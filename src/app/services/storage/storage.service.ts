import { EventEmitter, Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';
import { Storage } from '@ionic/storage-angular';
import { FilterService } from '../filter/filter.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  newDataAdded = new EventEmitter<void>();
  dataDeleted = new EventEmitter<void>();
  constructor(private storage: Storage, private filterService: FilterService) {
    this.init();
  }

  async init() {
    await this.storage.create();
  }
  async saveGamesToLocalStorage(gameData: Game[]): Promise<void> {
    for (const game of gameData) {
      const key = 'game' + game.gameId; // Generate key using index
      await this.storage.set(key, game);
    }
    this.newDataAdded.emit();
  }

  async saveGameToLocalStorage(gameData: Game): Promise<void> {
    const key = 'game' + gameData.gameId; // Generate key using index
    await this.storage.set(key, gameData);
    this.newDataAdded.emit();
  }

  async deleteGame(key: string): Promise<void> {
    await this.storage.remove(key);
    this.dataDeleted.emit();
  }

  async deleteAllData(): Promise<void> {
    await this.storage.clear();
    this.dataDeleted.emit();
  }

  async loadGameHistory(): Promise<Game[]> {
    const gameHistory: Game[] = [];
    
    await this.storage.forEach((value: Game, key: string) => {
      if (key.startsWith('game')) {
        gameHistory.push(value);
      }
    });

    // TODO remove this block after a while
    let isRenewed = localStorage.getItem('isRenewed') || false;
    if (!isRenewed) {
      gameHistory.forEach((game) => {
        game.isPerfect = game.totalScore === 300;
        game.isClean = game.frames.every((frame: { throws: any[] }) => {
          const frameTotal = frame.throws.reduce((sum: any, currentThrow: { value: any }) => sum + currentThrow.value, 0);
          return frameTotal >= 10;
        });
      });
      this.saveGamesToLocalStorage(gameHistory);    
      isRenewed = true;
    localStorage.setItem('isRenewed', JSON.stringify(isRenewed));

    }
    this.sortGameHistoryByDate(gameHistory);

    return gameHistory;
  }

  private sortGameHistoryByDate(gameHistory: Game[]): void {
    gameHistory.sort((a: { date: number }, b: { date: number }) => {
      return b.date - a.date;
    });
  }
}
