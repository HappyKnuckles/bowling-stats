import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryPage } from './history.page';
import { MatExpansionModule } from '@angular/material/expansion';

import { HistoryPageRoutingModule } from './history-routing.module';

import {
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonTitle,
  IonBadge,
  IonContent,
  IonRefresher,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
} from '@ionic/angular/standalone';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HistoryPageRoutingModule,
    MatExpansionModule,
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonTitle,
    IonBadge,
    IonContent,
    IonRefresher,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    HistoryPage,
  ],
})
export class HistoryPageModule {}
