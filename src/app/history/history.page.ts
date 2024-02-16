import { Component, OnChanges, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss']
})
export class HistoryPage implements OnInit {
  gameHistory: any = [];
  isLoading: boolean = false;

  constructor(private alertController: AlertController) { }

  loadGameHistory() {
    this.isLoading = true;
    const previousGameCount = this.gameHistory.length; // Store the previous game count

    // Clear the current game history
    this.gameHistory = [];

    // Retrieve games from local storage
    for (let i = 1; i <= localStorage.length; i++) {
      const key = 'game' + i;
      const gameDataString = localStorage.getItem(key);

      if (gameDataString) {
        const gameData = JSON.parse(gameDataString);
        this.gameHistory.push(gameData);
      }
    }
    this.isLoading = false;
  }
  
  async deleteGame(index: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this game?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            // Do nothing if canceled
          }
        },
        {
          text: 'Delete',
          handler: () => {
            const key = 'game' + index;
            localStorage.removeItem(key);
            // Perform any additional actions after deletion if needed
          }
        }
      ]
    });
  
    await alert.present();
  }

  ngOnInit() {
    this.loadGameHistory();
    console.log(this.gameHistory) // Call the method to load game history
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.loadGameHistory();
      event.target.complete();
    }, 100);
  }
}
