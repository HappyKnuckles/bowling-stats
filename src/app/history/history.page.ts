import { Component, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss']
})
export class HistoryPage implements OnInit {
  gameHistory: any = [];
  isLoading: boolean = false;

  constructor() { }

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

  ngOnInit() {
    this.loadGameHistory(); // Call the method to load game history
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.loadGameHistory();
      event.target.complete();
    }, 100);
  }
}
