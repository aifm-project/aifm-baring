import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FundService } from '../../../core/services/fund.service';
import { Store } from '@ngrx/store';
import { selectSelectedDate } from '../../../store/date';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Tooltip } from 'bootstrap';

@Component({
  selector: 'app-portfolio-overview',
  standalone: true,
  imports: [CommonModule,SharedModule],
  templateUrl: './portfolio-overview.component.html',
  styleUrls: ['./portfolio-overview.component.scss'],
})
export class PortfolioOverviewComponent implements AfterViewInit {
  selectedFund: any;
  asOfDate: string;
  fundConfig: any;
  fundCurrency: any;
  fundUnit: any;
  totalOverViewInfo: any = {};

  // Dynamic tooltip properties
  infoIconAlt: string = 'Portfolio Overview Information';
  infoIconTitle: string = 'A high-level summary of all the companies or assets the fund has invested in and exited over a time period';

  @ViewChildren('infoIcon') infoIconElements!: QueryList<ElementRef>;
  constructor(private fundService: FundService, private store: Store){

  }

  ngOnInit(): void {
    this.getStoreData();
  }

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  private initializeTooltips() {
    // Initialize Bootstrap tooltips with responsive placement
    this.infoIconElements.forEach((element: ElementRef) => {
      const tooltipElement = element.nativeElement;
      new Tooltip(tooltipElement, {
        placement: 'auto',
        trigger: 'hover focus',
        html: false,
        delay: { show: 100, hide: 100 }
      });
    });
  }

  getStoreData() {
      this.store.select(selectSelectedDate).subscribe(fundState => {
        console.log('Fund State from Store:', fundState);
        this.selectedFund=fundState.fundDetails;
        this.asOfDate = fundState?.asOfDate;
         this.fundConfig = fundState.fundDetails?.fund_configuration_classes.reduce((map, obj) => {
          map.set(obj.fund_key, obj.fund_value);
          return map;
        }, new Map<string, string>());
        this.fundCurrency = this.fundConfig.get('fund_currency');
        this.fundUnit = this.fundConfig.get('fund_size_unit');
        console.log('Fund Configurations:', this.fundConfig);
        this.getPortfolioData();
      })
    }

   getPortfolioData(){
    let queryParams = {asOnDate:this.asOfDate,type:'ALL_INVESTMENTS',currentAsOnDate:'2023-10-31'};
    this.fundService.portfolioData(this.selectedFund.guid, queryParams).subscribe({
      next: (response) => {
        this.totalOverViewInfo = {}
        if(response && response.portfolio && response.portfolio['all_investments'] && response.portfolio['all_investments'].length){
          let lengthOfInvestMent = response.portfolio['all_investments'].length
          let lastElementData = response.portfolio['all_investments'][lengthOfInvestMent-1];
          if(lastElementData && lastElementData.name=='TOTAL'){
            this.totalOverViewInfo = lastElementData
          }else {
            this.totalOverViewInfo = {}
          }
        }
      },
      error: (error) => {
        console.error('Error fetching Portfolio Data:', error);
      }
    });
  }
  
}
