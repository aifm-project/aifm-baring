import { Component } from '@angular/core';
import { FundService } from '../../../core/services/fund.service';
import { selectFundData } from '../../../store/fund';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { selectDateState, selectSelectedDate } from '../../../store/date';

interface OverviewData {
  capital_summary: {
    total_commitment: string;
    total_value: string;
    distribution: string;
    capital_redeemed: string;
    residual_value: string;
    funded: string;
    growth: string;
    unfunded: string;
  },
metadata: {
  inception_date: string;
  aum: string;
  nav: string;
  as_on_date: string;
  benchmark_name: string;
  units: string;
  residual_value: string;
  return: string;
  tvpi: string;
  xirr: string;
  commitment: string;
}
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule,SharedModule],
templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {
  public overviewData: OverviewData = {
    capital_summary: {
      total_commitment: 'N/A',
      total_value: 'N/A',
      distribution: 'N/A',
      capital_redeemed: 'N/A',
      residual_value: 'N/A',
      funded: 'N/A',
      growth: 'N/A',
      unfunded: 'N/A'
    },
    metadata: {
      inception_date: 'N/A',
      aum: 'N/A',
      nav: 'N/A',
      as_on_date: 'N/A',
      benchmark_name: 'N/A',
      units: 'N/A',
      residual_value: 'N/A',
      return: 'N/A',
      tvpi: 'N/A',
      xirr: 'N/A',
      commitment: 'N/A'
    }
  };
  selectedFund: any;
  fundConfig: Map<string, string>=new  Map<string, string>();
  numberFormat: string;
  asOfDate: any;
  constructor(private fundService: FundService, private store: Store) {}

  ngOnInit() {
    this.getStoreData();
  }

  fetchFundOverview() {
    this.fundService.getPerformanceData({ fundGuid: this.selectedFund.guid, classGuid: this.selectedFund.guid, asOnDate: this.asOfDate },'CAPITAL_SUMMARY,METADATA').subscribe({
      next: (sk) => {
        console.log('Fund Performance Data:', sk);
        this.overviewData.capital_summary = sk.performance && sk.performance.capital_summary ? sk.performance.capital_summary : {};
        this.overviewData.metadata = sk.performance && sk.performance.metadata ? sk.performance.metadata : {};
      },
      error: (error) => {
        // Handle error response
      }
    });
  }
  getStoreData() {
    this.store.select(selectSelectedDate).subscribe(fundState => {
      console.log('Fund State from Store:', fundState);
      this.asOfDate = fundState?.asOfDate;
      this.selectedFund=fundState.fundDetails;
      this.fundConfig = fundState.fundDetails?.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());
      
      console.log('Fund Configurations sk:', this.fundConfig);
     this.numberFormat = this.fundConfig.get("number_format");
      this.fetchFundOverview();
    })
  }
}
