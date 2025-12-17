import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentsGridComponent } from './components/documents-grid/documents-grid.component';
import { DocumentService } from '../core/services/document.service';
import { Store } from '@ngrx/store';
import { selectFundData } from '../store/fund';
import moment from 'moment';

@Component({
  selector: 'app-web-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, DocumentsGridComponent],
  templateUrl: './web-documents.component.html',
  styleUrls: ['./web-documents.component.scss']
})
export class WebDocumentsComponent {
  selectedFund: any;
  fundConfig: any;
  public documentTypes: any[] = [];
  public documentList: any = [];
  public allDocuments: any[] = [];
  loadDocConfig: { startDate: string; endDate: string; };
  selectedDocType: string = 'ALL';
  searchedKey: any;
  totalDocuments: number;
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
        this.selectedFund = fundState;
        this.fundConfig = fundState?.fund_configuration_classes.reduce((map, obj) => {
          map.set(obj.fund_key, obj.fund_value);
          return map;
        }, new Map<string, string>());
        this.getDocumentTypes();
        this.documentRangeChange({value:'l3m'})
      });
  }

  loadDocuments(config){
    this.documentService.loadDocuments(this.selectedFund.guid, config).subscribe((res)=>{
      console.log('Documents:', res);
      this.totalDocuments = res.count;
      this.allDocuments = res.data;
      
      if(this.searchedKey){
        this.searchDocuments(this.searchedKey)
      }else {
        this.documentList = res.data;
      }
    });
  }

  searchDocuments($event: any){
    // const searchTerm = value.toLowerCase();
    // this.searchedKey = searchTerm

    // if(this.searchedKey){
    //     this.documentList = this.allDocuments.filter(doc => doc.type.toLowerCase().includes(searchTerm) || doc.date==searchTerm);
    // }else {
    //   this.documentList = this.allDocuments
    // }
     console.log("documentType: ",$event.value)
    this.searchedKey = $event.value
    let config = this.loadDocConfig
    if($event.value!='ALL'){
      config['search'] = $event.value
    }else {
      delete config['search']
    }
    this.loadDocuments(config)
    
  }

  documentTypeChange($event){
    console.log("documentType: ",$event.value)
    this.selectedDocType = $event.value
    let config = this.loadDocConfig
    if($event.value!='ALL'){
      config['type'] = $event.value
    }else {
      delete config['type']
    }
    this.loadDocuments(config)
  }

  documentRangeChange($event){
    console.log("documentRangeChange",$event.value)
    let currentDate = new Date()
    let key = $event.value
    let config = {
      startDate:'',
      endDate:''
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
    if(this.selectedDocType!='ALL'){
      config['type'] = this.selectedDocType
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
    let config = {
      ...this.loadDocConfig,
      offset: pageInfo.page,
      limit: pageInfo.pageSize
    }
    this.loadDocuments(config);
  }
}
