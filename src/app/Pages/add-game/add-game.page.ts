import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {
  ActionSheetController,
  AlertController,
  IonModal,
  isPlatform,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonTitle,
  IonAlert,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonInput,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SeriesMode } from './seriesModeEnum';
import { Game } from 'src/app/models/game-model';
import { addIcons } from 'ionicons';
import { add, chevronDown, chevronUp } from 'ionicons/icons';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { TrackGridComponent } from 'src/app/components/track-grid/track-grid.component';
import { AdService } from 'src/app/services/ad/ad.service';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImageProcesserService } from 'src/app/services/image-processer/image-processer.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { SaveGameDataService } from 'src/app/services/save-game/save-game.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { GameDataTransformerService } from 'src/app/services/transform-game/transform-game-data.service';
import { UserService } from 'src/app/services/user/user.service';
import { defineCustomElements } from '@teamhive/lottie-player/loader';
import { Device } from '@capacitor/device';

defineCustomElements(window);

@Component({
  selector: 'app-add-game',
  templateUrl: 'add-game.page.html',
  styleUrls: ['add-game.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonTitle,
    NgIf,
    IonAlert,
    NgFor,
    IonContent,
    TrackGridComponent,
    IonGrid,
    IonRow,
    IonCol,
    IonModal,
    IonButtons,
    IonInput,
    CommonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddGamePage implements OnInit {
  totalScores: number[] = new Array(8).fill(0);
  maxScores: number[] = new Array(8).fill(300);
  seriesMode: boolean[] = [true, false, false];
  selectedMode: SeriesMode = SeriesMode.Single; // Initialize selected mode
  selectedModeText: SeriesMode = SeriesMode.Single;
  trackIndexes: number[][] = [[0], [1, 2, 3], [4, 5, 6, 7]];
  sheetOpen: boolean = false;
  isAlertOpen: boolean = false;
  alertButton = ['Dismiss'];
  isModalOpen: boolean = false;
  is300: boolean = false;
  username = '';
  gameData!: Game;
  deviceId: string = '';
  private allowedDeviceIds = [
    '820fabe8-d29b-45c2-89b3-6bcc0e149f2b',
    '21330a3a-9cff-41ce-981a-00208c21d883',
    'b376db84-c3a4-4c65-8c59-9710b7d05791',
    '01c1e0d1-3469-4091-96a0-76beb68a6f97',
  ];

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
    private loadingService: LoadingService,
    private userService: UserService,
    private adService: AdService,
    private hapticService: HapticService
  ) {
    addIcons({ add, chevronDown, chevronUp });
  }

  async ngOnInit(): Promise<void> {
    this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
    this.deviceId = (await Device.getId()).identifier;
  }

  async openFileInput(): Promise<File | undefined> {
    return new Promise((resolve) => {
      const fileInput = document.getElementById('upload') as HTMLInputElement;
      fileInput.value = '';

      fileInput.addEventListener('change', () => {
        const selectedFile = fileInput.files?.[0];
        resolve(selectedFile);
      });
      fileInput.click();
    });
  }

  async takeOrChoosePicture(): Promise<File | Blob | undefined> {
    if ((isPlatform('android') || isPlatform('ios')) && !isPlatform('mobileweb')) {
      const permissionRequestResult = await Camera.checkPermissions();

      if (permissionRequestResult.photos === 'prompt') {
        (await Camera.requestPermissions()).photos;
        await this.handleImageUpload();
      } else if (permissionRequestResult.photos === 'denied') {
        this.showPermissionDeniedAlert();
      } else {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        });

        const blob = await fetch(image.webPath!).then((r) => r.blob());

        return blob;
      }
    } else {
      const file = await this.openFileInput();
      if (file) {
        return file;
      }
    }

    return undefined;
  }

  async showPermissionDeniedAlert(): Promise<void> {
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
          },
        },
      ],
    });
    await alert.present();
  }

  async handleImageUpload(): Promise<void> {
    // if (!this.allowedDeviceIds.includes(this.deviceId)) {
    //   this.toastService.showToast('You are not allowed to use this feature yet.', 'bug', true);
    //   return;
    // }
    try {
      if ((isPlatform('android') || isPlatform('ios')) && !isPlatform('mobileweb')) {
        const adWatched = await this.showAdAlert();
        if (!adWatched) {
          this.toastService.showToast('You need to watch the ad to use this service.', 'bug', true);
          return;
        }
      }
      const imageUrl: File | Blob | undefined = await this.takeOrChoosePicture();
      if (imageUrl instanceof File) {
        this.loadingService.setLoading(true);
        const gameText = await this.imageProcessingService.performOCR(imageUrl);
        this.parseBowlingScores(gameText!);
      } else {
        this.toastService.showToast('No image uploaded.', 'bug', true);
      }
    } catch (error) {
      this.toastService.showToast(`Error uploading image: ${error}`, 'bug', true);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
  onInputChange(event: any, frameIndex: number, throwIndex: number): void {
    let inputValue = event.target.value;
    let parsedValue: number = 0;
    // Handle notation for frames 1-9
    if (frameIndex < 9) {
      if (inputValue === 'X' || inputValue === 'x') {
        parsedValue = 10; // Strike notation
      } else if (inputValue === '/') {
        const firstThrow = this.gameData.frames[frameIndex].throws[0]?.value || 0;
        parsedValue = 10 - firstThrow; // Spare notation
      } else {
        parsedValue = parseInt(inputValue, 10); // Regular number input
      }
    } else {
      // Handle notation for 10th frame
      const firstThrow = this.gameData.frames[frameIndex].throws[0]?.value || 0;
      const secondThrow = this.gameData.frames[frameIndex].throws[1]?.value || 0;
  
      switch (throwIndex) {
        case 0: // First throw in 10th frame
          if (inputValue === 'X' || inputValue === 'x') {
            parsedValue = 10;
          } else {
            parsedValue = parseInt(inputValue, 10); // Regular number input
          }
          break;
  
        case 1: // Second throw in 10th frame
          if (firstThrow === 10) {
            // First throw was a strike, any value (0-10) is valid
            if (inputValue === 'X' || inputValue === 'x') {
              parsedValue = 10;
            } else {
              parsedValue = parseInt(inputValue, 10);
            }
          } else if (inputValue === '/') {
            parsedValue = 10 - firstThrow; // Spare notation
          } else {
            parsedValue = parseInt(inputValue, 10); // Regular number input
          }
          break;
  
        case 2: // Third throw in 10th frame
          if (firstThrow === 10) {
            // If first throw is a strike, handle second throw conditions
            if (secondThrow === 10 && (inputValue === 'X' || inputValue === 'x')) {
              parsedValue = 10; // Double strike
            } else if (secondThrow !== 10 && inputValue === '/') {
              parsedValue = 10 - secondThrow; // Spare notation after a non-strike second throw
            } else {
              parsedValue = parseInt(inputValue, 10); // Regular number input
            }
          } else if (firstThrow + secondThrow === 10) {
            // First two throws were a spare, any value (0-10) is valid
            if (inputValue === 'X' || inputValue === 'x') {
              parsedValue = 10; // Strike
            } else {
              parsedValue = parseInt(inputValue, 10); // Regular number input
            }
          }
          break;
      }
    }
    if(this.gameData.frames[frameIndex].throws[throwIndex]){
    // Update the frame data with parsed value
    if (parsedValue !== undefined && !isNaN(parsedValue)) {
      this.gameData.frames[frameIndex].throws[throwIndex].value = parsedValue;
    } else {
      // Handle invalid input (e.g., letters other than X or /)
      this.gameData.frames[frameIndex].throws[throwIndex].value = 0;
    }} else this.gameData.frames[frameIndex].isInvalid = true;
  
    // Validate game state after input change
    this.isGameValid(this.gameData);
  }
  
  showAdAlert(): Promise<boolean> {
    return new Promise((resolve) => {
      this.alertController
        .create({
          header: 'Ad required',
          message: 'To use this service, you need to watch an ad.',
          buttons: [
            {
              text: 'Watch ad',
              handler: async () => {
                try {
                  await this.adService.showRewardedAd();
                  resolve(true);
                } catch (error) {
                  resolve(false);
                }
              },
            },
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                resolve(false);
              },
            },
          ],
        })
        .then((alert) => alert.present());
    });
  }

  parseBowlingScores(input: string): void {
    try {
      const lines = input.split('\n').filter((line) => line.trim() !== '');

      const userIndex = lines.findIndex((line) => line.toLowerCase().includes(this.username!.toLowerCase()));

      const linesAfterUsername = userIndex >= 0 ? lines.slice(userIndex + 1) : [];

      const nextNonXLineIndex = linesAfterUsername.findIndex((line) => /^[a-wyz]/i.test(line));

      const relevantLines = nextNonXLineIndex >= 0 ? linesAfterUsername.slice(0, nextNonXLineIndex) : linesAfterUsername;

      if (relevantLines.length < 2) {
        throw new Error(`Insufficient score data for user ${this.username}`);
      }

      let throwValues = relevantLines[0].split('');
      let frameScores;

      if (throwValues.length < 12) {
        throwValues = throwValues.concat(relevantLines[1].split(''));
        frameScores = relevantLines.slice(2).map((line) => line.split(' ').map(Number));
      } else {
        frameScores = relevantLines.slice(1).map((line) => line.split(' ').map(Number));
      }

      // Scores können doppelt vorkommen, endScore immer zweimal (erscheinen der höchsten Zahl immer unm 1 reduzieren)
      frameScores = frameScores.flat().sort((a, b) => a - b);

      if (frameScores[9] === frameScores[10]) {
        frameScores.splice(frameScores.length - 1, 1);
      }

      throwValues = throwValues.filter((value) => value.trim() !== '');
      let prevValue: number | undefined;

      throwValues = throwValues.map((value) => {
        if (value === 'X' || value === '×') {
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
        if (frames.length < 10) {
          currentFrame.push(value);
          if ((currentFrame.length === 2 && !isNinthFrame) || (isNinthFrame && currentFrame.length === 3)) {
            frames.push([...currentFrame]);
            currentFrame = [];
          } else if (value === '10' && !isNinthFrame) {
            frames.push([...currentFrame]);
            currentFrame = [];
          }
        }
      });

      if (currentFrame.length > 0) {
        frames.push([...currentFrame]);
      }

      const totalScore = frameScores[9];

      this.gameData = this.transformGameService.transformGameData(frames, frameScores, totalScore);

      if (this.gameData.frames.length === 10 && this.gameData.frameScores.length === 10 && this.gameData.totalScore <= 300) {
        this.isModalOpen = true;
      } else {
        // this.toastService.showToast('Spielinhalt wurde nicht richtig erkannt! Probiere einen anderen Winkel.', 'bug-outline', true);
        this.isModalOpen = true;
      }
    } catch (error) {
      this.toastService.showToast(`${error}`, 'bug', true);
    }
  }

  cancel(): void {
    this.modal.dismiss(null, 'cancel');
  }

  confirm(): void {
    try {
      if (!this.isGameValid(this.gameData)) {
        this.hapticService.vibrate(ImpactStyle.Heavy, 300);
        this.toastService.showToast('Invalid input.', 'bug', true);
        return;
      } else {
        this.saveGameService.saveGameToLocalStorage(this.gameData);
        this.toastService.showToast('Game saved successfully.', 'add');
        this.modal.dismiss(null, 'confirm');
      }
    } catch (error) {
      this.toastService.showToast(`Error saving game data to local storage: ${error}`, 'bug', true);
    }
  }

  isGameValid(game: Game): boolean {
    let isValid = true;

    game.frames.forEach((frame: any, index: number) => {
      let throws = frame.throws.map((t: { value: any }) => t.value);
      if (index < 9) {
        // For frames 1 to 9
        if(throws[0] === 10 && !isNaN(parseInt(throws[1]))){
         throws.splice(1,1)
         frame.throws.splice(1,1)
        }        console.log(throws)

        const frameValid =
          (throws[0] === 10 && (isNaN(parseInt(throws[1]))||  throws[1] === 0 )) ||
          (throws[0] !== 10 &&
            throws.reduce((acc: any, curr: any) => acc + curr, 0) <= 10 &&
            throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10));
        if (!frameValid) {
          isValid = false;
          frame.isInvalid = true;
        } else {
          frame.isInvalid = false;
        }
      } else {
        // For frame 10
        const frameValid =
          (throws[0] === 10 && throws.length === 3 && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10)) ||
          (throws.length === 2 && throws[0] + throws[1] < 10 && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10)) ||
          (throws.length === 3 &&
            throws[0] + throws[1] >= 10 &&
            throws[1] !== undefined &&
            throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10));
        if (!frameValid) {
          isValid = false;
          frame.isInvalid = true;
        } else {
          frame.isInvalid = false;
        }
      }
    });

    return isValid;
  }

  updateFrameScore(value: any, index: number): void {
    this.gameData.frameScores[index] = value;
  }

  clearFrames(index?: number): void {
    if (index !== undefined && index >= 0 && index < this.trackGrids.length) {
      // Clear frames for the specified index
      this.trackGrids.toArray()[index].clearFrames();
    } else {
      // Clear frames for all components
      this.trackGrids.forEach((trackGrid: TrackGridComponent) => {
        trackGrid.clearFrames();
      });
    }
    this.toastService.showToast('Game reset successfully.', 'refresh-outline');
  }

  calculateScore(): void {
    let allGamesValid = true;

    this.trackGrids.forEach((trackGrid: TrackGridComponent) => {
      if (!trackGrid.isGameValid()) {
        allGamesValid = false;
        this.hapticService.vibrate(ImpactStyle.Heavy, 300);
        return;
      }
    });

    if (allGamesValid) {
      try {
        let perfectGame = false;
        this.trackGrids.forEach((trackGrid: TrackGridComponent) => {
          if (trackGrid.totalScore === 300) {
            perfectGame = true;
          }
          trackGrid.saveGameToLocalStorage();
        });
        if (perfectGame) {
          this.is300 = true;
          setTimeout(() => {
            this.is300 = false;
          }, 4000);
        }
        // if ((isPlatform('android') || isPlatform('ios')) && !isPlatform('mobileweb')) {
        //   await this.adService.showIntertistalAd();
        // }
        this.hapticService.vibrate(ImpactStyle.Medium, 200);
        this.toastService.showToast('Game saved successfully.', 'add');
      } catch (error) {
        this.toastService.showToast('Oops, something went wrong.', 'bug', true);
      }
    } else this.setAlertOpen();
  }

  setAlertOpen(): void {
    this.isAlertOpen = !this.isAlertOpen;
  }

  onMaxScoreChanged(maxScore: number, index: number): void {
    this.maxScores[index] = maxScore;
  }

  onTotalScoreChange(totalScore: number, index: number): void {
    this.totalScores[index] = totalScore;
  }

  getSeriesMaxScore(index: number): number {
    return this.bowlingService.getSeriesMaxScore(index, this.maxScores);
  }

  getSeriesCurrentScore(index: number): number {
    return this.bowlingService.getSeriesCurrentScore(index, this.totalScores);
  }

  async presentActionSheet(): Promise<void> {
    const buttons = [];
    this.hapticService.vibrate(ImpactStyle.Medium, 200);
    this.sheetOpen = true;
    if (!this.seriesMode[0]) {
      buttons.push({
        text: SeriesMode.Single,
        handler: () => {
          this.seriesMode[0] = true;
          this.seriesMode[1] = false;
          this.seriesMode[2] = false;
          this.selectedModeText = SeriesMode.Single;
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
          this.selectedModeText = SeriesMode.Series3;
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
          this.selectedModeText = SeriesMode.Series4;
        },
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Choose series mode',
      buttons: buttons,
    });

    actionSheet.onWillDismiss().then(() => {
      this.sheetOpen = false;
    });

    await actionSheet.present();
  }
}
