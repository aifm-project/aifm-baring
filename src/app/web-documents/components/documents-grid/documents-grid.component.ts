import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundService } from '../../../core/services/fund.service';

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
  public defaultBackground = 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
  public typeBackgroundImages = [{
    type:'Drawdown Receipt',
    value:'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620',
  },{type:'Quarterly Update Report',value:'https://api.builder.io/api/v1/image/assets/TEMP/7e4df20ed3436c041c1beeb4d7c9d2a08d7fea6b?width=620'}]

  viewMode: 'grid' | 'list' = 'grid';
  constructor(private fundService:FundService){

  }
  ngOnInit() {
    // If no documents provided via Input, use default sample data
    if (this.documents.length === 0) {
      this.documents = [
        {
          type: 'Drawdown Receipt',
          date: '2025-11-14',
          size: '14 KB',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          type: 'Statement of Account',
          date: '2025-11-14',
          size: '14 KB',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          type: 'Quarterly Update Report',
          date: '2025-11-14',
          size: '14 KB',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/7e4df20ed3436c041c1beeb4d7c9d2a08d7fea6b?width=620'
        },
        {
          type: 'Income Statement',
          date: '2025-11-14',
          size: '14 KB',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          type: 'K1 Certificate',
          date: '2025-11-14',
          size: '14 KB',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          type: 'Drawdown Notice',
          date: '2025-11-14',
          size: '14 KB',
          bgImage: 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
        },
        {
          type: 'Form 64C',
          date: '2025-11-14',
          size: '14 KB',
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

  getBackgrounUrl(type){
    let url = this.typeBackgroundImages.find(sk=>sk.type==type)?.value
    if(url){
      return url
    }else {
      return this.defaultBackground
    }
  }

    async onDownloadDocument(document: any) {

    console.log('Download document:', document.title);
    if(document.guid){
       let response = await this.fundService.downloadDocument(document.guid);
    this.fundService.downloadContent(response, document.name);
    }
   
  }
}
