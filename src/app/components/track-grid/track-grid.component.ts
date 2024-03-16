import { Component, ElementRef, OnInit, ViewChild, Renderer2, EventEmitter, Output } from '@angular/core';
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

  simulateScore(index: number) {
    this.bowlingService.calculateScore();
    this.totalScore = this.bowlingService.totalScore;
    this.maxScore = this.bowlingService.calculateMaxScore(index);
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  getGameData(): any {
    return {
      frames: this.bowlingService.frames,
      frameScores: this.bowlingService.frameScores,
      totalScore: this.bowlingService.totalScore
      // Add other necessary data
    };
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
  
  isGameValid(): boolean{
    const allInputsFilled = this.bowlingService.frames.every((frame: string | any[], index: number) => {
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
    return allInputsFilled;
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



