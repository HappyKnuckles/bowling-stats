import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ToastService } from './services/toast/toast.service';
import { LoadingService } from './services/loader/loading.service';
import { UserService } from './services/user/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  isLoading = false;
  private loadingSubscription: Subscription;
  private userNameSubscription: Subscription;

  username = '';

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private loadingService: LoadingService,
    private userService: UserService
  ) {
    this.loadingSubscription = this.loadingService.isLoading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
    this.userNameSubscription = this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
  }

  ngOnInit(): void {
    this.greetUser();
  }

  ngOnDestroy(): void {
    this.loadingSubscription.unsubscribe();
    this.userNameSubscription.unsubscribe();

  }

  async greetUser(): Promise<void> {
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
              this.userService.setUsername(newName);
              this.toastService.showToast(`Name updated to ${this.username}`, 'reload-outline');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async presentGreetingAlert(name: string): Promise<void> {
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
