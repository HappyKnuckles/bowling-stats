import { NgIf, NgStyle } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IonText, IonIcon } from '@ionic/angular/standalone';
import { ConditionalNumberPipe } from '../../pipes/number-pipe/conditional-number.pipe';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-stat-display',
  templateUrl: './stat-display.component.html',
  styleUrls: ['./stat-display.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgIf, IonText, NgStyle, IonIcon, ConditionalNumberPipe],
})
export class StatDisplayComponent implements OnChanges {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) currentStat!: number;
  @Input() toolTip?: string;
  @Input() prevStat?: number;
  @Input() id?: string;
  @Input() isPercentage?: boolean;

  statDifference: string = '0';

  constructor() {
    addIcons({ informationCircleOutline });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStat'] || changes['prevStat']) {
      this.statDifference = this.calculateStatDifference(this.currentStat, this.prevStat!);
    }
  }

  getArrowIcon(currentValue: number, previousValue?: number): string {
    if (previousValue === undefined || currentValue === undefined) {
      return '';
    }
    if (currentValue === previousValue) {
      return '';
    }
    return currentValue > previousValue ? 'arrow-up' : 'arrow-down';
  }

  getDiffColor(currentValue: number, previousValue?: number): string {
    if (previousValue === undefined || currentValue === undefined) {
      return '';
    }
    if (currentValue === previousValue) {
      return '';
    }
    return currentValue > previousValue ? 'success' : 'danger';
  }

  private calculateStatDifference(currentValue: number, previousValue: number): string {
    if (previousValue === undefined) {
      return '0';
    }
    const difference = (currentValue - previousValue).toFixed(2);
    if (Number(difference) === 0) {
      return '0';
    }
    const percentageChange = previousValue === 0 ? '' : ((Number(difference) / previousValue) * 100).toFixed(2);
    const differenceWithSign = Number(difference) > 0 ? `+${difference}` : difference;
    return previousValue === 0 ? `${differenceWithSign}` : `${differenceWithSign} (${percentageChange}%)`;
  }
}
