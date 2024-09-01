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
import { IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonText, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { NgIf, NgFor, NgStyle, DecimalPipe } from '@angular/common';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
@Component({
    selector: 'app-stats',
    templateUrl: 'stats.page.html',
    styleUrls: ['stats.page.scss'],
    standalone: true,
    imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, NgIf, IonText, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, IonGrid, IonRow, IonCol, NgFor, NgStyle, DecimalPipe]
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
    @ViewChild('throwChart') throwChart?: ElementRef;
    @ViewChild('pinChart') pinChart?: ElementRef;
    private pinChartInstance: Chart | null = null;
    private throwChartInstance: Chart | null = null;
    private scoreChartInstance: Chart | null = null;

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
                this.toastService.showToast(`Fehler beim Historie und Stats laden: ${error}`, 'bug', true)
            }
        }
    }

    async loadGameHistory() {
        try {
            this.gameHistory = await this.gameHistoryService.loadGameHistory();
        } catch (error) {
            this.toastService.showToast(`Fehler beim Historie laden: ${error}`, 'bug', true)
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
            this.toastService.showToast(`Fehler beim Statistik laden: ${error}`, 'bug', true);
        }
    }

    async ngOnInit(): Promise<void> {
        try {
            this.loadingService.setLoading(true);
            await this.loadDataAndCalculateStats();
            this.subscribeToDataEvents();
            this.generateScoreChart();
            this.generateThrowChart();
            this.generatePinChart();
        }
        catch (error) {
            console.error(error);
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
            console.error(error);
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
        if (this.scoreChartInstance) {
            this.scoreChartInstance.destroy();
        }


        // Create a new chart instance with multiple datasets
        this.scoreChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: gameLabels,
                datasets: [
                    {
                        label: 'Average',
                        data: overallAverages,
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        pointHitRadius: 10
                    },
                    {
                        label: 'Difference from Average',
                        data: differences,
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        pointHitRadius: 10
                    },
                    {
                        label: 'Games Played',
                        data: gamesPlayedDaily,
                        type: 'bar',
                        backgroundColor: "rgba(153, 102, 255, 0.1)",
                        borderColor: 'rgba(153, 102, 255, .5)',
                        borderWidth: 1,
                        yAxisID: 'y1' // Use a second y-axis for this dataset
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 300,
                        ticks: {
                            font: {
                                size: 14
                            }
                        }

                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false // Only draw grid lines for the first y-axis
                        },
                        ticks: {
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Score Analysis',
                        color: 'white',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: true, // Show legend to differentiate datasets
                        labels: {
                            font: {
                                size: 15
                            },
                        },
                        onClick: (e, legendItem) => {
                            // Access the dataset index from the legend item
                            const index = legendItem.datasetIndex!;

                            // Ensure that chartInstance is defined and points to your chart
                            const ci = this.scoreChartInstance;
                            if (!ci) {
                                console.error("Chart instance is not defined.");
                                return;
                            }

                            // Get the metadata of the clicked dataset
                            const meta = ci.getDatasetMeta(index);

                            // Toggle the visibility of the dataset
                            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : !meta.hidden;

                            // Find the index of the "Games Played" dataset
                            const gamesPlayedIndex = ci.data.datasets.findIndex(dataset => dataset.label === 'Games Played');

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
                        }
                    }
                }
            }
        });
    }

    generateThrowChart(): void {
        const data = {
            labels: ['Spare %', 'Strike %', 'Open %'],
            datasets: [{
                label: 'Percentage',
                data: [this.sparePercentage, this.strikePercentage, this.openPercentage],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(54, 162, 235)'
            }]
        };

        const ctx = this.throwChart?.nativeElement;

        if (this.throwChartInstance) {
            this.throwChartInstance.destroy();
        }

        this.throwChartInstance = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'gray',
                            lineWidth: 0.5
                        },
                        angleLines: {
                            color: 'gray',
                            lineWidth: 0.5
                        },
                        pointLabels: {
                            color: 'gray',
                            font: {
                                size: 14
                            }
                        },
                        ticks: {
                            display: false,
                            backdropColor: 'transparent',
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Throw Distribution',
                        color: 'white',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    }
                }
            }
        });
    }

    //TODO adjust look of this
    generatePinChart() {
        const ctx = this.pinChart!.nativeElement;

        if (this.pinChartInstance) {
            this.pinChartInstance.destroy();
        }

        this.pinChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], // Labels for each pin count
                datasets: [
                    {
                        label: 'Pin Counts',
                        data: this.pinCounts.slice(1), // Exclude the first element if it's for total
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Missed Counts',
                        data: this.missedCounts.slice(1), // Exclude the first element if it's for total
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: Math.min(this.totalSparesConverted, this.totalSparesMissed),
                        grid: {
                            color: 'gray'
                        },
                        angleLines: {
                            color: 'gray'
                        },
                        pointLabels: {
                            color: 'gray',
                            font: {
                                size: 14
                            }
                        },
                        ticks: {
                            backdropColor: 'transparent',
                            color: 'white',
                            display: false,
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Pin Counts vs Missed Counts',
                        color: 'white',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 15
                            },
                        }
                    }
                }
            }
        });
    }
}
