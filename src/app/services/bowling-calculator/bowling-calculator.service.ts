import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BowlingCalculatorService {
  frameScores: number[] = [];

  frames: number[][] = [[]];
  totalScore: number = 0;

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

  calculateScore() {
    let rolls: number[] = [];
    this.frames.forEach(frame => {
      rolls.push(...frame);
    });

    let score = 0;
    let frameIndex = 0;

    for (let frame = 0; frame < 10; frame++) {
      if (this.isStrike(rolls[frameIndex]) && rolls[frameIndex] != null && rolls[frameIndex + 1] != null) {
        score += 10 + this.strikeBonus(frameIndex, rolls);
        frameIndex++;
      } else if (this.isSpare(rolls[frameIndex], rolls[frameIndex + 1]) && rolls[frameIndex] != null && rolls[frameIndex + 1] != null) {
        score += 10 + this.spareBonus(frameIndex, rolls);
        frameIndex += 2;
      } else if (rolls[frameIndex] != null && rolls[frameIndex + 1] != null) {
        score += this.sumOfBallsInFrame(frameIndex, rolls);
        frameIndex += 2;
      }

      // Update frame score
      this.frameScores[frame] = score;
    }
    console.log(score);
    this.totalScore = score;
  }

  calculateMaxScore(frameIndex: number): number {
    const rolls: number[] = [];
    this.frames.slice(0, frameIndex + 1).forEach(frame => {
      rolls.push(...frame);
    });

    let maxScore = this.frameScores[frameIndex];
    let frameScore = this.frameScores[frameIndex];
    let remainingFrames = 10 - frameIndex - 1; // Remaining frames after the current frame

    for (let i = 0; i < remainingFrames; i++) {
      const currentFrame = frameIndex + i + 1;
      const nextFrame = currentFrame + 1;

      if (this.isStrike(rolls[currentFrame])) {
        maxScore += 10 + this.strikeBonus(currentFrame, rolls.slice(nextFrame, nextFrame + 2));
      } else if (this.isSpare(rolls[currentFrame], rolls[currentFrame + 1])) {
        maxScore += 10 + this.spareBonus(currentFrame, rolls.slice(nextFrame, nextFrame + 1));
      } else {
        maxScore += this.sumOfBallsInFrame(currentFrame, rolls.slice(currentFrame, currentFrame + 2));
      }
    }

    return maxScore;
  }

  isStrike(roll: number): boolean {
    return roll === 10;
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
