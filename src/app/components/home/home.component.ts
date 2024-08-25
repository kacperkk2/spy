import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  userId: string | null = "";

  constructor(
    private storageManager: StorageManagerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = this.storageManager.getUserId();
    if (this.userId == null) {
      this.router.navigate(['/user']);
    }
  }

  changeUserId() {
    this.router.navigate(['/user']);
  }

  start() {
    this.router.navigate(['/start']);
  }
}
