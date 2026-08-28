import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { LayoutModule } from './authenticated/layout/layout.module';
import { AuthService } from './core/services/auth.service';
import { StoreModule } from '@ngrx/store';
import { authReducer } from './store/auth';
import { fundReducer } from './store/fund/fund.reducer';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { metaReducers } from './store/metaReducers';
import { httpConfigInterceptor } from './core/interceptors/http-config.interceptor';
import { dateReducer } from './store/date/date.reducer';
import { ToastModule } from 'primeng/toast';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { LoadingBarHttpClientModule } from "@ngx-loading-bar/http-client";
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(LayoutModule),
    MessageService,
    provideHttpClient(
      withInterceptors([httpConfigInterceptor]),
      // LoadingBarHttpClientModule registers its interceptor through the
      // HTTP_INTERCEPTORS multi-provider. Without withInterceptorsFromDi() Angular
      // never runs DI-registered interceptors, so the progress bar was inert.
      withInterceptorsFromDi()
    ),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideAnimations(),
    importProvidersFrom(ToastModule),
    importProvidersFrom(LoadingBarHttpClientModule),
  importProvidersFrom(StoreModule.forRoot({ authState: authReducer, fundState: fundReducer, dateState: dateReducer }, { metaReducers })),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
     return authService.getAccountData()
  }),
  ],
};



