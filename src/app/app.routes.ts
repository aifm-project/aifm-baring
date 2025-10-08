import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
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
  { path: '**', redirectTo: 'dashboard' },
];
