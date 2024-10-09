import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
@Component({
  selector: 'app-keyboard',
  imports: [IonButton],
  template: `
    <div class="keyboard">
      <ion-button (click)="keyPress('1')">1</ion-button>
      <ion-button (click)="keyPress('2')">2</ion-button>
      <ion-button (click)="keyPress('3')">3</ion-button>
      <ion-button (click)="keyPress('4')">4</ion-button>
      <ion-button (click)="keyPress('5')">5</ion-button>
      <ion-button (click)="keyPress('6')">6</ion-button>
      <ion-button (click)="keyPress('7')">7</ion-button>
      <ion-button (click)="keyPress('8')">8</ion-button>
      <ion-button (click)="keyPress('9')">9</ion-button>
      <ion-button (click)="keyPress('0')">0</ion-button>
      <ion-button (click)="keyPress('X')" [disabled]="throwIndex === 1">X</ion-button>
      <ion-button (click)="keyPress('/')" [disabled]="throwIndex === 0">/</ion-button>
      <ion-button (click)="keyPress('C')">Clear</ion-button>
    </div>
  `,
  styles: [
    `
      .keyboard {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
      }
      ion-button {
        width: 30%;
      }
    `,
  ],
  standalone: true,
})
export class KeyboardComponent {
  @Output() keyPressEvent = new EventEmitter<string>();
  @Input() frameIndex!: number;
  @Input() throwIndex!: number;

  keyPress(key: string) {
    this.keyPressEvent.emit(key);
  }
}
