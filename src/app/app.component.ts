import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private alertController: AlertController) {
    this.greetUser();
  }

  async greetUser() {
    let name = localStorage.getItem('username');

    if (!name) {
      const alert = await this.alertController.create({
        header: 'Willkommen!',
        message: 'Bitte Namen eingeben:',
        inputs: [
          {
            name: 'username',
            type: 'text',
            placeholder: 'Dein Name',
          },
        ],
        buttons: [
          {
            text: 'Submit',
            handler: (data) => {
              if (data.username) {
                name = data.username;
                localStorage.setItem('username', name!);
              }
            },
          },
        ],
      });

      await alert.present();
    } else {
      this.presentGreetingAlert(name);
    }
  }

  async presentGreetingAlert(name: string) {
    const alert = await this.alertController.create({
      header: `Hallo ${name}!`,
      buttons: ['OK'],
    });

    await alert.present();
  }
}
