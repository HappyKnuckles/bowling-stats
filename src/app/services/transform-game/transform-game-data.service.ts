import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameDataTransformerService {

  constructor() { }

  transformGameData(frames: any, frameScores: any, totalScore: any){
  const gameId = Date.now() + '_' + Math.random().toString(36).substr(2, 9); // Generate a unique gameId
  const date = Date.now();
  return  {
    gameId: gameId,
    date: date,
    frames: frames.map((frame: any[], frameIndex: number) => ({
      throws: frame.map((throwValue: any, throwIndex: number) => ({
        value: parseInt(throwValue),
        throwIndex: throwIndex + 1 // Add 1 to make it 1-based index
      })),
      frameIndex: frameIndex + 1 // Add 1 to make it 1-based index
    })),
    frameScores: frameScores,
    totalScore: totalScore
  };
}}
