import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { TrackGridComponent } from '../components/track-grid/track-grid.component';
import { ActionSheetController, AlertController, IonModal, isPlatform, IonHeader, IonToolbar, IonButton, IonIcon, IonTitle, IonAlert, IonContent, IonGrid, IonRow, IonCol, IonButtons, IonInput } from '@ionic/angular/standalone';
import { ImageProcesserService } from '../services/image-processer/image-processer.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ToastService } from '../services/toast/toast.service';
import { SeriesMode } from './seriesModeEnum';
import { BowlingCalculatorService } from '../services/bowling-calculator/bowling-calculator.service';
import { GameDataTransformerService } from '../services/transform-game/transform-game-data.service';
import { SaveGameDataService } from '../services/save-game/save-game.service';
import { LoadingService } from '../services/loader/loading.service';
import { UserService } from '../services/user/user.service';
import { Game } from '../models/game-model';
import { addIcons } from "ionicons";
import { add, chevronDown, chevronUp } from "ionicons/icons";
import { NgIf, NgFor } from '@angular/common';
import { AdService } from '../services/ad/ad.service';
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
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddGamePage implements OnInit {
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
    username = "";
    gameData!: Game;

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
        private adService: AdService
    ) {
        addIcons({ add, chevronDown, chevronUp });
    }

    async ngOnInit(): Promise<void> {
        this.userService.getUsername().subscribe((username: string) => {
            this.username = username;
        });
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
                    }
                }
            ]
        });
        await alert.present();
    }

    async handleImageUpload(): Promise<void> {
        try {
            await this.adService.showRewardedAd();
            const imageUrl: File | Blob | undefined = await this.takeOrChoosePicture();
            if (imageUrl instanceof File) {
                this.loadingService.setLoading(true);
                const gameText = await this.imageProcessingService.performOCR(imageUrl);
                this.parseBowlingScores(gameText!);
            } else {
                this.toastService.showToast("No image uploaded.", "bug", true);
            }
        } catch (error) {
            if ((error as Error).message === 'Ad not watched') {
                this.toastService.showToast("You need to watch the ad to upload an image.", "bug", true);
            } else {
                this.toastService.showToast(`Error uploading image: ${error}`, "bug", true);
            }
        } finally {
            this.loadingService.setLoading(false);
        }
    }

    parseBowlingScores(input: string): void {
        try {
            const lines = input.split('\n').filter(line => line.trim() !== '');

            const userIndex = lines.findIndex(line => line.toLowerCase().includes(this.username!.toLowerCase()));

            const linesAfterUsername = userIndex >= 0 ? lines.slice(userIndex + 1) : [];

            const nextNonXLineIndex = linesAfterUsername.findIndex(line => /^[a-wyz]/i.test(line));

            const relevantLines = nextNonXLineIndex >= 0 ? linesAfterUsername.slice(0, nextNonXLineIndex) : linesAfterUsername;

            if (relevantLines.length < 2) {
                throw new Error(`Insufficient score data for user ${this.username}`);
            }

            let throwValues = relevantLines[0].split('');
            let frameScores;

            if (throwValues.length < 12) {
                throwValues = throwValues.concat(relevantLines[1].split(''));
                frameScores = relevantLines.slice(2).map(line => line.split(' ').map(Number));
            } else {
                frameScores = relevantLines.slice(1).map(line => line.split(' ').map(Number));
            }

            // Scores können doppelt vorkommen, endScore immer zweimal (erscheinen der höchsten Zahl immer unm 1 reduzieren)
            frameScores = frameScores.flat().sort((a, b) => a - b);

            if (frameScores[9] === frameScores[10]) {
                frameScores.splice(frameScores.length - 1, 1);
            }

            throwValues = throwValues.filter(value => value.trim() !== '');
            let prevValue: number | undefined;

            throwValues = throwValues.map(value => {
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
                this.toastService.showToast('Invalid input.', 'bug', true);
                return;
            }
            else {
                this.saveGameService.saveGameToLocalStorage(this.gameData);
                this.toastService.showToast("Game saved successfully.", "add");
                this.modal.dismiss(null, 'confirm');
            }
        } catch (error) {
            this.toastService.showToast(`Error saving game data to local storage: ${error}`, 'bug', true);
        }
    }

    isGameValid(game: Game): boolean {
        const allInputsValid = game.frames.every((frame: any, index: number) => {
            const throws = frame.throws.map((t: { value: any; }) => t.value);
            if (index < 9) {
                // For frames 1 to 9: Check if there are either 2 throws (unless it's a strike) or 1 throw (for strike)
                return (throws[0] === 10 && throws.length === 1) ||
                    (throws.length === 2 && throws.reduce((acc: any, curr: any) => acc + curr, 0) <= 10 && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10));
            } else {
                // For frame 10: Check if there are either 3 throws (if there's a strike or spare in the first two throws),
                // or 2 throws (if there's no strike or spare in the first two throws)
                return (throws[0] === 10 && throws.length === 3 && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10)) ||
                    (throws.length === 2 && throws[0] + throws[1] < 10 && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10)) ||
                    (throws.length === 3 && throws[0] + throws[1] >= 10 && throws[1] !== undefined && throws.every((throwValue: number) => throwValue >= 0 && throwValue <= 10));
            }
        });
        return allInputsValid;
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

    async calculateScore(): Promise<void> {
        let allGamesValid = true;

        this.trackGrids.forEach((trackGrid: TrackGridComponent) => {
            if (!trackGrid.isGameValid()) {
                allGamesValid = false;
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
                }
                if (isPlatform('android') || isPlatform('ios')) {
                    await this.adService.showIntertistalAd();
                }
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
