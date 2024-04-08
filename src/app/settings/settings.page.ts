import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  name: string | null = '';
  constructor() { }

  ngOnInit() {
    this.name = localStorage.getItem('username');
  }

  changeName(){
    localStorage.setItem('username', this.name!);
  }
}
