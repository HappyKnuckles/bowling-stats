import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonSelect, IonInput, IonButton, IonSelectOption } from '@ionic/angular/standalone';
import { StorageService } from 'src/app/services/storage/storage.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
  selector: 'app-league-selector',
  templateUrl: './league-selector.component.html',
  styleUrls: ['./league-selector.component.scss'],
  imports: [IonButton, IonInput, IonSelect, CommonModule, FormsModule, ReactiveFormsModule, IonSelectOption],
  standalone: true,
})
export class LeagueSelectorComponent  implements OnInit {
  leagues: string[] = [];
  newLeague: string = "";
  constructor(private storageService: StorageService, private toastService: ToastService) { }

  async ngOnInit() {
    await this.getLeagues()
  }
  
  async saveLeague(): Promise<void>{
    const key = "league" + "_" + this.newLeague;
    await this.storageService.save(key, this.newLeague);
    this.newLeague = "";
    this.toastService.showToast("League saved sucessfully.", "add");
  }

  async getLeagues(): Promise<void>{
    this.leagues = await this.storageService.loadLeagues(); 
  }
}
