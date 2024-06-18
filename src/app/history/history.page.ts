import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, isPlatform } from '@ionic/angular';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { ToastService } from '../services/toast/toast.service';
import { GameHistoryService } from '../services/game-history/game-history.service';
import { SaveGameDataService } from '../services/save-game/save-game.service';
import { Subscription } from 'rxjs';
import { GameDataTransformerService } from '../services/transform-game/transform-game-data.service';
import { LoadingService } from '../services/loader/loading.service';
import * as ExcelJS from 'exceljs';
import { readFile } from 'fs/promises';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
})
export class HistoryPage implements OnInit, OnDestroy {
  gameHistory: any = [];
  isLoading: boolean = false;
  arrayBuffer: any;
  file!: File;
  newDataAddedSubscription!: Subscription;
  dataDeletedSubscription!: Subscription;

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private gameHistoryService: GameHistoryService,
    private saveService: SaveGameDataService,
    private loadingService: LoadingService
  ) {}

  async loadGameHistory() {
    this.loadingService.setLoading(true);
    try {
      this.gameHistory = await this.gameHistoryService.loadGameHistory();
    } catch (error) {
      this.toastService.showToast(
        `Fehler beim Historie laden ${error}`,
        'bug-outline',
        true
      );
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async deleteGame(gameId: string) {
    console.log(gameId);
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this game?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {},
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

  deleteAll() {
    localStorage.clear();
    window.dispatchEvent(new Event('dataDeleted'));
  }

  async ngOnInit() {
    this.isLoading = true;
    await this.loadGameHistory();
    this.subscribeToDataEvents();
    this.isLoading = false;
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

  ngOnDestroy() {
    this.newDataAddedSubscription.unsubscribe();
    this.dataDeletedSubscription.unsubscribe();
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.loadGameHistory();
      event.target.complete();
    }, 100);
  }

  openExcelFileInput() {
    const fileInput = document.getElementById('excelUpload');
    if (fileInput) {
      fileInput.click();
    }
  }

  async exportToExcel() {
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
    this.isLoading = true;
    let suffix = '';
    let fileName = `game_data_${formattedDate}`;
    let i = 1;

    while (await this.fileExists(fileName + suffix)) {
      suffix = `(${i++})`;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    await this.saveExcelFile(buffer, `${fileName + suffix}.xlsx`);
    this.isLoading = false;
  }

  private getGameDataForExport(): any[] {
    const gameData: any[] = [];

    // Add header row
    const headerRow = ['Game', 'Date'];
    for (let i = 1; i <= 10; i++) {
      headerRow.push(`Frame ${i}`);
    }
    headerRow.push('Total Score');
    headerRow.push('FrameScores');
    gameData.push(headerRow);

    // Iterate through game history and format data for export
    this.gameHistory.forEach((game: any) => {
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

      if (isPlatform('desktop')) {
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

  async handleFileUpload(event: any) {
    try {
      this.file = event.target.files[0];
      this.isLoading = true;
      await this.readExcelData();
      this.toastService.showToast(
        'Excel Datei wurde hochgeladen!',
        'checkmark-outline'
      );
      event.target.value = '';
    } catch (error) {
      this.toastService.showToast(`Error: ${error}`, 'bug', true);
    } finally {
      this.isLoading = false;
    }
  }

  async readExcelData() {
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
    this.transformData(gameData);
  }

  fileToBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (event: any) => resolve(event.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  transformData(data: any[]) {
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

      const game = {
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

  async showPermissionDeniedAlert() {
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
