import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  parseIntValue(value: any): any {
    const parsedValue = parseInt(value, 10);
    return isNaN(parsedValue) ? '' : parsedValue;
  }

  calculateStatDifference(currentValue: number, previousValue: number): string {
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
}
