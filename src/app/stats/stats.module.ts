import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatsPage } from './stats.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { StatsPageRoutingModule } from './stats-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    StatsPageRoutingModule
  ],
  declarations: [StatsPage]
})
export class StatsPageModule {}
