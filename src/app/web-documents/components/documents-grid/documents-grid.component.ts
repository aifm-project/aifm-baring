import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documents-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-grid.component.html',
})
export class DocumentsGridComponent {
  documents = [
    {
      title: 'Drawdown Receipt',
      date: 'Issued on 23 July 2025',
      size: '14 KB',
      type: 'pdf',
      bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
    },
    {
      title: 'Statement of Account',
      date: 'Issued on 23 July 2025',
      size: '14 KB',
      type: 'pdf',
      bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
    },
    {
      title: 'Quarterly Update Report',
      date: 'Issued on 23 July 2025',
      size: '14 KB',
      type: 'pdf',
      bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/7e4df20ed3436c041c1beeb4d7c9d2a08d7fea6b?width=620'
    },
    {
      title: 'Income Statement',
      date: 'Issued on 23 July 2025',
      size: '14 KB',
      type: 'pdf',
      bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
    },
    {
      title: 'K1 Certificate',
      date: 'Issued on 23 July 2025',
      size: '14 KB',
      type: 'pdf',
      bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
    },
    {
      title: 'Drawdown Notice',
      date: 'Issued on 23 July 2025',
      size: '14 KB',
      type: 'pdf',
      bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
    },
    {
      title: 'Form 64C',
      date: 'Issued on 23 July 2025',
      size: '14 KB',
      type: 'pdf',
      bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
    }
  ];

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
