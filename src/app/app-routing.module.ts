import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './components/game/game.component';
import { HomeComponent } from './components/home/home.component';
import { StartComponent } from './components/start/start.component';
import { UserComponent } from './components/user/user.component';
import { QuestionsComponent } from './components/questions/questions.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'user', component: UserComponent },
  { path: 'start', component: StartComponent },
  { path: 'game/:data', component: GameComponent },
  { path: 'questions', component: QuestionsComponent },
  { path: 'questions/:data', component: QuestionsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
