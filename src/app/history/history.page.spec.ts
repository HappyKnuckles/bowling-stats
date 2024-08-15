import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryPage } from './history.page';

describe('HistoryPage', () => {
    let component: HistoryPage;
    let fixture: ComponentFixture<HistoryPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), HistoryPage]
}).compileComponents();

        fixture = TestBed.createComponent(HistoryPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
