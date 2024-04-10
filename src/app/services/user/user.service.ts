import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usernameSubject = new BehaviorSubject<string>('');

  constructor() { }

  getUsername() {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername !== null) {
      this.usernameSubject.next(storedUsername);
    }
    return this.usernameSubject.asObservable();
  }

  setUsername(username: string) {
    localStorage.setItem('username', username);
    this.usernameSubject.next(username);
  }
}
