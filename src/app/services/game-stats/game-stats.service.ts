import { Injectable } from '@angular/core';
import { SessionStats, Stats } from 'src/app/models/stats-model';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Game } from 'src/app/models/game-model';
import { PrevStats } from 'src/app/models/stats-model';

const PERFECT_SCORE = 300;
const MAX_FRAMES = 10;
@Injectable({
  providedIn: 'root',
})
export class GameStatsService {
  // Previous Stats
  prevStats: PrevStats = {
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    cleanGamePercentage: 0,
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    averageFirstCount: 0,
    cleanGameCount: 0,
    perfectGameCount: 0,
    averageScore: 0,
    overallSpareRate: 0,
    overallMissedRate: 0,
    spareRates: [] as number[],
  };

  // Stats
  currentStats: Stats = {
    totalGames: 0,
    totalPins: 0,
    perfectGameCount: 0,
    cleanGameCount: 0,
    cleanGamePercentage: 0,
    totalStrikes: 0,
    totalSpares: 0,
    totalSparesMissed: 0,
    totalSparesConverted: 0,
    pinCounts: Array(11).fill(0),
    missedCounts: Array(11).fill(0),
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    spareConversionPercentage: 0,
    averageFirstCount: 0,
    averageScore: 0,
    highGame: 0,
    spareRates: [],
    overallSpareRate: 0,
    overallMissedRate: 0,
  };

  // Session Stats
  sessionStats: SessionStats = {
    totalGames: 0,
    totalPins: 0,
    perfectGameCount: 0,
    cleanGameCount: 0,
    cleanGamePercentage: 0,
    totalStrikes: 0,
    totalSpares: 0,
    totalSparesMissed: 0,
    totalSparesConverted: 0,
    pinCounts: Array(11).fill(0),
    missedCounts: Array(11).fill(0),
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    spareConversionPercentage: 0,
    averageFirstCount: 0,
    averageScore: 0,
    highGame: 0,
    lowGame: 0,
    spareRates: [],
    overallSpareRate: 0,
    overallMissedRate: 0,
  };

  private currentStatsSubject = new BehaviorSubject<Stats>(this.currentStats);
  private sessionStatsSubject = new BehaviorSubject<SessionStats>(this.sessionStats);

  currentStats$ = this.currentStatsSubject.asObservable();
  sessionStats$ = this.sessionStatsSubject.asObservable();

  constructor() {}

  calculateStats(gameHistory: Game[]): void {
    const lastComparisonDate = localStorage.getItem('lastComparisonDate') ?? '0';
    const today = Date.now();

    let lastGameDate = 0;
    if (gameHistory.length > 0) {
      lastGameDate = gameHistory[gameHistory.length - 1].date;
    }

    if (lastComparisonDate !== '0') {
      // If the previous game date is different, update the stats comparison
      if (!this.isSameDay(parseInt(lastComparisonDate), today) && this.isDayBefore(parseInt(lastComparisonDate), lastGameDate)) {
        // Save previous stats
        this.prevStats = {
          strikePercentage: this.currentStats.strikePercentage,
          sparePercentage: this.currentStats.sparePercentage,
          openPercentage: this.currentStats.openPercentage,
          cleanGamePercentage: this.currentStats.cleanGamePercentage,
          averageStrikesPerGame: this.currentStats.averageStrikesPerGame,
          averageSparesPerGame: this.currentStats.averageSparesPerGame,
          averageOpensPerGame: this.currentStats.averageOpensPerGame,
          averageFirstCount: this.currentStats.averageFirstCount,
          cleanGameCount: this.currentStats.cleanGameCount,
          perfectGameCount: this.currentStats.perfectGameCount,
          averageScore: this.currentStats.averageScore,
          overallSpareRate: this.currentStats.overallSpareRate,
          spareRates: this.currentStats.spareRates,
          overallMissedRate: this.currentStats.overallMissedRate,
        };

        localStorage.setItem('prevStats', JSON.stringify(this.prevStats));
        localStorage.setItem('lastComparisonDate', lastGameDate.toString());
      }
    }

    this.currentStats = this.calculateBowlingStats(gameHistory);
    this.updateCurrentStats(this.currentStats);

    if (lastComparisonDate === '0') {
      if (this.currentStats.totalGames > 0) {
        this.prevStats = {
          strikePercentage: this.currentStats.strikePercentage,
          sparePercentage: this.currentStats.sparePercentage,
          openPercentage: this.currentStats.openPercentage,
          cleanGamePercentage: this.currentStats.cleanGamePercentage,
          averageStrikesPerGame: this.currentStats.averageStrikesPerGame,
          averageSparesPerGame: this.currentStats.averageSparesPerGame,
          averageOpensPerGame: this.currentStats.averageOpensPerGame,
          averageFirstCount: this.currentStats.averageFirstCount,
          cleanGameCount: this.currentStats.cleanGameCount,
          perfectGameCount: this.currentStats.perfectGameCount,
          averageScore: this.currentStats.averageScore,
          overallSpareRate: this.currentStats.overallSpareRate,
          spareRates: this.currentStats.spareRates,
          overallMissedRate: this.currentStats.overallMissedRate,
        };
      } else {
        this.prevStats = {
          strikePercentage: 0,
          sparePercentage: 0,
          openPercentage: 0,
          cleanGamePercentage: 0,
          averageStrikesPerGame: 0,
          averageSparesPerGame: 0,
          averageOpensPerGame: 0,
          averageFirstCount: 0,
          cleanGameCount: 0,
          perfectGameCount: 0,
          averageScore: 0,
          overallSpareRate: 0,
          spareRates: Array(11).fill(0),
          overallMissedRate: 0,
        };
      }
      localStorage.setItem('prevStats', JSON.stringify(this.prevStats));
      localStorage.setItem('lastComparisonDate', lastGameDate.toString());
    }
  }

  calculateStatsBasedOnDate(gameHistory: Game[], date: number): void {
    const filteredGames = gameHistory.filter((game) => this.isSameDay(game.date, date));
    this.sessionStats = this.calculateBowlingStats(filteredGames) as SessionStats;
    this.updateSessionStats(this.sessionStats);
  }

  private calculateBowlingStats(gameHistory: Game[]): Stats | SessionStats {
    let totalStrikes = 0;
    let totalSpares = 0;
    let totalSparesConverted = 0;
    let totalSparesMissed = 0;
    const pinCounts = Array(11).fill(0);
    const missedCounts = Array(11).fill(0);
    let firstThrowCount = 0;
    let perfectGameCount = 0;
    let cleanGameCount = 0;
    let lowestScore = -1;
    let highestScore = -1;

    gameHistory.forEach((game: { frames: any[]; totalScore: number }) => {
      if (game.totalScore === PERFECT_SCORE) {
        perfectGameCount++;
      }

      gameHistory.forEach((game: { totalScore: number }) => {
        if (game.totalScore > highestScore) {
          highestScore = game.totalScore;
        }
        if (lowestScore === -1 || game.totalScore < lowestScore) {
          lowestScore = game.totalScore;
        }
      });

      let isCleanGame = true;

      game.frames.forEach((frame, index) => {
        const throws = frame.throws;

        // Count the first throw in each frame for firstThrowAverage
        firstThrowCount += parseInt(throws[0].value);

        // Count strikes
        if (throws[0].value === 10) {
          totalStrikes++;
          // Additional logic for counting strikes in the 10th frame
          if (index === 9) {
            if (throws[1]?.value === 10) {
              totalStrikes++; // Increment by 1 if second throw is also a strike
              if (throws[2]?.value === 10) {
                totalStrikes++; // Increment by 1 if third throw is also a strike
              }
            }
          }
        } else if (index === 9 && throws.length === 3) {
          if (throws[2]?.value === 10) {
            totalStrikes++; // Increment by 1 if third throw is a strike
          }
        }

        // Handle pin counts for spares
        if (throws.length === 2) {
          if (throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            pinCounts[pinsLeft]++;
          } else {
            const pinsLeft = 10 - throws[0].value;
            missedCounts[pinsLeft]++;
          }
        } else if (throws.length === 3) {
          // Check for spares in the first two throws
          if (throws[0].value !== 10 && throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            pinCounts[pinsLeft]++;
          } else if (throws[1].value !== 10 && throws[1].value + throws[2].value === 10) {
            const pinsLeft = 10 - throws[1].value;
            pinCounts[pinsLeft]++;
          }

          // Check for missed pins
          if (throws[0].value !== 10 && throws[0].value + throws[1].value !== 10) {
            const pinsLeft = 10 - throws[0].value;
            missedCounts[pinsLeft]++;
          }
          if (throws[1].value !== 10 && throws[0].value + throws[1].value !== 10 && throws[1].value + throws[2].value !== 10) {
            const pinsLeft = 10 - throws[1].value;
            missedCounts[pinsLeft]++;
          }
        }

        // Check if the current frame has a score of less than 10
        const frameScore = throws.reduce((acc: any, curr: { value: any }) => acc + curr.value, 0);
        if (frameScore < 10) {
          isCleanGame = false; // If any frame is less than 10, the game is not clean
        }
      });

      if (isCleanGame) {
        cleanGameCount++;
      }
    });

    for (let i = 1; i <= MAX_FRAMES; i++) {
      totalSparesMissed += missedCounts[i] || 0;
      totalSparesConverted += pinCounts[i] || 0;
    }

    totalSpares = totalSparesConverted;
    const totalPins = gameHistory.reduce((sum, game) => sum + game.totalScore, 0);

    const totalGames = gameHistory.length;
    const averageScore = totalPins / gameHistory.length;
    const highGame = highestScore;
    const lowGame = lowestScore;

    const cleanGamePercentage = (cleanGameCount / totalGames) * 100;

    const totalFrames = totalGames * 10;
    const strikeChances = gameHistory.length * 12;

    const averageStrikesPerGame = totalStrikes / totalGames;
    const averageSparesPerGame = totalSpares / totalGames;
    const averageOpensPerGame = totalSparesMissed / totalGames;

    const strikePercentage = (totalStrikes / strikeChances) * 100;
    const sparePercentage = (totalSpares / totalFrames) * 100;
    const openPercentage = (totalSparesMissed / totalFrames) * 100;

    const averageFirstCount = firstThrowCount / totalFrames;

    const spareRates = pinCounts.map((pinCount, i) => this.getRate(pinCount, missedCounts[i]));
    const overallSpareRate = this.getRate(totalSparesConverted, totalSparesMissed);
    const spareConversionPercentage = (totalSparesConverted / (totalSparesConverted + totalSparesMissed)) * 100;
    const overallMissedRate = totalSparesMissed > 0 ? 100 - overallSpareRate : 0;

    return {
      totalStrikes,
      totalSpares,
      totalSparesConverted,
      totalSparesMissed,
      pinCounts,
      missedCounts,
      perfectGameCount,
      cleanGameCount,
      cleanGamePercentage,
      totalGames,
      averageScore,
      highGame,
      averageStrikesPerGame,
      averageSparesPerGame,
      averageOpensPerGame,
      strikePercentage,
      sparePercentage,
      openPercentage,
      averageFirstCount,
      spareRates,
      overallSpareRate,
      totalPins,
      overallMissedRate,
      spareConversionPercentage,
      lowGame,
    };
  }

  private updateCurrentStats(newStats: Stats | SessionStats): void {
    this.currentStatsSubject.next(newStats);
  }

  private updateSessionStats(newStats: SessionStats): void {
    this.sessionStatsSubject.next(newStats);
  }

  private getRate(converted: number, missed: number): number {
    if (converted + missed === 0) {
      return 0;
    }
    return (converted / (converted + missed)) * 100;
  }

  private isSameDay(timestamp1: number, timestamp2: number): boolean {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);

    return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  }

  private isDayBefore(timestamp1: number, timestamp2: number): boolean {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);

    if (date1.getFullYear() < date2.getFullYear()) {
      return true;
    } else if (date1.getFullYear() === date2.getFullYear()) {
      if (date1.getMonth() < date2.getMonth()) {
        return true;
      } else if (date1.getMonth() === date2.getMonth()) {
        return date1.getDate() < date2.getDate();
      }
    }

    return false;
  }
}
