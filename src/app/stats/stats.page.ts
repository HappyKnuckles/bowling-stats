import { NONE_TYPE } from '@angular/compiler';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
@Component({
  selector: 'app-stats',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss']
})
export class StatsPage implements OnInit, OnDestroy {
  gameHistory: any = [];
  isLoading: boolean = false;
  averageScore: any;
  totalStrikes: number = 0;
  totalSpares: number = 0;
  totalOpens: number = 0;
  firstThrowCount: number = 0;
  averageFirstCount: number = 0;
  averageStrikesPerGame: number = 0;
  sparePercentage: any;
  strikePercentage: any;
  openPercentage: any;
  pinCounts: number[] = Array(11).fill(0);
  missedCounts: number[] = Array(11).fill(0);;
  gameHistoryChanged: boolean = true;
  @ViewChild('scoreChart') scoreChart!: ElementRef;

  constructor() { }

  loadGameHistory() {
    this.isLoading = true;
    // Clear the current game history
    this.gameHistory = [];
  
    // Retrieve games from local storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('game')) {
        const gameDataString = localStorage.getItem(key);
        if (gameDataString) {
          const gameData = JSON.parse(gameDataString);
          this.gameHistory.push(gameData);
        }
      }
    }
  
    // Sort game history by date
    this.sortGameHistoryByDate();
  
    this.isLoading = false;
  }
  
  // Function to sort game history by date
  sortGameHistoryByDate(): void {
    this.gameHistory.sort((a: any, b: any) => {
      return b.date - a.date; // Assuming `date` is a numeric timestamp
    });
  }
  

  async ngOnInit() {
    await this.loadDataAndCalculateStats();
    this.subscribeToDataEvents();
    this.generateScoreChart();
  }

  private subscribeToDataEvents() {
    window.addEventListener('newDataAdded', () => {
      this.gameHistoryChanged = true;
      this.loadDataAndCalculateStats();
    });

    window.addEventListener('dataDeleted', () => {
      this.gameHistoryChanged = true;
      this.loadDataAndCalculateStats();
    });
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.loadDataAndCalculateStats();
      event.target.complete();
    }, 100);
  }

  private async loadDataAndCalculateStats() {
    if (this.gameHistoryChanged) {
      this.loadGameHistory();
      this.getAverage();
      this.calculateStats();
      this.gameHistoryChanged = false; // Reset the flag
    }
  }

  ngOnDestroy() {
    window.removeEventListener('newDataAdded', this.loadDataAndCalculateStats);
    window.removeEventListener('dataDeleted', this.loadDataAndCalculateStats);
  }

  generateScoreChart() {
    const gameLabels = this.gameHistory.map((game: any, index: number) => `${index + 1}`);
    const scores = this.gameHistory.map((game: any, index: number) => {
      // Calculate the average score up to the current game index
      const totalScoreSum = this.gameHistory.slice(0, index + 1).reduce((sum: number, currentGame: any) => {
        return sum + currentGame.totalScore;
      }, 0);
      return totalScoreSum / (index + 1); // Calculate average
    });
      
    const ctx = this.scoreChart.nativeElement;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: gameLabels,
        datasets: [{
          label: 'Average',
          data: scores,
          backgroundColor: "#FFFFFf",
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 300 // Set the maximum value to 300
          }
        },
        plugins:{
          title: {
            display: true,
            text: 'Score Average'
          },
          legend: {
            display: false,
          }
        }
      }
    });
  }
  
  getAverage() {
    let totalScoreSum = 0;
    for (let i = 0; i < this.gameHistory.length; i++) {
      totalScoreSum += this.gameHistory[i].totalScore;
    }
    this.averageScore = totalScoreSum / this.gameHistory.length;
  }

  calculateStats() {
    this.totalStrikes = 0;
    this.totalSpares = 0;
    this.totalOpens = 0;
    this.pinCounts = Array(11).fill(0);
    this.missedCounts = Array(11).fill(0);
    this.gameHistory.forEach((game: { frames: any[]; }) => {
      this.totalStrikes += this.countOccurrences(game.frames, frame => frame.throws[0].value === 10);
      this.totalSpares += this.countOccurrences(game.frames, frame => frame.throws[0].value !== 10 && frame.throws[0].value + frame.throws[1]?.value === 10 || frame.throws[0].value === 10 && frame.throws[1]?.value !== 10 && frame.throws[1]?.value + frame.throws[2]?.value === 10);
      this.totalOpens += this.countOccurrences(game.frames, frame => frame.throws.length === 2 && frame.throws[0].value + frame.throws[1]?.value < 10);

      game.frames.forEach(frame => {
        const throws = frame.throws;
        if (throws.length === 2 && throws[0].value + throws[1].value === 10) {
          const pinsLeft = 10 - throws[0].value;
          this.pinCounts[pinsLeft]++;
        } else if (throws.length === 3) {
          if (throws[1].value + throws[2].value === 10) {
            const pinsLeft = 10 - throws[1].value;
            this.pinCounts[pinsLeft]++;
          } else if (throws[0].value + throws[1].value === 10) {
            const pinsLeft = 10 - throws[0].value;
            this.pinCounts[pinsLeft]++;
          }
        }
      });
      // Additional logic for counting strikes in the 10th frame
      if (game.frames.length === 10) {
        const tenthFrame = game.frames[9]; // Get the 10th frame
        const throws = tenthFrame.throws;
        if (throws.length === 3 && throws[0].value === 10 && throws[1]?.value === 10) {
          this.totalStrikes += 2; // Increment by 2 if both throws are strikes
        } else if (throws.length === 3 && throws[0].value === 10) {
          this.totalStrikes++; // Increment by 1 if first throw is a strike
        }
      }
      game.frames.forEach(frame => {
        const throws = frame.throws;
        if (throws.length === 2 && throws[0].value + throws[1].value != 10) {
          const pinsLeft = 10 - throws[0].value;
          this.missedCounts[pinsLeft]++;
        }
      });
      game.frames.forEach(frame => {
        const throws = frame.throws;
        this.firstThrowCount += throws[0].value;
      });
    });
    
    const totalFrames = (this.gameHistory.length * 10);
    const strikeChances = (this.gameHistory.length * 12)
    this.averageStrikesPerGame = (this.totalStrikes / this.gameHistory.length);
    this.strikePercentage = (this.totalStrikes / strikeChances ) * 100;
    this.sparePercentage = (this.totalSpares / totalFrames) * 100;
    this.openPercentage = (this.totalOpens / totalFrames) * 100;
    this.averageFirstCount = (this.firstThrowCount / totalFrames);
  }

  countOccurrences(frames: any[], condition: (frame: any) => boolean): number {
    return frames.reduce((acc, frame) => acc + (condition(frame) ? 1 : 0), 0);
  }
}