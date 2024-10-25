import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LeagueSelectorComponent } from './league-selector.component';

describe('LeagueSelectorComponent', () => {
  let component: LeagueSelectorComponent;
  let fixture: ComponentFixture<LeagueSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LeagueSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
