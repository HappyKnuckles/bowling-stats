import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-stats',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss']
})
export class StatsPage implements OnInit {
  gameHistory: any = [];
  isLoading: boolean = false;
  averageScore: any;
  totalStrikes: number = 0;
  totalSpares: number = 0;
  totalOpens: number = 0;
  sparePercentage: any;
  strikePercentage: any;
  openPercentage: any;
  pinCounts: number[] = Array(11).fill(0);
  missedCounts: number[] = Array(11).fill(0);;

  constructor() { }

  async loadGameHistory() {
    this.isLoading = true;
    const previousGameCount = this.gameHistory.length;

    this.gameHistory = [];

    for (let i = 1; i <= localStorage.length; i++) {
      const key = 'game' + i;
      const gameDataString = localStorage.getItem(key);

      if (gameDataString) {
        const gameData = JSON.parse(gameDataString);
        this.gameHistory.push(gameData);
      }
    }
    this.isLoading = false;
  }

  async ngOnInit() {
    await this.loadGameHistory();
    this.getAverage();
    this.calculateStats();
  }

  getAverage() {
    let totalScoreSum = 0;
    for (let i = 0; i < this.gameHistory.length; i++) {
      totalScoreSum += this.gameHistory[i].totalScore;
    }
    this.averageScore = totalScoreSum / this.gameHistory.length;
  }

  calculateStats() {
    this.gameHistory.forEach((game: { frames: any[]; }) => {
      this.totalStrikes += this.countOccurrences(game.frames, frame => frame.throws[0].value === 10 || frame.throws[1]?.value === 10 || frame.throws[2]?.value === 10);
      this.totalSpares += this.countOccurrences(game.frames, frame => frame.throws[0].value + frame.throws[1]?.value === 10 || (frame.throws[1]?.value === 10 && frame.throws[2]?.value === 10));
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

      game.frames.forEach(frame => {
        const throws = frame.throws;
        if (throws.length === 2 && throws[0].value + throws[1].value != 10) {
          const pinsLeft = 10 - throws[0].value;
          this.missedCounts[pinsLeft]++;
        }
      });
    });


    const totalFrames = this.gameHistory.length * 10;
    this.strikePercentage = (this.totalStrikes / totalFrames) * 100;
    this.sparePercentage = (this.totalSpares / totalFrames) * 100;
    this.openPercentage = 100 - this.strikePercentage - this.sparePercentage;
  }

  countOccurrences(frames: any[], condition: (frame: any) => boolean): number {
    return frames.reduce((acc, frame) => acc + (condition(frame) ? 1 : 0), 0);
  }
}