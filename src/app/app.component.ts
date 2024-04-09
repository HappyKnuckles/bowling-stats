import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ToastService } from './services/toast/toast.service';
import { LoadingService } from './services/loader/loading.service';
import { UserService } from './services/user/user.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  isLoading = false;
  username = '';

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadingService.isLoading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });

    this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });

    this.greetUser();
  }

  async greetUser() {
    this.username = localStorage.getItem('username') || '';
    if (!this.username) {
      await this.showEnterNameAlert();
    } else {
      this.presentGreetingAlert(this.username);
    }
  }

  async showEnterNameAlert() {
    const alert = await this.alertController.create({
      header: 'Welcome!',
      message: 'Please enter your name:',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Your Name',
          cssClass: 'nameInput'
        },
      ],
      buttons: [
        {
          text: 'Confirm',
          handler: (data) => {
            const newName = data.username.trim();
            if (newName !== '') {
              localStorage.setItem('username', newName);
              this.userService.setUsername(newName);
              this.toastService.showToast(`Name updated to ${this.username}`, 'reload-outline');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async presentGreetingAlert(name: string) {
    const alert = await this.alertController.create({
      header: `Hello ${name}!`,
      buttons: [
        {
          text: 'Hi',
        },
        {
          text: 'Change Name',
          handler: () => {
            this.showEnterNameAlert();
          }
        }
      ],
    });

    await alert.present();
  }
}
