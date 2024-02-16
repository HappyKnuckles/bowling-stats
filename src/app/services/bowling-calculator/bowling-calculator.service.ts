import { Injectable } from '@angular/core';
import { first, max } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BowlingCalculatorService {
  frameScores: number[] = [];

  frames: number[][] = [[]];
  totalScore: number = 0;
  rolls: number[] = Array.from({ length: 21 }, () => 0);
  maxScore = 300; // Maximum possible score is 300 for 10 strikes


  constructor() {
    for (let i = 1; i < 10; i++) {
      this.addFrame();
    }
  }

  addFrame() {
    if (this.frames.length < 9) {
      this.frames.push([]);
    } else if (this.frames.length === 9) {
      this.frames.push([]);
    }
  }

  clearRolls() {
    // Reset rolls array
    this.rolls = Array.from({ length: 21 }, () => 0);
    this.frames = Array.from({ length: 10 }, () => []);

    // Recalculate the score and max score
    this.calculateScore();
  }

  calculateScore() {
    let index = 0;
    this.frames.forEach(frame => {
      frame.forEach(value => {
        this.rolls[index++] = value;
      });
    });

    let score = 0;
    let frameIndex = 0;

    for (let frame = 0; frame < 10; frame++) {
      if (this.isStrike(this.rolls[frameIndex]) && this.rolls[frameIndex] != null && this.rolls[frameIndex + 1] != null) {
        score += 10 + this.strikeBonus(frameIndex, this.rolls);
        frameIndex++;
      } else if (this.isSpare(this.rolls[frameIndex], this.rolls[frameIndex + 1]) && this.rolls[frameIndex] != null && this.rolls[frameIndex + 1] != null) {
        score += 10 + this.spareBonus(frameIndex, this.rolls);
        frameIndex += 2;
      } else if (this.rolls[frameIndex] != null && this.rolls[frameIndex + 1] != null) {
        score += this.sumOfBallsInFrame(frameIndex, this.rolls);
        frameIndex += 2;
      }
      // Update frame score
      this.frameScores[frame] = score;
    }
    this.totalScore = score;
  }

  calculateMaxScore(frameIndex: number): number {
    const firstThrow = this.frames[frameIndex][0];
    const secondThrow = this.frames[frameIndex][1];

    if (frameIndex === 0 && secondThrow !== undefined) {
      if (this.isStrike(firstThrow)) {
        return this.maxScore = 300;
      } else if (this.isSpare(firstThrow, secondThrow)) {
        this.maxScore -= 10;
      } else {
        this.maxScore -= 30 - firstThrow + secondThrow;
      }
    } else if (this.isPreviousStrike(firstThrow) && this.isStrike(firstThrow)) {
      this.maxScore = this.maxScore;
    } else if (firstThrow !== 10 && secondThrow !== undefined) {
      if (this.isPreviousStrike(firstThrow) && this.isSpare(firstThrow, secondThrow)) {
        this.maxScore -= 20;
      } else if (this.isPreviousStrike(firstThrow) && !this.isSpare(firstThrow, secondThrow)) {
        this.maxScore -= 40 - 2 * (firstThrow + secondThrow);
      } else if (this.isPreviousSpare(firstThrow, secondThrow) && this.isSpare(firstThrow, secondThrow)) {
        this.maxScore -= 20 - firstThrow ;
      } else if (this.isPreviousSpare(firstThrow, secondThrow) && !this.isSpare(firstThrow, secondThrow)) {
        this.maxScore -= 40 - 2 * firstThrow + secondThrow;
      } else if (!this.isPreviousSpare(firstThrow, secondThrow) && this.isStrike(firstThrow)) {
        this.maxScore = this.maxScore;
      } else {
        this.maxScore -= 40 - firstThrow + secondThrow;
      }
    }

    return this.maxScore;
  }

  isStrike(roll: number): boolean {
    return roll === 10;
  }

  isPreviousStrike(firstThrow: number): boolean {
    if (firstThrow === undefined) {
      return true;
    }
    if (firstThrow === 10) {
      return true;
    }
    return false;
  }

  isPreviousSpare(firstThrow: number, secondThrow: number): boolean {
    if (firstThrow + secondThrow === 10) {
      return true;
    }
    return false;
  }

  isSpare(roll1: number, roll2: number): boolean {
    return roll1 + roll2 === 10;
  }

  sumOfBallsInFrame(frameIndex: number, rolls: number[]): number {
    return rolls[frameIndex] + rolls[frameIndex + 1];
  }

  spareBonus(frameIndex: number, rolls: number[]): number {
    return rolls[frameIndex + 2];
  }

  strikeBonus(frameIndex: number, rolls: number[]): number {
    return rolls[frameIndex + 1] + rolls[frameIndex + 2];
  }
}
