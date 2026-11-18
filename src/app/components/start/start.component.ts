import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CodecService } from 'src/app/services/codec/codec.service';
import { DrawOptions, RoundDrawService } from 'src/app/services/round-draw/round-draw.service';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';
import {
  RoundSettingsDialog,
  RoundSettingsDialogData,
  RoundSettingsDialogResult,
  storedDrawOptions,
} from '../round-settings-dialog/round-settings-dialog';

const DEFAULT_PLAYERS = 3;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 30;
const MAX_NAME_LENGTH = 20;

/**
 * „Lobby” gry na jednym urządzeniu (układ jak lobby pokoju online): lista graczy z −/+
 * (z opcjonalnymi imionami) i te same ustawienia rundy (dialog ⚙) co w pokoju.
 */
@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  readonly minPlayers = MIN_PLAYERS;
  readonly maxPlayers = MAX_PLAYERS;
  readonly maxNameLength = MAX_NAME_LENGTH;

  playersCount = DEFAULT_PLAYERS;
  playerIds: number[] = [];
  /**
   * Imiona graczy (indeks = numer gracza − 1); puste → „Gracz N”. Trzymane też dla graczy
   * ponad bieżącą liczbę, żeby −/+ ich nie gubiło.
   */
  names: string[] = [];

  constructor(
    private storageManager: StorageManagerService,
    private codec: CodecService,
    private roundDraw: RoundDrawService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    const form = this.storageManager.getForm();
    this.names = Array.isArray(form?.names)
      ? form.names.map((n: unknown) => typeof n === 'string' ? n.slice(0, MAX_NAME_LENGTH) : '')
      : [];
    this.setPlayers(Number(form?.players) || DEFAULT_PLAYERS);
  }

  changePlayers(delta: number) {
    this.setPlayers(this.playersCount + delta);
    this.saveLobby();
  }

  private setPlayers(count: number) {
    this.playersCount = Math.min(Math.max(Math.round(count), MIN_PLAYERS), MAX_PLAYERS);
    this.playerIds = Array.from({ length: this.playersCount }, (_, i) => i + 1);
  }

  nameOf(player: number): string {
    return this.names[player - 1] ?? '';
  }

  setName(player: number, name: string) {
    this.names[player - 1] = name;
    this.saveLobby();
  }

  /** Zapisuje liczbę graczy i imiona (bez pustego ogona) obok ustawień rundy. */
  private saveLobby() {
    const names = Array.from({ length: MAX_PLAYERS }, (_, i) => this.names[i] ?? '');
    while (names.length && !names[names.length - 1].trim()) names.pop();
    this.storageManager.saveForm({ ...(this.storageManager.getForm() ?? {}), players: this.playersCount, names });
  }

  start() {
    this.saveLobby();
    const options = storedDrawOptions(this.storageManager, this.playersCount);
    if (!options) {
      this.snackBar.open('Uzupełnij ustawienia rundy', 'OK', { duration: 3000 });
      this.openSettings();
      return;
    }
    this.router.navigate(['/game', drawOfflineGame(this.roundDraw, this.codec, this.playersCount, this.names, options)]);
  }

  openSettings() {
    openOfflineSettings(this.dialog, this.playersCount).subscribe();
  }

  back() {
    this.router.navigate(['/']);
  }
}

/** Losuje rundę offline i zwraca dane do URL `game/<data>`. */
export function drawOfflineGame(roundDraw: RoundDrawService, codec: CodecService, playersCount: number,
                                names: string[], options: DrawOptions): string {
  const playerIds = Array.from({ length: playersCount }, (_, i) => i + 1);
  const round = roundDraw.draw(playerIds, options);
  const settings: Settings = {
    phrase: round.phrase,
    category: round.showCategory ? round.category : null,
    spies: round.spyIds,
    starts: round.startingId,
    playersCount,
    names: playerIds.map(id => (names[id - 1] ?? '').trim()),
  };
  return codec.compress(settings);
}

/** Dialog ustawień rundy w trybie jednego urządzenia (bez „Zamknij pokój”). */
export function openOfflineSettings(dialog: MatDialog, playersCount: number) {
  return dialog.open<RoundSettingsDialog, RoundSettingsDialogData, RoundSettingsDialogResult>(RoundSettingsDialog, {
    data: { playersCount }, width: '90%', maxWidth: '500px', autoFocus: false,
  }).afterClosed();
}

export interface Settings {
  phrase: string,
  category: string | null,
  spies: number[],
  starts: number,
  playersCount: number,
  /** Imiona graczy (indeks = numer − 1), '' gdy brak; [] w linkach sprzed imion. */
  names: string[],
}

/** Etykieta gracza: imię albo „Gracz N”. */
export function playerLabel(names: string[], player: number): string {
  return names[player - 1]?.trim() || `Gracz ${player}`;
}
