import { TestBed } from '@angular/core/testing';
import { SaveGameDataService } from './save-game.service';

describe('SaveGameDataService', () => {
  let service: SaveGameDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SaveGameDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
