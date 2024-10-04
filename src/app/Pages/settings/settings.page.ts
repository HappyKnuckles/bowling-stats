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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonButton,
  IonTextarea,
  IonText,
} from '@ionic/angular/standalone';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { colorPaletteOutline, logoGithub, personCircleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/services/toast/toast.service';
import { UserService } from 'src/app/services/user/user.service';
import { ThemeChangerService } from 'src/app/services/theme/theme-changer.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import emailjs from '@emailjs/browser';
import { LoadingService } from 'src/app/services/loader/loading.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonTextarea,
    ReactiveFormsModule,
    IonButton,
    IonLabel,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
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
  userEmail: string = '';
  feedbackMessage: string = '';
  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private themeService: ThemeChangerService,
  ) {
    addIcons({ personCircleOutline, colorPaletteOutline, logoGithub });
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
    this.toastService.showToast(`Changed theme to ${this.currentColor}.`, 'checkmark-outline');
  }

  async submitFeedback(form: NgForm) {
    if (form.valid) {
      const templateParams = {
        from_name: this.userEmail,
        message: this.feedbackMessage,
        to_name: 'Lightning Bowl',
      };
      this.loadingService.setLoading(true);
      try {
        await emailjs.send(environment.emailServiceID, environment.emailTemplateID, templateParams, environment.emailUserID);
        alert('Thank you for your feedback!');
        this.userEmail = '';
        this.feedbackMessage = '';
        form.resetForm();
      } catch (error) {
        console.error('ERROR...', error);
        alert('Unexpected error occurred, please try again later.');
      } finally {
        this.loadingService.setLoading(false);
      }
    } else {
      alert('Please fill out all fields correctly.');
    }
  }
}
