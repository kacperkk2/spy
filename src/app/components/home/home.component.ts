import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RoomSession, StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';
import { openNickDialog } from '../nick-dialog/nick-dialog';

/** Ekran startowy — wybór trybu gry (online / jeden telefon). Nie odpytuje API. */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  /** Ostatni pokój, w którym gracz był (może to być jego własny). */
  session: RoomSession | null = null;
  nick: string | null = null;

  constructor(
    private storageManager: StorageManagerService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.session = this.storageManager.getRoomSession();
    this.nick = this.storageManager.getNick();
  }

  changeNick() {
    openNickDialog(this.dialog, this.storageManager, { nick: this.nick, inRoom: !!this.session })
      .subscribe(nick => this.nick = nick || this.nick);
  }

  online() {
    this.router.navigate(['/online']);
  }

  oneDevice() {
    this.router.navigate(['/start']);
  }

  returnToRoom() {
    if (this.session) {
      this.router.navigate(['/room', this.session.code]);
    }
  }
}
