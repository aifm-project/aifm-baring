import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documents-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-grid.component.html',
  styleUrls: ['./documents-grid.component.scss']
})
export class DocumentsGridComponent {
  @Input() maxDocuments: number | null = null;
  @Input() showViewToggle: boolean = true;
  @Input() documents: any[] = [];

  viewMode: 'grid' | 'list' = 'grid';
  ngOnInit() {
    // If no documents provided via Input, use default sample data
    if (this.documents.length === 0) {
      this.documents = [
        {
          title: 'Drawdown Receipt',
          date: '23 July 2025',
          size: '14 KB',
          type: 'pdf',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          title: 'Statement of Account',
          date: '20 July 2025',
          size: '14 KB',
          type: 'pdf',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          title: 'Quarterly Update Report',
          date: '09 July 2025',
          size: '14 KB',
          type: 'pdf',
          bgImage: 'https://cdn.builder.io/api/v1/image/assets%2F563a90ce06cf47e7b58977a93621d124%2F01914b9d6f024348a2f20aaf19ae6542?format=webp&width=800'
        },
        {
          title: 'Income Statement',
          date: '02 July 2025',
          size: '14 KB',
          type: 'pdf',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          title: 'K1 Certificate',
          date: '07 May 2025',
          size: '14 KB',
          type: 'pdf',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          title: 'Drawdown Notice',
          date: '12 March 2025',
          size: '14 KB',
          type: 'pdf',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          title: 'Form 64C',
          date: '02 Dec 2024',
          size: '14 KB',
          type: 'pdf',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        }
      ];
    }
  }

  get displayedDocuments() {
    return this.maxDocuments ? this.documents.slice(0, this.maxDocuments) : this.documents;
  }

  toggleView(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  onView(document: any) {
    console.log('View document:', document.title);
  }

  onDownload(document: any) {
    console.log('Download document:', document.title);
  }

  onAISummary(document: any) {
    console.log('AI Summary for document:', document.title);
  }
}
