import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonToolbar,
  IonCheckbox,
  IonItem,
  IonButton,
  IonRange,
  IonInput,
  IonLabel,
  IonDatetimeButton,
  IonDatetime,
  IonModal,
  IonToggle,
  IonNote,
} from '@ionic/angular/standalone';
import { Game } from 'src/app/models/game-model';
import { FilterService } from 'src/app/services/filter/filter.service';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  standalone: true,
  imports: [
    IonNote,
    IonToggle,
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonLabel,
    IonInput,
    IonRange,
    IonButton,
    IonItem,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
})
export class FilterComponent implements OnInit {
  @Input({ required: true }) games!: Game[];
  filters = this.filterService.filters;

  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];
  constructor(private modalCtrl: ModalController, private filterService: FilterService) {}

  cancel() {
    this.filterService.filters = localStorage.getItem('filter') ? JSON.parse(localStorage.getItem('filter')!) : this.filterService.filters;
    return this.modalCtrl.dismiss(null, 'cancel');
  }
  // reset() {
  //   this.filterService.filters = this.filterService.defaultFilters;
  // }
  confirm() {
    const filteredGames = this.filterService.filterGames(this.games);
    return this.modalCtrl.dismiss(filteredGames, 'confirm');
  }

  updateStart(event: CustomEvent) {
    this.filterService.filters.startDate = event.detail.value!;
  }
  updateEnd(event: CustomEvent) {
    this.filterService.filters.endDate = event.detail.value!;
  }

  ngOnInit(): void {
    if (!this.filterService.filters.startDate && !this.filterService.filters.endDate) {
      this.filterService.filters.startDate = new Date(this.games[this.games.length - 1].date).toISOString() || Date.now().toString();
      this.filterService.filters.endDate = new Date(this.games[0].date).toISOString() || Date.now().toString();
    }
    
    const textColor = '#000000';
    const rootStyles = getComputedStyle(document.documentElement);
    const backgroundColor = rootStyles.getPropertyValue('--ion-color-primary').trim();
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

  transformDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
