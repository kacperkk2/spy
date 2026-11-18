import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { drawOfflineGame, openOfflineSettings, playerLabel, Settings } from '../start/start.component';
import { CodecService } from 'src/app/services/codec/codec.service';
import { RoundDrawService } from 'src/app/services/round-draw/round-draw.service';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';
import { ConfirmDialog, ConfirmDialogData } from '../confirm-dialog/confirm-dialog';
import { storedDrawOptions } from '../round-settings-dialog/round-settings-dialog';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  isPhraseShowed: boolean = false;
  /** Runda zakończona — widok wyniku (hasło, kategoria, szpiedzy). */
  isRevealed: boolean = false;
  settings: Settings;
  userId: number;
  playerRows: number[][] = [];
  playerIds: number[] = [];
  /** Czy ktokolwiek ma imię — wtedy wybór gracza to zawijana lista imion zamiast siatki numerów. */
  hasNames = false;
  /** Numer rundy w tej sesji — z query param `r` (nie jest częścią zakodowanych danych). */
  round = 1;

  constructor(
    private route: ActivatedRoute,
    private codec: CodecService,
    private roundDraw: RoundDrawService,
    private storageManager: StorageManagerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const data = params['data'];
      if (data) {
        this.settings = this.codec.decompress(data);
        this.round = Number(this.route.snapshot.queryParamMap.get('r')) || 1;
        this.userId = 1;
        this.isPhraseShowed = false;
        this.isRevealed = false;
        this.generatePlayerRows();
      }
      else {
        this.router.navigate(['/']);
      }
    });
  }

  generatePlayerRows(): void {
    const players = this.settings.playersCount;
    const rows: number[][] = [];
    for (let i = 0; i < players; i += 5) {
      rows.push(
        Array.from({ length: Math.min(5, players - i) }, (_, j) => i + j + 1)
      );
    }
    this.playerRows = rows;
    this.playerIds = rows.flat();
    this.hasNames = this.settings.names.some(n => n.trim());
  }

  /** Imię gracza albo „Gracz N”. */
  label(player: number): string {
    return playerLabel(this.settings.names, player);
  }

  /** Napis na przycisku wyboru gracza: imię albo sam numer. */
  pickerLabel(player: number): string {
    return this.settings.names[player - 1]?.trim() || String(player);
  }

  setCurrentUser(player: number): void {
    this.userId = player;
    this.isPhraseShowed = false;
  }

  isUserSpy() {
    return this.settings.spies.includes(this.userId)
  }

  isUserStarting() {
    return this.settings.starts == this.userId
  }

  isSpy(player: number): boolean {
    return this.settings.spies.includes(player);
  }

  confirmEndRound() {
    this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: { title: 'Zakończyć rundę?', message: 'Wszyscy zobaczą hasło i szpiegów.', confirmLabel: 'Zakończ' },
      width: '90%', maxWidth: '400px', autoFocus: false,
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isPhraseShowed = false;
        this.isRevealed = true;
      }
    });
  }

  /** Nowe losowanie z zapisanymi ustawieniami i tą samą liczbą graczy. */
  newRound() {
    const playersCount = this.settings.playersCount;
    const options = storedDrawOptions(this.storageManager, playersCount);
    if (!options) {
      this.snackBar.open('Uzupełnij ustawienia rundy', 'OK', { duration: 3000 });
      this.openSettings();
      return;
    }
    // replaceUrl — „wstecz” nie pokaże poprzedniego hasła
    this.router.navigate(['/game', drawOfflineGame(this.roundDraw, this.codec, playersCount, this.settings.names, options)],
      { replaceUrl: true, queryParams: { r: this.round + 1 } });
  }

  openSettings() {
    openOfflineSettings(this.dialog, this.settings.playersCount).subscribe();
  }

  back() {
    this.router.navigate(['/start']);
  }

  goToQuestions() {
    this.router.navigate(this.settings.category ? ['/questions', this.settings.category] : ['/questions']);
  }

  togglePhrase() {
    this.isPhraseShowed = !this.isPhraseShowed;
  }
}
