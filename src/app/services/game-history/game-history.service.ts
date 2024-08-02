import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';

@Injectable({
  providedIn: 'root'
})
export class GameHistoryService {
  constructor() {}

  async loadGameHistory(): Promise<Game[]> {
    const gameHistory: Game[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('game')) {
        const gameDataString = localStorage.getItem(key);
        if (gameDataString) {
          const gameData = JSON.parse(gameDataString);
          gameHistory.push(gameData);
        }
      }
    }
    await this.sortGameHistoryByDate(gameHistory);
    return gameHistory;
  }

  async sortGameHistoryByDate(gameHistory: Game[]): Promise<void> {
    gameHistory.sort((a: { date: number }, b: { date: number }) => {
      return a.date - b.date;
    });
  }
}

