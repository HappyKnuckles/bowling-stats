import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  icon: string = '';
  error?: boolean = false;
  message: string = '';
  isToastOpen: boolean = false;

  constructor(private alertController: AlertController) {
    this.greetUser();
  }

  async greetUser() {
    let name = localStorage.getItem('username');

    if (!name) {
      await this.showEnterNameAlert();
    } else {
      this.presentGreetingAlert(name);
    }
  }

  async showEnterNameAlert() {
    const alert = await this.alertController.create({
      header: 'Willkommen!',
      message: 'Bitte Namen eingeben:',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Dein Name',
          cssClass: 'nameInput'
        },
      ],
      buttons: [
        {
          text: 'Bestätigen',
          handler: (data) => {
            if (data.username) {
              const name = data.username;
              localStorage.setItem('username', name);
              this.setToastOpen('Name geändert', 'reload-outline')
            }
          },
        },
      ],
    });

    await alert.present();
  }

  setToastOpen(message: string, icon: string, error?: boolean) {
    this.message = message;
    this.icon = icon;
    this.error = error;
    this.isToastOpen = true;
  }
  
  async presentGreetingAlert(name: string) {
    const alert = await this.alertController.create({
      header: `Hallo ${name}!`,
      buttons: [
        {
          text: 'Hi',
        },
        {
          text: 'Namen ändern',
          handler: () => {
            this.showEnterNameAlert(); // Call showEnterNameAlert function to allow the user to change their name
          }
        }
      ],
    });

    await alert.present();
  }


}
