import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FundSelectorComponent } from '../../shared/components/fund-selector/fund-selector.component';
import { NewsletterComponent } from '../../shared/components/newsletter/newsletter.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { PdfViewerComponent } from '../../shared/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FundSelectorComponent,
    RouterOutlet,
    NewsletterComponent,
    FooterComponent,
    PdfViewerComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <app-fund-selector *ngIf="!isNewsAndInsightsPage()"></app-fund-selector>
    <router-outlet></router-outlet>
    <app-pdf-viewer></app-pdf-viewer>
    <app-newsletter></app-newsletter>
    <app-footer></app-footer>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuthenticatedLayoutComponent {
  constructor(private router: Router) {}

  isNewsAndInsightsPage(): boolean {
    return this.router.url.includes('/insights');
  }
}
