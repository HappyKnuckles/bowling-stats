import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonHeader, IonicModule } from '@ionic/angular';

import { SettingsPageRoutingModule } from './settings-routing.module';

import { SettingsPage } from './settings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SettingsPageRoutingModule,
    SettingsPage,
  ]
})
export class SettingsPageModule {}