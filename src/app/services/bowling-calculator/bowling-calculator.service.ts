import { Injectable } from '@angular/core';

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
    this.addFrame();
  }

  addFrame() {
    for (let i = 1; i < 10; i++) {
      this.frames.push([]);
    }
  }

  clearRolls() {
    // Reset rolls array
    this.rolls = Array.from({ length: 21 }, () => 0);
    this.frames = [[]];
    this.frameScores = [];
    this.addFrame();
    // Recalculate the score and max score
    this.totalScore = 0;
    this.maxScore = 300; // Maximum possible score is 300 for 10 strikes
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

    // Base case: First frame
    if (frameIndex < 9) {
      if (frameIndex === 0) {
        if (secondThrow !== undefined) {
          if (this.isStrike(firstThrow)) {
            return this.maxScore = 300; // Maximum score if first throw is a strike
          }
          if (this.isSpare(firstThrow, secondThrow)) {
            return this.maxScore -= 10;
          }
          return this.maxScore -= 30 - (firstThrow + secondThrow);
        } else return this.maxScore;
      }
      // Handling frames after the first frame
      else {
        if (secondThrow !== undefined) {
          if (frameIndex >= 2) {
            if (this.isPreviousStrike(frameIndex - 1) && this.isPreviousStrike(frameIndex) && this.isSpare(firstThrow, secondThrow)) {
              return this.maxScore -= 30 - (firstThrow)//50 - ((2 * firstThrow) + secondThrow);
            }
            if (this.isPreviousStrike(frameIndex - 1) && this.isPreviousStrike(frameIndex) && !this.isSpare(firstThrow, secondThrow)) {
              return this.maxScore -= 60 - (firstThrow + 2 * (firstThrow + secondThrow));
            }
          }
          if (frameIndex >= 1) {
            if (firstThrow !== 10) {
              if (this.isPreviousStrike(frameIndex) && this.isSpare(firstThrow, secondThrow)) {
                return this.maxScore -= 20;
              }
              if (this.isPreviousStrike(frameIndex) && !this.isSpare(firstThrow, secondThrow)) {
                return this.maxScore -= 50 - 2 * (firstThrow + secondThrow);
              }
              if (this.isPreviousSpare(frameIndex) && this.isSpare(firstThrow, secondThrow)) {
                return this.maxScore -= 20 - (firstThrow);
              }
              if (this.isPreviousSpare(frameIndex) && !this.isSpare(firstThrow, secondThrow)) {
                return this.maxScore -= 40 - (2 * firstThrow + secondThrow);
              }
              if (!this.isPreviousSpare(frameIndex) && this.isSpare(firstThrow, secondThrow)) {
                return this.maxScore -= 10;
              }
            }
            if (!this.isPreviousSpare(frameIndex) && this.isStrike(firstThrow)) {
              return this.maxScore = this.maxScore;
            }

            return this.maxScore -= 30 - (firstThrow + secondThrow);
          }
        }
      }
    }
    // Last Frame
    else {
      const thirdThrow = this.frames[frameIndex][3];
      if (!this.isStrike(firstThrow) && this.isStrike(secondThrow) && !this.isSpare(firstThrow, secondThrow) && secondThrow !== undefined) {
        return this.maxScore = this.totalScore;
      }
      if (this.isSpare(firstThrow, secondThrow) && secondThrow !== undefined) {
        return this.maxScore -= 10;
      }
      if (this.isStrike(firstThrow) && !this.isStrike(secondThrow) && secondThrow !== undefined) {
        if (this.isPreviousStrike(frameIndex)) {
          return this.maxScore -= 20 - 2 * secondThrow;
        } else return this.maxScore -= 10;
      }
      if (this.isStrike(firstThrow)) {
        return this.maxScore;
      }
      if (!this.isSpare(firstThrow, secondThrow) && secondThrow !== undefined) {
        return this.maxScore = this.totalScore;
      }
      if (thirdThrow != undefined) {
        return this.maxScore = this.totalScore;
      }
    }

    return this.maxScore;
  }

  getSeriesMaxScore(index: number, maxScores: number[]): number {
    if (index === 1) {
      return maxScores[1] + maxScores[2] + maxScores[3];
    }
    if (index === 2) {
      return maxScores[4] + maxScores[5] + maxScores[6] + maxScores[7];
    }
    return 900;
  }

  getSeriesCurrentScore(index: number, totalScores: number[]): number {
    if (index === 1) {
      return totalScores[1] + totalScores[2] + totalScores[3];
    }
    if (index === 2) {
      return totalScores[4] + totalScores[5] + totalScores[6] + totalScores[7];
    }
    return 0;
  }

  isStrike(roll: number): boolean {
    return roll === 10;
  }

  isPreviousStrike(index: number): boolean {
    if (this.frames[index - 1][0] === 10) {
      return true;
    }
    return false;
  }

  isPreviousSpare(index: number): boolean {
    if (this.frames[index - 1][0] + this.frames[index - 1][1] === 10) {
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
