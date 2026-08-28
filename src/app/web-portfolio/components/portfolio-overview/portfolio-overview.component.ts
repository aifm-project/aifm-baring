import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef, DestroyRef, inject } from '@angular/core';
import { FundService } from '../../../core/services/fund.service';
import { Store } from '@ngrx/store';
import { selectSelectedDate } from '../../../store/date';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Tooltip } from 'bootstrap';
import { selectedFundDate$ } from '../../../shared/rxjs/selected-fund-date';
import { TASK } from '../../../core/loading/readiness.model';
import { ReadinessService } from '../../../core/loading/readiness.service';

@Component({
  selector: 'app-portfolio-overview',
  standalone: true,
  imports: [CommonModule,SharedModule],
  templateUrl: './portfolio-overview.component.html',
  styleUrls: ['./portfolio-overview.component.scss'],
})
export class PortfolioOverviewComponent implements AfterViewInit {
  private readonly readiness = inject(ReadinessService);
  /**
   * True while this section's own request is in flight. Starts true so the window
   * before the first request is issued reads as "loading" rather than as empty data.
   * Scoped per component so one slow section can never block a sibling.
   */
  isLoading = true;

  private readonly destroyRef = inject(DestroyRef);
  selectedFund: any;
  asOfDate: string;
  fundConfig: any;
  fundCurrency: any;
  fundUnit: any;
  totalOverViewInfo: any = {};

  // Dynamic tooltip properties
  infoIconAlt: string = 'Portfolio Overview Information';
  infoIconTitle: string = 'A high-level summary of all the companies or assets the fund has invested in and exited over a time period';
  totalInvestedInfoAlt: string = 'Total Invested Information';
  totalInvestedInfoTitle: string = 'Total capital invested by the fund since inception, including both current holdings and fully exited investments';

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
      selectedFundDate$(this.store, this.destroyRef).subscribe(fundState => {
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
    const issuedEpoch = this.readiness.epoch();
    this.isLoading = true;
    // Same API call (endpoint + type) as app-investment-table's default loadType,
    // so the two components never diverge on Total Market Value / Investment / MOIC / Gain.
    let queryParams = {asOnDate:this.asOfDate,type:'INVESTMENT_PORTFOLIO,TOTAL_INVESTMENT_PORTFOLIO,ALL_INVESTMENTS',currentAsOnDate:this.asOfDate};
    this.fundService.portfolioData(this.selectedFund.guid, queryParams, TASK.PORTFOLIO_SUMMARY).subscribe({
      next: (response) => {
      // Stale-response guard. Components fire their fetch from inside a store
      // subscriber and nothing aborts the previous request, so a slow response for
      // the fund the user just left can still land here. Without this it overwrites
      // the current fund's figures - one fund's numbers under another fund's name,
      // visually identical to a correct screen.
        if (issuedEpoch !== this.readiness.epoch()) return;
        this.isLoading = false;
        this.totalOverViewInfo = {}
        const totals = response && response.portfolio && response.portfolio.total_investment_portfolio;
        if (totals) {
          const totalInvestment = totals.instrumentCost || 0;
          const totalMarketValue = totals.instrumentPrice || 0;
          this.totalOverViewInfo = {
            total_value: totals.instrumentPrice ? totals.instrumentPrice : '-',   // Total Market Value -> Total Portfolio Value
            total_cost: totals.instrumentCost ? totals.instrumentCost : '-',      // Total Investment -> Total Invested
            moic: totals.instrumentMOIC ? totals.instrumentMOIC : '-',            // Total Gross MOIC -> Overall MOIC
            totalGain: totalInvestment && totalMarketValue ? totalMarketValue - totalInvestment : '-', // Absolute Gain -> Total Gains
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching Portfolio Data:', error);
      }
    });
  }
  
}
