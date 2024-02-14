import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TrackGridComponent } from './track-grid.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  declarations: [TrackGridComponent],
  exports: [TrackGridComponent]
})
export class TrackGridComponentModule {}