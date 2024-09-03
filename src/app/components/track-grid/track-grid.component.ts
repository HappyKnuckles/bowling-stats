import { Component, OnInit, EventEmitter, Output, QueryList, ViewChildren } from '@angular/core';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';
import { SaveGameDataService } from 'src/app/services/save-game/save-game.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { GameDataTransformerService } from 'src/app/services/transform-game/transform-game-data.service';
import { NgFor, NgIf } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonInput } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-track-grid',
    templateUrl: './track-grid.component.html',
    styleUrls: ['./track-grid.component.scss'],
    providers: [BowlingCalculatorService],
    standalone: true,
    imports: [NgFor, IonGrid, IonRow, IonCol, NgIf, IonInput, FormsModule]
})
export class TrackGridComponent implements OnInit {
    @Output() maxScoreChanged = new EventEmitter<number>();
    @Output() totalScoreChanged = new EventEmitter<number>();
    @ViewChildren(IonInput) inputs!: QueryList<IonInput>;

    totalScore: any;
    maxScore: any;
    globalIndex: number = 0;

    constructor(public bowlingService: BowlingCalculatorService,
        private saveGameService: SaveGameDataService,
        private transformGameService: GameDataTransformerService,
        private toastService: ToastService) { }

    ngOnInit(): void {
        // Check if gameIndex exists in local storage
        this.maxScore = this.bowlingService.maxScore;
        this.totalScore = this.bowlingService.totalScore;
        this.maxScoreChanged.emit(this.maxScore);
        this.totalScoreChanged.emit(this.totalScore);
    }

    simulateScore(event: any): void {
        const inputValue = parseInt(event.target.value, 10);
        if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 10) {
            this.totalScore = this.bowlingService.calculateScore();
            this.maxScore = this.bowlingService.calculateMaxScore();
            this.maxScoreChanged.emit(this.maxScore);
            this.totalScoreChanged.emit(this.totalScore);
        }
    }

    async focusNextInput(frameIndex: number, inputIndex: number) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Convert QueryList to an array               
        const inputArray = this.inputs.toArray();
        // Calculate the current index in the linear array of inputs
        const currentInputPosition = frameIndex * 2 + inputIndex;

        // Find the next input element that is not disabled
        for (let i = currentInputPosition + 1; i < inputArray.length; i++) {
            const nextInput = inputArray[i];
            const nextInputElement = await nextInput.getInputElement();

            if (!nextInputElement.disabled) {
                // Add a 1-second delay before focusing on the next available input
                nextInput.setFocus();
                break;
            }
        }
    }

    saveGameToLocalStorage(): void {
        try {
            const gameData = this.transformGameService.transformGameData(this.bowlingService.frames, this.bowlingService.frameScores, this.bowlingService.totalScore);
            this.saveGameService.saveGameToLocalStorage(gameData);
            this.toastService.showToast("Game saved succesfully.", "add");
            this.clearFrames();
        } catch (error) {
            this.toastService.showToast(`Error saving game data to local storage: ${error}`, 'bug', true);
        }
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

    clearFrames(): void {
        this.bowlingService.clearRolls();
        this.maxScore = this.bowlingService.maxScore;
        this.totalScore = this.bowlingService.totalScore;
        this.maxScoreChanged.emit(this.maxScore);
        this.totalScoreChanged.emit(this.totalScore);
    }
}



