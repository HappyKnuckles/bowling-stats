import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatsPage } from './stats.page';

import { StatsPageRoutingModule } from './stats-routing.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonText, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    StatsPageRoutingModule,
    MatExpansionModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    StatsPage,
  ],
})
export class StatsPageModule {}
