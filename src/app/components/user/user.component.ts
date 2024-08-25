import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  userId: string | null = "";
  userForm: FormGroup;

  get userIdFormControl() {
    return this.userForm.controls["userId"] as FormControl;
  }

  constructor(
    private storageManager: StorageManagerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = this.storageManager.getUserId();
    this.userForm = new FormGroup({
      userId: new FormControl(this.userId, [Validators.required, Validators.min(1)])
    });
  }

  save() {
    const userId = this.userIdFormControl.value;
    this.storageManager.saveUserId(userId);
    this.router.navigate(['/']);
  }

  back() {
    this.router.navigate(['/']);
  }

  restrictCharacters(event: KeyboardEvent) {
    const invalidChars = ['+', '-'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }
}
