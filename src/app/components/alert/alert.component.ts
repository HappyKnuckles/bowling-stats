import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent   {
  @Input({required: true}) isOpen!: boolean;
  @Input({required: true}) message!: string;
  @Input() icon!: string;
  @Input() isError?: boolean;

  constructor() { }

    setOpen(open: boolean) {
      this.isOpen = open;
    }
  

}
