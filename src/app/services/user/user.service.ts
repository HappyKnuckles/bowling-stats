import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from '../toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usernameSubject = new BehaviorSubject<string>('');

  constructor(private toastService: ToastService) { }

  getUsername() {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername !== null) {
      this.usernameSubject.next(this.capitalizeFirstLetter(storedUsername));
    }
    return this.usernameSubject.asObservable();
  }

  setUsername(username: string) {
    localStorage.setItem('username', username);
    this.usernameSubject.next(this.capitalizeFirstLetter(username));
    this.toastService.showToast(`Name updated to ${username}`, 'reload-outline');
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
