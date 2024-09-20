import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StatDisplayComponent } from './stat-display.component';

describe('StatDisplayComponent', () => {
  let component: StatDisplayComponent;
  let fixture: ComponentFixture<StatDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [StatDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
