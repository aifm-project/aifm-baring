import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DefaultLandingGuard } from './core/guards/default-landing.guard';
import { AuthenticatedLayoutComponent } from './authenticated/layout/layout.component';

export const routes: Routes = [
  {
    path: 'user',
    loadChildren: () =>
      import('./unauthenticated/user/user.module').then((m) => m.UserModule),
  },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [DefaultLandingGuard], children: [] },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./web-dashboard/web-dashboard.module').then((m) => m.WebDashboardModule),
      },
      {
        path: 'portfolio',
        loadChildren: () =>
          import('./web-portfolio/web-portfolio.module').then((m) => m.WebPortfolioModule),
      },
      {
        path: 'documents',
        loadChildren: () =>
          import('./web-documents/web-documents.module').then((m) => m.WebDocumentsModule),
      },
      {
        path: 'insights',
        loadChildren: () =>
          import('./news-and-insights/news-and-insights.module').then((m) => m.NewsAndInsightsModule),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./shared/components/notifications/notifications.module').then((m) => m.NotificationsModule),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./shared/components/profile/profile.module').then((m) => m.ProfileModule),
      },
    ],
  },
  { path: '**', redirectTo: 'user/login' },
];
