import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentsGridComponent } from './components/documents-grid/documents-grid.component';
import { DocumentService } from '../core/services/document.service';
import { Store } from '@ngrx/store';
import { selectFundData } from '../store/fund';
import moment from 'moment';

@Component({
  selector: 'app-web-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DocumentsGridComponent],
  templateUrl: './web-documents.component.html',
  styleUrls: ['./web-documents.component.scss']
})
export class WebDocumentsComponent {
  selectedFund: any;
  fundConfig: any;
  previousFundGuid: string = '';
  public documentTypes: any[] = [];
  public documentList: any = [];
  public allDocuments: any[] = [];
  loadDocConfig: any = { startDate: '', endDate: '', offset: 0, limit: 12 };
  selectedDocType: string = 'ALL';
  selectedDateRange: string = 'l3m';
  searchedKey: any = '';
  totalDocuments: number;
  currentPage: number = 1;
  currentPageSize: number = 12;
  constructor(private documentService:DocumentService, private store: Store) {}


  ngOnInit() {
    this.getStoreData();
  }


  getDocumentTypes(){
    this.documentService.getDocumentTypes(this.selectedFund.guid).subscribe((res)=>{
      this.documentTypes = res.data?.map(sk=>sk.document_type) || []
      console.log('Document Types:', res);
    });
  }

  getStoreData() {
      this.store.select(selectFundData).subscribe((fundState) => {
        if (fundState && fundState.guid) {
          const fundGuidChanged = this.previousFundGuid && this.previousFundGuid !== fundState.guid;

          this.selectedFund = fundState;

          this.fundConfig = fundState?.fund_configuration_classes.reduce((map, obj) => {
            map.set(obj.fund_key, obj.fund_value);
            return map;
          }, new Map<string, string>());

          if (fundGuidChanged) {
            console.log('Fund changed from', this.previousFundGuid, 'to', fundState.guid, '- Resetting filters');
            this.resetFiltersToDefault();
          } else if (!this.previousFundGuid) {
            console.log('Initial load - Setting default filters');
            this.getDocumentTypes();
            this.documentRangeChange({value:'l3m'})
          }

          this.previousFundGuid = fundState.guid;
        }
      });
  }

  resetFiltersToDefault() {
    this.selectedDocType = 'ALL';
    this.selectedDateRange = 'l3m';
    this.searchedKey = '';
    this.currentPage = 1;
    this.currentPageSize = 12;
    this.loadDocConfig = { startDate: '', endDate: '', offset: 0, limit: 12 };
    this.getDocumentTypes();
    this.documentRangeChange({value:'l3m'})
  }

  loadDocuments(config){
    this.documentService.loadDocuments(this.selectedFund.guid, config).subscribe((res)=>{
      console.log('Documents:', res);
      this.totalDocuments = res.count;
      this.allDocuments = res.data;
      
      this.documentList = res.data
    });
  }

  searchDocuments(searchValue: any){
    const value = typeof searchValue === 'object' && searchValue.value ? searchValue.value : searchValue;
    console.log("searchValue: ", value)
    this.searchedKey = value
    this.currentPage = 1;
    this.currentPageSize = 12;
    let config = { ...this.loadDocConfig }
    config['offset'] = 0;
    config['limit'] = 12;
    if(value && value.toString().trim() !== ''){
      config['search'] = value
    }else {
      delete config['search']
    }
    if(this.selectedDocType !== 'ALL'){
      config['type'] = this.selectedDocType
    }
    this.loadDocConfig = config
    this.loadDocuments(config)
  }

  documentTypeChange($event){
    const value = typeof $event === 'object' ? $event.value : $event;
    console.log("documentType: ", value)
    this.selectedDocType = value
    this.currentPage = 1;
    this.currentPageSize = 12;
    let config = { ...this.loadDocConfig }
    config['offset'] = 0;
    config['limit'] = 12;
    if(value !== 'ALL'){
      config['type'] = value
    }else {
      delete config['type']
    }
    if(this.searchedKey && this.searchedKey.toString().trim() !== ''){
      config['search'] = this.searchedKey
    }
    this.loadDocConfig = config
    this.loadDocuments(config)
  }

  documentRangeChange($event){
    const value = typeof $event === 'object' ? $event.value : $event;
    console.log("documentRangeChange", value)
    this.selectedDateRange = value;
    this.currentPage = 1;
    this.currentPageSize = 12;
    let currentDate = new Date()
    let key = value
    let config = {
      startDate:'',
      endDate:'',
      offset: 0,
      limit: 12
    }
    if(key=='cm'){
      config.endDate = moment(currentDate).startOf('month').format('YYYY-MM-DD');
      config.startDate = moment(currentDate).endOf('month').format('YYYY-MM-DD');
    }else if(key=='lm'){
      config.endDate = moment(currentDate).subtract(1,'M').startOf('month').format('YYYY-MM-DD');
      config.startDate = moment(currentDate).subtract(1,'M').endOf('month').format('YYYY-MM-DD');
    }else if(key=='l3m'){
      config.endDate = moment(currentDate).subtract(3,'M').startOf('month').format('YYYY-MM-DD');
      config.startDate = moment(currentDate).endOf('month').format('YYYY-MM-DD');
    }else if(key=='l6m'){
      config.endDate = moment(currentDate).subtract(6,'M').startOf('month').format('YYYY-MM-DD');
      config.startDate = moment(currentDate).endOf('month').format('YYYY-MM-DD');
    }else {
      config.endDate = moment('2015-01-01').startOf('month').format('YYYY-MM-DD');
      config.startDate = moment(currentDate).endOf('month').format('YYYY-MM-DD');
    }
    if(this.selectedDocType !== 'ALL'){
      config['type'] = this.selectedDocType
    }
    if(this.searchedKey && this.searchedKey.toString().trim() !== ''){
      config['search'] = this.searchedKey
    }
    this.loadDocConfig = config
    this.loadDocuments(config)
  }

  onPreviousPage($event) {
    console.log('Previous page requested');
  }

  onNextPage($event) {
    console.log('Next page requested');
  }

  onPageChange(pageInfo){
    console.log('Page change requested:', pageInfo);
    this.currentPage = pageInfo.page;
    this.currentPageSize = pageInfo.pageSize;
    const offset = (pageInfo.page -1);
    let config = {
      ...this.loadDocConfig,
      offset: offset,
      limit: pageInfo.pageSize
    }
    this.loadDocuments(config);
  }
}
