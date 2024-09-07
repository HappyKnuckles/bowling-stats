import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertController, isPlatform, IonHeader, IonToolbar, IonButton, IonIcon, IonTitle, IonBadge, IonContent, IonRefresher, IonText, IonGrid, IonRow, IonCol, IonInput, IonItemSliding, IonItem, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { debounceTime, Subject, Subscription } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { addIcons } from "ionicons";
import { cloudUploadOutline, cloudDownloadOutline, trashOutline, createOutline, shareOutline } from "ionicons/icons";
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import { Share } from '@capacitor/share';
import { FormsModule } from '@angular/forms';
import { toPng } from 'html-to-image';
import { ImpactStyle } from '@capacitor/haptics';
import { GameHistoryService } from 'src/app/services/game-history/game-history.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { SaveGameDataService } from 'src/app/services/save-game/save-game.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Game } from 'src/app/models/game-model';

@Component({
    selector: 'app-history',
    templateUrl: 'history.page.html',
    styleUrls: ['history.page.scss'],
    standalone: true,
    providers: [DatePipe],
    imports: [IonItemOption, IonItemOptions, IonItem, IonItemSliding,
        IonHeader,
        IonToolbar,
        IonButton,
        IonIcon,
        IonTitle,
        IonBadge,
        IonContent,
        IonRefresher,
        NgIf,
        IonText,
        NgFor,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatExpansionPanelDescription,
        IonGrid,
        IonRow,
        IonCol,
        IonInput,
        FormsModule
    ],
})
export class HistoryPage implements OnInit, OnDestroy {
    @ViewChild('expansionPanel') expansionPanel!: MatExpansionPanel;
    gameHistory: Game[] = [];
    arrayBuffer: any;
    file!: File;
    newDataAddedSubscription!: Subscription;
    dataDeletedSubscription!: Subscription;
    private loadingSubscription: Subscription;
    isLoading: boolean = false;
    isEditMode: { [key: string]: boolean } = {};
    private originalGameState: { [key: string]: Game } = {};
    private throwChangeSubject: Subject<{ gameIndex: number, event: any, frameIndex: number, inputIndex: number }> = new Subject();

    constructor(
        private alertController: AlertController,
        private toastService: ToastService,
        private gameHistoryService: GameHistoryService,
        private saveService: SaveGameDataService,
        private loadingService: LoadingService,
        private datePipe: DatePipe,
        private hapticService: HapticService
    ) {
        this.loadingSubscription = this.loadingService.isLoading$.subscribe(isLoading => {
            this.isLoading = isLoading;
        });
        addIcons({ cloudUploadOutline, cloudDownloadOutline, trashOutline, createOutline, shareOutline });
    }

    parseIntValue(value: any): any {
        const parsedValue = parseInt(value, 10);
        return isNaN(parsedValue) ? '' : parsedValue;
    }

    async loadGameHistory(): Promise<void> {
        try {
            this.gameHistory = await this.gameHistoryService.loadGameHistory();
        } catch (error) {
            this.toastService.showToast(
                `Error loading history! ${error}`,
                'bug',
                true
            );
        }
    }

    saveOriginalStateAndEnableEdit(game: Game, expansionPanel?: MatExpansionPanel) {
        this.originalGameState[game.gameId] = JSON.parse(JSON.stringify(game));
        this.enableEdit(game, expansionPanel);
    }

    enableEdit(game: Game, expansionPanel?: MatExpansionPanel): void {
        this.isEditMode[game.gameId] = !this.isEditMode[game.gameId];
        this.hapticService.vibrate(ImpactStyle.Light, 100);
        if (expansionPanel) {
            this.openExpansionPanel(expansionPanel);
        }
    }

    async openExpansionPanel(expansionPanel: MatExpansionPanel): Promise<void> {
        expansionPanel.open();
    }

    cancelEdit(game: Game): void {
        // Revert to the original game state
        if (this.originalGameState[game.gameId]) {
            Object.assign(game, this.originalGameState[game.gameId]);
            delete this.originalGameState[game.gameId];
        }
        this.enableEdit(game);
    }

    async saveEdit(game: Game): Promise<void> {
        try {
            if (!this.isGameValid(game)) {
                this.hapticService.vibrate(ImpactStyle.Heavy, 300);
                this.toastService.showToast('Invalid input.', 'bug', true);
                return;
            }
            else {
                await this.saveService.saveGameToLocalStorage(game);
                this.toastService.showToast("Game edit saved sucessfully!", "refresh-outline");
                this.enableEdit(game);
            }
        } catch (error) {
            this.toastService.showToast(`Error saving game to localstorage: ${error}`, 'bug', true);
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

    async takeScreenshotAndShare(game: Game, expansionPanel: MatExpansionPanel): Promise<void> {
        const panelContent = expansionPanel._body.nativeElement;
        const scoreTemplate = panelContent.querySelector('.grid-container') as HTMLElement;

        if (!scoreTemplate) {
            throw new Error('Score template not found in the expansion panel');
        }

        // Save panel state
        const originalVisibility = panelContent.style.visibility;
        const originalWidth = panelContent.style.width;

        // Temporarily show the panel content
        panelContent.style.visibility = 'visible';
        panelContent.style.width = '700px';

        const formattedDate = this.datePipe.transform(game.date, 'dd.MM.yy');

        let message = `Check out this game from ${formattedDate}`;
        if (game.totalScore === 300) {
            message = `Look at me bitches, perfect game on ${formattedDate}! 🎳🎉.`;
        }

        try {
            this.loadingService.setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Generate screenshot
            const dataUrl = await toPng(scoreTemplate, { quality: 0.7 });
            const base64Data = dataUrl.split(',')[1];

            if (navigator.share && navigator.canShare({ files: [new File([], '')] })) {
                // Web Share API is supported
                const blob = await (await fetch(dataUrl)).blob();
                const filesArray = [
                    new File([blob], `score_${game.gameId}.png`, {
                        type: blob.type,
                    }),
                ];


                await navigator.share({
                    title: 'Game Score',
                    text: message,
                    files: filesArray,
                });
            } else {
                // Fallback for native mobile platforms
                const fileName = `score_${game.gameId}.png`;

                await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8
                });

                const fileUri = await Filesystem.getUri({
                    directory: Directory.Cache,
                    path: fileName
                });

                await Share.share({
                    title: 'Game Score',
                    text: message,
                    url: fileUri.uri,
                    dialogTitle: 'Share Game Score'
                });
                this.toastService.showToast('Screenshot shared successfully.', 'share-social-outline');
            }
        } catch (error) {
            console.error('Error taking screenshot and sharing', error);
            this.toastService.showToast('Error sharing screenshot', 'bug', true);
        } finally {
            // Restore the original state
            panelContent.style.visibility = originalVisibility;
            panelContent.style.width = originalWidth;
            this.loadingService.setLoading(false);
        }
    }

    async deleteGame(gameId: string): Promise<void> {
        this.hapticService.vibrate(ImpactStyle.Heavy, 300);
        const alert = await this.alertController.create({
            header: 'Confirm Deletion',
            message: 'Are you sure you want to delete this game?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => { },
                },
                {
                    text: 'Delete',
                    handler: () => {
                        const key = 'game' + gameId;
                        this.saveService.deleteGame(key);
                        this.toastService.showToast('Game deleted sucessfully.', 'checkmark-outline');
                    },
                },
            ],
        });

        await alert.present();
    }

    deleteAll(): void {
        this.saveService.deleteAllData();
        window.dispatchEvent(new Event('dataDeleted'));
    }

    onThrowChangeDebounced(gameIndex: number, event: any, frameIndex: number, inputIndex: number) {
        this.throwChangeSubject.next({ gameIndex, event, frameIndex, inputIndex });
    }

    async ngOnInit(): Promise<void> {
        this.throwChangeSubject.pipe(
            debounceTime(300) // Adjust the debounce time as needed
        ).subscribe(({ gameIndex, event, frameIndex, inputIndex }) => {
            this.onThrowChange(gameIndex, event, frameIndex, inputIndex);
        });
        try {
            this.loadingService.setLoading(true);
            await this.loadGameHistory();
            this.subscribeToDataEvents();
        } catch (error) {
            console.error(error);
        } finally {
            this.loadingService.setLoading(false);
        }
    }

    private subscribeToDataEvents() {
        this.newDataAddedSubscription = this.saveService.newDataAdded.subscribe(
            async () => {
                await this.loadGameHistory();
            }
        );

        this.dataDeletedSubscription = this.saveService.dataDeleted.subscribe(
            async () => {
                await this.loadGameHistory();
            }
        );
    }

    ngOnDestroy(): void {
        this.newDataAddedSubscription.unsubscribe();
        this.dataDeletedSubscription.unsubscribe();
        this.loadingSubscription.unsubscribe();
    }

    handleRefresh(event: any): void {
        try {
            this.hapticService.vibrate(ImpactStyle.Medium, 200);
            this.loadingService.setLoading(true);
            setTimeout(async () => {
                await this.loadGameHistory();
                event.target.complete();
            }, 100);
        } catch (error) {
            console.error(error);
        } finally {
            this.loadingService.setLoading(false);
        }
    }

    openExcelFileInput(): void {
        const fileInput = document.getElementById('excelUpload');
        if (fileInput) {
            fileInput.click();
        }
    }

    async exportToExcel(): Promise<void> {
        const gameData = this.getGameDataForExport();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Game History');

        worksheet.columns = Object.keys(gameData[0]).map((key) => ({
            header: key,
            key,
        }));
        worksheet.addRows(gameData);

        const date = new Date();
        const formattedDate = date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        const isIos = isPlatform('ios');
        const permissionsGranted = isIos
            ? (await Filesystem.requestPermissions()).publicStorage === 'granted'
            : true;

        if (isIos && !permissionsGranted) {
            const permissionRequestResult = await Filesystem.requestPermissions();
            if (!permissionRequestResult) {
                return this.showPermissionDeniedAlert();
            }
        }

        // If running on an Android device, save the file without asking for permissions
        this.loadingService.setLoading(true);
        let suffix = '';
        let fileName = `game_data_${formattedDate}`;
        let i = 1;

        const existingFiles = JSON.parse(localStorage.getItem('savedFilenames') || '[]');

        if (isPlatform('mobileweb')) {
            while (existingFiles.includes(fileName + suffix + '.xlsx')) {
                suffix = `(${i++})`;
            }
        } else {
            while (await this.fileExists(fileName + suffix)) {
                suffix = `(${i++})`;
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        await this.saveExcelFile(buffer, `${fileName + suffix}.xlsx`);

        if (isPlatform('mobileweb')) {
            existingFiles.push(`${fileName + suffix}.xlsx`);
            localStorage.setItem('savedFilenames', JSON.stringify(existingFiles));
        }
        this.loadingService.setLoading(false)
    }

    async fileExists(path: string): Promise<boolean> {
        try {
            await Filesystem.stat({
                path: path + '.xlsx',
                directory: Directory.Documents,
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    private isValidNumber0to10(value: number): boolean {
        return !isNaN(value) && value >= 0 && value <= 10;
    }

    private isValidFrameScore(gameIndex: number, inputValue: number, frameIndex: number, inputIndex: number): boolean {
        const firstThrow = this.gameHistory[gameIndex].frames[frameIndex].throws[0]?.value || 0;
        const secondThrow = inputIndex === 1 ? inputValue : this.gameHistory[gameIndex].frames[frameIndex].throws[1]?.value || 0;
        return firstThrow + secondThrow <= 10;
    }
    previousValues: { [key: string]: number } = {};

    onThrowChange(gameIndex: number, event: any, frameIndex: number, inputIndex: number) {
        const inputValue = parseInt(event.target.value, 10);
    
        // Generate a unique key for each input field to track the previous value
        const key = `${gameIndex}-${frameIndex}-${inputIndex}`;
    
        // Store the previous value before making any changes
        if (!this.previousValues[key]) {
            this.previousValues[key] = this.gameHistory[gameIndex].frames[frameIndex].throws[inputIndex]?.value || 0;
        }
    
        // Validate the input value
        if (!this.isValidNumber0to10(inputValue)) {
            this.handleInvalidInput(event, key);
            return;
        }
    
        if (!this.isValidFrameScore(gameIndex, inputValue, frameIndex, inputIndex)) {
            this.handleInvalidInput(event, key);
            return;
        }
    
        // Update the value after validation
        this.gameHistory[gameIndex].frames[frameIndex].throws[inputIndex] = { value: inputValue };
    
        // Update the previous value after a successful input
        this.previousValues[key] = inputValue;
    }
    
    private handleInvalidInput(event: any, key: string): void {
        this.hapticService.vibrate(ImpactStyle.Heavy, 300);
    
        // Revert to the previous value if there's an error
        event.target.value = this.previousValues[key] !== undefined ? this.previousValues[key] : '';
    
        // Optionally, show an error message or take other actions
        console.log(`Invalid input, reverting to previous value: ${this.previousValues[key]}`);
    }

    private getGameDataForExport(): String[][] {
        const gameData: string[][] = [];

        // Add header row
        const headerRow = ['Game', 'Date'];
        for (let i = 1; i <= 10; i++) {
            headerRow.push(`Frame ${i}`);
        }
        headerRow.push('Total Score');
        headerRow.push('FrameScores');
        gameData.push(headerRow);

        // Iterate through game history and format data for export
        this.gameHistory.forEach((game: Game) => {
            const gameId = game.gameId;
            const gameDate = game.date;

            const rowData: any[] = [gameId, gameDate];
            const frames = game.frames;
            frames.forEach((frame: any) => {
                const throws = frame.throws.map((throwData: any) => throwData.value);
                const firstThrow = throws.length > 0 ? throws[0] : '';
                const secondThrow = throws.length > 1 ? throws[1] : '';
                const thirdThrow = throws.length > 2 ? throws[2] : '';

                if (throws.length === 1) {
                    rowData.push(`${firstThrow}`);
                }
                if (throws.length === 2) {
                    rowData.push(`${firstThrow} / ${secondThrow}`);
                }
                if (throws.length === 3) {
                    rowData.push(`${firstThrow} / ${secondThrow} / ${thirdThrow}`);
                }
            });

            // Pad missing frames with empty values
            const numFrames = frames.length;
            for (let i = numFrames; i < 10; i++) {
                rowData.push('', '');
            }

            rowData.push(game.totalScore);
            rowData.push(game.frameScores.join(', '));
            gameData.push(rowData);
        });

        return gameData;
    }

    async saveExcelFile(buffer: any, fileName: string): Promise<void> {
        try {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const length = bytes.byteLength;

            for (let i = 0; i < length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }

            const base64Data = btoa(binary);
            const dataUri =
                'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' +
                base64Data;

            if (isPlatform('desktop') || isPlatform('mobileweb')) {
                const anchor = document.createElement('a');
                anchor.href = dataUri;
                anchor.download = fileName;

                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);

                this.toastService.showToast(`File saved sucessfully.`, 'checkmark-outline');
            } else {
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: dataUri,
                    directory: Directory.Documents,
                    recursive: true,
                });
                this.toastService.showToast(`File saved at path: ${savedFile.uri}`, 'checkmark-outline');
            }
            this.hapticService.vibrate(ImpactStyle.Light, 100);
        } catch (error) {
            this.toastService.showToast(`${error}`, 'bug', true);
        }
    }

    async handleFileUpload(event: any): Promise<void> {
        try {
            this.loadingService.setLoading(true);
            this.file = event.target.files[0];
            await this.readExcelData();
            this.toastService.showToast('Uploaded Excel file successfully.', 'checkmark-outline');
        } catch (error) {
            this.toastService.showToast(`Error: ${error}`, 'bug', true);
        } finally {
            event.target.value = '';
            this.loadingService.setLoading(false);
        }
    }

    async readExcelData(): Promise<void> {
        let workbook = new ExcelJS.Workbook();
        let buffer = await this.fileToBuffer(this.file);
        await workbook.xlsx.load(buffer);
        let worksheet = workbook.worksheets[0];
        let gameData: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
            let rowData: { [key: string]: any } = {};
            row.eachCell((cell, colNumber) => {
                rowData[worksheet.getRow(1).getCell(colNumber).value as string] =
                    cell.value;
            });
            if (rowNumber !== 1) gameData.push(rowData);
        });
        // TODO so umändern - Testen
        // let gameData: Game[] = [];
        // worksheet.eachRow((row, rowNumber) => {
        //   if (rowNumber !== 1) {
        //     let game: Game = {
        //       gameId: row.getCell(1).value as string,
        //       date: row.getCell(2).value as string,
        //       frames: this.parseFrames(row.getCell(3).value), // Assuming frames are in the 3rd column
        //       totalScore: parseInt(row.getCell(13).value as string),
        //       frameScores: (row.getCell(14).value as string)
        //         .split(', ')
        //         .map((score: string) => parseInt(score)),
        //     };
        //     gameData.push(game);
        //   }
        // });
        this.transformData(gameData);
    }

    // parseFrames(framesData: any): any {
    //   // Implement this function to parse frames data if necessary
    //   return framesData;
    // }

    fileToBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = (event: any) => resolve(event.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    transformData(data: any[]): void {
        const gameData = [];

        for (let i = 1; i < data.length; i++) {
            const frames = [];
            for (let j = 2; j <= 11; j++) {
                const frame = {
                    frameIndex: j,
                    throws: [] as { value: number; throwIndex: number }[],
                };

                const throwsData = data[i][j.toString()];
                if (typeof throwsData === 'string') {
                    if (throwsData.includes('/')) {
                        const throws = throwsData
                            .split(' / ')
                            .map((value) => parseInt(value));
                        for (let k = 0; k < throws.length; k++) {
                            frame.throws.push({ value: throws[k], throwIndex: k + 1 });
                        }
                    } else {
                        // Handle case when only one throw is present
                        frame.throws.push({ value: parseInt(throwsData), throwIndex: 1 });
                    }
                }
                frames.push(frame);
            }

            const game: Game = {
                gameId: data[i]['0'],
                date: data[i]['1'],
                frames: frames,
                totalScore: parseInt(data[i]['12']),
                frameScores: data[i]['13']
                    .split(', ')
                    .map((score: string) => parseInt(score)),
            };

            this.saveService.saveGameToLocalStorage(game);
            gameData.push(game);
        }
    }

    async showPermissionDeniedAlert(): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Permission Denied',
            message: 'To save to Gamedata.xlsx, you need to give permissions!',
            buttons: [
                {
                    text: 'OK',
                    handler: async () => {
                        const permissionRequestResult =
                            await Filesystem.requestPermissions();
                        if (permissionRequestResult.publicStorage === 'granted') {
                            this.exportToExcel();
                        }
                    },
                },
            ],
        });
        await alert.present();
    }
}
