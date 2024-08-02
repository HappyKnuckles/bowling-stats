import { EventEmitter, Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';

@Injectable({
  providedIn: 'root'
})
export class SaveGameDataService {
  newDataAdded = new EventEmitter<void>();
  dataDeleted = new EventEmitter<void>();

  constructor() { }

  // TODO Use IonicStorage instead
  saveGameToLocalStorage(gameData: Game): void {
    const gameDataString = JSON.stringify(gameData);
    const key = 'game' + gameData.gameId; // Generate key using index
    localStorage.setItem(key, gameDataString);
    this.newDataAdded.emit();
  }

  deleteGame(key: string): void {
    localStorage.removeItem(key);
    this.dataDeleted.emit();
  }
}
