import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
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
  maxScore: any;
  isAlertOpen: boolean = false;
  alertButton = ['Dismiss'];

  constructor(private bowlingService: BowlingCalculatorService) { }

  ngOnInit() {
    // Check if gameIndex exists in local storage
    this.maxScore = this.bowlingService.maxScore;
  }

  simulateScore(index: number) {
    this.bowlingService.calculateScore();
    this.maxScore = this.bowlingService.calculateMaxScore(index);
    this.totalScore = this.bowlingService.totalScore;
  }

  calculateScore() {
    this.bowlingService.calculateScore();
    const allInputsFilled = this.frames.every((frame: string | any[], index: number) => {
      if (index < 9) {
        return frame.length === (frame[0] === 10 ? 1 : 2);
      } else {
        if (frame[0] === 10 || frame[0] + frame[1] === 10) {
          return frame.length === 3;
        } else {
          return frame.length === 2;
        }
      }
    });

    if (allInputsFilled) {
      this.totalScore = this.bowlingService.totalScore;
      this.saveGameToLocalStorage();
    } else this.setAlertOpen();
  }

  setAlertOpen() {
    this.isAlertOpen = !this.isAlertOpen;
  }

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  saveGameToLocalStorage() {
    const gameId = Date.now() + '_' + Math.random().toString(36).substr(2, 9); // Generate a unique gameId
    const date = Date.now();
    const gameData = {
      gameId: gameId,
      date: date,
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
    const key = 'game' + gameData.gameId; // Generate key using index
    localStorage.setItem(key, gameDataString);
    this.clearFrames();
    window.dispatchEvent(new Event('newDataAdded'));
  }


  clearFrames() {
    this.bowlingService.clearRolls();
    this.frameScores = this.bowlingService.frameScores;
    this.frames = this.bowlingService.frames;
    this.totalScore = this.bowlingService.totalScore;
    this.maxScore = this.bowlingService.maxScore;
  }
}



