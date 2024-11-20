import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  AlertController,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonTitle,
  IonBadge,
  IonContent,
  IonRefresher,
  IonText,
  IonButtons,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonAccordionGroup,
} from '@ionic/angular/standalone';
import { Filesystem } from '@capacitor/filesystem';
import { merge, Subscription } from 'rxjs';
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
import { NgIf, DatePipe } from '@angular/common';
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
import { GameComponent } from 'src/app/components/game/game.component';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { ExcelService } from 'src/app/services/excel/excel.service';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: true,
  providers: [DatePipe, ModalController],
  imports: [
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonButtons,
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
    ReactiveFormsModule,
    FormsModule,
    GameComponent,
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
  private gameSubscriptions: Subscription = new Subscription();
  private filteredGamesSubscription!: Subscription;
  private loadingSubscription: Subscription;
  private leagueSubscriptions: Subscription = new Subscription();
  isLoading: boolean = false;
  activeFilterCount = this.filterService.activeFilterCount;

  constructor(
    private alertController: AlertController,
    private toastService: ToastService,
    private storageService: StorageService,
    private loadingService: LoadingService,
    private hapticService: HapticService,
    private modalCtrl: ModalController,
    private filterService: FilterService,
    private utilsService: UtilsService,
    private excelService: ExcelService
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
    this.gameSubscriptions.unsubscribe();
    this.leagueSubscriptions.unsubscribe();
    this.loadingSubscription.unsubscribe();
    this.filteredGamesSubscription.unsubscribe();
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
      const gameData = await this.excelService.readExcelData(this.file);
      await this.excelService.transformData(gameData);
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
    const gotPermission = await this.excelService.exportToExcel(this.gameHistory);
    if(!gotPermission) {
      this.showPermissionDeniedAlert();
    }
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
    this.gameSubscriptions.add(
      merge(this.storageService.newGameAdded, this.storageService.gameDeleted).subscribe(() => {
        this.loadGameHistory()
          .then(() => {
            this.filterService.filterGames(this.gameHistory);
          })
          .then(() => {
            this.utilsService.sortGameHistoryByDate(this.gameHistory);
          })
          .catch((error) => {
            console.error('Error loading game history:', error);
          });
      })
    );

    this.filteredGamesSubscription = this.filterService.filteredGames$.subscribe((games) => {
      this.gameLength = games;
      this.utilsService.sortGameHistoryByDate(this.gameLength);
      this.filterGameLength = this.gameLength.length;
      this.filteredGameHistory = this.gameLength.slice(0, 20);
      this.activeFilterCount = this.filterService.activeFilterCount;
    });

    this.leagueSubscriptions.add(
      merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
        this.getLeagues();
      })
    );
  } 
  
  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission Denied',
      message: 'To save to Gamedata.xlsx, you need to give permissions!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Try again',
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