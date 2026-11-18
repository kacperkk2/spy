import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameComponent } from './components/game/game.component';
import { HomeComponent } from './components/home/home.component';
import { QuestionsComponent } from './components/questions/questions.component';
import { ConfirmDialog } from './components/confirm-dialog/confirm-dialog';
import { RoomComponent } from './components/room/room.component';
import { OnlineComponent } from './components/online/online.component';
import { NickDialog } from './components/nick-dialog/nick-dialog';
import { RoundSettingsDialog } from './components/round-settings-dialog/round-settings-dialog';
import { StartComponent } from './components/start/start.component';
import { PlayerTokenInterceptor } from './services/room-api/player-token.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    StartComponent,
    QuestionsComponent,
    GameComponent,
    RoomComponent,
    OnlineComponent,
    RoundSettingsDialog,
    ConfirmDialog,
    NickDialog,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatGridListModule,
    HttpClientModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    FlexLayoutModule,
    MatSlideToggleModule,
    MatIconModule,
    FormsModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    ClipboardModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: PlayerTokenInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
