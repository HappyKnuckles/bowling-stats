import { Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Game } from 'src/app/models/game-model';
import { Stats } from 'src/app/models/stats-model';

@Injectable({
  providedIn: 'root',
})
export class ChartDataService {
  constructor() { }

  calculateScoreChartData(gameHistory: Game[]) {
    const scoresByDate: { [date: string]: number[] } = {};
    gameHistory.forEach((game: any) => {
      const date = new Date(game.date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      if (!scoresByDate[date]) {
        scoresByDate[date] = [];
      }
      scoresByDate[date].push(game.totalScore);
    });

    const gameLabels = Object.keys(scoresByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulativeSum = 0;
    let cumulativeCount = 0;

    const overallAverages = gameLabels.map((date) => {
      cumulativeSum += scoresByDate[date].reduce((sum, score) => sum + score, 0);
      cumulativeCount += scoresByDate[date].length;
      return cumulativeSum / cumulativeCount;
    });
    overallAverages.map((average) => parseFloat(new DecimalPipe("en").transform(average, '1.2-2')!));

    const differences = gameLabels.map((date, index) => {
      const dailySum = scoresByDate[date].reduce((sum, score) => sum + score, 0);
      const dailyAverage = dailySum / scoresByDate[date].length;
      return dailyAverage - overallAverages[index];
    });
    differences.map((difference) => parseFloat(new DecimalPipe("en").transform(difference, '1.2-2')!));

    const gamesPlayedDaily = gameLabels.map((date) => scoresByDate[date].length);
    return { gameLabels, overallAverages, differences, gamesPlayedDaily };
  }

  calculatePinChartData(stats: Stats) {
    const filteredSpareRates: number[] = stats.spareRates.slice(1).map((rate) => parseFloat(new DecimalPipe("en").transform(rate, '1.2-2')!));
    const filteredMissedCounts: number[] = stats.missedCounts.slice(1).map((count, i) => {
      const rate = this.getRate(count, stats.pinCounts[i + 1]);
      const transformedRate = new DecimalPipe("en").transform(rate, '1.2-2');
      return parseFloat(transformedRate ?? '0');
    });
    return { filteredSpareRates, filteredMissedCounts };
  }

  calculateThrowChartData(stats: Stats) {
    const opens = parseFloat(new DecimalPipe("en").transform(stats.openPercentage, '1.2-2')!);
    const spares = parseFloat(new DecimalPipe("en").transform(stats.sparePercentage, '1.2-2')!);
    const strikes = parseFloat(new DecimalPipe("en").transform(stats.strikePercentage, '1.2-2')!);
    return { opens, spares, strikes };
  }

  private getRate(converted: number, missed: number): number {
    if (converted + missed === 0) {
      return 0;
    }
    return (converted / (converted + missed)) * 100;
  }
}