import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { BowlingCalculatorService } from '../services/bowling-calculator/bowling-calculator.service';
import { TrackGridComponent } from '../components/track-grid/track-grid.component';
import { Subscription } from 'rxjs';
import { ActionSheetController } from '@ionic/angular';
import { ImageProcesserService } from '../services/image-processer/image-processer.service';
@Component({
  selector: 'app-add-game',
  templateUrl: 'add-game.page.html',
  styleUrls: ['add-game.page.scss'],
})
export class AddGamePage {
  totalScores: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  maxScores: number[] = [300, 300, 300, 300, 300, 300, 300, 300];
  seriesMode: boolean[] = [true, false, false];
  trackIndexes: number[][] = [[0], [1, 2, 3], [4, 5, 6, 7]];
  selectedModeText: string = 'Single';
  sheetOpen: boolean = false;
  isAlertOpen: boolean = false;
  alertButton = ['Dismiss'];
  isToastOpen: boolean = false;
  message: string = '';
  icon: string = '';
  error?: boolean = false;
  userName: string | null;
  @ViewChildren(TrackGridComponent) trackGrids!: QueryList<TrackGridComponent>;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private imageProcessingService: ImageProcesserService
  ) {
    this.userName = localStorage.getItem('username');
  }

  openFileInput() {
    const fileInput = document.getElementById('upload');
    if (fileInput) {
      fileInput.click();
    }
  }

  async handleImageUpload(event: any): Promise<void> {
    const imageFile = event.target.files[0];
    // const gameText = await this.imageProcessingService.performOCR(imageFile);
    // localStorage.setItem("testdata", gameText!);
    const gameText = localStorage.getItem('testdata');
    console.log(gameText);
    this.parseBowlingScores(gameText!);
  }

  parseBowlingScores(input: string) {
    // Split the input into lines
    const lines = input.split('\n');
    console.log(lines);
    // Find the lines with the user's scores
    const index = lines.findIndex((line) =>
      line.toLowerCase().includes('lotti'!.toLowerCase())
    );
    let linesAfterUsername = index >= 0 ? lines.slice(index + 1) : [];

    const nextNonXLineIndex = linesAfterUsername.findIndex((line) => {
      const firstChar = line.charAt(0).toLowerCase();
      return firstChar >= 'a' && firstChar <= 'z' && firstChar !== 'x';
    });

    if (nextNonXLineIndex >= 0) {
      linesAfterUsername = linesAfterUsername.slice(0, nextNonXLineIndex);
    }

    if (linesAfterUsername.length < 2) {
      throw new Error(`Insufficient score data for user ${this.userName}`);
    }
    // Extract the throw values and frame scores from the user's lines
    let throwValues;
    if (linesAfterUsername.length > 3) {
      throwValues = linesAfterUsername[0]
        .split('')
        .slice(0)
        .concat(linesAfterUsername[1].split('').slice(0));
    } else throwValues = linesAfterUsername[0].split('').slice(0);

    let filteredThrowValues = throwValues.filter(
      (value) => value.trim() !== ''
    );

    filteredThrowValues = filteredThrowValues.map((value) => {
      if (value === 'X') {
        return '10';
      } else if (value === '-') {
        return '0';
      } else {
        return value;
      }
    });

    const frameScores = linesAfterUsername[2].split(' ').slice(0).map(Number);

    console.log(filteredThrowValues);

    // Calculate the total score
    const totalScore = frameScores[9];
    // Build the final game object
    const game = {
      gameId: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      date: Date.now(),
      frames,
      frameScores,
      totalScore,
    };

    console.log(game);
  }

  clearFrames(index?: number) {
    if (index !== undefined && index >= 0 && index < this.trackGrids.length) {
      // Clear frames for the specified index
      this.trackGrids.toArray()[index].clearFrames();
    } else {
      // Clear frames for all components
      this.trackGrids.forEach((trackGrid: TrackGridComponent) => {
        trackGrid.clearFrames();
      });
    }
    this.setToastOpen('Spiel wurde zurückgesetzt!', 'refresh-outline');
  }

  calculateScore() {
    let allGamesValid = true;

    this.trackGrids.forEach((trackGrid: TrackGridComponent) => {
      if (!trackGrid.isGameValid()) {
        allGamesValid = false;
        return;
      }
    });

    if (allGamesValid) {
      try {
        this.trackGrids.forEach((trackGrid: TrackGridComponent) => {
          trackGrid.saveGameToLocalStorage();
        });
        this.setToastOpen('Spiel wurde gespeichert!', 'add');
      } catch (error) {
        this.setToastOpen('Da ist was schief gelaufen', 'bug-outline', true);
      }
    } else this.setAlertOpen();
  }

  setAlertOpen() {
    this.isAlertOpen = !this.isAlertOpen;
  }

  setToastOpen(message: string, icon: string, error?: boolean) {
    this.message = message;
    this.icon = icon;
    this.error = error;
    this.isToastOpen = true;
  }

  onMaxScoreChanged(maxScore: number, index: number) {
    this.maxScores[index] = maxScore;
  }

  onTotalScoreChange(totalScore: number, index: number) {
    this.totalScores[index] = totalScore;
  }

  getSeriesMaxScore(index: number): number {
    if (index === 1) {
      return this.maxScores[1] + this.maxScores[2] + this.maxScores[3];
    }
    if (index === 2) {
      return (
        this.maxScores[4] +
        this.maxScores[5] +
        this.maxScores[6] +
        this.maxScores[7]
      );
    }
    return 900;
  }

  getSeriesCurrentScore(index: number): number {
    if (index === 1) {
      return this.totalScores[1] + this.totalScores[2] + this.totalScores[3];
    }
    if (index === 2) {
      return (
        this.totalScores[4] +
        this.totalScores[5] +
        this.totalScores[6] +
        this.totalScores[7]
      );
    }
    return 0;
  }

  async presentActionSheet() {
    const buttons = [];
    this.sheetOpen = true;
    if (!this.seriesMode[0]) {
      buttons.push({
        text: 'Single',
        handler: () => {
          this.seriesMode[0] = true;
          this.seriesMode[1] = false;
          this.seriesMode[2] = false;
          this.selectedModeText = 'Single'; // Update selected mode text
        },
      });
    }

    if (!this.seriesMode[1]) {
      buttons.push({
        text: '3 Series',
        handler: () => {
          this.seriesMode[0] = false;
          this.seriesMode[1] = true;
          this.seriesMode[2] = false;
          this.selectedModeText = '3 Series'; // Update selected mode text
        },
      });
    }

    if (!this.seriesMode[2]) {
      buttons.push({
        text: '4 Series',
        handler: () => {
          this.seriesMode[0] = false;
          this.seriesMode[1] = false;
          this.seriesMode[2] = true;
          this.selectedModeText = '4 Series'; // Update selected mode text
        },
      });
    }

    buttons.push({
      text: 'Abbrechen',
      role: 'cancel',
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Serie auswählen',
      buttons: buttons,
    });

    actionSheet.onWillDismiss().then(() => {
      this.sheetOpen = false;
    });

    await actionSheet.present();
  }
}
