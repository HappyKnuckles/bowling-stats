import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
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
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Game } from 'src/app/models/game-model';
import { addIcons } from 'ionicons';
import { add, chevronDown, chevronUp, cameraOutline, documentTextOutline } from 'ionicons/icons';
import { NgIf, NgFor } from '@angular/common';
import { ImpactStyle } from '@capacitor/haptics';
import { TrackGridComponent } from 'src/app/components/track-grid/track-grid.component';
import { AdService } from 'src/app/services/ad/ad.service';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImageProcesserService } from 'src/app/services/image-processer/image-processer.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { GameDataTransformerService } from 'src/app/services/transform-game/transform-game-data.service';
import { UserService } from 'src/app/services/user/user.service';
import { defineCustomElements } from '@teamhive/lottie-player/loader';
import { Device } from '@capacitor/device';
import Swiper from 'swiper';
import { IonicSlides } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage/storage.service';
import { SeriesMode } from './seriesModeEnum';

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
    IonAlert,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonModal,
    IonButtons,
    IonInput,
    IonSegmentButton,
    IonSegment,
    NgIf,
    NgFor,
    TrackGridComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddGamePage implements OnInit {
  swiperModules = [IonicSlides];
  totalScores: number[] = new Array(8).fill(0);
  maxScores: number[] = new Array(8).fill(300);
  seriesMode: boolean[] = [true, false, false];
  seriesId: string = '';
  selectedMode: SeriesMode = SeriesMode.Single;
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
  @ViewChild('swiper')
  set swiper(swiperRef: ElementRef) {
    /**
     * This setTimeout waits for Ionic's async initialization to complete.
     * Otherwise, an outdated swiper reference will be used.
     */
    setTimeout(() => {
      this.swiperInstance = swiperRef?.nativeElement.swiper;
    }, 0);
  }
  private swiperInstance: Swiper | undefined;
  selectedSegment: string = 'Game 1';
  segments3: string[] = ['Game 1', 'Game 2', 'Game 3'];
  segments4: string[] = ['Game 1', 'Game 2', 'Game 3', 'Game 4'];
  constructor(
    private actionSheetCtrl: ActionSheetController,
    private imageProcessingService: ImageProcesserService,
    private alertController: AlertController,
    private toastService: ToastService,
    private bowlingService: BowlingCalculatorService,
    private storageService: StorageService,
    private transformGameService: GameDataTransformerService,
    private loadingService: LoadingService,
    private userService: UserService,
    private adService: AdService,
    private hapticService: HapticService
  ) {
    addIcons({ cameraOutline, chevronDown, chevronUp, documentTextOutline, add });
  }

  async ngOnInit(): Promise<void> {
    this.userService.getUsername().subscribe((username: string) => {
      this.username = username;
    });
    this.deviceId = (await Device.getId()).identifier;
  }

  async handleImageUpload(): Promise<void> {
    if (!this.allowedDeviceIds.includes(this.deviceId)) {
      this.toastService.showToast('You are not allowed to use this feature yet.', 'bug', true);
      return;
    }
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
        this.storageService.saveGameToLocalStorage(this.gameData);
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
      const throws = frame.throws.map((t: { value: any }) => t.value);
      if (index < 9) {
        // For frames 1 to 9
        const frameValid =
          (throws[0] === 10 && isNaN(parseInt(throws[1]))) ||
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

    const isSeries = this.seriesMode.some((mode, i) => mode && i !== 0);
    if (isSeries) {
      this.seriesId = this.generateUniqueSeriesId();
    }

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
          trackGrid.saveGameToLocalStorage(isSeries, this.seriesId);
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

  onSegmentChanged(event: any) {
    if (this.swiperInstance) {
      this.selectedSegment = event.detail.value;
      const activeIndex = this.getSlideIndex(this.selectedSegment);
      this.swiperInstance.slideTo(activeIndex);
    }
  }

  onSlideChanged() {
    if (this.swiperInstance) {
      const activeIndex = this.swiperInstance.realIndex;
      this.selectedSegment = this.getSegmentValue(activeIndex);
    }
  }

  private getSlideIndex(segment: string): number {
    let index = 0;
    if (this.selectedMode === SeriesMode.Series3) {
      index = this.segments3.indexOf(segment);
    } else index = this.segments4.indexOf(segment);
    return index !== -1 ? index : 0;
  }

  private getSegmentValue(index: number): string {
    if (this.selectedMode === SeriesMode.Series3) {
      return this.segments3[index] || 'Game 1';
    } else return this.segments4[index] || 'Game 1';
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
          this.selectedMode = SeriesMode.Single;
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
          this.selectedMode = SeriesMode.Series3;
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
          this.selectedMode = SeriesMode.Series4;
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
      this.swiperInstance?.slideTo(0);
      this.sheetOpen = false;
    });

    await actionSheet.present();
  }

  private showAdAlert(): Promise<boolean> {
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

  private parseBowlingScores(input: string): void {
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

      this.gameData = this.transformGameService.transformGameData(frames, frameScores, totalScore, false);

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

  private async openFileInput(): Promise<File | undefined> {
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

  private async takeOrChoosePicture(): Promise<File | Blob | undefined> {
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

  private async showPermissionDeniedAlert(): Promise<void> {
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

  private generateUniqueSeriesId(): string {
    return 'series-' + Math.random().toString(36).substring(2, 15);
  }
}
