import { CommonModule, NgIf, NgStyle } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { IonText, IonCol, IonRow, IonIcon, IonGrid } from '@ionic/angular/standalone';
import { PrevStats, SessionStats, Stats } from 'src/app/models/stats-model';
import { ConditionalNumberPipe } from '../../pipes/number-pipe/conditional-number.pipe';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-spare-display',
  templateUrl: './spare-display.component.html',
  styleUrls: ['./spare-display.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonText, IonCol, IonRow, IonIcon, IonGrid, NgIf, NgStyle, ConditionalNumberPipe, CommonModule],
})
export class SpareDisplayComponent {
  @Input({ required: true }) stats!: Stats | SessionStats;
  @Input() prevStats?: PrevStats;
  

  constructor() {
    addIcons({informationCircleOutline});
  }

  getStatDifference(currentValue: number, previousValue: number): string {
    const difference = (currentValue - previousValue).toFixed(2);
    if (Number(difference) === 0) {
      return '0';
    }
    const percentageChange = previousValue === 0 ? '' : ((Number(difference) / previousValue) * 100).toFixed(2);
    const differenceWithSign = Number(difference) > 0 ? `+${difference}` : difference;
    return previousValue === 0 ? `${differenceWithSign}` : `${differenceWithSign} (${percentageChange}%)`;
  }

  getLabel(i: number): string {
    if (i === 0) return 'Overall';
    if (i === 1) return `${i} Pin`;
    return `${i} Pins`;
  }

  getRateColor(conversionRate: number): string {
    if (conversionRate > 95) {
      return '#4faeff';
    } else if (conversionRate > 75) {
      return '#008000';
    } else if (conversionRate > 50) {
      return '#809300';
    } else if (conversionRate > 33) {
      return '#FFA500';
    } else {
      return '#FF0000';
    }
  }

  getArrowIcon(currentValue: number, previousValue: number): string {
    if (previousValue === undefined) {
      return '';
    }
    if (currentValue === previousValue) {
      return '';
    }
    return currentValue > previousValue ? 'arrow-up' : 'arrow-down';
  }

  getDiffColor(currentValue: number, previousValue: number): string {
    if (previousValue === undefined) {
      return '';
    }
    if (currentValue === previousValue) {
      return '';
    }
    return currentValue > previousValue ? 'success' : 'danger';
  }
}
