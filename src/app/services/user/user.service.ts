import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usernameSubject = new BehaviorSubject<string>('');

  constructor() { }

  getUsername(): Observable<string> {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername !== null) {
      this.usernameSubject.next(storedUsername);
    }
    return this.usernameSubject.asObservable();
  }

  setUsername(username: string): void {
    localStorage.setItem('username', username);
    this.usernameSubject.next(username);
  }
}
