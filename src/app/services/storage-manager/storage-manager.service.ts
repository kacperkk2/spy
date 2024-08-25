import { Injectable } from '@angular/core';
import { CONFIG } from 'src/app/app.properties';

@Injectable({
  providedIn: 'root'
})
export class StorageManagerService {

  private userKey: string = CONFIG.USER_ID_KEY;
  private formKey: string = CONFIG.FORM_KEY;

  constructor() { }

  public getUserId() {
    return localStorage.getItem(this.userKey);
  }

  public saveUserId(userId: string) {
    return localStorage.setItem(this.userKey, userId);
  }

  public getForm() {
    const storageForm = localStorage.getItem(this.formKey);
    return storageForm == null ? null : JSON.parse(storageForm);
  }

  public saveForm(form: any) {
    return localStorage.setItem(this.formKey, JSON.stringify(form));
  }
}
