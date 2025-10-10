import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Settings } from '../start/start.component';
import { CodecService } from 'src/app/services/codec/codec.service';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  isPhraseShowed: boolean = false;
  settings: Settings;
  userId: number;
  playerRows: number[][] = [];

  constructor(
    private route: ActivatedRoute,
    private codec: CodecService, 
    private storageManager: StorageManagerService, 
    private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const data = params['data'];
      if (data) {
        this.settings = this.codec.decompress(data);
        if (this.settings.oneDevice) {
          this.userId = 1
          this.generatePlayerRows()
        }
        else {
          let user = this.storageManager.getUserId();
          if (user == null) {
            this.router.navigate(['/user']);
          }
          this.userId = Number(user);
        }
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
  }

  setCurrentUser(player: number): void {
    this.userId = player;
  }

  isUserSpy() {
    return this.settings.spies.includes(this.userId)
  }

  isUserStarting() {
    return this.settings.starts == this.userId
  }
  
  back() {
    this.router.navigate(['/']);
  }

  show() {
    this.isPhraseShowed = true;
  }

  hide() {
    this.isPhraseShowed = false;
  }
}
