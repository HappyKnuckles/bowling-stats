import { Component } from '@angular/core';
import { BowlingCalculatorService } from '../services/bowling-calculator/bowling-calculator.service';

@Component({
  selector: 'app-add-game',
  templateUrl: 'add-game.page.html',
  styleUrls: ['add-game.page.scss']
})
export class AddGamePage {
  private frameScores: number[] = [];


  constructor(private bowlingService: BowlingCalculatorService) {
  //   const game = [
  //     10, 
  //     10,
  //     10,
  //     9, 1,
  //     9, 1,
  //     9, 1,
  //     9, 1,
  //     9, 1,
  //     9, 1,
  //     9, 1, 10
  //   ]
  //   for (const pins of game) {
  //     bowlingService.roll(pins);
  //     console.log(bowlingService.score())

  //   }
  }
}
