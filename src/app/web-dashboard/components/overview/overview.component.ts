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
  imports: [CommonModule, SharedModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent {
  public overviewData: OverviewData = {
    capital_summary: {
      total_commitment: '-',
      total_value: '-',
      distribution: '-',
      capital_redeemed: '-',
      residual_value: '-',
      funded: '-',
      growth: '-',
      unfunded: '-'
    },
    metadata: {
      inception_date: '-',
      aum: '-',
      nav: '-',
      as_on_date: '-',
      benchmark_name: '-',
      units: '',
      residual_value: '-',
      return: '-',
      tvpi: '-',
      xirr: '-',
      commitment: '-'
    }
  };
  selectedFund: any;
  fundConfig: Map<string, string> = new Map<string, string>();
  asOfDate: any;
  private currencySymbol: string = '';
  private numberFormat: string = 'en-IN';
  private fundSizeUnit: string = ''
  constructor(
    private fundService: FundService,
    private store: Store,

  ) {
    this.store.select(selectFundData).subscribe(fundState => {
      if (fundState?.fund_configuration_classes?.length) {
        this.fundConfig = new Map(
          fundState.fund_configuration_classes.map(
            (item: any) => [item?.fund_key, item?.fund_value]
          )
        );
        this.currencySymbol = this.fundConfig.get('fund_currency') || 'INR';
        this.fundSizeUnit = this.fundConfig.get('fund_size_unit') || 'Cr';
        this.numberFormat = this.fundConfig.get('number_format') || 'en-IN';
      }
    });
  }

  ngOnInit() {
    this.getStoreData();
  }

  fetchFundOverview() {
    this.fundService.getPerformanceData({ fundGuid: this.selectedFund.guid, classGuid: this.selectedFund.guid, asOnDate: this.asOfDate }, 'CAPITAL_SUMMARY,METADATA').subscribe({
      next: (sk) => {
        console.log('Fund Performance Data:', sk);
        this.overviewData.capital_summary = sk.performance && sk.performance.capital_summary ? sk.performance.capital_summary : {};
        if(this.overviewData.capital_summary.hasOwnProperty('distribution')){
          let distribution = this.overviewData.capital_summary.distribution;
          let capital_redeemed = this.overviewData.capital_summary.capital_redeemed;
          let totalDistribution:any = ((+distribution) + (+capital_redeemed));
          this.overviewData.capital_summary.distribution = totalDistribution;
        }
        this.overviewData.metadata = sk.performance && sk.performance.metadata ? sk.performance.metadata : {};
        let tvpi  =  this.overviewData.metadata.tvpi ? Number( this.overviewData.metadata.tvpi) : '-'
        this.overviewData.metadata.tvpi = tvpi.toLocaleString(this.numberFormat, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })+'x';
        let xirr = this.overviewData.metadata.xirr ? Number(this.overviewData.metadata.xirr) : '-';
        this.overviewData.metadata.xirr = xirr!='-' ?  xirr.toLocaleString(this.numberFormat) + '%' : xirr;
        let units = this.overviewData.metadata.units ? Number(this.overviewData.metadata.units) : '-';
        this.overviewData.metadata.units = units.toLocaleString(this.numberFormat, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
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
      this.selectedFund = fundState.fundDetails;
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
