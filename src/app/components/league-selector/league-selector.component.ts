import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonSelect, IonInput, IonButton, IonSelectOption, IonItem, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, medalOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
  selector: 'app-league-selector',
  templateUrl: './league-selector.component.html',
  styleUrls: ['./league-selector.component.scss'],
  imports: [IonLabel, IonIcon, IonItem, IonButton, IonInput, IonSelect, NgIf, NgFor, FormsModule, ReactiveFormsModule, IonSelectOption],
  standalone: true,
})
export class LeagueSelectorComponent implements OnInit, OnDestroy {
  @Input() isAddPage: boolean = false;
  @Input() defaultLeague: string = '';
  @Output() leagueChanged = new EventEmitter<string>();
  leagues: string[] = [];
  selectedLeague: string = 'New';
  newLeague: string = '';
  newLeagueSubscription: Subscription;
  constructor(private storageService: StorageService, private toastService: ToastService) {
    this.newLeagueSubscription = this.storageService.newLeagueAdded.subscribe(() => {
      this.getLeagues();
    });
    addIcons({ medalOutline, addOutline });
  }
  ngOnDestroy(): void {
    this.newLeagueSubscription.unsubscribe();
  }
  async ngOnInit() {
    await this.getLeagues();
  }

  async saveLeague(): Promise<void> {
    const key = 'league' + '_' + this.newLeague;
    await this.storageService.addLeague(key, this.newLeague);
    this.selectedLeague = this.newLeague;
    this.leagueChanged.emit(this.selectedLeague);
    this.newLeague = '';
    this.toastService.showToast('League saved sucessfully.', 'add');
  }

  async getLeagues(): Promise<void> {
    this.leagues = await this.storageService.loadLeagues();
  }
}
