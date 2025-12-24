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
  totalHoldings: string;
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
   @Input() public loadType:string = 'INVESTMENT_PORTFOLIO,TOTAL_INVESTMENT_PORTFOLIO,ALL_INVESTMENTS';
  @Input() portfolioSummary: PortfolioSummary;
  @Input() showHeader!: boolean;
  @Input() showPortfolioSummary!: boolean;
  @Input() showStaticContent!: boolean;
  @Input() limit!: number | null;
  @Input() containerClass: 'container' | 'container-fluid' = 'container';
  @Input() public latestPortfolio:boolean = false
  companies: Company[] = [];
  fundConfig: Map<unknown, unknown>;
  selectedFund: any;

  private maxWeight = Math.max(...this.companies.map((company) => company.weight ? parseFloat(company.weight) : 0));
  private progressCache = new Map<number, number>();
  asOfDate: string;
  public portfolioInvestment: {};
  public totalMaxWeight: number;
  fundCurrency: any='INR';
  fundUnit:any='Cr';

  // Sort properties
  sortField: string = 'weight';
  sortDirection: 'asc' | 'desc' = 'desc';
  showSortMenu: boolean = false;

  sortOptions = [
    { field: 'weight', label: 'Weight (Highest First)', type: 'numeric' },
    { field: 'name', label: 'Company Name (A-Z)', type: 'alphabetical' },
    { field: 'industry', label: 'Industry (A-Z)', type: 'alphabetical' },
    { field: 'unrealisedCost', label: 'Investment Amount', type: 'numeric' },
    { field: 'unrealisedPrice', label: 'Market Value', type: 'numeric' },
    { field: 'unrealisedIRR', label: 'IRR', type: 'numeric' },
    { field: 'unrealisedMOIC', label: 'MOIC', type: 'numeric' },
  ];

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

  toggleSortMenu(): void {
    this.showSortMenu = !this.showSortMenu;
  }

  closeSortMenu(): void {
    this.showSortMenu = false;
  }

  setSortOption(field: string, type: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = field === 'weight' || type === 'numeric' ? 'desc' : 'asc';
    }
    this.sortCompanies();
    this.closeSortMenu();
  }

  sortCompanies(): void {
    const fieldKey = this.sortField as keyof Company;

    this.companies.sort((a, b) => {
      let aVal = a[fieldKey];
      let bVal = b[fieldKey];

      if (aVal === '-' || aVal === null || aVal === undefined) aVal = '';
      if (bVal === '-' || bVal === null || bVal === undefined) bVal = '';

      let comparison = 0;

      const sortOption = this.sortOptions.find(opt => opt.field === this.sortField);
      const isNumeric = sortOption?.type === 'numeric' || this.isNumericField(this.sortField);

      if (isNumeric) {
        const numA = parseFloat(String(aVal)) || 0;
        const numB = parseFloat(String(bVal)) || 0;
        comparison = numA - numB;
      } else {
        const strA = String(aVal).toLowerCase().trim();
        const strB = String(bVal).toLowerCase().trim();
        comparison = strA.localeCompare(strB);
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  private isNumericField(field: string): boolean {
    const numericFields = ['unrealisedCost', 'unrealisedPrice', 'unrealisedIRR', 'unrealisedMOIC', 'weight'];
    return numericFields.includes(field);
  }


  ngOnInit(): void {
    if(this.latestPortfolio){
      this.getStoreDataFund();
    }else {
      this.getStoreData();
    }
    
  }

  getPortfolioData(){
    let queryParams = {asOnDate:this.asOfDate,type:this.loadType,currentAsOnDate:this.asOfDate};
    if(this.limit){
      queryParams['limit'] = this.limit.toString();
    }
    this.fundService.portfolioData(this.selectedFund.guid, queryParams).subscribe({
      next: (response) => {
        console.log('Portfolio Data fetched successfully:', response);
        this.companies = response.portfolio && response.portfolio.investment_portfolio ? response.portfolio.investment_portfolio : [];
        if(response.portfolio && response.portfolio.investment_portfolio){
          this.portfolioInvestment = {
            unrealisedIRR:
              response.portfolio.investment_portfolio &&
              response.portfolio.investment_portfolio.unrealisedIRR
                ? response.portfolio.investment_portfolio.unrealisedIRR.toFixed(2)
                : '-',
            unrealisedMOIC:
              response.portfolio.investment_portfolio &&
              response.portfolio.investment_portfolio.unrealisedMOIC
                ? response.portfolio.investment_portfolio.unrealisedMOIC.toFixed(2)
                : '-',
            weight:
              response.portfolio.investment_portfolio &&
              response.portfolio.investment_portfolio.weight
                ? response.portfolio.investment_portfolio.weight.toFixed(2)
                : '-',
          };
        }  
        if(response.portfolio && response.portfolio.total_investment_portfolio){
          const totalInvestment = response.portfolio.total_investment_portfolio.instrumentCost || 0;
          const totalMarketValue = response.portfolio.total_investment_portfolio.instrumentPrice || 0;
          const totalReturns = totalInvestment !== 0 && totalMarketValue !== 0 ? String(totalMarketValue - totalInvestment) : '-';

          this.portfolioSummary = {
            totalHoldings: response.portfolio.total_investment_portfolio.instrumentCost ? response.portfolio.total_investment_portfolio.instrumentCost : '-',
            totalInvestment: response.portfolio.total_investment_portfolio.instrumentCost ? response.portfolio.total_investment_portfolio.instrumentCost : '- ',
            totalMarketValue: response.portfolio.total_investment_portfolio.instrumentPrice ? response.portfolio.total_investment_portfolio.instrumentPrice : '-' ,
            totalGrossIRR: response.portfolio.total_investment_portfolio.instrumentIRR ? response.portfolio.total_investment_portfolio.instrumentIRR : '-'  ,
            totalGrossMOIC: response.portfolio.total_investment_portfolio.instrumentMOIC ? response.portfolio.total_investment_portfolio.instrumentMOIC : '-'   ,
            totalReturns: totalReturns,
          }
        }else {
          this.portfolioSummary = {
            totalHoldings: '-',
            totalInvestment: '-',
            totalMarketValue: '-',
            totalGrossIRR: '-',
            totalGrossMOIC: '-',
            totalReturns: '-'
          }
        }
        if(response.portfolio){

        }
        this.totalMaxWeight = this.companies.reduce((acc, curr) => acc + (+curr.weight || 0), 0);
        console.log(this.totalMaxWeight,"totalmax");

        // Sort companies by weight (highest first) by default
        this.sortCompanies();

        // this.companies = portfolioInvestment.map(data => {
        //   if (data.value && data.value != '-' && +data.value) {
        //     if (this.calculateToata.includes(this.LOADTYPE)) {
        //       this.totalCal = +data.value + +(this.totalCal ? +this.totalCal : 0);


        //     }
        //     if (this.barMax) {
        //       data['barWidth'] = (+data.value / maxValue) * 100
        //     } else {
        //       data['barWidth'] = data.value
        //     }
        //     if (this.multiples.includes(this.LOADTYPE)) {
        //       data.value = +data.value * 100
        //     } else if (this.weight) {
        //       data.value = +data.value * 100
        //     } else if (this.pmsJsonVersion == 2) {
        //       data.value = +data.value / 100
        //     }
        //     data.value = this.numberFormate.transform(data.value) + '%'
        //   } else {
        //     data.value = '-'
        //     data['barWidth'] = 0
        //   }
        //   if (this.subHeader2) {
        //     if (data['total_return']) {
        //       if (this.multiples.includes(this.LOADTYPE)) {
        //         data.total_return = +data.total_return * 100
        //       } else if (this.weight) {
        //         data.total_return = +data.total_return * 100
        //       }
        //       data.total_return = this.numberFormate.transform(data.total_return) + '%'
        //     } else {
        //       data['total_return'] = '-'
        //     }
        //   }

        //   return data
        // });
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
      this.fundCurrency = this.fundConfig.get('fund_currency');
      this.fundUnit = this.fundConfig.get('fund_size_unit');
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

  getAsOfDate(){
  this.fundService.getDates(this.selectedFund.guid,'PORTFOLIO').subscribe(perfDates => {
      const perfDate = perfDates.dates;
      this.companies = []
      this.portfolioSummary = {
         totalHoldings:null,
    totalInvestment:null,
    totalMarketValue: null,
    totalGrossIRR: null,
    totalGrossMOIC:null,
    totalReturns: null
      }
      this.portfolioInvestment = {}
      if(perfDate && perfDate.length){
        this.asOfDate = perfDate[0];
        this.getPortfolioData();
      }

    });
  }

  getStoreDataFund(){
       this.store.select(selectFundData).subscribe(fundData => {
      console.log('Fund State from Store:', fundData);
      this.selectedFund=fundData;
         this.getAsOfDate();
    })
  }
  
}
