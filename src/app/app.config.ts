import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { LayoutModule } from './authenticated/layout/layout.module';
import { AuthService } from './core/services/auth.service';
import { StoreModule } from '@ngrx/store';
import { authReducer } from './store/auth';
import { fundReducer } from './store/fund/fund.reducer';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { metaReducers } from './store/metaReducers';
import { httpConfigInterceptor } from './core/interceptors/http-config.interceptor';
import { dateReducer } from './store/date/date.reducer';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(LayoutModule),
    MessageService,
    provideHttpClient(
      withInterceptors([httpConfigInterceptor])
    ),
  importProvidersFrom(StoreModule.forRoot({ authState: authReducer, fundState: fundReducer, dateState: dateReducer }, { metaReducers })),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
     return authService.getAccountData()
  }),
  ],
};



