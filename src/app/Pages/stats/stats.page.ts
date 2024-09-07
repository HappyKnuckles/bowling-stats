import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import { Subscription } from 'rxjs';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonText, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { NgIf, NgFor, NgStyle, DecimalPipe } from '@angular/common';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { ImpactStyle } from '@capacitor/haptics';
import { Game } from 'src/app/models/game-model';
import { GameHistoryService } from 'src/app/services/game-history/game-history.service';
import { GameStatsService } from 'src/app/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { SaveGameDataService } from 'src/app/services/save-game/save-game.service';
import { ToastService } from 'src/app/services/toast/toast.service';
@Component({
    selector: 'app-stats',
    templateUrl: 'stats.page.html',
    styleUrls: ['stats.page.scss'],
    standalone: true,
    providers: [DecimalPipe],
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
    spareRates: number[] = [];
    overallSpareRate: number = 0;
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
        private saveService: SaveGameDataService,
        private decimalPipe: DecimalPipe,
        private hapticService: HapticService
    ) {
        this.loadingSubscription = this.loadingService.isLoading$.subscribe(isLoading => {
            this.isLoading = isLoading;
        });
    }

    private async loadDataAndCalculateStats() {
                       this.loadingService.setLoading(true);
 if (this.gameHistoryChanged) {
            try {
                await this.loadGameHistory();
                await this.loadStats();
                this.gameHistoryChanged = false; // Reset the flag
            } catch (error) {
                this.toastService.showToast(`Error loading history and stats: ${error}`, 'bug', true)
            } finally {
                this.loadingService.setLoading(false);}
        }
    }

    async loadGameHistory() {
        try {
            this.gameHistory = await this.gameHistoryService.loadGameHistory();
        } catch (error) {
            this.toastService.showToast(`Error loading history: ${error}`, 'bug', true)
        }
    }

    async loadStats() {
        try {
            // Await the result from the web worker call
            const stats = await this.statsService.calculateStatsWithWorker(this.gameHistory);
            console.log(stats);
            // Destructure the result received from the web worker
            const {
                totalGames,
                averageScore,
                averageFirstCount,
                totalStrikes,
                averageStrikesPerGame,
                strikePercentage,
                totalSpares,
                totalSparesConverted,
                totalSparesMissed,
                averageSparesPerGame,
                sparePercentage,
                averageOpensPerGame,
                openPercentage,
                missedCounts,
                pinCounts,
                highGame
            } = stats;

            // Assign the results to the component's properties
            this.totalGames = totalGames;
            this.averageScore = averageScore;
            this.averageFirstCount = averageFirstCount;
            this.totalStrikes = totalStrikes;
            this.averageStrikesPerGame = averageStrikesPerGame;
            this.strikePercentage = strikePercentage;
            this.totalSpares = totalSpares;
            this.totalSparesConverted = totalSparesConverted;
            this.totalSparesMissed = totalSparesMissed;
            this.averageSparesPerGame = averageSparesPerGame;
            this.sparePercentage = sparePercentage;
            this.averageOpensPerGame = averageOpensPerGame;
            this.openPercentage = openPercentage;
            this.missedCounts = missedCounts;
            this.pinCounts = pinCounts;
            this.highGame = highGame;
    
            // Calculate additional rates if needed
            await this.calculateRates();
        } catch (error) {
            console.log("hier fehler");
            this.toastService.showToast(`Error loading stats: ${error}`, 'bug', true);
        }
    }
    
    async ngOnInit(): Promise<void> {
        try {
            this.loadingService.setLoading(true);
            await this.loadDataAndCalculateStats();
            this.subscribeToDataEvents();
            this.generateCharts();
        }
        catch (error) {
            console.error(error);
        }
        finally {
            this.loadingService.setLoading(false);
        }
    }

    generateCharts(): void {
        this.generatePinChart();
        this.generateScoreChart();
        this.generateThrowChart();
    }

    private subscribeToDataEvents(): void {
        this.newDataAddedSubscription = this.saveService.newDataAdded.subscribe(async () => {
            this.gameHistoryChanged = true;
            await this.loadDataAndCalculateStats();
            this.generateCharts();
        });

        this.dataDeletedSubscription = this.saveService.dataDeleted.subscribe(async () => {
            this.gameHistoryChanged = true;
            await this.loadDataAndCalculateStats();
            this.generateCharts();
        });
    }

    handleRefresh(event: any): void {
        try {
            this.hapticService.vibrate(ImpactStyle.Medium, 200);
            this.loadingService.setLoading(true);
            setTimeout(async () => {
                await this.loadDataAndCalculateStats();
                event.target.complete();
            }, 100);
            this.generateCharts();
        } catch (error) {
            console.error(error);
        } finally {
            this.loadingService.setLoading(false);
        }
    }

    async calculateRates() {
        this.spareRates = this.pinCounts.map((pinCount, i) => this.getRate(pinCount, this.missedCounts[i]));
        this.overallSpareRate = this.getRate(this.totalSparesConverted, this.totalSparesMissed);
    }

    getLabel(i: number): string {
        if (i === 0) return 'Overall';
        if (i === 1) return `${i} Pin`;
        return `${i} Pins`;
    }

    getRate(converted: number, missed: number): number {
        if (converted + missed === 0) {
            return 0;
        }
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

    //TODO adjust look of this
    generatePinChart(): void {
        const originalLabels = ['1 Pin', '2 Pins', '3 Pins', '4 Pins', '5 Pins', '6 Pins', '7 Pins', '8 Pins', '9 Pins', '10 Pins'];

        // Filter out the spareRates and update labels accordingly
        const filteredSpareRates = this.spareRates.slice(1).map(rate => parseFloat(this.decimalPipe.transform(rate, '1.2-2')!));
        const filteredMissedCounts = this.missedCounts.slice(1).map((count, i) => {
            const rate = this.getRate(count, this.pinCounts[i + 1]);
            const transformedRate = this.decimalPipe.transform(rate, '1.2-2');
            return parseFloat(transformedRate ?? '0');
        });

        const ctx = this.pinChart!.nativeElement;

        if (this.pinChartInstance) {
            this.pinChartInstance.destroy();
        }

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
                        pointHitRadius: 10
                    },
                    {
                        label: 'Missed',
                        data: filteredMissedCounts,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        pointHitRadius: 10
                    }
                ]
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
                    tooltip: {
                        callbacks: {
                            title: function (context) {
                                // Get the value of the hovered point
                                const value = context[0].raw;

                                // Find all labels with the same value
                                const matchingLabels = context[0].chart.data.labels!.filter((label, index) => {
                                    // Check if the value matches any point in the datasets and is 0
                                    return context[0].chart.data.datasets.some(dataset => dataset.data[index] === value && value === 0);
                                });

                                // Only modify the title if multiple labels match the same value
                                if (matchingLabels.length > 1) {
                                    // Extract only the numbers from each label and join them
                                    const extractedNumbers = matchingLabels.map(label => {
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
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Converted vs Missed spares',
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
                        data: overallAverages.map(average => parseFloat(this.decimalPipe.transform(average, '1.2-2')!)),
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        pointHitRadius: 10
                    },
                    {
                        label: 'Difference from average',
                        data: differences.map(difference => parseFloat(this.decimalPipe.transform(difference, '1.2-2')!)),
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        pointHitRadius: 10
                    },
                    {
                        label: 'Games played',
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
                        text: 'Score analysis',
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
                            const gamesPlayedIndex = ci.data.datasets.findIndex(dataset => dataset.label === 'Games played');

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
        const ctx = this.throwChart?.nativeElement;

        if (this.throwChartInstance) {
            this.throwChartInstance.destroy();
        }

        this.throwChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Spare', 'Strike', 'Open'],
                datasets: [{
                    label: 'Percentage',
                    data: [parseFloat(this.decimalPipe.transform(this.sparePercentage, '1.2-2')!), parseFloat(this.decimalPipe.transform(this.strikePercentage, '1.2-2')!), parseFloat(this.decimalPipe.transform(this.openPercentage, '1.2-2')!)],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)',
                    pointHitRadius: 10
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(128, 128, 128, 0.3)',
                            lineWidth: 0.5
                        },
                        angleLines: {
                            color: 'rgba(128, 128, 128, 0.3)',
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
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.r !== null) {
                                    label += context.parsed.r + '%';
                                }
                                return label;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Throw distribution',
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

}
