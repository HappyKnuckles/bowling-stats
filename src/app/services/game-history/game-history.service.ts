import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class GameHistoryService {
  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
  }

  async loadGameHistory(): Promise<Game[]> {
    const gameHistory: Game[] = [];
    await this.storage.forEach((value: Game, key: string) => {
      if (key.startsWith('game')) {
        gameHistory.push(value);
      }
    });
    this.sortGameHistoryByDate(gameHistory);
    return gameHistory;
  }

  sortGameHistoryByDate(gameHistory: Game[]): void {
    gameHistory.sort((a: { date: number }, b: { date: number }) => {
      return a.date - b.date;
    });
  }
}
