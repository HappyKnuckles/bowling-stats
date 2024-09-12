import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddGamePageRoutingModule } from './add-game-routing.module';


import { IonHeader, IonToolbar, IonButton, IonIcon, IonTitle, IonAlert, IonContent, IonGrid, IonRow, IonCol, IonModal, IonButtons, IonInput } from "@ionic/angular/standalone";
import { AddGamePage } from './add-game.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        AddGamePageRoutingModule,
        IonHeader,
        IonToolbar,
        IonButton,
        IonIcon,
        IonTitle,
        IonAlert,
        IonContent,
        IonGrid,
        IonRow,
        IonCol,
        IonModal,
        IonButtons,
        IonInput,
        AddGamePage
    ]
})
export class AddGamePageModule { }
