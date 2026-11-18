import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CONFIG } from 'src/app/app.properties';
import { ApiError, MyRoleDto, RevealDto, RoomStateDto } from 'src/app/services/room-api/room-api.models';
import { RoomApiService } from 'src/app/services/room-api/room-api.service';
import {
  apiErrorMessage,
  isValidRoomCode,
  NICK_MAX_LENGTH,
  nickValidators,
  normalizeRoomCode,
} from 'src/app/services/room-api/room-api.utils';
import { ConnectionStatus, RoomEvent, RoomEventsService } from 'src/app/services/room-api/room-events.service';
import { RoundDrawService } from 'src/app/services/round-draw/round-draw.service';
import { RoomSession, StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';
import { ConfirmDialog, ConfirmDialogData } from '../confirm-dialog/confirm-dialog';
import {
  RoundSettingsDialog,
  RoundSettingsDialogData,
  RoundSettingsDialogResult,
  storedDrawOptions,
} from '../round-settings-dialog/round-settings-dialog';

/**
 * - `join` — brak sesji dla tego kodu i brak zapisanego nicku (albo nick zajęty): formularz nicku,
 * - `room` — jest sesja: lobby / gra,
 * - `error` — pokój nie istnieje, kod niepoprawny albo zerwane połączenie.
 */
type View = 'loading' | 'join' | 'room' | 'error';

const MIN_PLAYERS = 2;
/** Odstęp przed ponownym otwarciem strumienia, gdy przeglądarka z niego zrezygnowała. */
const EVENTS_RESTART_DELAY_MS = 3000;

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {

  readonly nickMaxLength = NICK_MAX_LENGTH;
  readonly minPlayers = MIN_PLAYERS;

  view: View = 'loading';
  code = '';
  session: RoomSession | null = null;
  state: RoomStateDto | null = null;
  /** Rola w bieżącej rundzie (IN_ROUND). */
  role: MyRoleDto | null = null;
  /** Wynik bieżącej rundy (REVEALED). */
  reveal: RevealDto | null = null;
  isPhraseShowed = false;
  errorMessage = '';
  joining = false;
  /** Trwa akcja hosta (start rundy, reveal, zamknięcie). */
  busy = false;
  /** Stan strumienia SSE — przy `connecting` pokazujemy „Łączenie…”. */
  connection: ConnectionStatus = 'closed';

  nick = new FormControl<string>('', { nonNullable: true, validators: nickValidators });
  /** Opis zapisanych ustawień rundy — dla hosta w lobby. */

  private sub = new Subscription();
  /** Automatyczne dołączenie zapisanym nickiem już próbowane — drugi raz tylko po udanym wejściu (bez pętli). */
  private autoJoinTried = false;
  private eventsSub: Subscription | null = null;
  /** Runda, dla której pobrano (albo właśnie pobieramy) rolę — chroni przed podwójnym getMe. */
  private roleRound: number | null = null;
  /** j.w. dla wyniku rundy. */
  private revealRound: number | null = null;
  /** Strumień był już otwarty — kolejne `open` to ponowne połączenie. */
  private eventsWereOpen = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomApi: RoomApiService,
    private roomEvents: RoomEventsService,
    private roundDraw: RoundDrawService,
    private storageManager: StorageManagerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.sub.add(this.route.paramMap.subscribe(params => this.enter(params.get('code') ?? '')));
    this.sub.add(this.roomEvents.status$.subscribe(status => this.onConnectionStatus(status)));
  }

  ngOnDestroy(): void {
    this.stopEvents();
    this.sub.unsubscribe();
  }

  /** Telefony zrywają SSE w tle — po powrocie karty dociągamy stan, bo mogło coś umknąć. */
  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.visibilityState === 'visible' && this.view === 'room') {
      this.refresh();
    }
  }

  get isHost(): boolean {
    return !!this.state?.players.find(p => p.id === this.session?.playerId)?.isHost;
  }

  get hostNick(): string | undefined {
    return this.state?.players.find(p => p.isHost)?.nick;
  }

  get roomLink(): string {
    return location.origin + CONFIG.URL_ROOT + '/room/' + this.code;
  }

  get canStartRound(): boolean {
    return !!this.state
      && (this.state.status === 'LOBBY' || this.state.status === 'REVEALED')
      && this.state.players.length >= MIN_PLAYERS;
  }

  get startingNick(): string | null {
    return this.nickOf(this.state?.startingPlayerId ?? null);
  }

  get roundLabel(): string {
    const round = this.state?.roundNumber ?? 0;
    return round > 0 ? 'Runda ' + round : 'Lobby';
  }

  get statusLabel(): string {
    switch (this.state?.status) {
      case 'IN_ROUND': return 'trwa';
      case 'REVEALED': return 'zakończona';
      default: return '';
    }
  }

  /** Szpieg oznaczany w tabelce graczy tylko na widoku zakończonej rundy. */
  isSpy(playerId: string): boolean {
    return this.state?.status === 'REVEALED' && !!this.reveal?.spyPlayerIds.includes(playerId);
  }

  private nickOf(playerId: string | null): string | null {
    if (!playerId) {
      return null;
    }
    return this.state?.players.find(p => p.id === playerId)?.nick ?? null;
  }

  // --- wejście do pokoju ---

  private enter(rawCode: string) {
    const code = normalizeRoomCode(rawCode);
    if (code !== rawCode) {
      this.router.navigate(['/room', code], { replaceUrl: true });
      return;
    }
    this.stopEvents();
    this.code = code;
    this.state = null;
    this.autoJoinTried = false;
    this.resetRound();
    if (!isValidRoomCode(code)) {
      this.leaveRoom('Niepoprawny kod pokoju');
      return;
    }
    const session = this.storageManager.getRoomSession(code);
    if (session) {
      this.storageManager.setCurrentRoom(code);
      this.session = session;
      this.loadState();
    } else {
      this.session = null;
      this.showJoin();
    }
  }

  /** Brak sesji: z zapisanym nickiem dołącza od razu, bez niego — ekran nicku. */
  private showJoin() {
    const nick = this.storageManager.getNick();
    this.nick.setValue(nick ?? '');
    if (nick && !this.autoJoinTried) {
      this.autoJoinTried = true;
      this.view = 'loading';
      this.join();
    } else {
      this.view = 'join';
    }
  }

  private showError(message: string) {
    this.stopEvents();
    this.errorMessage = message;
    this.view = 'error';
  }

  /** Sprawdza sesję przez REST (EventSource nie podaje statusu błędu), potem otwiera strumień. */
  private loadState() {
    this.view = 'loading';
    this.roomApi.getState(this.code).subscribe({
      next: state => {
        this.applyState(state);
        this.view = 'room';
        this.autoJoinTried = false;
        this.startEvents();
      },
      error: (err: ApiError) => {
        if (!this.handleRoomError(err)) {
          this.showError(apiErrorMessage(err));
        }
      },
    });
  }

  /**
   * Błędy oznaczające, że nie jesteśmy już w pokoju — wspólne dla wszystkich wywołań.
   * Zwraca true, jeśli błąd został obsłużony.
   */
  private handleRoomError(err: ApiError): boolean {
    switch (err.code) {
      case 'ROOM_NOT_FOUND':
      case 'ROOM_CLOSED':
        this.leaveRoom('Pokój nie istnieje lub został zamknięty');
        return true;
      case 'UNAUTHORIZED':
        // token nieważny (np. serwer stracił pamięć po restarcie) — dołącz jeszcze raz tym samym nickiem
        this.stopEvents();
        this.forgetSession();
        this.dialog.closeAll();
        this.state = null;
        this.resetRound();
        this.toast('Sesja w pokoju wygasła — dołączam ponownie');
        this.showJoin();
        return true;
      default:
        return false;
    }
  }

  join() {
    if (this.joining || this.nick.invalid) {
      return;
    }
    const nick = this.nick.value.trim();
    this.joining = true;
    this.roomApi.joinRoom(this.code, nick).subscribe({
      next: res => {
        this.joining = false;
        this.session = { code: this.code, playerId: res.playerId, playerToken: res.playerToken, nick };
        this.storageManager.saveRoomSession(this.session);
        // pierwszy nick wpisany przy wejściu z linku zostaje nickiem gracza; zastępczy (przy zajętym) — nie
        if (!this.storageManager.getNick()) {
          this.storageManager.saveNick(nick);
        }
        this.loadState();
      },
      error: (err: ApiError) => {
        this.joining = false;
        if (err.code === 'NICK_TAKEN') {
          this.view = 'join';
          this.nick.setErrors({ nickTaken: true });
          this.nick.markAsTouched();
        } else if (!this.handleRoomError(err)) {
          if (this.view === 'loading') {
            // automatyczne dołączenie nie wyszło (np. sieć) — pokaż błąd z „Spróbuj ponownie”
            this.showError(apiErrorMessage(err));
          } else {
            this.toast(apiErrorMessage(err));
          }
        }
      },
    });
  }

  /** Czyści sesję tego pokoju — sesji innych pokoi nie ruszamy. */
  private forgetSession() {
    this.storageManager.clearRoomSession(this.code);
    this.session = null;
  }

  // --- zdarzenia SSE ---

  private startEvents() {
    this.clearRestartTimer();
    if (!this.session || this.eventsSub) {
      return;
    }
    this.eventsWereOpen = false;
    this.eventsSub = this.roomEvents.events(this.code, this.session.playerToken).subscribe({
      next: event => this.onEvent(event),
      error: () => {
        this.eventsSub = null;
        this.onEventsFailed();
      },
      complete: () => this.eventsSub = null,
    });
  }

  private stopEvents() {
    this.clearRestartTimer();
    this.eventsSub?.unsubscribe();
    this.eventsSub = null;
  }

  private onConnectionStatus(status: ConnectionStatus) {
    const reconnected = status === 'open' && this.connection === 'connecting' && this.eventsWereOpen;
    this.connection = status;
    if (status === 'open') {
      this.eventsWereOpen = true;
    }
    if (reconnected) {
      // w czasie przerwy mogło umknąć np. round-started
      this.refresh();
    }
  }

  /**
   * Przeglądarka zrezygnowała z ponownego łączenia (EventSource nie podaje statusu) —
   * przyczynę ustalamy przez REST.
   */
  private onEventsFailed() {
    this.roomApi.getState(this.code).subscribe({
      next: state => {
        // pokój żyje — otwórz strumień jeszcze raz, z przerwą, żeby nie zapętlić się przy błędzie serwera
        this.applyState(state, true);
        this.scheduleEventsRestart();
      },
      error: (err: ApiError) => {
        if (!this.handleRoomError(err)) {
          this.showError('Utracono połączenie z pokojem');
        }
      },
    });
  }

  private scheduleEventsRestart() {
    this.clearRestartTimer();
    this.connection = 'connecting';
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.view === 'room') {
        this.startEvents();
      }
    }, EVENTS_RESTART_DELAY_MS);
  }

  private clearRestartTimer() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
  }

  /** Dociąga stan i rolę (po ponownym połączeniu / powrocie karty). Wznawia strumień, jeśli padł. */
  private refresh() {
    if (this.view !== 'room' || !this.session) {
      return;
    }
    this.roomApi.getState(this.code).subscribe({
      next: state => {
        this.applyState(state, true);
        if (!this.eventsSub && !this.restartTimer) {
          this.startEvents();
        }
      },
      // błąd sieci: wskaźnik „Łączenie…” wystarczy, EventSource ponawia sam
      error: (err: ApiError) => this.handleRoomError(err),
    });
  }

  private onEvent(event: RoomEvent) {
    switch (event.type) {
      case 'room-state':
      case 'round-started':
        this.applyState(event.data);
        break;
      case 'round-revealed':
        this.applyReveal(event.data);
        break;
      case 'room-closed':
        this.leaveRoom('Pokój został zamknięty');
        break;
    }
  }

  // --- stan rundy ---

  /**
   * Jedyne miejsce ustawiania stanu pokoju: dociąga rolę / wynik, gdy zmieniła się runda.
   * `forceRole` — pobierz rolę ponownie nawet w tej samej rundzie (synchronizacja po przerwie).
   */
  private applyState(state: RoomStateDto, forceRole = false) {
    this.state = state;
    switch (state.status) {
      case 'IN_ROUND':
        this.reveal = null;
        this.revealRound = null;
        if (forceRole || this.roleRound !== state.roundNumber) {
          this.loadRole(state.roundNumber);
        }
        break;
      case 'REVEALED':
        if (this.revealRound !== state.roundNumber) {
          this.loadReveal(state.roundNumber);
        }
        break;
      default:
        this.resetRound();
    }
  }

  private applyReveal(reveal: RevealDto) {
    this.reveal = reveal;
    this.revealRound = reveal.roundNumber;
    this.role = null;
    this.roleRound = null;
    this.isPhraseShowed = false;
    if (this.state) {
      this.state = { ...this.state, status: 'REVEALED', roundNumber: reveal.roundNumber };
    }
  }

  private loadRole(round: number) {
    if (this.roleRound !== round) {
      // nowa runda — chowamy poprzednią rolę; przy odświeżeniu tej samej rundy zostawiamy widok
      this.role = null;
      this.isPhraseShowed = false;
    }
    this.roleRound = round;
    this.roomApi.getMe(this.code).subscribe({
      next: role => {
        if (this.roleRound === round) {
          this.role = role;
        }
      },
      error: (err: ApiError) => {
        if (this.roleRound === round && !this.handleRoomError(err)) {
          if (!this.role) {
            this.roleRound = null;
          }
          this.toast(apiErrorMessage(err));
        }
      },
    });
  }

  private loadReveal(round: number) {
    this.revealRound = round;
    this.reveal = null;
    this.roomApi.getReveal(this.code).subscribe({
      next: reveal => {
        if (this.revealRound === round) {
          this.applyReveal(reveal);
        }
      },
      error: (err: ApiError) => {
        if (this.revealRound === round && !this.handleRoomError(err)) {
          this.revealRound = null;
          this.toast(apiErrorMessage(err));
        }
      },
    });
  }

  private resetRound() {
    this.role = null;
    this.roleRound = null;
    this.reveal = null;
    this.revealRound = null;
    this.isPhraseShowed = false;
  }

  togglePhrase() {
    this.isPhraseShowed = !this.isPhraseShowed;
  }

  /** Wyjście z pokoju, którego już nie ma (zamknięty, nie istnieje, zły kod): komunikat i powrót na start. */
  private leaveRoom(message: string) {
    this.stopEvents();
    this.forgetSession();
    this.dialog.closeAll();
    this.toast(message);
    this.router.navigate(['/online']);
  }

  // --- panel hosta ---

  newRound() {
    if (!this.state || !this.canStartRound || this.busy) {
      return;
    }
    const players = this.state.players;
    const options = storedDrawOptions(this.storageManager, players.length);
    if (!options) {
      this.toast('Uzupełnij ustawienia rundy');
      this.openSettings();
      return;
    }
    const round = this.roundDraw.draw(players.map(p => p.id), options);
    this.busy = true;
    this.roomApi.startRound(this.code, {
      phrase: round.phrase,
      category: round.category,
      showCategory: round.showCategory,
      spyPlayerIds: round.spyIds,
      startingPlayerId: round.startingId,
    }).subscribe({
      next: state => {
        this.busy = false;
        this.applyState(state);
      },
      error: (err: ApiError) => this.hostActionFailed(err),
    });
  }

  confirmEndRound() {
    if (this.state?.status !== 'IN_ROUND' || this.busy) {
      return;
    }
    this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: { title: 'Zakończyć rundę?', message: 'Wszyscy zobaczą hasło i szpiegów.', confirmLabel: 'Zakończ' },
      width: '90%', maxWidth: '400px', autoFocus: false,
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.endRound();
      }
    });
  }

  endRound() {
    if (this.state?.status !== 'IN_ROUND' || this.busy) {
      return;
    }
    this.busy = true;
    this.roomApi.reveal(this.code).subscribe({
      next: reveal => {
        this.busy = false;
        this.applyReveal(reveal);
      },
      error: (err: ApiError) => this.hostActionFailed(err),
    });
  }

  openSettings() {
    const data: RoundSettingsDialogData = { playersCount: this.playersCount };
    this.dialog.open<RoundSettingsDialog, RoundSettingsDialogData, RoundSettingsDialogResult>(RoundSettingsDialog, {
      data, width: '90%', maxWidth: '500px', autoFocus: false,
    });
  }

  private get playersCount(): number {
    return Math.max(this.state?.players.length ?? 0, MIN_PLAYERS);
  }

  confirmCloseRoom() {
    this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: { title: 'Zamknąć pokój?', message: 'Wszyscy gracze zostaną z niego wyrzuceni.', confirmLabel: 'Zamknij' },
      width: '90%', maxWidth: '400px', autoFocus: false,
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.closeRoom();
      }
    });
  }

  private closeRoom() {
    this.busy = true;
    // własne room-closed z SSE nie jest już potrzebne
    this.stopEvents();
    this.roomApi.closeRoom(this.code).subscribe({
      next: () => {
        this.busy = false;
        this.forgetSession();
        this.router.navigate(['/online']);
      },
      error: (err: ApiError) => {
        if (err.code === 'ROOM_NOT_FOUND') {
          // pokoju już nie ma — efekt ten sam co zamknięcie
          this.busy = false;
          this.forgetSession();
          this.router.navigate(['/online']);
          return;
        }
        this.hostActionFailed(err);
        this.startEvents();
      },
    });
  }

  /** Przycisk znów aktywny, komunikat i synchronizacja (np. po INVALID_STATE / NOT_ENOUGH_PLAYERS). */
  private hostActionFailed(err: ApiError) {
    this.busy = false;
    if (this.handleRoomError(err)) {
      return;
    }
    this.toast(apiErrorMessage(err));
    if (err.code !== 'NETWORK') {
      this.roomApi.getState(this.code).subscribe({ next: state => this.applyState(state), error: () => { } });
    }
  }

  // --- wspólne ---

  linkCopied() {
    this.toast('Skopiowano link do pokoju');
  }

  retry() {
    this.enter(this.code);
  }

  back() {
    this.router.navigate(['/online']);
  }

  goToQuestions() {
    // kategoria znana tylko, gdy host ją pokazuje (rola) albo po reveal
    const category = this.role?.category ?? this.reveal?.category;
    this.router.navigate(category ? ['/questions', category] : ['/questions']);
  }

  private toast(message: string) {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }
}
