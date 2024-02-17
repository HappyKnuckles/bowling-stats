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
    this.maxScore = this.bowlingService.maxScore;
  }

  simulateScore(index: number, throwIndex: number) {
    this.bowlingService.calculateScore();
    if (index === 10 && throwIndex === 2) {
      this.maxScore === this.totalScore + 10;
    }
    else if (index === 10 && throwIndex === 3) {
      this.maxScore === this.totalScore;
    }
    else this.maxScore = this.bowlingService.calculateMaxScore(index);
    this.totalScore = this.bowlingService.totalScore;
  }

  calculateScore() {
    this.bowlingService.calculateScore();
    const allInputsFilled = this.frames.every((frame: string | any[], index: number) => {
      if (index < 9) {
        return frame.length === (frame[0] === 10 ? 1 : 2);
      } else {
        if (frame[0] === 10) {
          return frame.length === 3;
        } else {
          return frame.length === 2;
        }
      }
    });

    if (allInputsFilled) {
      this.totalScore = this.bowlingService.totalScore;
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
    this.bowlingService.clearRolls();
    this.frameScores = this.bowlingService.frameScores;
    this.frames = this.bowlingService.frames;
    this.totalScore = undefined;
    this.maxScore = this.bowlingService.calculateMaxScore(0);
  }
}



