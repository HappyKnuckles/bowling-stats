import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonModal,
  IonRefresher,
} from '@ionic/angular/standalone';
import { StorageService } from 'src/app/services/storage/storage.service';
import { addIcons } from 'ionicons';
import {
  chevronForward,
  trashOutline,
  createOutline,
  documentTextOutline,
  shareOutline,
  medalOutline,
  cameraOutline,
  addOutline,
  chevronBack,
} from 'ionicons/icons';
import { Game } from 'src/app/models/game-model';
import { GameComponent } from '../../components/game/game.component';
import { ToastService } from 'src/app/services/toast/toast.service';
import { AlertController, IonicSlides } from '@ionic/angular';
import { merge, Subscription } from 'rxjs';
import { LoadingService } from 'src/app/services/loader/loading.service';
import { Stats } from 'src/app/models/stats-model';
import { GameStatsService } from 'src/app/services/game-stats/game-stats.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { StatDisplayComponent } from 'src/app/components/stat-display/stat-display.component';
import { SpareDisplayComponent } from 'src/app/components/spare-display/spare-display.component';
import Swiper from 'swiper';
import { SortUtilsService } from 'src/app/services/sort-utils/sort-utils.service';

@Component({
  selector: 'app-league',
  templateUrl: './league.page.html',
  styleUrls: ['./league.page.scss'],
  standalone: true,
  imports: [
    IonRefresher,
    IonModal,
    IonText,
    IonItemOptions,
    IonItemOption,
    IonItemSliding,
    IonLabel,
    IonItem,
    IonIcon,
    IonButtons,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    FormsModule,
    GameComponent,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    DecimalPipe,
    StatDisplayComponent,
    SpareDisplayComponent,
    IonSegmentButton,
    IonSegment,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LeaguePage implements OnInit, OnDestroy {
  swiperModules = [IonicSlides];
  private swiperInstance: Swiper | undefined;

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
  @ViewChildren('modal') modals!: QueryList<IonModal>;
  selectedSegment: string = 'Overall';
  segments: string[] = ['Overall', 'Spares', 'Games'];
  // leagues: string[] = [];
  games: Game[] = [];
  isEditMode: { [key: string]: boolean } = {};
  gamesByLeague: { [key: string]: Game[] } = {};
  private gameSubscriptions: Subscription = new Subscription();
  private loadingSubscription: Subscription;
  private leagueSubscriptions: Subscription = new Subscription();
  statsByLeague: { [key: string]: Stats } = {};
  overallStats: Stats = {
    totalGames: 0,
    totalPins: 0,
    perfectGameCount: 0,
    cleanGameCount: 0,
    cleanGamePercentage: 0,
    totalStrikes: 0,
    totalSpares: 0,
    totalSparesMissed: 0,
    totalSparesConverted: 0,
    pinCounts: Array(11).fill(0),
    missedCounts: Array(11).fill(0),
    averageStrikesPerGame: 0,
    averageSparesPerGame: 0,
    averageOpensPerGame: 0,
    strikePercentage: 0,
    sparePercentage: 0,
    openPercentage: 0,
    spareConversionPercentage: 0,
    averageFirstCount: 0,
    averageScore: 0,
    highGame: 0,
    spareRates: [],
    overallSpareRate: 0,
    overallMissedRate: 0,
  };
  isLoading: boolean = false;

  constructor(
    private storageService: StorageService,
    private sortUtilsService: SortUtilsService,
    private hapticService: HapticService,
    private statService: GameStatsService,
    public loadingService: LoadingService,
    private alertController: AlertController,
    private toastService: ToastService
  ) {
    addIcons({
      addOutline,
      trashOutline,
      createOutline,
      chevronForward,
      chevronBack,
      cameraOutline,
      shareOutline,
      documentTextOutline,
      medalOutline,
    });
    this.loadingSubscription = this.loadingService.isLoading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });
  }

  ngOnDestroy(): void {
    this.loadingSubscription.unsubscribe();
    this.leagueSubscriptions.unsubscribe();
  }

  async ngOnInit() {
    try {
      this.loadingService.setLoading(true);
      // await this.getLeagues();
      await this.getGames();
      this.subscribeToDataEvents();
    } catch (error) {
      this.toastService.showToast('Error loading leagues and games', 'error');
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async handleRefresh(event: any): Promise<void> {
    try {
      this.hapticService.vibrate(ImpactStyle.Medium, 200);
      this.loadingService.setLoading(true);
      await this.getGames();
    } catch (error) {
      console.error(error);
    } finally {
      event.target.complete();
      this.loadingService.setLoading(false);
    }
  }

  cancel(league: string) {
    this.selectedSegment = 'Overall';
    const modalToDismiss = this.modals.find((modal) => modal.trigger === league);

    if (modalToDismiss) {
      modalToDismiss.dismiss();
    }
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

  async saveLeague(league: string): Promise<void> {
    const key = 'league' + '_' + league;
    await this.storageService.addLeague(key, league);
    this.toastService.showToast('League saved sucessfully.', 'add');
  }

  getGamesByLeague(league: string): any[] {
    return this.gamesByLeague[league] || [];
  }

  getStatsByLeague(league: string): Stats {
    return this.statsByLeague[league] || [];
  }

  getLeagueKeys(excludePractice: boolean = false): string[] {
    if (excludePractice) {
      return Object.keys(this.gamesByLeague).filter((league) => league !== 'Practice');
    }
    return Object.keys(this.gamesByLeague);
  }

  async addLeague() {
    const alert = await this.alertController.create({
      header: 'Add League',
      message: 'Enter the league name',
      inputs: [
        {
          name: 'league',
          type: 'text',
          placeholder: 'League name',
          cssClass: 'league-alert-input',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Add',
          handler: async (data: { league: string }) => {
            await this.saveLeague(data.league);
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteLeague(league: string): Promise<void> {
    this.hapticService.vibrate(ImpactStyle.Heavy, 300);
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this league?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {},
        },
        {
          text: 'Delete',
          handler: async () => {
            const key = 'league' + '_' + league;
            await this.storageService.deleteLeague(key);
            this.toastService.showToast('League deleted sucessfully.', 'checkmark-outline');
          },
        },
      ],
    });

    await alert.present();
  }

  async editLeague(league: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Edit League',
      message: 'Enter the new league name',
      inputs: [
        {
          name: 'league',
          type: 'text',
          value: league,
          placeholder: 'League name',
          cssClass: 'alert-input',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Edit',
          handler: async (data: { league: string }) => {
            const key = 'league' + '_' + data.league;
            await this.storageService.editLeague(key, data.league, league);
            this.toastService.showToast('League edited sucessfully.', 'checkmark-outline');
          },
        },
      ],
    });

    await alert.present();
  }

  // private async getLeagues(): Promise<void> {
  //   this.leagues = await this.storageService.loadLeagues();
  // }

  private getOverallStats(): void {
    this.overallStats = this.statService.calculateBowlingStats(this.games);
  }

  private getSlideIndex(segment: string): number {
    const index = this.segments.indexOf(segment);
    return index !== -1 ? index : 0;
  }

  private getSegmentValue(index: number): string {
    return this.segments[index] || 'Overall';
  }

  private async getGames(): Promise<void> {
    this.games = await this.storageService.loadGameHistory();
    this.gamesByLeague = this.sortUtilsService.sortGamesByLeagues(this.games, true);
    this.getOverallStats();
    this.calculateStatsForLeagues();
  }

  private calculateStatsForLeagues(): void {
    this.getLeagueKeys().forEach((league) => {
      const games = this.gamesByLeague[league] || [];
      this.statsByLeague[league] = this.statService.calculateBowlingStats(games);
    });
  }

  private subscribeToDataEvents(): void {
    this.leagueSubscriptions.add(
      merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
        // this.getLeagues().then(() => {
        //   this.calculateStatsForLeagues();
        // });
        this.calculateStatsForLeagues();
      })
    );

    this.gameSubscriptions.add(
      merge(this.storageService.newGameAdded, this.storageService.gameDeleted, this.storageService.gameEditHistory).subscribe(() => {
        this.getGames()
          .then(() => {
            this.sortUtilsService.sortGameHistoryByDate(this.games);
          })
          .catch((error: Error) => {
            console.error('Error loading game history:', error);
          });
      })
    );
  }
}
