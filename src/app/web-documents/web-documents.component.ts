import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { FundSelectorComponent } from '../shared/components/fund-selector/fund-selector.component';
import { DocumentsGridComponent } from './components/documents-grid/documents-grid.component';
import { NewsletterComponent } from '../shared/components/newsletter/newsletter.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-web-documents',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FundSelectorComponent,
    DocumentsGridComponent,
    NewsletterComponent,
    FooterComponent,
  ],
  templateUrl: './web-documents.component.html',
})
export class WebDocumentsComponent {}
