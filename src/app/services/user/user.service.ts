import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usernameSubject = new BehaviorSubject<string>('');

  constructor() {}

  getUsername() {
    return this.usernameSubject.asObservable();
  }

  setUsername(username: string) {
    this.usernameSubject.next(username);
  }
}
