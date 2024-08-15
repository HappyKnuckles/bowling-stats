import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, isPlatform, IonHeader, IonToolbar, IonButton, IonIcon, IonTitle, IonBadge, IonContent, IonRefresher, IonText, IonGrid, IonRow, IonCol, IonInput } from '@ionic/angular/standalone';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { ToastService } from '../services/toast/toast.service';
import { GameHistoryService } from '../services/game-history/game-history.service';
import { SaveGameDataService } from '../services/save-game/save-game.service';
import { Subscription } from 'rxjs';
import { LoadingService } from '../services/loader/loading.service';
import * as ExcelJS from 'exceljs';
import { Game } from '../models/game-model';
import { addIcons } from "ionicons";
import { cloudUploadOutline, cloudDownloadOutline, trashOutline } from "ionicons/icons";
import { NgIf, NgFor } from '@angular/common';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';

@Component({
    selector: 'app-history',
    templateUrl: 'history.page.html',
    styleUrls: ['history.page.scss'],
    standalone: true,
    imports: [
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
    ],
})
export class HistoryPage implements OnInit, OnDestroy {
    gameHistory: Game[] = [];
    arrayBuffer: any;
    file!: File;
    newDataAddedSubscription!: Subscription;
    dataDeletedSubscription!: Subscription;
    private loadingSubscription: Subscription;
    isLoading: boolean = false;

    constructor(
        private alertController: AlertController,
        private toastService: ToastService,
        private gameHistoryService: GameHistoryService,
        private saveService: SaveGameDataService,
        private loadingService: LoadingService
    ) {
        this.loadingSubscription = this.loadingService.isLoading$.subscribe(isLoading => {
            this.isLoading = isLoading;
        });
        addIcons({ cloudUploadOutline, cloudDownloadOutline, trashOutline });
    }

    async loadGameHistory(): Promise<void> {
        try {
            this.gameHistory = await this.gameHistoryService.loadGameHistory();
        } catch (error) {
            this.toastService.showToast(
                `Fehler beim Historie laden ${error}`,
                'bug-outline',
                true
            );
        }
    }

    async deleteGame(gameId: string): Promise<void> {
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
                        this.toastService.showToast(
                            'Spiel wurde gelöscht!',
                            'checkmark-outline'
                        );
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

    async ngOnInit(): Promise<void> {
        try {
            this.loadingService.setLoading(true); await this.loadGameHistory();
            this.subscribeToDataEvents();
        } catch (error) {
            console.log(error);
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
            this.loadingService.setLoading(true);
            setTimeout(async () => {
                await this.loadGameHistory();
                event.target.complete();
            }, 100);
        } catch (error) {
            console.log(error);
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

                this.toastService.showToast(
                    `File saved successfully`,
                    'checkmark-outline'
                );
            } else {
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: dataUri,
                    directory: Directory.Documents,
                    recursive: true,
                });
                this.toastService.showToast(
                    `File saved at path: ${savedFile.uri}`,
                    'checkmark-outline'
                );
            }
        } catch (error) {
            this.toastService.showToast(`${error}`, 'bug', true);
        }
    }

    async handleFileUpload(event: any): Promise<void> {
        try {
            this.loadingService.setLoading(true);
            this.file = event.target.files[0];
            await this.readExcelData();
            this.toastService.showToast(
                'Excel Datei wurde hochgeladen!',
                'checkmark-outline'
            );
            event.target.value = '';
        } catch (error) {
            this.toastService.showToast(`Error: ${error}`, 'bug', true);
        } finally {
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
