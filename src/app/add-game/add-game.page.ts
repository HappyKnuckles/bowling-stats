import {
  Component,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { TrackGridComponent } from '../components/track-grid/track-grid.component';
import { ActionSheetController, AlertController, IonModal, isPlatform } from '@ionic/angular';
import { ImageProcesserService } from '../services/image-processer/image-processer.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ToastService } from '../services/toast/toast.service';
import { SeriesMode } from './seriesModeEnum';
import { BowlingCalculatorService } from '../services/bowling-calculator/bowling-calculator.service';
import { GameDataTransformerService } from '../services/transform-game/transform-game-data.service';
import { SaveGameDataService } from '../services/save-game/save-game.service';
import { LoadingService } from '../services/loader/loading.service';

@Component({
  selector: 'app-add-game',
  templateUrl: 'add-game.page.html',
  styleUrls: ['add-game.page.scss'],
})
export class AddGamePage {
  totalScores: number[] = new Array(8).fill(0);
  maxScores: number[] = new Array(8).fill(300);
  seriesMode: boolean[] = [true, false, false];
  selectedMode: SeriesMode = SeriesMode.Single; // Initialize selected mode
  trackIndexes: number[][] = [[0], [1, 2, 3], [4, 5, 6, 7]];
  selectedModeText: SeriesMode = SeriesMode.Single;
  sheetOpen: boolean = false;
  isAlertOpen: boolean = false;
  alertButton = ['Dismiss'];
  isModalOpen: boolean = false;
  userName: string | null;
  gameData: any;
  isLoading: boolean = false;

  @ViewChildren(TrackGridComponent) trackGrids!: QueryList<TrackGridComponent>;
  @ViewChild(IonModal) modal!: IonModal;


  constructor(
    private actionSheetCtrl: ActionSheetController,
    private imageProcessingService: ImageProcesserService,
    private alertController: AlertController,
    private toastService: ToastService,
    private bowlingService: BowlingCalculatorService,
    private saveGameService: SaveGameDataService,
    private transformGameService: GameDataTransformerService,
    private loadingService: LoadingService
  ) {
    this.userName = localStorage.getItem('username');
  }

  async openFileInput(): Promise<File | undefined> {
    return new Promise((resolve) => {
      const fileInput = document.getElementById('upload') as HTMLInputElement;
      fileInput.addEventListener('change', () => {
        const selectedFile = fileInput.files?.[0];
        resolve(selectedFile);
      });
      fileInput.click();
    });
  }

  async takeOrChoosePicture(): Promise<any> {
    if (isPlatform('android') || isPlatform('ios') || isPlatform('mobile')) {
      const permissionRequestResult = (await Camera.checkPermissions());

      if (permissionRequestResult.photos === 'prompt') {
        (await Camera.requestPermissions()).photos;
        await this.handleImageUpload();
      } else if (permissionRequestResult.photos === 'denied') {
        this.showPermissionDeniedAlert();
      }
      else {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        });

        let blob = await fetch(image.webPath!).then(r => r.blob());

        return blob;
      }
    } else {
      const file = await this.openFileInput();
      if (file) {
        return file;
      }
    }
  }

  async showPermissionDeniedAlert() {
    const alert = await this.alertController.create({
      header: 'Permission Denied',
      message: 'To take or choose a picture, you need to grant camera access permission. Please enable camera access in your device settings.',
      buttons: [
        {
          text: 'OK',
          handler: async () => {
            const permissionRequestResult = await Camera.requestPermissions();
            if (permissionRequestResult.photos === 'granted') {
              this.takeOrChoosePicture();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async handleImageUpload(): Promise<void> {
    try {
      const imageUrl = await this.takeOrChoosePicture();
      if (imageUrl) {
        this.loadingService.setLoading(true);
        const gameText = await this.imageProcessingService.performOCR(imageUrl);
        this.parseBowlingScores(gameText!);
      } else this.toastService.showToast("Kein Bild hochgeladen", "bug-outline", true);
    } catch (error) {
      this.toastService.showToast(`Fehler beim Hochladen des Bildes ${error}`, "bug-outline", true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  parseBowlingScores(input: string) {
    try {
      const lines = input.split('\n');
      const userIndex = lines.findIndex(line => line.toLowerCase().includes(this.userName!.toLowerCase()));
      const linesAfterUsername = userIndex >= 0 ? lines.slice(userIndex + 1) : [];

      const nextNonXLineIndex = linesAfterUsername.findIndex(line => /^[a-wyz]/i.test(line));

      const relevantLines = nextNonXLineIndex >= 0 ? linesAfterUsername.slice(0, nextNonXLineIndex) : linesAfterUsername;

      if (relevantLines.length < 2) {
        throw new Error(`Insufficient score data for user ${this.userName}`);
      }

      let throwValues = relevantLines[0].split('').concat(relevantLines[1].split(''));

      throwValues = throwValues.filter(value => value.trim() !== '');

      let prevValue: number | undefined;

      throwValues = throwValues.map(value => {
        if (value === 'X') {
          prevValue = 10;
          return '10';
        } else if (value === '-') {
          prevValue = 0;
          return '0';
        } else if (value === '/') {
          if (prevValue !== undefined) {
            return (10 - prevValue).toString();
          }
          return '';
        } else {
          prevValue = parseInt(value, 10);
          return value;
        }
      });

      const frames: any[] = [];
      let currentFrame: any[] = [];

      throwValues.forEach((value) => {
        const isNinthFrame = frames.length === 9;
        currentFrame.push(value);

        if ((currentFrame.length === 2 && !isNinthFrame) || (isNinthFrame && currentFrame.length === 3)) {
          frames.push([...currentFrame]);
          currentFrame = [];
        } else if (value === '10' && !isNinthFrame) {
          frames.push([...currentFrame]);
          currentFrame = [];
        }
      });

      if (currentFrame.length > 0) {
        frames.push([...currentFrame]);
      }

      const frameScores = relevantLines[2].split(' ').map(Number);

      const totalScore = frameScores[9];

      this.gameData = this.transformGameService.transformGameData(frames, frameScores, totalScore);

      if (this.gameData.frames.length === 10 && this.gameData.frameScores.length === 10 && this.gameData.totalScore <= 300) {
        this.isModalOpen = true;
      } else {
        this.toastService.showToast('Spielinhalt wurde nicht richtig erkannt! Probiere einen anderen Winkel.', 'bug-outline', true);
      }
    } catch (error) {
      this.toastService.showToast(`${error}`, 'bug-outline', true);
    }
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    try {
      this.saveGameService.saveGameToLocalStorage(this.gameData);
      this.toastService.showToast("Spiel hinzugefügt", "add");
      this.modal.dismiss(null, 'confirm');
    } catch (error) {
      this.toastService.showToast(`Error saving game data to local storage: ${error}`, 'bug-outline', true);
    }
  }

  updateFrameScore(value: any, index: number) {
    this.gameData.frameScores[index] = value;
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
    this.toastService.showToast('Spiel wurde zurückgesetzt!', 'refresh-outline');
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
        this.toastService.showToast('Spiel wurde gespeichert!', 'add');
      } catch (error) {
        this.toastService.showToast('Da ist was schief gelaufen', 'bug-outline', true);
      }
    } else this.setAlertOpen();
  }

  setAlertOpen() {
    this.isAlertOpen = !this.isAlertOpen;
  }

  onMaxScoreChanged(maxScore: number, index: number) {
    this.maxScores[index] = maxScore;
  }

  onTotalScoreChange(totalScore: number, index: number) {
    this.totalScores[index] = totalScore;
  }

  getSeriesMaxScore(index: number): number {
    return this.bowlingService.getSeriesMaxScore(index, this.maxScores);
  }

  getSeriesCurrentScore(index: number): number {
    return this.bowlingService.getSeriesCurrentScore(index, this.totalScores);
  }

  async presentActionSheet() {
    const buttons = [];
    this.sheetOpen = true;
    if (!this.seriesMode[0]) {
      buttons.push({
        text: SeriesMode.Single,
        handler: () => {
          this.seriesMode[0] = true;
          this.seriesMode[1] = false;
          this.seriesMode[2] = false;
          this.selectedModeText = SeriesMode.Single; // Update selected mode text
        },
      });
    }

    if (!this.seriesMode[1]) {
      buttons.push({
        text: SeriesMode.Series3,
        handler: () => {
          this.seriesMode[0] = false;
          this.seriesMode[1] = true;
          this.seriesMode[2] = false;
          this.selectedModeText = SeriesMode.Series3; // Update selected mode text
        },
      });
    }

    if (!this.seriesMode[2]) {
      buttons.push({
        text: SeriesMode.Series4,
        handler: () => {
          this.seriesMode[0] = false;
          this.seriesMode[1] = false;
          this.seriesMode[2] = true;
          this.selectedModeText = SeriesMode.Series4; // Update selected mode text
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
