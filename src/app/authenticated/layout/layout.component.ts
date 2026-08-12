import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FundSelectorComponent } from '../../shared/components/fund-selector/fund-selector.component';
import { NewsletterComponent } from '../../shared/components/newsletter/newsletter.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { PdfViewerComponent } from '../../shared/components/pdf-viewer/pdf-viewer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    NavbarComponent,
    FundSelectorComponent,
    RouterOutlet,
    FooterComponent,
    PdfViewerComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-navbar></app-navbar>
    <app-fund-selector *ngIf="!isNewsAndInsightsPage() && !isNotificationPage() && !isProfilePage()"></app-fund-selector>
    <router-outlet></router-outlet>
    <app-pdf-viewer></app-pdf-viewer>
    <!-- <app-newsletter></app-newsletter>  NewsletterComponent-->
    <app-footer></app-footer>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuthenticatedLayoutComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setupScrollToTop();
  }

  private setupScrollToTop(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        window.scrollTo(0, 0);
      });
  }

  isNewsAndInsightsPage(): boolean {
    return this.router.url.includes('/insights');
  }
  isNotificationPage(): boolean {
    return this.router.url.includes('/notifications');
  }
  isProfilePage(): boolean {
    return this.router.url.includes('/profile');
  }
}
