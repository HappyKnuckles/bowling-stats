import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonButtons,
  IonToolbar,
  IonItem,
  IonButton,
  IonInput,
  IonLabel,
  IonDatetimeButton,
  IonDatetime,
  IonModal,
  IonToggle,
  IonFooter,
  IonSelectOption,
  IonSelect,
  IonList,
} from '@ionic/angular/standalone';
import { merge, Subscription } from 'rxjs';
import { Filter, TimeRange } from 'src/app/models/filter-model';
import { Game } from 'src/app/models/game-model';
import { FilterService } from 'src/app/services/filter/filter.service';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  standalone: true,
  imports: [
    IonList,
    IonFooter,
    IonToggle,
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonLabel,
    IonInput,
    IonButton,
    IonItem,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonSelect,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IonSelectOption,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FilterComponent implements OnInit, OnDestroy {
  @Input({ required: true }) games!: Game[];
  @Input() filteredGames!: Game[];
  filters!: Filter;
  defaultFilters = this.filterService.defaultFilters;
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];
  leagues: string[] = [];
  private leagueSubscriptions: Subscription = new Subscription();
  private filterSubscription: Subscription;

  constructor(private modalCtrl: ModalController, private filterService: FilterService, private storageService: StorageService) {
    this.filterSubscription = this.filterService.filters$.subscribe((filters: Filter) => {
      this.filters = filters;
    });
    this.leagueSubscriptions.add(
      merge(this.storageService.newLeagueAdded, this.storageService.leagueDeleted, this.storageService.leagueChanged).subscribe(() => {
        this.storageService.loadLeagues().then((leagues) => {
          this.leagues = leagues;
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.filterSubscription.unsubscribe();
    this.leagueSubscriptions.unsubscribe();
  }

  startDateChange(event: CustomEvent) {
    const now = new Date(Date.now());
    switch (event.detail.value) {
      case TimeRange.TODAY:
        this.filters.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case TimeRange.WEEK:
        this.filters.startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case TimeRange.MONTH:
        this.filters.startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      case TimeRange.QUARTER:
        this.filters.startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString();
        break;
      case TimeRange.HALF:
        this.filters.startDate = new Date(now.setMonth(now.getMonth() - 6)).toISOString();
        break;
      case TimeRange.YEAR:
        this.filters.startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        break;
      case TimeRange.ALL:
      default:
        this.filters.startDate = this.defaultFilters.startDate;
        break;
    }
  }

  cancel() {
    this.filterService.filters = localStorage.getItem('filter') ? JSON.parse(localStorage.getItem('filter')!) : this.filterService.filters;
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  reset() {
    this.filterService.resetFilters();
  }

  confirm() {
    this.filterService.filterGames(this.games);
    this.getHighlightedDates();
    return this.modalCtrl.dismiss('confirm');
  }

  updateStart(event: CustomEvent) {
    this.filterService.filters.startDate = event.detail.value!;
  }

  updateEnd(event: CustomEvent) {
    this.filterService.filters.endDate = event.detail.value!;
  }

  async ngOnInit(): Promise<void> {
    if (!this.filterService.filters.startDate && !this.filterService.filters.endDate) {
      this.filterService.filters.startDate = new Date(this.games[this.games.length - 1].date).toISOString() || Date.now().toString();
      this.filterService.filters.endDate = new Date(this.games[0].date).toISOString() || Date.now().toString();
    }
    this.leagues = await this.storageService.loadLeagues();
    this.getHighlightedDates();
  }

  private getHighlightedDates() {
    const textColor = '#000000';
    const rootStyles = getComputedStyle(document.documentElement);
    const backgroundColor = rootStyles.getPropertyValue('--ion-color-primary').trim();
    // TODO Think if using it like this so highlighted dates are only that match the current filter or not
    // maybe make days that are in current filter a different color as well
    this.highlightedDates = this.games.map((game) => {
      const date = new Date(game.date);
      const formattedDate = this.transformDate(date);
      return {
        date: formattedDate,
        textColor: textColor,
        backgroundColor: backgroundColor,
      };
    });
  }

  private transformDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
