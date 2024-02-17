import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryPage } from './history.page';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';

import { HistoryPageRoutingModule } from './history-routing.module';
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    HistoryPageRoutingModule,
    MatExpansionModule
  ],
  declarations: [HistoryPage]
})
export class HistoryPageModule {}
