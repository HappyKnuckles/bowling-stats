import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonCol, IonInput, IonRow, IonGrid, IonButton } from "@ionic/angular/standalone";

@Component({
  selector: 'app-pin-input',
  templateUrl: './pin-input.component.html',
  styleUrls: ['./pin-input.component.scss'],
  standalone: true,
  imports: [IonCol, IonInput, IonRow, IonGrid, IonButton, CommonModule]
})
export class PinInputComponent {
  pressedPins: Set<number> = new Set();
  firstThrowPins = new Set<number>();
  activeFrame = 0;
  activeThrow = 0;
  currentFrame = 0;
  currentThrow = 0;
  maxFrames = 10;
  maxThrows = 2; // Two throws per frame (except for frame 10)
  pinsKnockedDown = 0;
  gameData: { throws: (number | null)[] }[] = Array(10).fill(null).map(() => ({ throws: [null, null, null] }));

  constructor() { }

  pressPin(pinNumber: number) {
    if (this.pressedPins.has(pinNumber)) {
      this.pressedPins.delete(pinNumber);
    } else {
      // Only allow pressing pins that weren't knocked down in the first throw
      if (this.currentThrow === 1 && this.firstThrowPins.has(pinNumber)) {
        return; // Do not allow pressing already knocked down pins in the second throw
      }
      this.pressedPins.add(pinNumber);
    }

    this.pinsKnockedDown = this.pressedPins.size;
  }

  // Save current throw and advance
  confirmThrow() {
    const throws = this.gameData[this.currentFrame].throws;
    throws[this.currentThrow] = this.pinsKnockedDown;  // Save the number of knocked-down pins

    // Move to next throw/frame
    if (this.isTenthFrame()) {
      if (this.currentThrow < 2) {
        this.currentThrow++;
      }
    } else if (this.currentThrow === 0) {
      this.firstThrowPins = new Set(this.pressedPins); // Save the pins pressed in the first throw
      this.currentThrow++;
      this.pressedPins.clear(); // Clear pressed pins for the second throw
      this.pinsKnockedDown = 0; // Reset pins knocked down for the second throw
    } else {
      this.currentThrow = 0;
      this.currentFrame++;
      this.resetPins(); // Move to the next frame and reset pins
    }

    // Set the next active frame and throw
    this.setActiveFrameThrow(this.currentFrame, this.currentThrow);
  }

  goBack() {
    if (this.currentThrow > 0) {
      // If not the first throw, move back to the previous throw
      this.currentThrow--;
    } else if (this.currentFrame > 0) {
      // If the first throw of the current frame, move back to the last throw of the previous frame
      this.currentFrame--;
      this.currentThrow = this.isTenthFrame() ? 2 : 1;
    } else {
      // If already at the first frame and first throw, do nothing
      return;
    }

    // Clear the current throw
    this.gameData[this.currentFrame].throws[this.currentThrow] = null;

    // Reset pins for the current throw
    this.resetPins();

    // Set the active input to the previous frame and throw
    this.setActiveFrameThrow(this.currentFrame, this.currentThrow);
  }


  setActiveFrameThrow(frameIndex: number, throwIndex: number) {
    this.activeFrame = frameIndex;
    this.activeThrow = throwIndex;
  }

  // Method to determine if an input is active
  isActiveInput(frameIndex: number, throwIndex: number): boolean {
    return this.activeFrame === frameIndex && this.activeThrow === throwIndex;
  }

  resetPins() {
    this.pressedPins.clear();
    this.firstThrowPins.clear();
    this.pinsKnockedDown = 0;
  }

  isTenthFrame() {
    return this.currentFrame === 9;
  }

  clearFrames() {
    this.gameData = Array.from({ length: 10 }, () => ({ throws: [null, null, null] }));
    this.currentThrow = 0;
    this.currentFrame = 0;
    this.setActiveFrameThrow(this.currentFrame, this.currentThrow);
    this.resetPins();
  }

}
