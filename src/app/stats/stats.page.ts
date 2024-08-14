import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import { GameHistoryService } from '../services/game-history/game-history.service';
import { ToastService } from '../services/toast/toast.service';
import { BowlingCalculatorService } from '../services/bowling-calculator/bowling-calculator.service';
import { GameStatsService } from '../services/game-stats/game-stats.service';
import { Subscription } from 'rxjs';
import { SaveGameDataService } from '../services/save-game/save-game.service';
import { LoadingService } from '../services/loader/loading.service';
import { Game } from '../models/game-model';
@Component({
  selector: 'app-stats',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss']
})
export class StatsPage implements OnInit, OnDestroy {
  gameHistory: Game[] = [];
  totalGames: number = 0;
  averageScore: number = 0;
  totalPins: number = 0;
  totalStrikes: number = 0;
  totalSpares: number = 0;
  totalSparesMissed: number = 0;
  totalSparesConverted: number = 0;
  totalOpens: number = 0;
  firstThrowCount: number = 0;
  averageFirstCount: number = 0;
  averageStrikesPerGame: number = 0;
  averageSparesPerGame: number = 0;
  averageOpensPerGame: number = 0;
  strikePercentage: number = 0;
  sparePercentage: number = 0;
  openPercentage: number = 0;
  spareConversionPercentage: number = 0;
  highGame: number = 0;
  pinCounts: number[] = Array(11).fill(0);
  missedCounts: number[] = Array(11).fill(0);
  totalMissed: number = 0;
  totalConverted: number = 0;
  gameHistoryChanged: boolean = true;
  newDataAddedSubscription!: Subscription;
  dataDeletedSubscription!: Subscription;
  private loadingSubscription: Subscription;
  isLoading: boolean = false;
  @ViewChild('scoreChart') scoreChart?: ElementRef;
  private chartInstance: Chart | null = null;


  constructor(private loadingService: LoadingService,
    private statsService: GameStatsService,
    private toastService: ToastService,
    private gameHistoryService: GameHistoryService,
    private saveService: SaveGameDataService) {
    this.loadingSubscription = this.loadingService.isLoading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
  }

  private async loadDataAndCalculateStats() {
    if (this.gameHistoryChanged) {
      try {
        await this.loadGameHistory();
        this.loadStats();
        this.gameHistoryChanged = false; // Reset the flag
      } catch (error) {
        this.toastService.showToast(`Fehler beim Historie und Stats laden: ${error}`, 'bug-outline', true)
      }
    }
  }

  async loadGameHistory() {
    try {
      this.gameHistory = await this.gameHistoryService.loadGameHistory();
    } catch (error) {
      this.toastService.showToast(`Fehler beim Historie laden: ${error}`, 'bug-outline', true)
    }
  }

  async loadStats() {
    try {
      this.statsService.calculateStats(this.gameHistory);

      const {
        totalGames,
        averageScore,
        averageFirstCount,
        totalScoreSum: totalPins,
        totalStrikes,
        averageStrikesPerGame,
        strikePercentage,
        totalSpares,
        totalSparesConverted,
        totalSparesMissed,
        averageSparesPerGame,
        sparePercentage,
        totalOpens,
        averageOpensPerGame,
        openPercentage,
        missedCounts,
        pinCounts,
        highGame
      } = this.statsService;

      this.totalGames = totalGames;
      this.averageScore = averageScore;
      this.averageFirstCount = averageFirstCount;
      this.totalPins = totalPins;
      this.totalStrikes = totalStrikes;
      this.averageStrikesPerGame = averageStrikesPerGame;
      this.strikePercentage = strikePercentage;
      this.totalSpares = totalSpares;
      this.totalSparesConverted = totalSparesConverted;
      this.totalSparesMissed = totalSparesMissed;
      this.averageSparesPerGame = averageSparesPerGame;
      this.sparePercentage = sparePercentage;
      this.totalOpens = totalOpens;
      this.averageOpensPerGame = averageOpensPerGame;
      this.openPercentage = openPercentage;
      this.missedCounts = missedCounts;
      this.pinCounts = pinCounts;
      this.highGame = highGame;
    } catch (error) {
      this.toastService.showToast(`Fehler beim Statistik laden: ${error}`, 'bug-outline', true);
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      await this.loadDataAndCalculateStats();
      this.subscribeToDataEvents();
      this.generateScoreChart();
    }
    catch (error) {
      console.log(error);
    }
    finally {
      this.loadingService.setLoading(false);
    }
  }

  private subscribeToDataEvents(): void {
    this.newDataAddedSubscription = this.saveService.newDataAdded.subscribe(async () => {
      this.gameHistoryChanged = true;
      await this.loadDataAndCalculateStats();
      this.generateScoreChart();

    });

    this.dataDeletedSubscription = this.saveService.dataDeleted.subscribe(async () => {
      this.gameHistoryChanged = true;
      await this.loadDataAndCalculateStats();
      this.generateScoreChart();
    });
  }

  handleRefresh(event: any): void {
    try {
      this.loadingService.setLoading(true);
      setTimeout(async () => {
        await this.loadDataAndCalculateStats();
        event.target.complete();
      }, 100);
      this.generateScoreChart();
    } catch (error) {
      console.log(error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  getLabel(i: number): string {
    if (i === 0) return 'Overall';
    if (i === 1) return `${i} Pin`;
    return `${i} Pins`;
  }

  getRate(converted: number, missed: number): number {
    return (converted / (converted + missed)) * 100;
  }

  getRateColor(conversionRate: number): string {
    if (conversionRate > 95) {
      return '#4faeff'
    } else if (conversionRate > 75) {
      return '#008000';
    } else if (conversionRate > 50) {
      return '#809300';
    } else if (conversionRate > 33) {
      return '#FFA500';
    } else {
      return '#FF0000';
    }
  }

  ngOnDestroy(): void {
    this.newDataAddedSubscription.unsubscribe();
    this.dataDeletedSubscription.unsubscribe();
    this.loadingSubscription.unsubscribe();
  }

  generateScoreChart(): void {
    // Create a map to aggregate scores by date
    const scoresByDate: { [date: string]: number[] } = {};

    this.gameHistory.forEach((game: any) => {
      const date = new Date(game.date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }); // Convert to local date string
      if (!scoresByDate[date]) {
        scoresByDate[date] = [];
      }
      scoresByDate[date].push(game.totalScore);
    });

    // Create labels and scores arrays
    const gameLabels = Object.keys(scoresByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Calculate overall average up to each date
    let cumulativeSum = 0;
    let cumulativeCount = 0;
    const overallAverages = gameLabels.map(date => {
      cumulativeSum += scoresByDate[date].reduce((sum, score) => sum + score, 0);
      cumulativeCount += scoresByDate[date].length;
      return cumulativeSum / cumulativeCount; // Overall average up to this date
    });

    // Calculate differences from the overall average
    const differences = gameLabels.map((date, index) => {
      const dailySum = scoresByDate[date].reduce((sum, score) => sum + score, 0);
      const dailyAverage = dailySum / scoresByDate[date].length;
      return dailyAverage - overallAverages[index]; // Difference from the overall average
    });

    // Calculate the number of games played each day
    const gamesPlayedDaily = gameLabels.map(date => scoresByDate[date].length);

    const ctx = this.scoreChart?.nativeElement;

    // Destroy the old chart instance if it exists
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Create a new chart instance with multiple datasets
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: gameLabels,
        datasets: [
          {
            label: 'Average',
            data: overallAverages,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Difference from Average',
            data: differences,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'Games Played',
            data: gamesPlayedDaily,
            backgroundColor: "rgba(153, 102, 255, 0.2)",
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            yAxisID: 'y1' // Use a second y-axis for this dataset
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 300 // Set the maximum value to 300
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: {
              drawOnChartArea: false // Only draw grid lines for the first y-axis
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Score Analysis'
          },
          legend: {
            display: true // Show legend to differentiate datasets
          }
        }
      }
    });
  }
}