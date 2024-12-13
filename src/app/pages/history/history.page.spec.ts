import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryPage } from './history.page';
import { StorageService } from 'src/app/services/storage/storage.service';
import { AngularDelegate } from '@ionic/angular';
import { of } from 'rxjs';

const mockStorageService = {
  getItem: jasmine.createSpy('getItem').and.returnValue(Promise.resolve(null)),
  setItem: jasmine.createSpy('setItem').and.returnValue(Promise.resolve()),
  loadLeagues: jasmine.createSpy('loadLeagues').and.returnValue(Promise.resolve([])),
  loadGameHistory: jasmine.createSpy('loadGameHistory').and.returnValue(Promise.resolve([])),
  newGameAdded: of(null),
  gameDeleted: of(null),
  gameEditLeague: of(null),
  newLeagueAdded: of(null),
  leagueDeleted: of(null),
  leagueChanged: of(null),
};

describe('HistoryPage', () => {
  let component: HistoryPage;
  let fixture: ComponentFixture<HistoryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [{ provide: StorageService, useValue: mockStorageService }, AngularDelegate],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
