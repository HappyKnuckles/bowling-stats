import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular, IonApp, IonBackdrop, IonSpinner, IonRouterOutlet } from '@ionic/angular/standalone';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule, IonicStorageModule.forRoot()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideAnimationsAsync(), provideIonicAngular(),
    provideHttpClient(withInterceptorsFromDi()),
  ]
})
  .catch(err => console.log(err));
