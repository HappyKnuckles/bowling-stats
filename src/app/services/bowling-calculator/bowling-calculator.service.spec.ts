import { TestBed } from '@angular/core/testing';

import { BowlingCalculatorService } from './bowling-calculator.service';

describe('BowlingCalculatorService', () => {
  let service: BowlingCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BowlingCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
