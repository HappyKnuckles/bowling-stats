import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import { merge, Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { Game } from 'src/app/models/game-model';
import { GameStatsService } from 'src/app/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { Swiper } from 'swiper';
import { IonicSlides } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarNumber, calendarNumberOutline, filterOutline } from 'ionicons/icons';
import { StatDisplayComponent } from 'src/app/components/stat-display/stat-display.component';
import { PrevStats, SessionStats, Stats } from 'src/app/models/stats-model';
import { SpareDisplayComponent } from '../../components/spare-display/spare-display.component';
import { StorageService } from 'src/app/services/storage/storage.service';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { ModalController } from '@ionic/angular';
import { FilterService } from 'src/app/services/filter/filter.service';
import { ChartDataService } from 'src/app/services/chart/chart-data.service';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';

@Component({
  selector: 'app-stats',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss'],
  standalone: true,
  providers: [DecimalPipe, DatePipe, ModalController],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonLabel,
    IonSegmentButton,
    IonSegment,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonSelectOption,
    IonSelect,
    IonText,
    NgIf,
    NgFor,
    FormsModule,
    DatePipe,
    StatDisplayComponent,
    SpareDisplayComponent,
  ],
})
export class StatsPage implements OnInit, OnDestroy {
  swiperModules = [IonicSlides];

  // used to only generate charts when value is changed
  statsValueChanged: boolean[] = [true, true, true];

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
  stats: Stats = {
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
  selectedDate: number = 0;
  uniqueSortedDates: number[] = [];
  // Game Data
  gameHistory: Game[] = [];
  filteredGameHistory: Game[] = [];
  gameHistoryChanged: boolean = true;
  isLoading: boolean = false;
  selectedSegment: string = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Throws', 'Sessions'];
  activeFilterCount = this.filterService.activeFilterCount;
  // Subscriptions
  private gameSubscriptions: Subscription = new Subscription();
  private loadingSubscription: Subscription;
  private currentStatSubscription: Subscription;
  private sessionStatSubscription: Subscription;
  private filteredGamesSubscription!: Subscription;

  // Viewchilds and Instances
  @ViewChild('scoreChart', { static: false }) scoreChart?: ElementRef;
  @ViewChild('pinChart', { static: false }) pinChart?: ElementRef;
  @ViewChild('throwChart', { static: false }) throwChart?: ElementRef;
  @ViewChild('swiper')
  set swiper(swiperRef: ElementRef) {
    /**
     * This setTimeout waits for Ionic's async initialization to complete.
     * Otherwise, an outdated swiper reference will be used.
     */
    setTimeout(() => {
      this.swiperInstance = swiperRef?.nativeElement.swiper;
    }, 0);
  }
  private swiperInstance: Swiper | undefined;
  private pinChartInstance: Chart | null = null;
  private throwChartInstance: Chart | null = null;
  private scoreChartInstance: Chart | null = null;

  constructor(
    private loadingService: LoadingService,
    private statsService: GameStatsService,
    private toastService: ToastService,
    private storageService: StorageService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    private filterService: FilterService,
    private sortUtilsService: SortUtilsService,
    private chartDataService: ChartDataService
  ) {
    this.loadingSubscription = this.loadingService.isLoading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });

    this.currentStatSubscription = this.statsService.currentStats$.subscribe((stats) => {
      this.stats = stats;
    });

    this.sessionStatSubscription = this.statsService.sessionStats$.subscribe((stats) => {
      this.sessionStats = stats;
    });

    addIcons({ filterOutline, calendarNumberOutline, calendarNumber });
  }
  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
      await this.calculateStats();
      this.subscribeToDataEvents();
      this.generateCharts();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
  async openFilterModal() {
    // TODO Think if using it like this so highlighted dates are only that match the current filter or not
    const modal = await this.modalCtrl.create({
      component: FilterComponent,
      componentProps: {
        games: this.gameHistory,
        filteredGames: this.filteredGameHistory,
      },
    });

    return await modal.present();
  }

  ngOnDestroy(): void {
    this.loadingSubscription.unsubscribe();
    this.currentStatSubscription.unsubscribe();
    this.sessionStatSubscription.unsubscribe();
    this.filteredGamesSubscription.unsubscribe();
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
      await this.calculateStats(true);
      this.generateCharts(undefined, true);
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
    }
  }

  onDateChange(event: any): void {
    const selectedDate = event.target.value;
    this.statsService.calculateStatsBasedOnDate(this.gameHistory, selectedDate);
  }

  onSegmentChanged(event: any) {
    if (this.swiperInstance) {
      this.selectedSegment = event.detail.value;
      const activeIndex = this.getSlideIndex(this.selectedSegment);
      this.swiperInstance.slideTo(activeIndex);
      this.generateCharts(activeIndex);
    }
  }

  onSlideChanged() {
    if (this.swiperInstance) {
      const activeIndex = this.swiperInstance.realIndex;
      this.selectedSegment = this.getSegmentValue(activeIndex);
      this.generateCharts(activeIndex);
    }
  }

  private getSlideIndex(segment: string): number {
    const index = this.segments.indexOf(segment);
    return index !== -1 ? index : 0;
  }

  private getSegmentValue(index: number): string {
    return this.segments[index] || 'Overall';
  }

  private calculateStats(isRefresh?: boolean): void {
    if (this.gameHistoryChanged || isRefresh) {
      try {
        // await this.loadGameHistory();
        // this.sortUtilsService.sortGameHistoryByDate(this.gameHistory, true);
        this.loadStats();

        if (this.selectedDate) {
          this.statsService.calculateStatsBasedOnDate(this.gameHistory, this.selectedDate);
        }

        this.gameHistoryChanged = false; // Reset the flag
      } catch (error) {
        this.toastService.showToast(`Error loading history and stats: ${error}`, 'bug', true);
      }
    }
  }

  private async loadGameHistory() {
    try {
      this.gameHistory = await this.storageService.loadGameHistory();
      this.sortUtilsService.sortGameHistoryByDate(this.gameHistory, true);
      this.filterService.filterGames(this.gameHistory);
    } catch (error) {
      this.toastService.showToast(`Error loading history: ${error}`, 'bug', true);
    }
  }

  private loadStats() {
    try {
      // TODO adjust so stats are not calculated twice (on startup and on init)
      // currently this is needed to get previous stats before the first game
      // and has to happen on init because wrong stats if you add games before opening stats page
      this.statsService.calculateStats(this.filteredGameHistory);

      // this.stats = this.statsService.currentStats;

      const prevStats = localStorage.getItem('prevStats');
      this.prevStats = prevStats ? JSON.parse(prevStats) : this.statsService.prevStats;

      this.processDates();
    } catch (error) {
      this.toastService.showToast(`Error loading stats: ${error}`, 'bug', true);
    }
  }

  // TODO if filtergamedlength was 0, the charts dont load until restart
  private generateCharts(index?: number, isReload?: boolean): void {
    if (this.gameHistory.length > 0 && (index === undefined || this.statsValueChanged[index])) {
      if (this.selectedSegment === 'Overall') {
        this.generateScoreChart(isReload);
      } else if (this.selectedSegment === 'Spares') {
        this.generatePinChart(isReload);
      } else if (this.selectedSegment === 'Throws') {
        this.generateThrowChart(isReload);
      }

      if (index !== undefined) {
        this.statsValueChanged[index] = false;
      }
    }
  }

  private processDates() {
    const dateSet = new Set<number>();

    this.gameHistory.forEach((game) => {
      // Add only the date part (ignoring time) to the Set
      const date = new Date(game.date);
      // Set the time to midnight to ensure we only consider the date
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.getTime()); // Store the Unix timestamp
    });

    // Convert the Set to an Array and sort it
    this.uniqueSortedDates = Array.from(dateSet).sort((a, b) => b - a);
    this.selectedDate = this.uniqueSortedDates[0];
  }

  private subscribeToDataEvents(): void {
    this.gameSubscriptions.add(
      merge(this.storageService.newGameAdded, this.storageService.gameDeleted).subscribe(() => {
        this.gameHistoryChanged = true;
        this.loadGameHistory();
        // this.calculateStats()
        //   .then(() => {
        //     this.generateCharts();
        //     this.statsValueChanged = [true, true, true];
        //   })
        //   .catch((error) => {
        //     console.error('Error loading data and calculating stats:', error);
        //   });
      })
    );

    this.filteredGamesSubscription = this.filterService.filteredGames$.subscribe((games) => {
      this.filteredGameHistory = games;
      this.activeFilterCount = this.filterService.activeFilterCount;
      this.gameHistoryChanged = true;
      this.calculateStats();
      this.generateCharts(undefined, true);
      this.statsValueChanged = [true, true, true];
    });
  }

  private generateScoreChart(isReload?: boolean): void {
    if (!this.scoreChart) {
      return;
    }

    const { gameLabels, overallAverages, differences, gamesPlayedDaily } = this.chartDataService.calculateScoreChartData(this.gameHistory);

    const ctx = this.scoreChart.nativeElement;

    if (isReload) {
      this.scoreChartInstance?.destroy();
    }

    if (this.scoreChartInstance && !isReload) {
      this.scoreChartInstance.data.labels = gameLabels;
      this.scoreChartInstance.data.datasets[0].data = overallAverages;
      this.scoreChartInstance.data.datasets[1].data = differences;
      this.scoreChartInstance.data.datasets[2].data = gamesPlayedDaily;
      this.scoreChartInstance.update();
    }

    // Create a new chart instance with multiple datasets
    else {
      this.scoreChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: gameLabels,
          datasets: [
            {
              label: 'Average',
              data: overallAverages,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              pointHitRadius: 10,
            },
            {
              label: 'Difference from average',
              data: differences,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              pointHitRadius: 10,
            },
            {
              label: 'Games played',
              data: gamesPlayedDaily,
              type: 'bar',
              backgroundColor: 'rgba(153, 102, 255, 0.1)',
              borderColor: 'rgba(153, 102, 255, .5)',
              borderWidth: 1,
              yAxisID: 'y1', // Use a second y-axis for this dataset
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 300,
              ticks: {
                font: {
                  size: 14,
                },
              },
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false, // Only draw grid lines for the first y-axis
              },
              ticks: {
                font: {
                  size: 14,
                },
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Score analysis',
              color: 'white',
              font: {
                size: 20,
              },
            },
            legend: {
              display: true, // Show legend to differentiate datasets
              labels: {
                font: {
                  size: 15,
                },
              },
              onClick: (e, legendItem) => {
                // Access the dataset index from the legend item
                const index = legendItem.datasetIndex!;

                // Ensure that chartInstance is defined and points to your chart
                const ci = this.scoreChartInstance;
                if (!ci) {
                  console.error('Chart instance is not defined.');
                  return;
                }

                // Get the metadata of the clicked dataset
                const meta = ci.getDatasetMeta(index);

                // Toggle the visibility of the dataset
                meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : !meta.hidden;

                // Find the index of the "Games Played" dataset
                const gamesPlayedIndex = ci.data.datasets.findIndex((dataset) => dataset.label === 'Games played');

                // Check if the "Games Played" dataset exists
                if (gamesPlayedIndex !== -1) {
                  const gamesPlayedMeta = ci.getDatasetMeta(gamesPlayedIndex);
                  const isGamesPlayedHidden = gamesPlayedMeta.hidden;

                  // Update the y1 axis visibility based on the "Games Played" dataset visibility
                  if (ci.options.scales && ci.options.scales['y1']) {
                    ci.options.scales['y1'].display = !isGamesPlayedHidden;
                  }
                }

                // Update the chart to apply the changes
                ci.update();
              },
            },
          },
        },
      });
    }
  }

  //TODO adjust look of this
  private generatePinChart(isReload?: boolean): void {
    if (!this.pinChart) {
      return;
    }

    const { filteredSpareRates, filteredMissedCounts } = this.chartDataService.calculatePinChartData(this.stats);

    const ctx = this.pinChart.nativeElement;

    if (isReload) {
      this.pinChartInstance?.destroy();
    }

    if (this.pinChartInstance && !isReload) {
      this.pinChartInstance.data.datasets[0].data = filteredSpareRates;
      this.pinChartInstance.data.datasets[1].data = filteredMissedCounts;
      this.pinChartInstance.update();
    } else {
      this.pinChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['1 Pin', '2 Pins', '3 Pins', '4 Pins', '5 Pins', '6 Pins', '7 Pins', '8 Pins', '9 Pins', '10 Pins'], // Labels for each pin count
          datasets: [
            {
              label: 'Converted',
              data: filteredSpareRates, // Exclude the first element if it's for total
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              pointHitRadius: 10,
            },
            {
              label: 'Missed',
              data: filteredMissedCounts,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              pointHitRadius: 10,
            },
          ],
        },
        options: {
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(128, 128, 128, 0.3)',
              },
              angleLines: {
                color: 'rgba(128, 128, 128, 0.3)',
              },
              pointLabels: {
                color: 'gray',
                font: {
                  size: 14,
                },
              },
              ticks: {
                backdropColor: 'transparent',
                color: 'white',
                display: false,
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: function (context) {
                  // Get the value of the hovered point
                  const value = context[0].raw;

                  // Find all labels with the same value
                  const matchingLabels = context[0].chart.data.labels!.filter((label, index) => {
                    // Check if the value matches any point in the datasets and is 0
                    return context[0].chart.data.datasets.some((dataset) => dataset.data[index] === value && value === 0);
                  });

                  // Only modify the title if multiple labels match the same value
                  if (matchingLabels.length > 1) {
                    // Extract only the numbers from each label and join them
                    const extractedNumbers = matchingLabels.map((label) => {
                      // Use regex to extract the number part from the label (e.g., "1 Pin" -> "1")
                      const match = (label as string).match(/\d+/);
                      return match ? match[0] : ''; // Return the matched number or an empty string if no match
                    });

                    // Return the combined numbers as the title (e.g., "2, 3 Pins")
                    return extractedNumbers.join(', ') + ' Pins';
                  }

                  // Default behavior: return the original label if only one match
                  return context[0].label || '';
                },
                label: function (context) {
                  // Create the base label with dataset name and value percentage
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.r !== null) {
                    label += context.parsed.r + '%';
                  }

                  return label;
                },
              },
            },
            title: {
              display: true,
              text: 'Converted vs Missed spares',
              color: 'white',
              font: {
                size: 20,
              },
            },
            legend: {
              display: true,
              labels: {
                font: {
                  size: 15,
                },
              },
            },
          },
        },
      });
    }
  }

  private generateThrowChart(isReload?: boolean): void {
    if (!this.throwChart) {
      return;
    }

    const { opens, spares, strikes } = this.chartDataService.calculateThrowChartData(this.stats);

    const ctx = this.throwChart.nativeElement;

    if (isReload) {
      this.throwChartInstance?.destroy();
    }

    if (this.throwChartInstance && !isReload) {
      this.throwChartInstance.data.datasets[0].data = [spares, strikes, opens];
      this.throwChartInstance.update();
    } else {
      this.throwChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Spare', 'Strike', 'Open'],
          datasets: [
            {
              label: 'Percentage',
              data: [spares, strikes, opens],
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgb(54, 162, 235)',
              pointBackgroundColor: 'rgb(54, 162, 235)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(54, 162, 235)',
              pointHitRadius: 10,
            },
          ],
        },
        options: {
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(128, 128, 128, 0.3)',
                lineWidth: 0.5,
              },
              angleLines: {
                color: 'rgba(128, 128, 128, 0.3)',
                lineWidth: 0.5,
              },
              pointLabels: {
                color: 'gray',
                font: {
                  size: 14,
                },
              },
              ticks: {
                display: false,
                backdropColor: 'transparent',
                color: 'white',
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: function (context) {
                  // Get the value of the hovered point
                  const value = context[0].raw;

                  // Find all labels with the same value
                  const matchingLabels = context[0].chart.data.labels!.filter((label, index) => {
                    // Check if the value matches any point in the datasets and is 0
                    return context[0].chart.data.datasets.some((dataset) => dataset.data[index] === value && value === 0);
                  });

                  // Only modify the title if multiple labels match the same value
                  if (matchingLabels.length > 1) {
                    // Return the combined titles as the title (e.g., "2, 3 Pins")
                    return matchingLabels.join(', ');
                  }

                  // Default behavior: return the original label if only one match
                  return context[0].label || '';
                },
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.r !== null) {
                    label += context.parsed.r + '%';
                  }
                  return label;
                },
              },
            },
            title: {
              display: true,
              text: 'Throw distribution',
              color: 'white',
              font: {
                size: 20,
              },
            },
            legend: {
              display: false,
            },
          },
          layout: {
            padding: {
              top: 10,
              bottom: 10,
            },
          },
          elements: {
            line: {
              borderWidth: 2,
            },
          },
        },
      });
    }
  }
}
