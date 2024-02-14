import { Component, OnInit } from '@angular/core';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';

@Component({
  selector: 'app-track-grid',
  templateUrl: './track-grid.component.html',
  styleUrls: ['./track-grid.component.scss'],
})
export class TrackGridComponent {
  private frameScores: number[] = [];

  rolls: { roll1: string, roll2: string, roll3: string }[] = Array.from({ length: 10 }, () => ({ roll1: '', roll2: '', roll3: '' }));
  frames: number[] = Array.from({ length: 10 }, (_, i) => i + 1);

  constructor(private bowlingService: BowlingCalculatorService) {}

  updateScore(frame: number, roll: number, pins: string): void {
    const pinsValue = parseInt(pins, 10);
    if (!isNaN(pinsValue)) {
        this.bowlingService.roll(pinsValue);
        const frameIndex = frame;
        const frameScore = this.bowlingService.score();
        this.frameScores[frameIndex] = frameScore;
    }
}


  calculateFrameScore(frame: number): number {
    return this.frameScores[frame];
}



}
