import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddGamePageRoutingModule } from './add-game-routing.module';
import { AddGamePage } from './add-game.page';
import { TrackGridComponentModule } from '../components/track-grid/track-grid.component.module';


@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    AddGamePageRoutingModule,
    TrackGridComponentModule
  ],
  declarations: [AddGamePage]
})
export class AddGamePageModule {}
