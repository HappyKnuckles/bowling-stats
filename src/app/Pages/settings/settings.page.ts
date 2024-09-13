import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonInput,
  IonIcon,
  IonTitle,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { colorPaletteOutline, personCircleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/services/toast/toast.service';
import { UserService } from 'src/app/services/user/user.service';
import { ThemeChangerService } from 'src/app/services/theme/theme-changer.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonItem,
    IonTitle,
    IonIcon,
    IonInput,
    IonContent,
    IonToolbar,
    IonHeader,
    IonSelect,
    IonSelectOption,
    FormsModule,
    CommonModule,
  ],
})
export class SettingsPage implements OnInit {
  username: string | null = '';
  currentColor: string | null = '';
  optionsWithClasses: { name: string; class: string }[] = [
    { name: 'Blue', class: 'blue-option' },
    { name: 'Lila', class: 'lila-option' },
    { name: 'Green', class: 'green-option' },
    { name: 'Red', class: 'red-option' },
    { name: 'Gray', class: 'gray-option' },
  ];
  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private themeService: ThemeChangerService
  ) {
    addIcons({ personCircleOutline, colorPaletteOutline });
  }

  ngOnInit() {
    this.currentColor = this.themeService.getCurrentTheme();

    this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
  }

  changeName() {
    this.userService.setUsername(this.username!);
  }

  changeColor() {
    this.themeService.saveColorTheme(this.currentColor!);
    this.toastService.showToast(
      `Changed theme to ${this.currentColor}.`,
      'checkmark-outline'
    );
  }
}
