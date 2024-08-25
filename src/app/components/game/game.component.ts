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
  userId: string | null = "";

  constructor(
    private route: ActivatedRoute,
    private codec: CodecService, 
    private storageManager: StorageManagerService, 
    private router: Router) { }

  ngOnInit(): void {
    this.userId = this.storageManager.getUserId();
    if (this.userId == null) {
      this.router.navigate(['/user']);
    }

    this.route.params.subscribe(params => {
      const data = params['data'];
      if (data) {
        this.settings = this.codec.decompress(data);
      }
      else {
        this.router.navigate(['/']);
      }
    });
  }

  isUserSpy() {
    return this.settings.spies.includes(Number(this.userId))
  }

  isUserStarting() {
    return this.settings.starts == Number(this.userId)
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
