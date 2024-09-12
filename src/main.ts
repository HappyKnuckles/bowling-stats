import { enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { environment } from './environments/environment';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app/app.component';
import { provideServiceWorker } from '@angular/service-worker';
import { inject } from '@vercel/analytics';

if (environment.production) {
  enableProdMode();
}

inject();

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule, IonicStorageModule.forRoot()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideAnimationsAsync(), provideIonicAngular(),
    provideHttpClient(withInterceptorsFromDi()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
})
  .catch(err => console.error(err));
