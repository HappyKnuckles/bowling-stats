import { Component, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import {
  AlertController,
  isPlatform,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonTitle,
  IonBadge,
  IonContent,
  IonRefresher,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonItemSliding,
  IonItem,
  IonItemOptions,
  IonItemOption,
  IonTextarea,
  IonButtons,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonAccordionGroup,
  IonAccordion,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Subscription } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  cloudDownloadOutline,
  trashOutline,
  createOutline,
  shareOutline,
  documentTextOutline,
  filterOutline,
  medalOutline,
} from 'ionicons/icons';
import { NgIf, NgFor, DatePipe, NgClass } from '@angular/common';
import { Share } from '@capacitor/share';
import { toPng } from 'html-to-image';
import { ImpactStyle } from '@capacitor/haptics';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Game } from 'src/app/models/game-model';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { InfiniteScrollCustomEvent, ModalController } from '@ionic/angular';
import { FilterService } from 'src/app/services/filter/filter.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: true,
  providers: [DatePipe, ModalController],
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonButtons,
    IonTextarea,
    IonItemOption,
    IonItemOptions,
    IonItem,
    IonItemSliding,
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonTitle,
    IonBadge,
    IonContent,
    IonRefresher,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    NgIf,
    NgFor,
    NgClass,
    IonText,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class HistoryPage implements OnInit, OnDestroy {
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  gameHistory: Game[] = [];
  filteredGameHistory: Game[] = [];
  gameLength: Game[] = [];
  leagues: string[] = [];
  filterGameLength: number = 0;
  arrayBuffer: any;
  file!: File;
  private gameAddedSubscription!: Subscription;
  private gameDeletedSubscription!: Subscription;
  private filteredGamesSubscription!: Subscription;
  private loadingSubscription: Subscription;
  private newLeagueSubscription!: Subscription;

  isLoading: boolean = false;
  isEditMode: { [key: string]: boolean } = {};
  private originalGameState: { [key: string]: Game } = {};
  activeFilterCount = this.filterService.activeFilterCount;

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private storageService: StorageService,
    private loadingService: LoadingService,
    private datePipe: DatePipe,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    private filterService: FilterService,
    private renderer: Renderer2
  ) {
    this.loadingSubscription = this.loadingService.isLoading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });

    addIcons({
      cloudUploadOutline,
      cloudDownloadOutline,
      filterOutline,
      trashOutline,
      createOutline,
      shareOutline,
      documentTextOutline,
      medalOutline,
    });
  }
  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
      await this.getLeagues();
      this.subscribeToDataEvents();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingService.setLoading(false);
    }
  }
  async getLeagues() {
    this.leagues = await this.storageService.loadLeagues();
  }

  async openFilterModal() {
    // TODO Think if using it like this so highlighted dates are only that match the current filter or not
    const modal = await this.modalCtrl.create({
      component: FilterComponent,
      componentProps: {
        games: this.gameHistory,
        filteredGames: this.filteredGameHistory,
      },
    });

    return await modal.present();
  }

  ngOnDestroy(): void {
    this.gameAddedSubscription.unsubscribe();
    this.gameDeletedSubscription.unsubscribe();
    this.newLeagueSubscription.unsubscribe();
    this.loadingSubscription.unsubscribe();
    this.filteredGamesSubscription.unsubscribe();
  }

  parseIntValue(value: any): any {
    const parsedValue = parseInt(value, 10);
    return isNaN(parsedValue) ? '' : parsedValue;
  }

  saveOriginalStateAndEnableEdit(game: Game) {
    this.originalGameState[game.gameId] = JSON.parse(JSON.stringify(game));
    this.enableEdit(game, game.gameId);
  }

  enableEdit(game: Game, accordionId?: string): void {
    this.isEditMode[game.gameId] = !this.isEditMode[game.gameId];
    this.hapticService.vibrate(ImpactStyle.Light, 100);

    if (accordionId) {
      this.openExpansionPanel(accordionId);
    }
  }

  openExpansionPanel(accordionId: string): void {
    const nativeEl = this.accordionGroup;

    if (nativeEl.value === accordionId) {
      nativeEl.value = undefined;
    } else nativeEl.value = accordionId;
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
      } else {
        if (game.league === undefined || game.league === '') {
          game.isPractice = true;
        } else game.isPractice = false;

        await this.storageService.saveGameToLocalStorage(game, true);
        this.toastService.showToast('Game edit saved sucessfully!', 'refresh-outline');
        this.enableEdit(game);
      }
    } catch (error) {
      this.toastService.showToast(`Error saving game to localstorage: ${error}`, 'bug', true);
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

  async takeScreenshotAndShare(game: Game): Promise<void> {
    const accordion = document.getElementById(game.gameId);
    if (!accordion) {
      throw new Error('Accordion not found');
    }

    const scoreTemplate = accordion.querySelector('.grid-container') as HTMLElement;

    if (!scoreTemplate) {
      throw new Error('Score template not found in the accordion');
    }

    const accordionGroupEl = this.accordionGroup;
    const accordionGroupValues = this.accordionGroup.value;
    const accordionIsOpen = accordionGroupEl.value?.includes(game.gameId) ?? false;

    if (!accordionIsOpen) {
      this.openExpansionPanel(game.gameId);
    }
    const childNode = accordion.childNodes[1] as HTMLElement;

    const originalWidth = childNode.style.width;

    try {
      this.loadingService.setLoading(true);

      // Temporarily show the panel content
      this.renderer.setStyle(childNode, 'width', '700px');

      const formattedDate = this.datePipe.transform(game.date, 'dd.MM.yy');

      const message =
        game.totalScore === 300 ? `Look at me bitches, perfect game on ${formattedDate}! 🎳🎉.` : `Check out this game from ${formattedDate}`;

      await new Promise((resolve) => setTimeout(resolve, 100)); // Give time for layout to update

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
          encoding: Encoding.UTF8,
        });

        const fileUri = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName,
        });

        await Share.share({
          title: 'Game Score',
          text: message,
          url: fileUri.uri,
          dialogTitle: 'Share Game Score',
        });
        this.toastService.showToast('Screenshot shared successfully.', 'share-social-outline');
      }
    } catch (error) {
      console.error('Error taking screenshot and sharing', error);
      this.toastService.showToast('Error sharing screenshot!', 'bug', true);
    } finally {
      // Restore the original state
      this.renderer.setStyle(childNode, 'width', originalWidth);
      this.accordionGroup.value = accordionGroupValues;
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
          handler: () => {},
        },
        {
          text: 'Delete',
          handler: async () => {
            const key = 'game' + gameId;
            await this.storageService.deleteGame(key);
            this.toastService.showToast('Game deleted sucessfully.', 'checkmark-outline');
          },
        },
      ],
    });

    await alert.present();
  }

  deleteAll(): void {
    this.storageService.deleteAllData();
    window.dispatchEvent(new Event('dataDeleted'));
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      await this.loadGameHistory();
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
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
    const permissionsGranted = isIos ? (await Filesystem.requestPermissions()).publicStorage === 'granted' : true;

    if (isIos && !permissionsGranted) {
      const permissionRequestResult = await Filesystem.requestPermissions();
      if (!permissionRequestResult) {
        return this.showPermissionDeniedAlert();
      }
    }

    // If running on an Android device, save the file without asking for permissions
    this.loadingService.setLoading(true);
    let suffix = '';
    const fileName = `game_data_${formattedDate}`;
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
    this.loadingService.setLoading(false);
  }

  async loadGameHistory(): Promise<void> {
    try {
      this.gameHistory = await this.storageService.loadGameHistory();
    } catch (error) {
      this.toastService.showToast(`Error loading history! ${error}`, 'bug', true);
    }
  }

  loadMoreGames(event: any): void {
    const nextPage = this.filteredGameHistory.length + 15;

    setTimeout(() => {
      (event as InfiniteScrollCustomEvent).target.complete();
      this.filteredGameHistory = this.gameLength.slice(0, nextPage);
    }, 150);
  }

  private subscribeToDataEvents(): void {
    this.gameAddedSubscription = this.storageService.newGameAdded.subscribe(() => {
      this.loadGameHistory()
        .then(() => {
          this.filterService.filterGames(this.gameHistory);
        }).then(() => {
          this.sortGameHistoryByDate(this.gameHistory);
        })
        .catch((error) => {
          console.error('Error loading game history:', error);
        });
    });

    this.gameDeletedSubscription = this.storageService.gameDeleted.subscribe(() => {
      this.loadGameHistory()
        .then(() => {
          this.filterService.filterGames(this.gameHistory);
        }).then(() => {
          this.sortGameHistoryByDate(this.gameHistory);
        })
        .catch((error) => {
          console.error('Error loading game history:', error);
        });
    });

    this.filteredGamesSubscription = this.filterService.filteredGames$.subscribe((games) => {
      this.gameLength = games;
      this.sortGameHistoryByDate(this.gameLength);
      this.filterGameLength = this.gameLength.length;
      this.filteredGameHistory = this.gameLength.slice(0, 20);
      this.activeFilterCount = this.filterService.activeFilterCount;
    });

    this.newLeagueSubscription = this.storageService.newLeagueAdded.subscribe(() => {
      this.storageService.loadLeagues().then((leagues) => {
        this.leagues = leagues;
      });
    });
  }

  private sortGameHistoryByDate(gameHistory: Game[]): void {
    gameHistory.sort((a: { date: number }, b: { date: number }) => {
      return b.date - a.date;
    });
  }

  private async fileExists(path: string): Promise<boolean> {
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

  private getGameDataForExport(): string[][] {
    const gameData: string[][] = [];

    // Add header row
    const headerRow = ['Game', 'Date'];
    for (let i = 1; i <= 10; i++) {
      headerRow.push(`Frame ${i}`);
    }
    headerRow.push('Total Score');
    headerRow.push('FrameScores');
    headerRow.push('League');
    headerRow.push('Practice');
    headerRow.push('Clean');
    headerRow.push('Perfect');
    headerRow.push('Series');
    headerRow.push('Series ID');
    headerRow.push('Notes');
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
      rowData.push(game.league || '');
      rowData.push(game.isPractice ? 'true' : 'false');
      rowData.push(game.isClean ? 'true' : 'false');
      rowData.push(game.isPerfect ? 'true' : 'false');
      rowData.push(game.isSeries ? 'true' : 'false');
      rowData.push(game.seriesId || '');
      rowData.push(game.note || '');
      gameData.push(rowData);
    });

    return gameData;
  }

  private async saveExcelFile(buffer: any, fileName: string): Promise<void> {
    try {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const length = bytes.byteLength;

      for (let i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      const base64Data = btoa(binary);
      const dataUri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64Data;

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

  private async readExcelData(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const buffer = await this.fileToBuffer(this.file);
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const gameData: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData: { [key: string]: any } = {};
      row.eachCell((cell, colNumber) => {
        rowData[worksheet.getRow(1).getCell(colNumber).value as string] = cell.value;
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
    await this.transformData(gameData);
  }

  // parseFrames(framesData: any): any {
  //   // Implement this function to parse frames data if necessary
  //   return framesData;
  // }

  private fileToBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => resolve(event.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // TODO beobachten ob öfter / nach Strike in Excel -> NaN
  private async transformData(data: any[]): Promise<void> {
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
            const throws = throwsData.split(' / ').map((value) => parseInt(value));
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
        frameScores: data[i]['13'].split(', ').map((score: string) => parseInt(score)),
        league: data[i]['14'],
        isPractice: data[i]['15'],
        isClean: data[i]['16'],
        isPerfect: data[i]['17'],
        isSeries: data[i]['18'] === 'true',
        seriesId: data[i]['19'],
        note: data[i]['20'],
      };

      gameData.push(game);
    }
    await this.storageService.saveGamesToLocalStorage(gameData);
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission Denied',
      message: 'To save to Gamedata.xlsx, you need to give permissions!',
      buttons: [
        {
          text: 'OK',
          handler: async () => {
            const permissionRequestResult = await Filesystem.requestPermissions();
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
