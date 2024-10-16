import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TrackGridComponent } from './track-grid.component';

describe('TrackGridComponent', () => {
  let component: TrackGridComponent;
  let fixture: ComponentFixture<TrackGridComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TrackGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
