import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundService } from '../../../core/services/fund.service';
import { PdfViewerService } from '../../../shared/services/pdf-viewer.service';

@Component({
  selector: 'app-documents-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-grid.component.html',
  styleUrls: ['./documents-grid.component.scss']
})
export class DocumentsGridComponent implements OnChanges {
  @Input() maxDocuments: number | null = null;
  @Input() showViewToggle: boolean = true;
  @Input() documents: any[] = [];
  @Input() totalDocuments: number = 0;
  @Input() isLoading: boolean = false;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();
  @Output() loadMore = new EventEmitter<{ page: number; pageSize: number }>();

  private previousTotalDocuments: number = 0;

  public defaultBackground = 'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620'
  public typeBackgroundImages = [{
    type:'Drawdown Receipt',
    value:'https://api.builder.io/api/v1/image/assets/TEMP/be9ca3232984139ab8074fa047ab507acc3a62fb?width=620',
  },{type:'Quarterly Update Report',value:'https://api.builder.io/api/v1/image/assets/TEMP/7e4df20ed3436c041c1beeb4d7c9d2a08d7fea6b?width=620'}]

  viewMode: 'grid' | 'list' = 'grid';
  gridPageSize: number = 12;
  listPageSize: number = 10;
  Math = Math;

  constructor(
    private fundService: FundService,
    private pdfViewerService: PdfViewerService
  ){

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

  ngOnChanges(changes: SimpleChanges) {
    // Sync currentPage from parent input
    if (changes['currentPage']) {
      this.currentPage = changes['currentPage'].currentValue;
    }

    // Only reset page if totalDocuments changed (indicating a filter was applied)
    // Don't reset if we're just loading data for the current page
    if (changes['totalDocuments']) {
      const newTotal = changes['totalDocuments'].currentValue;
      const previousTotal = this.previousTotalDocuments;

      // Only reset to page 1 if totalDocuments changed significantly (filter applied)
      // Don't reset if totalDocuments is just loading the same filtered set
      if (previousTotal > 0 && newTotal !== previousTotal) {
        this.currentPage = 1;
      }
      this.previousTotalDocuments = newTotal;
    }
  }

  get currentPageSize(): number {
    return this.viewMode === 'grid' ? this.gridPageSize : this.listPageSize;
  }

  get displayedDocuments() {
    if (this.maxDocuments) {
      return this.documents.slice(0, this.maxDocuments);
    }

    // API already returns paginated data, so just return all documents
    // Do NOT slice again as the backend already handles pagination with offset/limit
    return this.documents;
  }

  get totalPages(): number {
    if (this.maxDocuments) {
      return Math.ceil(this.maxDocuments / this.currentPageSize);
    }
    const total = this.totalDocuments;
    return Math.ceil(total / this.currentPageSize);
  }

  get pages(): number[] {
    const pagesArray = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pagesArray.push(i);
    }
    return pagesArray;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get visiblePageNumbers(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }

  toggleView(mode: 'grid' | 'list') {
    this.viewMode = mode;
    this.currentPage = 1;
  }

  onPageChange(page: number) {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit({ page: this.currentPage, pageSize: this.currentPageSize });
    }
  }

  onNextPage() {
    if (this.hasNextPage) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  onPreviousPage() {
    if (this.hasPreviousPage) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  onLoadMore() {
    this.loadMore.emit({ page: this.currentPage + 1, pageSize: this.currentPageSize });
  }

  async onView(document: any) {
    const fileName = document.type || document.title || 'document.pdf';
   
    // Use the same path as download
    if (document.guid) {
      let  response = await this.fundService.downloadDocument(document.guid);
      // Construct the download/view path using the same endpoint as download
      // const documentPath = this.fundService.getDocumentDownloadPath(document.guid);
      this.pdfViewerService.openPdfBlob(response, `${fileName}.pdf`);
      // this.pdfViewerService.openPdf(documentPath, `${fileName}.pdf`);
    } else if (document.url) {
      this.pdfViewerService.openPdf(document.url, `${fileName}.pdf`);
    } else if (document.blob) {
      this.pdfViewerService.openPdfBlob(document.blob, `${fileName}.pdf`);
    } else {
      console.warn('No path, URL or blob available for document:', document);
    }
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
