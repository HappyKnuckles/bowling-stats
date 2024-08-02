import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor() { }

  setLoading(isLoading: boolean): void {
    console.log(isLoading + "service")
    this.isLoadingSubject.next(isLoading);
  }}
