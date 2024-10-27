import { EventEmitter, Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  newGameAdded = new EventEmitter<void>();
  gameDeleted = new EventEmitter<void>();
  newLeagueAdded = new EventEmitter<void>();
  leagueDeleted = new EventEmitter<void>();

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
  }

  private async save(key: string, data: any) {
    await this.storage.set(key, data);
  }

  private async delete(key: string) {
    await this.storage.remove(key);
  }

  async addLeague(key: string, data: any) {
    await this.save(key, data);
    this.newLeagueAdded.emit();
  }

  async deleteLeague(key: string) {
    await this.storage.remove(key);
    this.leagueDeleted.emit();
  }

  async saveGamesToLocalStorage(gameData: Game[], isEdit?: boolean): Promise<void> {
    for (const game of gameData) {
      const key = 'game' + game.gameId;
      await this.save(key, game);
    }
    if (!isEdit) {
      this.newGameAdded.emit();
    }
  }

  async saveGameToLocalStorage(gameData: Game, isEdit?: boolean): Promise<void> {
    const key = 'game' + gameData.gameId;
    await this.save(key, gameData);
    if (!isEdit) {
      this.newGameAdded.emit();
    }
  }

  async deleteGame(key: string): Promise<void> {
    await this.delete(key);
    this.gameDeleted.emit();
  }

  async deleteAllData(): Promise<void> {
    await this.storage.clear();
    this.gameDeleted.emit();
  }

  async loadData<T>(prefix: string): Promise<T[]> {
    const data: T[] = [];
    await this.storage.forEach((value: T, key: string) => {
      if (key.startsWith(prefix)) {
        data.push(value);
      }
    });
    return data;
  }

  async loadLeagues(): Promise<string[]> {
    const leagues = await this.loadData<string>('league');
    return leagues.reverse();
  }
  async loadGameHistory(): Promise<Game[]> {
    const gameHistory = await this.loadData<Game>('game');

    // TODO remove this block after a while
    let isRenewed = localStorage.getItem('isRenewedAgain') || false;
    if (!isRenewed) {
      gameHistory.forEach((game) => {
        game.isPerfect = game.totalScore === 300;
        game.isClean = game.frames.every((frame: { throws: any[] }) => {
          const frameTotal = frame.throws.reduce((sum: any, currentThrow: { value: any }) => sum + currentThrow.value, 0);
          return frameTotal >= 10;
        });
        if (game.league === undefined || game.league === '') {
          game.isPractice = true;
        } else game.isPractice = false;
      });
      
      this.saveGamesToLocalStorage(gameHistory);
      isRenewed = true;
      localStorage.setItem('isRenewedAgain', JSON.stringify(isRenewed));
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
