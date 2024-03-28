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
import { Subscription, filter } from 'rxjs';
import { ActionSheetController, AlertController, IonModal, Platform, isPlatform } from '@ionic/angular';
import { ImageProcesserService } from '../services/image-processer/image-processer.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  isModalOpen: boolean = false;
  message: string = '';
  icon: string = '';
  error?: boolean = false;
  userName: string | null;
  @ViewChildren(TrackGridComponent) trackGrids!: QueryList<TrackGridComponent>;
  @ViewChild(IonModal) modal!: IonModal;
  gameData: any;
  isLoading: boolean = false;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private imageProcessingService: ImageProcesserService,
    private alertController: AlertController
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
    if (isPlatform('android') || isPlatform('ios')) {
      if (isPlatform('ios') && (await Camera.checkPermissions()).camera === 'denied') {
        const permissionRequestResult = await Camera.requestPermissions();
        if (permissionRequestResult) {
          // If running on a mobile device, use Camera plugin
          const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Prompt,
          });
          return image;
        } else this.showPermissionDeniedAlert();
      } else if (isPlatform('android')) {
        // If running on an Android device, use Camera plugin without asking for permissions
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt,
        });
        return image;
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
            if (permissionRequestResult.camera === 'granted') {
              this.takeOrChoosePicture();
            } else {
              this.showPermissionDeniedAlert();
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
        this.isLoading = true;
        const gameText = await this.imageProcessingService.performOCR(imageUrl);
        // localStorage.setItem("testdata", gameText!);
        // const gameText = localStorage.getItem('testdata');
        this.parseBowlingScores(gameText!);
      } else this.setToastOpen("Kein Bild hochgeladen", "bug-outline", true);
    } catch (error) {
      // Handle error
      console.error("Error handling image upload:", error);
      this.setToastOpen("Fehler beim Hochladen des Bildes", "bug-outline", true);
    } finally {
      this.isLoading = false;
    }
  }

  parseBowlingScores(input: string) {
    try {
      // Split the input into lines
      const lines = input.split('\n');
      console.log(lines);
      // Find the lines with the user's scores
      const index = lines.findIndex((line) =>
        line.toLowerCase().includes(this.userName!.toLowerCase())
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

      let prevValue: number | undefined; // Initialize previous value variable

      filteredThrowValues = filteredThrowValues.map((value) => {
        if (value === 'X') {
          prevValue = 10; // Set previous value to 10 for 'X'
          return '10';
        } else if (value === '-') {
          prevValue = 0; // Set previous value to 0 for '-'
          return '0';
        } else if (value === '/') {
          if (prevValue !== undefined) {
            return (10 - prevValue).toString(); // Calculate the difference between 10 and previous value
          }
          return ''; // Return an empty string if previous value is not available
        } else {
          prevValue = parseInt(value, 10); // Set previous value to current value
          return value;
        }
      });

      const frames: any[] = [];
      let currentFrame: any[] = [];

      filteredThrowValues.forEach((value, index) => {
        // Check if we're in the ninth frame
        const isNinthFrame = frames.length === 9;

        // Add the current throw to the current frame
        currentFrame.push(value);

        // Check if the current frame is complete or if it's a strike
        if ((currentFrame.length === 2 && !isNinthFrame) || (isNinthFrame && currentFrame.length === 3)) {
          // If the current frame is complete, push it to frames and start a new frame
          frames.push([...currentFrame]);
          currentFrame = [];
        } else if (value === '10' && !isNinthFrame) {
          // If it's a strike and not the ninth frame, push it to frames and start a new frame
          frames.push([...currentFrame]);
          currentFrame = [];
        }
      });

      // Push any remaining throws to the frames
      if (currentFrame.length > 0) {
        frames.push([...currentFrame]);
      }

      const frameScores = linesAfterUsername[2].split(' ').slice(0).map(Number);

      console.log(filteredThrowValues);

      // Calculate the total score
      const totalScore = frameScores[9];
      // Build the final game object

      this.gameData = {
        gameId: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        date: Date.now(),
        frames: frames.map((frame: any[], frameIndex: number) => ({
          throws: frame.map((throwValue: any, throwIndex: number) => ({
            value: parseInt(throwValue), // Convert throw value to number
            throwIndex: throwIndex + 1 // Add 1 to make it 1-based index
          })),
          frameIndex: frameIndex + 1 // Add 1 to make it 1-based index
        })),
        frameScores: frameScores,
        totalScore: totalScore
      };
      console.log(this.gameData)
      if (this.gameData.frames.length === 10 && this.gameData.frameScores.length === 10 && this.gameData.totalScore <= 300) {
        this.isModalOpen = true;
      }
      else this.setToastOpen('Spielinhalt wurde nicht richtig erkannt!', 'bug-outline', true);
    } catch (error) {
      this.setToastOpen(`${error}`, 'bug-outline', true);
    }
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  updateFrameScore(value: any, index: number) {
    this.gameData.frameScores[index] = value;
  }

  confirm() {
    console.log(this.gameData)
    this.saveGameToLocalStorage()
    this.setToastOpen("Spiel hinzugefügt", "add")
    this.modal.dismiss(null, 'confirm');
  }

  saveGameToLocalStorage() {
    const gameDataString = JSON.stringify(this.gameData);
    const key = 'game' + this.gameData.gameId; // Generate key using gameId
    localStorage.setItem(key, gameDataString);
    window.dispatchEvent(new Event('newDataAdded'));
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
    this.isToastOpen = false;
    setTimeout(() => {
      this.isToastOpen = true;
    }, 100);
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
