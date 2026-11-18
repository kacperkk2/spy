import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, of, Subscription, timer } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { ApiError, RoomListDto, RoomSummaryDto } from 'src/app/services/room-api/room-api.models';
import { RoomApiService } from 'src/app/services/room-api/room-api.service';
import {
  apiErrorMessage,
  normalizeRoomCode,
  ROOM_CODE_LENGTH,
  roomCodeValidator,
} from 'src/app/services/room-api/room-api.utils';
import { RoomSession, StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';
import { openNickDialog } from '../nick-dialog/nick-dialog';

/** Ile pokoi pokazujemy na liście — do pozostałych wchodzi się po kodzie. */
const ROOMS_LIMIT = 5;
const ROOMS_REFRESH_MS = 10000;

/** Tryb online: tworzenie pokoju, dołączanie po kodzie, lista otwartych pokoi. */
@Component({
  selector: 'app-online',
  templateUrl: './online.component.html',
  styleUrls: ['./online.component.scss']
})
export class OnlineComponent implements OnInit, OnDestroy {

  readonly codeLength = ROOM_CODE_LENGTH;

  session: RoomSession | null = null;
  /** Pokój założony przez gracza — dopóki istnieje, nie można założyć kolejnego. */
  ownRoom: RoomSession | null = null;
  nick: string | null = null;
  loading = false;
  /** Lista otwartych pokoi; null — jeszcze nie pobrana albo błąd. */
  rooms: RoomListDto | null = null;
  roomsFailed = false;

  private roomsSub: Subscription | null = null;

  code = new FormControl<string>('', { nonNullable: true, validators: [roomCodeValidator] });

  constructor(
    private storageManager: StorageManagerService,
    private roomApi: RoomApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.session = this.storageManager.getRoomSession();
    this.nick = this.storageManager.getNick();
    this.ownRoom = this.storageManager.getHostedSession();
    if (this.ownRoom) {
      this.checkOwnRoom().subscribe();
    }
    this.roomsSub = timer(0, ROOMS_REFRESH_MS).pipe(
      // karta w tle — nie odpytujemy serwera
      filter(() => document.visibilityState === 'visible'),
      switchMap(() => this.roomApi.listRooms(ROOMS_LIMIT).pipe(
        catchError(() => of(null)),
      )),
    ).subscribe(list => {
      this.rooms = list;
      this.roomsFailed = !list;
    });
  }

  ngOnDestroy(): void {
    this.roomsSub?.unsubscribe();
  }

  /** Ile otwartych pokoi nie zmieściło się na liście. */
  get hiddenRooms(): number {
    return this.rooms ? Math.max(this.rooms.total - this.rooms.rooms.length, 0) : 0;
  }

  statusLabel(room: RoomSummaryDto): string {
    switch (room.status) {
      case 'LOBBY': return 'czeka na start';
      case 'IN_ROUND': return 'trwa runda';
      case 'REVEALED': return 'po rundzie';
    }
  }

  /** Wejście do pokoju z listy — RoomComponent dołączy zapisanym nickiem albo zapyta o nick. */
  openRoom(room: RoomSummaryDto) {
    this.router.navigate(['/room', normalizeRoomCode(room.code)]);
  }

  get canJoin(): boolean {
    return !this.loading && !!this.code.value && this.code.valid;
  }

  onCodeInput() {
    const upper = this.code.value.toUpperCase();
    if (upper !== this.code.value) {
      this.code.setValue(upper);
    }
  }

  changeNick() {
    this.openNickDialog().subscribe();
  }

  createRoom() {
    if (this.loading) {
      return;
    }
    if (this.ownRoom) {
      this.loading = true;
      this.checkOwnRoom().subscribe(alive => {
        this.loading = false;
        if (alive === true) {
          this.goToOwnRoom();
        } else if (alive === false) {
          this.createRoom();
        }
        // null — błąd sieci, komunikat już pokazany
      });
      return;
    }
    this.ensureNick().subscribe(nick => {
      if (!nick) {
        return;
      }
      this.loading = true;
      this.roomApi.createRoom(nick).subscribe({
        next: res => {
          this.storageManager.saveRoomSession({ code: res.code, playerId: res.playerId, playerToken: res.playerToken, nick, isHost: true });
          this.router.navigate(['/room', normalizeRoomCode(res.code)]);
        },
        error: (err: ApiError) => {
          this.loading = false;
          this.snackBar.open(apiErrorMessage(err), 'OK', { duration: 4000 });
        },
      });
    });
  }

  /** Dołączanie (z nickiem albo ekranem nicku) robi RoomComponent — tak samo jak przy wejściu z linku. */
  joinRoom() {
    if (this.canJoin) {
      this.router.navigate(['/room', normalizeRoomCode(this.code.value)]);
    }
  }

  returnToRoom() {
    if (this.session) {
      this.router.navigate(['/room', this.session.code]);
    }
  }

  /** Pokój, do którego można wrócić (bieżąca sesja) — podświetlony na liście. */
  isCurrent(room: RoomSummaryDto): boolean {
    return !!this.session && normalizeRoomCode(room.code) === normalizeRoomCode(this.session.code);
  }

  /** Bieżący pokój nie ma go na liście (limit, błąd pobierania) — pokazujemy go osobno, żeby dało się wrócić. */
  get currentMissing(): boolean {
    if (!this.session || (!this.rooms && !this.roomsFailed)) {
      return false;
    }
    return !this.rooms?.rooms.some(room => this.isCurrent(room));
  }

  back() {
    this.router.navigate(['/']);
  }

  private goToOwnRoom() {
    if (this.ownRoom) {
      this.router.navigate(['/room', this.ownRoom.code]);
    }
  }

  /**
   * Sprawdza, czy własny pokój jeszcze istnieje. true — istnieje; false — nie (sesja usunięta,
   * można założyć nowy); null — nie udało się sprawdzić (np. sieć).
   */
  private checkOwnRoom(): Observable<boolean | null> {
    const own = this.ownRoom;
    if (!own) {
      return of(false);
    }
    return this.roomApi.getState(own.code).pipe(
      map(() => true as boolean | null),
      catchError((err: ApiError) => {
        if (err.code === 'ROOM_NOT_FOUND' || err.code === 'ROOM_CLOSED' || err.code === 'UNAUTHORIZED') {
          this.storageManager.clearRoomSession(own.code);
          this.ownRoom = null;
          this.session = this.storageManager.getRoomSession();
          return of(false);
        }
        this.snackBar.open(apiErrorMessage(err), 'OK', { duration: 4000 });
        return of(null);
      }),
    );
  }

  /** Zapisany nick, a gdy go nie ma — dialog ustawienia nicku. */
  private ensureNick(): Observable<string | undefined> {
    return this.nick ? of(this.nick) : this.openNickDialog();
  }

  private openNickDialog(): Observable<string | undefined> {
    return openNickDialog(this.dialog, this.storageManager, { nick: this.nick, inRoom: !!this.session }).pipe(
      tap(nick => this.nick = nick || this.nick),
    );
  }
}
