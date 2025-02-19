import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import {provideFirestore, getFirestore} from '@angular/fire/firestore'
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from './environments/environment.prod';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp({ ...environment.firebaseConfig })),
    provideFirestore(() => getFirestore()),
  ],
});
