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
            const oldName = localStorage.getItem('username');
            if (data.username && data.username.trim() !== '') {
              const name = data.username;
              localStorage.setItem('username', name);
              if (oldName) {
                this.setToastOpen('Name geändert', 'reload-outline');
              } else {
                this.setToastOpen('Name hinzugefügt', 'reload-outline');
              }
              return true;
            } else if (!oldName) {
              return false; // Verhindert das Schließen des Dialogs, wenn das Eingabefeld leer ist und kein Name gespeichert ist
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
    this.isToastOpen = false;
    setTimeout(() => {
      this.isToastOpen = true;
    }, 100);
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
