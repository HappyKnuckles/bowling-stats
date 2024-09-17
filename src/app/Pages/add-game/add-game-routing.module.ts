import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddGamePage } from './add-game.page';

const routes: Routes = [
  {
    path: '',
    component: AddGamePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddGamePageRoutingModule {}
