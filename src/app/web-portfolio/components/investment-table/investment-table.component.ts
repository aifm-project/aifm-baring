import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundService } from '../../../core/services/fund.service';
import { selectFundData } from '../../../store/fund';
import { Store } from '@ngrx/store';
import { SharedModule } from '../../../shared/shared.module';
import { selectSelectedDate } from '../../../store/date';

export interface MonetaryValue {
  symbol: string;
  amount: string;
  unit: string;
}

export interface PercentageValue {
  value: string;
  suffix: string;
}

export interface Company {
  id: number;
  fund_guid: string | null;
  logo: string;
  name: string;
  investmentType: string;
  industry: string;
  realisedCost: string;
  realisedPrice: string;
  realisedCostGraphValue: string;
  realisedPriceGraphValue: string;
  realisedMOIC: string;
  realisedIRR: string | null;
  unrealisedCost: string;
  unrealisedCostGraphValue: string;
  unrealisedPrice: string;
  unrealisedPriceGraphValue: string;
  unrealisedMOIC: string;
  unrealisedIRR: string | null;
  weight: string;
  status: string;
}

export interface PortfolioSummary {
  totalHoldings: number;
  totalInvestment: string;
  totalMarketValue: string;
  totalGrossIRR: string;
  totalGrossMOIC: string;
  totalReturns: string;
}

@Component({
  selector: 'app-investment-table',
  standalone: true,
  imports: [CommonModule,SharedModule],
  templateUrl: './investment-table.component.html',
  styleUrls: ['./investment-table.component.scss']
})
export class InvestmentTableComponent implements OnInit {

  @Input() portfolioSummary: PortfolioSummary = {
    totalHoldings: 20,
    totalInvestment: '₹985.12 Cr',
    totalMarketValue: '₹1300.07 Cr',
    totalGrossIRR: '20.04%',
    totalGrossMOIC: '1.32X',
    totalReturns: '₹349.94 Cr'
  };
  @Input() showHeader!: boolean;
  @Input() showPortfolioSummary!: boolean;
  @Input() showStaticContent!: boolean;
  @Input() limit!: number | null;
  @Input() containerClass: 'container' | 'container-fluid' = 'container';

  companies: Company[] = [];
  fundConfig: Map<unknown, unknown>;
  selectedFund: any;

  private maxWeight = Math.max(...this.companies.map((company) => company.weight ? parseFloat(company.weight) : 0));
  private progressCache = new Map<number, number>();
  asOfDate: string;
  constructor(private fundService: FundService, private store: Store) { }
  getProgressPercent(weightPercent: number): number {
    if (this.progressCache.has(weightPercent)) {
      return this.progressCache.get(weightPercent)!;
    }

    if (!Number.isFinite(weightPercent) || weightPercent <= 0) {
      return 0;
    }

    const percent = Math.min((weightPercent / this.maxWeight) * 100, 100);
    this.progressCache.set(weightPercent, percent);
    return percent;
  }

  hasMonetaryValue(value: MonetaryValue): boolean {
    return value.amount.trim() !== '-' && value.amount.trim() !== '';
  }

  hasPercentageValue(value: PercentageValue): boolean {
    return value.value.trim() !== '-' && value.value.trim() !== '';
  }

  trackByCompany(index: number, company: Company): string {
    return company.name;
  }

  ngOnInit(): void {
    this.getStoreData();
  }

  getPortfolioData(){
    let queryParams = {asOnDate:this.asOfDate,type:'INVESTMENT_PORTFOLIO,TOTAL_INVESTMENT_PORTFOLIO',currentAsOnDate:'2023-10-31'};
    if(this.limit){
      queryParams['limit'] = this.limit.toString();
    }
    this.fundService.portfolioData(this.selectedFund.guid, queryParams).subscribe({
      next: (response) => {
        console.log('Portfolio Data fetched successfully:', response);
        this.companies = response.portfolio && response.portfolio.investment_portfolio ? response.portfolio.investment_portfolio : [];

        if(response.portfolio && response.portfolio.total_investment_portfolio){
          this.portfolioSummary = {
            totalHoldings: response.portfolio.total_investment_portfolio.total_holdings,
            totalInvestment: response.portfolio.total_investment_portfolio.total_investment,
            totalMarketValue: response.portfolio.total_investment_portfolio.total_market_value,
            totalGrossIRR: response.portfolio.total_investment_portfolio.total_gross_irr,
            totalGrossMOIC: response.portfolio.total_investment_portfolio.total_gross_moic,
            totalReturns: response.portfolio.total_investment_portfolio.total_returns
          }
        }
      },
      error: (error) => {
        console.error('Error fetching Portfolio Data:', error);
      }
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
      console.log('Fund Configurations:', this.fundConfig);
      this.getPortfolioData();
    })
  }

  get limitedCompanies(): Company[] {
    if (this.limit != null && this.limit > 0) {
      return this.companies.slice(0, this.limit);
    }
    return this.companies;
  }
}
