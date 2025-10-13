import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentsGridComponent } from './components/documents-grid/documents-grid.component';

@Component({
  selector: 'app-web-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, DocumentsGridComponent],
  templateUrl: './web-documents.component.html',
})
export class WebDocumentsComponent {}
