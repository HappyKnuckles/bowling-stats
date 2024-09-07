import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';
@Injectable({
  providedIn: 'root'
})
export class GameStatsService {
  worker: Worker | undefined;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // Initialize the web worker
      this.worker = new Worker(new URL('./game-stats.worker', import.meta.url), { type: 'module' });
    }
  }

  calculateStatsWithWorker(gameHistory: Game[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.worker) {
        // Send the game history to the worker
        this.worker.postMessage({ gameHistory });
        console.log('Game history sent to worker');
        // Listen for a message from the worker
        this.worker.onmessage = ({ data }) => {
          console.log(data)
          resolve(data); // Resolve the promise with the calculated stats
        };
        console.log('Listening for message from worker');
        // If there's an error with the worker
        this.worker.onerror = (error) => {
          reject(error);
        };
      } else {
        reject('Web Worker not supported');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate(); // Terminate the worker when done
    }
  }
}
