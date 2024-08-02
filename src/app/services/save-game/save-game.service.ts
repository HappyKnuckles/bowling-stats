import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SaveGameDataService {
  newDataAdded = new EventEmitter<void>();
  dataDeleted = new EventEmitter<void>();

  constructor() { }

  saveGameToLocalStorage(gameData: any): void {
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
