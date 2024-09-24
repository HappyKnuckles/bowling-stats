import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SpareDisplayComponent } from './spare-display.component';

describe('SpareDisplayComponent', () => {
  let component: SpareDisplayComponent;
  let fixture: ComponentFixture<SpareDisplayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SpareDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpareDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
