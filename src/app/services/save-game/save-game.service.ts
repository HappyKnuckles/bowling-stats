import { EventEmitter, Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';
import { Storage } from '@ionic/storage-angular';
import * as cordovaSQLiteDriver from 'localforage-cordovasqlitedriver';

@Injectable({
  providedIn: 'root'
})
export class SaveGameDataService {
  newDataAdded = new EventEmitter<void>();
  dataDeleted = new EventEmitter<void>();

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    this.storage.defineDriver(cordovaSQLiteDriver)
    await this.storage.create();    console.log(this.storage.driver)

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
}