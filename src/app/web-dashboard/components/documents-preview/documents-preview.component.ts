import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundService } from '../../../core/services/fund.service';
import { Store } from '@ngrx/store';
import { selectFundData, setDocumentData } from '../../../store/fund';

@Component({
  selector: 'app-documents-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-preview.component.html',
  styleUrls: ['./documents-preview.component.scss']
})
export class DocumentsPreviewComponent {
  documents = [];
  fundConfig: any;
  selectedFund: any;

  constructor(private fundService: FundService, private store: Store) { }
  ngOnInit(): void {
    this.getStoreData()
  }

  onViewAllDocuments() {
    // Navigate to documents page
    console.log('Navigate to documents page');
  }

  onViewDocument(document: any) {
    console.log('View document:', document.title);
  }

  async onDownloadDocument(document: any) {
    console.log('Download document:', document.title);
    let response = await this.fundService.downloadDocument(document.guid);
    this.fundService.downloadContent(response, document.name);
  }

  getDocumentList() {
    this.fundService.getDocuments(this.selectedFund.guid).subscribe({
      next: (response) => {
        let reducebyTYpe = response.documents.reduce((acc, doc) => {
          acc[doc.type] = [...(acc[doc.type] || []), doc];
          return acc;
        }, {});
        console.log('Document count by type:', reducebyTYpe);
        let limit = 4;
        for (const element of Object.entries(reducebyTYpe)) {
            this.documents.push({
              ...element[1][0],
              title: element[0],
            })
        }
        this.documents = this.documents.slice(0, limit);
        this.store.dispatch(setDocumentData({ documentData: this.documents }));
      },
      error: (error) => {
        console.error('Error fetching documents:', error);
      }
    });
  }

 getStoreData() {
    this.store.select(selectFundData).subscribe(fundState => {
      console.log('Fund State from Store:', fundState);
      this.selectedFund=fundState;
      this.fundConfig = fundState.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());
      console.log('Fund Configurations:', this.fundConfig);
      this.getDocumentList();
    })
  }
}
