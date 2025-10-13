import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FundSelectorComponent } from '../../shared/components/fund-selector/fund-selector.component';
import { NewsletterComponent } from '../../shared/components/newsletter/newsletter.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [
    NavbarComponent,
    FundSelectorComponent,
    RouterOutlet,
    NewsletterComponent,
    FooterComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <app-fund-selector></app-fund-selector>
    <router-outlet></router-outlet>
    <app-newsletter></app-newsletter>
    <app-footer></app-footer>
  `,
})
export class AuthenticatedLayoutComponent {}
