import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryPage } from './history.page';
import { MatExpansionModule } from '@angular/material/expansion';

import { HistoryPageRoutingModule } from './history-routing.module';
import { ToastComponentModule } from '../components/toast/toast.component.module';
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    HistoryPageRoutingModule,
    MatExpansionModule,
    ToastComponentModule
  ],
  declarations: [HistoryPage]
})
export class HistoryPageModule {}
