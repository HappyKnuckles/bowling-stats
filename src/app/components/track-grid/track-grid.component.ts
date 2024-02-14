import { Component, OnInit } from '@angular/core';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';

@Component({
  selector: 'app-track-grid',
  templateUrl: './track-grid.component.html',
  styleUrls: ['./track-grid.component.scss'],
})
export class TrackGridComponent implements OnInit {
  frameScores: any = this.bowlingService.frameScores;
  totalScore: any;
  frames: any = this.bowlingService.frames;
  gameIndex: any;
  maxScore: any;
  constructor(private bowlingService: BowlingCalculatorService) { }

  ngOnInit() {
    // Check if gameIndex exists in local storage
    const savedIndex = localStorage.getItem('index');
    this.gameIndex = savedIndex ? parseInt(savedIndex, 10) : 1;
  }

  simulateScore() {
    this.bowlingService.calculateScore();
  }

  calculateScore() {
    this.bowlingService.calculateScore();
    this.totalScore = this.bowlingService.totalScore;
    if (!Number.isNaN(this.totalScore)) {
      this.saveGameToLocalStorage();
    }
  }

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  saveGameToLocalStorage() {
    const gameData = {
      frames: this.frames.map((frame: any[], frameIndex: number) => ({
        throws: frame.map((throwValue: any, throwIndex: number) => ({
          value: throwValue,
          throwIndex: throwIndex + 1 // Add 1 to make it 1-based index
        })),
        frameIndex: frameIndex + 1 // Add 1 to make it 1-based index
      })),
      frameScores: this.frameScores,
      totalScore: this.totalScore
    };

    const gameDataString = JSON.stringify(gameData);
    const key = 'game' + this.gameIndex; // Generate key using index
    localStorage.setItem(key, gameDataString);
    this.gameIndex++; // Increment index for the next game
    localStorage.setItem('index', JSON.stringify(this.gameIndex));
  }


  clearFrames() {
    this.frames = Array.from({ length: 10 }, () => []);
    this.totalScore = 0;
  }
}



