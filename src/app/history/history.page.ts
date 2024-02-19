import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss']
})
export class HistoryPage implements OnInit, OnDestroy {
  gameHistory: any = [];
  isLoading: boolean = false;

  constructor(private alertController: AlertController) {
  }

  async loadGameHistory() {
    this.isLoading = true;
    // Clear the current game history
    this.gameHistory = [];

    // Retrieve games from local storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('game')) {
        const gameDataString = localStorage.getItem(key);
        if (gameDataString) {
          const gameData = JSON.parse(gameDataString);
          this.gameHistory.push(gameData);

        }
      }
    }
    this.isLoading = false;
  }


  async deleteGame(gameId: string) {
    console.log(gameId);
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
            const key = 'game' + gameId;
            localStorage.removeItem(key);
            window.dispatchEvent(new Event('dataDeleted'));
          }
        }
      ]
    });

    await alert.present();
  }


  async ngOnInit() {
    await this.loadGameHistory();
    this.subscribeToDataEvents();

  }
  
  private subscribeToDataEvents() {
    window.addEventListener('newDataAdded', () => {
      this.loadGameHistory();
    });

    window.addEventListener('dataDeleted', () => {
      this.loadGameHistory();
    });
  }

  ngOnDestroy() {
    window.removeEventListener('newDataAdded', this.loadGameHistory);
    window.removeEventListener('dataDeleted', this.loadGameHistory);
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.loadGameHistory();
      event.target.complete();
    }, 100);
  }
}
