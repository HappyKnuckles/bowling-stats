import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';

@Injectable({
  providedIn: 'root',
})
export class GameDataTransformerService {
  constructor() {}

  transformGameData(frames: any, frameScores: any, totalScore: any, isSeries?: boolean, seriesId?: string, note?: string): Game {
    const gameId = Date.now() + '_' + Math.random().toString(36).substr(2, 9); // Generate a unique gameId
    const date = Date.now();
    return {
      gameId: gameId,
      date: date,
      frames: frames.map((frame: any[], frameIndex: number) => ({
        throws: frame.map((throwValue: any, throwIndex: number) => ({
          value: parseInt(throwValue),
          throwIndex: throwIndex + 1, // Add 1 to make it 1-based index
        })),
        frameIndex: frameIndex + 1,
      })),
      frameScores: frameScores,
      totalScore: totalScore,
      isSeries: isSeries,
      seriesId: seriesId,
      note: note,
    };
  }
}
