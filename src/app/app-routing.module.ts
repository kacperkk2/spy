import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './components/game/game.component';
import { HomeComponent } from './components/home/home.component';
import { StartComponent } from './components/start/start.component';
import { QuestionsComponent } from './components/questions/questions.component';
import { RoomComponent } from './components/room/room.component';
import { OnlineComponent } from './components/online/online.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'online', component: OnlineComponent },
  { path: 'start', component: StartComponent },
  { path: 'game/:data', component: GameComponent },
  { path: 'room/:code', component: RoomComponent },
  { path: 'questions', component: QuestionsComponent },
  { path: 'questions/:data', component: QuestionsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
