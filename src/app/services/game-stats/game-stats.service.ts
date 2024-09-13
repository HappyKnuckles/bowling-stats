import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';

@Injectable({
  providedIn: 'root',
})
export class GameStatsService {
  totalGames: number = 0;
  perfectGameCount: number = 0;
  cleanGameCount: number = 0;
  totalStrikes: number = 0;
  totalSpares: number = 0;
  totalSparesMissed: number = 0;
  totalSparesConverted: number = 0;
  pinCounts: number[] = Array(11).fill(0);
  missedCounts: number[] = Array(11).fill(0);
  averageStrikesPerGame: number = 0;
  averageSparesPerGame: number = 0;
  averageOpensPerGame: number = 0;
  strikePercentage: number = 0;
  sparePercentage: number = 0;
  openPercentage: number = 0;
  spareConversionPercentage: number = 0;
  averageFirstCount: number = 0;
  averageScore: number = 0;
  totalScoreSum: number = 0;
  highGame: number = 0;
  constructor() {}

  calculateStats(gameHistory: Game[]): void {
    this.totalStrikes = 0;
    this.totalSpares = 0;
    this.totalSparesConverted = 0;
    this.totalSparesMissed = 0;
    this.pinCounts = Array(11).fill(0);
    this.missedCounts = Array(11).fill(0);
    let firstThrowCount = 0;
    this.perfectGameCount = 0;
    this.cleanGameCount = 0;

    gameHistory.forEach((game: { frames: any[]; totalScore: number }) => {
      if (game.totalScore === 300) {
        this.perfectGameCount++;
      }

      let isCleanGame = true;

      game.frames.forEach((frame, index) => {
        const throws = frame.throws;

        // Count the first throw in each frame for firstThrowAverage
        firstThrowCount += parseInt(throws[0].value);

        // Count strikes
        if (throws[0].value === 10) {
          this.totalStrikes++;
          // Additional logic for counting strikes in the 10th frame
          if (index === 9) {
            if (throws[1]?.value === 10) {
              this.totalStrikes++; // Increment by 1 if second throw is also a strike
              if (throws[2]?.value === 10) {
                this.totalStrikes++; // Increment by 1 if third throw is also a strike
              }
            }
          }
        } else if (index === 9 && throws.length === 3) {
          if (throws[2]?.value === 10) {
            this.totalStrikes++; // Increment by 1 if third throw is a strike
          }
        }

        // Handle pin counts for spares
        if (throws.length === 2) {
          if (throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            this.pinCounts[pinsLeft]++;
          } else {
            const pinsLeft = 10 - throws[0].value;
            this.missedCounts[pinsLeft]++;
          }
        } else if (throws.length === 3) {
          // Check for spares in the first two throws
          if (throws[0].value !== 10 && throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            this.pinCounts[pinsLeft]++;
          } else if (throws[1].value !== 10 && throws[1].value + throws[2].value === 10) {
            const pinsLeft = 10 - throws[1].value;
            this.pinCounts[pinsLeft]++;
          }

          // Check for missed pins
          if (throws[0].value !== 10 && throws[0].value + throws[1].value !== 10) {
            const pinsLeft = 10 - throws[0].value;
            this.missedCounts[pinsLeft]++;
          }
          if (throws[1].value !== 10 && throws[0].value + throws[1].value !== 10 && throws[1].value + throws[2].value !== 10) {
            const pinsLeft = 10 - throws[1].value;
            this.missedCounts[pinsLeft]++;
          }
        }

        // Check if the current frame has a score of less than 10
        const frameScore = throws.reduce((acc: any, curr: { value: any }) => acc + curr.value, 0);
        if (frameScore < 10) {
          isCleanGame = false; // If any frame is less than 10, the game is not clean
        }
      });

      if (isCleanGame) {
        this.cleanGameCount++;
      }
    });

    for (let i = 1; i <= 10; i++) {
      this.totalSparesMissed += this.missedCounts[i] || 0;
      this.totalSparesConverted += this.pinCounts[i] || 0;
    }

    this.totalSpares = this.totalSparesConverted;
    this.totalGames = gameHistory.length;
    this.averageScore = this.getAverage(gameHistory);
    this.highGame = this.getGameWithHighestScore(gameHistory);

    const totalFrames = this.totalGames * 10;
    const strikeChances = gameHistory.length * 12;

    this.averageStrikesPerGame = this.totalStrikes / this.totalGames;
    this.averageSparesPerGame = this.totalSpares / this.totalGames;
    this.averageOpensPerGame = this.totalSparesMissed / this.totalGames;

    this.strikePercentage = (this.totalStrikes / strikeChances) * 100;
    this.sparePercentage = (this.totalSpares / totalFrames) * 100;
    this.openPercentage = (this.totalSparesMissed / totalFrames) * 100;

    this.averageFirstCount = firstThrowCount / totalFrames;
  }

  private getAverage(gameHistory: Game[]): number {
    this.totalScoreSum = gameHistory.reduce((sum, game) => sum + game.totalScore, 0);
    return this.totalScoreSum / gameHistory.length;
  }

  private getGameWithHighestScore(gameHistory: Game[]): number {
    let highestScore = -1;

    gameHistory.forEach((game: { totalScore: number }) => {
      if (game.totalScore > highestScore) {
        highestScore = game.totalScore;
      }
    });

    return highestScore;
  }
}
