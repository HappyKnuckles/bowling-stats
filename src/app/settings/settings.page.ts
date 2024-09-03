import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { UserService } from '../services/user/user.service';
import { ToastService } from '../services/toast/toast.service';
import { IonHeader, IonToolbar, IonContent, IonInput, IonIcon, IonTitle, IonItem, IonSelect, IonSelectOption } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { colorPaletteOutline, personCircleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonItem, IonTitle, IonIcon, IonInput, IonContent, IonToolbar, IonHeader, IonSelect, IonSelectOption, FormsModule, CommonModule],

})
export class SettingsPage implements OnInit {
  username: string | null = '';
  currentColor: string | null = '';
  optionsWithClasses: { name: string; class: string }[] = [
    { name: 'Blue', class: 'blue-option' },
    { name: 'Yellow', class: 'yellow-option' },
    { name: 'Green', class: 'green-option' },
    { name: 'Red', class: 'red-option' },
    { name: 'Gray', class: 'gray-option' }
  ];
  constructor(private userService: UserService, private toastService: ToastService) {
    addIcons({ personCircleOutline, colorPaletteOutline});
   }

  ngOnInit() {
    this.currentColor = localStorage.getItem('theme');
    if (this.currentColor === null) {
      this.currentColor = 'Green';
    }
    this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
  }

  changeName() {
    this.userService.setUsername(this.username!);
  }

  changeColor() {
    localStorage.setItem('theme', this.currentColor!);
    this.toastService.showToast(`Changed theme to ${this.currentColor}.`, 'checkmark-outline');
  }
}
