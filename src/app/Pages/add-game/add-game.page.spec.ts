import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddGamePage } from './add-game.page';

describe('AddGamePage', () => {
  let component: AddGamePage;
  let fixture: ComponentFixture<AddGamePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddGamePage],
    }).compileComponents();

    fixture = TestBed.createComponent(AddGamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
