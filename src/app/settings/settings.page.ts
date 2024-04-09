import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  name: string | null = '';
  currentColor: string | null = '';
  optionsWithClasses: { name: string; class: string }[] = [
    { name: 'Blue', class: 'blue-option' },
    { name: 'Yellow', class: 'yellow-option' },
    { name: 'Green', class: 'green-option' },
    { name: 'Red', class: 'red-option' },
    { name: 'Gray', class: 'gray-option' }
  ];
    constructor() { }

  ngOnInit() {
    this.currentColor = localStorage.getItem('theme');
    if(this.currentColor === null){
      this.currentColor = 'Green';
    }
    this.name = localStorage.getItem('username');
  }

  changeName(){
    localStorage.setItem('username', this.name!);
  }

  changeColor(){
    localStorage.setItem('theme', this.currentColor!);
  }
}
