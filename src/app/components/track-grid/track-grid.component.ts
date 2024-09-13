import { Component, OnInit, EventEmitter, Output, QueryList, ViewChildren } from '@angular/core';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';
import { SaveGameDataService } from 'src/app/services/save-game/save-game.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { GameDataTransformerService } from 'src/app/services/transform-game/transform-game-data.service';
import { NgFor, NgIf } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonInput } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-track-grid',
  templateUrl: './track-grid.component.html',
  styleUrls: ['./track-grid.component.scss'],
  providers: [BowlingCalculatorService],
  standalone: true,
  imports: [NgFor, IonGrid, IonRow, IonCol, NgIf, IonInput, FormsModule],
})
export class TrackGridComponent implements OnInit {
  @Output() maxScoreChanged = new EventEmitter<number>();
  @Output() totalScoreChanged = new EventEmitter<number>();
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  private inputSubject: Subject<any> = new Subject();
  totalScore: any;
  maxScore: any;

  constructor(
    public bowlingService: BowlingCalculatorService,
    private saveGameService: SaveGameDataService,
    private transformGameService: GameDataTransformerService,
    private toastService: ToastService,
    private hapticService: HapticService
  ) {}

  ngOnInit(): void {
    this.inputSubject.pipe(debounceTime(300)).subscribe(({ event, frameIndex, inputIndex }) => {
      this.simulateScore(event, frameIndex, inputIndex);
    });
    // Check if gameIndex exists in local storage
    this.maxScore = this.bowlingService.maxScore;
    this.totalScore = this.bowlingService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  simulateScore(event: any, frameIndex: number, inputIndex: number): void {
    const inputValue = parseInt(event.target.value, 10);

    if (!this.isValidNumber0to10(inputValue)) {
      this.handleInvalidInput(event);
      return;
    }

    if (!this.isValidFrameScore(inputValue, frameIndex, inputIndex)) {
      this.handleInvalidInput(event);
      return;
    }

    this.bowlingService.frames[frameIndex][inputIndex] = inputValue;
    this.updateScores();
    this.focusNextInput(frameIndex, inputIndex);
  }

  private isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  private isValidFrameScore(inputValue: number, frameIndex: number, inputIndex: number): boolean {
    if (frameIndex < 9) {
      // Regular frames (1-9)
      const firstThrow = this.bowlingService.frames[frameIndex][0] || 0;
      const secondThrow = inputIndex === 1 ? inputValue : this.bowlingService.frames[frameIndex][1] || 0;
      return firstThrow + secondThrow <= 10;
    } else {
      // 10th frame
      const firstThrow = this.bowlingService.frames[frameIndex][0] || 0;
      const secondThrow = this.bowlingService.frames[frameIndex][1] || 0;

      switch (inputIndex) {
        case 0:
          return inputValue <= 10;
        case 1:
          if (firstThrow === 10) {
            // First throw is a strike, second throw can be any value 0-10
            return inputValue <= 10;
          } else {
            // First throw is not a strike, second throw + first throw must be <= 10
            return firstThrow + inputValue <= 10;
          }
        case 2:
          if (firstThrow === 10) {
            // First throw is a strike
            if (secondThrow === 10) {
              // Second throw is also a strike, third throw can be any value 0-10
              return inputValue <= 10;
            } else {
              // Second throw is not a strike, third throw can only be 10 - second throw
              return inputValue <= 10 - secondThrow;
            }
          } else if (firstThrow + secondThrow === 10) {
            // First two throws are a spare, third throw can be any value 0-10
            return inputValue <= 10;
          } else {
            // First two throws are not a strike or spare, no third throw allowed
            return false;
          }
        default:
          return false;
      }
    }
  }

  private handleInvalidInput(event: any): void {
    this.hapticService.vibrate(ImpactStyle.Heavy, 300);
    event.target.value = '';
  }

  private updateScores(): void {
    this.totalScore = this.bowlingService.calculateScore();
    this.maxScore = this.bowlingService.calculateMaxScore();
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  onInput(event: any, frameIndex: number, inputIndex: number) {
    this.inputSubject.next({ event, frameIndex, inputIndex }); // Emit the event to the Subject for debouncing
  }

  async focusNextInput(frameIndex: number, inputIndex: number) {
    await new Promise((resolve) => setTimeout(resolve, 600)); // Delay to give time to user

    // Convert QueryList to an array
    const inputArray = this.inputs.toArray();
    // Calculate the current index in the linear array of inputs
    const currentInputPosition = frameIndex * 2 + inputIndex;

    // Find the next input element that is not disabled
    for (let i = currentInputPosition + 1; i < inputArray.length; i++) {
      const nextInput = inputArray[i];
      const nextInputElement = await nextInput.getInputElement();

      if (!nextInputElement.disabled) {
        nextInput.setFocus();
        break;
      }
    }
  }

  saveGameToLocalStorage(): void {
    try {
      const gameData = this.transformGameService.transformGameData(
        this.bowlingService.frames,
        this.bowlingService.frameScores,
        this.bowlingService.totalScore
      );
      this.saveGameService.saveGameToLocalStorage(gameData);
      this.toastService.showToast('Game saved succesfully.', 'add');
      this.clearFrames();
    } catch (error) {
      this.toastService.showToast(`Error saving game data to local storage: ${error}`, 'bug', true);
    }
  }

  isGameValid(): boolean {
    const allInputsValid = this.bowlingService.frames.every((frame: any[], index: number) => {
      if (index < 9) {
        // For frames 1 to 9: Check if there are either 2 throws (unless it's a strike) or 1 throw (for strike)
        return (
          (frame[0] === 10 && frame.length === 1) ||
          (frame.length === 2 && frame.reduce((acc, curr) => acc + curr, 0) <= 10 && frame.every((throwValue) => throwValue >= 0 && throwValue <= 10))
        );
      } else {
        // For frame 10: Check if there are either 3 throws (if there's a strike or spare in the first two throws),
        // or 2 throws (if there's no strike or spare in the first two throws)
        return (
          (frame[0] === 10 && frame.length === 3 && frame.every((throwValue) => throwValue >= 0 && throwValue <= 10)) ||
          (frame.length === 2 && frame[0] + frame[1] < 10 && frame.every((throwValue) => throwValue >= 0 && throwValue <= 10)) ||
          (frame.length === 3 &&
            frame[0] + frame[1] >= 10 &&
            frame[1] !== undefined &&
            frame.every((throwValue) => throwValue >= 0 && throwValue <= 10))
        );
      }
    });
    return allInputsValid;
  }

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  clearFrames(): void {
    this.bowlingService.clearRolls();
    this.maxScore = this.bowlingService.maxScore;
    this.totalScore = this.bowlingService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }
}
