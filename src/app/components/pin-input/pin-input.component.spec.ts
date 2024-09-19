import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PinInputComponent } from './pin-input.component';

describe('PinInputComponent', () => {
  let component: PinInputComponent;
  let fixture: ComponentFixture<PinInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PinInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PinInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
