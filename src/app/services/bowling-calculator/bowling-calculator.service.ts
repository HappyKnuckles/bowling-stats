import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BowlingCalculatorService {
  private rolls: number[] = [];

  constructor() { }

  public roll(pins: number): void {
    this.rolls.push(pins);
  }
  public score(): number {
    let score = 0;
    let frameIndex = 0;
    const rolls = this.rolls;

    for (let frame = 0; frame < 10; frame++) {
      if (this.isStrike(frameIndex) && rolls[frameIndex] != null && rolls[frameIndex + 1] != null) {
        score += 10 + this.strikeBonus(frameIndex);
        frameIndex++;
      } else if (this.isSpare(frameIndex) && rolls[frameIndex] != null && rolls[frameIndex + 1] != null) {
        score += 10 + this.spareBonus(frameIndex);
        frameIndex += 2;
      } else if (rolls[frameIndex] != null && rolls[frameIndex + 1] != null) {
        score += this.sumOfBallsInFrame(frameIndex);
        frameIndex += 2;
      }
    }

    return score;
}


   isStrike(frameIndex: number): boolean {
    return this.rolls[frameIndex] === 10;
  }

   isSpare(frameIndex: number): boolean {
    return this.rolls[frameIndex] + this.rolls[frameIndex + 1] === 10;
  }

   sumOfBallsInFrame(frameIndex: number): number {
    return this.rolls[frameIndex] + this.rolls[frameIndex + 1];
  }

   spareBonus(frameIndex: number): number {
    return this.rolls[frameIndex + 2];
  }

   strikeBonus(frameIndex: number): number {
    return this.rolls[frameIndex + 1] + this.rolls[frameIndex + 2];
  }
}
