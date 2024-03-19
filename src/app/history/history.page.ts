import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss']
})
export class HistoryPage implements OnInit, OnDestroy {
  gameHistory: any = [];
  isLoading: boolean = false;
  arrayBuffer: any;
  file!: File;
  isToastOpen: boolean = false;
  message?: string = "";

  constructor(private alertController: AlertController) {
  }

  async loadGameHistory() {
    this.isLoading = true;
    // Clear the current game history
    this.gameHistory = [];

    // Retrieve games from local storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('game')) {
        const gameDataString = localStorage.getItem(key);
        if (gameDataString) {
          const gameData = JSON.parse(gameDataString);
          this.gameHistory.push(gameData);
        }
      }
    }
    this.sortGameHistoryByDate();

    this.isLoading = false;
  }

  // Function to sort game history by date
  sortGameHistoryByDate(): void {
    this.gameHistory.sort((a: { date: number; }, b: { date: number; }) => {
      return a.date - b.date; // Sorting in descending order based on date
    });
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
          handler: () => {
            // Do nothing if canceled
          }
        },
        {
          text: 'Delete',
          handler: () => {
            const key = 'game' + gameId;
            localStorage.removeItem(key);
            window.dispatchEvent(new Event('dataDeleted'));
          }
        }
      ]
    });

    await alert.present();
  }

  deleteAll() {
    localStorage.clear();
    window.dispatchEvent(new Event('dataDeleted'));
  }

  setOpen(open: boolean, message?: string) {
    this.message = message;
    this.isToastOpen = open;
  }

  async ngOnInit() {
    await this.loadGameHistory();
    this.subscribeToDataEvents();
  }

  private subscribeToDataEvents() {
    window.addEventListener('newDataAdded', () => {
      this.loadGameHistory();
    });

    window.addEventListener('dataDeleted', () => {
      this.loadGameHistory();
    });
  }

  ngOnDestroy() {
    window.removeEventListener('newDataAdded', this.loadGameHistory);
    window.removeEventListener('dataDeleted', this.loadGameHistory);
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      this.loadGameHistory();
      event.target.complete();
    }, 100);
  }

  openFileInput() {
    const fileInput = document.getElementById('upload');
    if (fileInput) {
      fileInput.click();
    }
  }

  exportToExcel() {
    const gameData = this.getGameDataForExport();
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(gameData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveExcelFile(excelBuffer, 'game_data.xlsx');
    this.setOpen(true, 'Excel Datei wurde heruntegeladen!');
  }

  private getGameDataForExport(): any[] {
    const gameData: any[] = [];

    // Add header row
    const headerRow = ['Game', 'Date'];
    for (let i = 1; i <= 10; i++) {
      headerRow.push(`Frame ${i}`);
    }
    headerRow.push('Total Score');
    headerRow.push('FrameScores')
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

  private saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url: string = window.URL.createObjectURL(data);
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  }

  handleFileUpload(event: any) {
    this.file = event.target.files[0];
    this.readExcelData();
    this.setOpen(true, 'Excel Datei wurde hochgeladen!');
  }

  readExcelData() {
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
      const gameData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      this.transformData(gameData);
    }
    fileReader.readAsArrayBuffer(this.file);
  }

  transformData(data: any[]) {
    const gameData = [];

    for (let i = 1; i < data.length; i++) {
      const frames = [];
      for (let j = 2; j <= 11; j++) {
        const frame = {
          frameIndex: j,
          throws: [] as { value: number; throwIndex: number }[]
        };

        const throwsData = data[i][j.toString()];
        if (typeof throwsData === 'string') {
          if (throwsData.includes('/')) {
            const throws = throwsData.split(' / ').map(value => parseInt(value));
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
        date: data[i]['1'], // convert date to integer
        frames: frames,
        totalScore: parseInt(data[i]['12']),
        frameScores: data[i]['13'].split(", ").map((score: string) => parseInt(score))
      };

      const gameDataString = JSON.stringify(game);
      const key = 'game' + game.gameId;
      localStorage.setItem(key, gameDataString);
      gameData.push(game);
    }
    window.dispatchEvent(new Event('newDataAdded'));
  }
}
