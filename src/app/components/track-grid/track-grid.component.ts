import { Component, ElementRef, OnInit, ViewChild, Renderer2, EventEmitter, Output } from '@angular/core';
import { IonInput } from '@ionic/angular';
import { Subject } from 'rxjs';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';

@Component({
  selector: 'app-track-grid',
  templateUrl: './track-grid.component.html',
  styleUrls: ['./track-grid.component.scss'],
  providers: [BowlingCalculatorService]
})
export class TrackGridComponent implements OnInit {
  @Output() maxScoreChanged = new EventEmitter<number>();
  @Output() totalScoreChanged = new EventEmitter<number>();

  totalScore: any;
  maxScore: any;

  constructor(public bowlingService: BowlingCalculatorService) { }

  ngOnInit() {
    // Check if gameIndex exists in local storage
    this.maxScore = this.bowlingService.maxScore;
    this.totalScore = this.bowlingService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  simulateScore(index: number, event: any) {
    const inputValue = parseInt(event.target.value, 10);
    if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 10) {
      this.bowlingService.calculateScore();
      this.totalScore = this.bowlingService.totalScore;
      this.maxScore = this.bowlingService.calculateMaxScore(index);
      this.maxScoreChanged.emit(this.maxScore);
      this.totalScoreChanged.emit(this.totalScore);
    }
  }

  saveGameToLocalStorage() {
    const gameId = Date.now() + '_' + Math.random().toString(36).substr(2, 9); // Generate a unique gameId
    const date = Date.now();
    const gameData = {
      gameId: gameId,
      date: date,
      frames: this.bowlingService.frames.map((frame: any[], frameIndex: number) => ({
        throws: frame.map((throwValue: any, throwIndex: number) => ({
          value: throwValue,
          throwIndex: throwIndex + 1 // Add 1 to make it 1-based index
        })),
        frameIndex: frameIndex + 1 // Add 1 to make it 1-based index
      })),
      frameScores: this.bowlingService.frameScores,
      totalScore: this.bowlingService.totalScore
    };

    const gameDataString = JSON.stringify(gameData);
    const key = 'game' + gameData.gameId; // Generate key using index
    localStorage.setItem(key, gameDataString);
    this.clearFrames();
    window.dispatchEvent(new Event('newDataAdded'));
  }

  isGameValid(): boolean {
    const allInputsValid = this.bowlingService.frames.every((frame: any[], index: number) => {
      if (index < 9) {
        // For frames 1 to 9: Check if there are either 2 throws (unless it's a strike) or 1 throw (for strike)
        return (frame[0] === 10 && frame.length === 1) ||
               (frame.length === 2 && frame.reduce((acc, curr) => acc + curr, 0) <= 10 && frame.every(throwValue => throwValue >= 0 && throwValue <= 10));
      } else {
        // For frame 10: Check if there are either 3 throws (if there's a strike or spare in the first two throws),
        // or 2 throws (if there's no strike or spare in the first two throws)
        return (frame[0] === 10 && frame.length === 3 && frame.every(throwValue => throwValue >= 0 && throwValue <= 10)) ||
               (frame.length === 2 && frame[0] + frame[1] < 10 && frame.every(throwValue => throwValue >= 0 && throwValue <= 10)) ||
               (frame.length === 3 && frame[0] + frame[1] >= 10 && frame[1] !== undefined && frame.every(throwValue => throwValue >= 0 && throwValue <= 10));
      }
    });
    return allInputsValid;
  }
  

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  clearFrames() {
    this.bowlingService.clearRolls();
    this.maxScore = this.bowlingService.maxScore;
    this.totalScore = this.bowlingService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }
}



