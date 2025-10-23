import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartModule } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { selectFundData, selectFundState } from '../../../store/fund';
import { Store } from '@ngrx/store';
import { FundService } from '../../../core/services/fund.service';
import moment from 'moment';
import { GetCurrencyByUnitsPipe } from '../../../shared/pipe/get-currency-by-units.pipe';
import { selectDateState, selectSelectedDate } from '../../../store/date';
import { SharedModule } from '../../../shared/shared.module';
interface ChartDataPoint {
  x: number;
  y: number;
}
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
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, ChartModule, SharedModule],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  chartOptions: any = {};
  chart!: Chart;
  selectedPeriod = '1Y';
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
      aum: '',
      nav: '',
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

  periods = [
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
    { label: 'Max', value: 'Max' }
  ];

  navValue = '0.69 Cr';
  drawdownsValue = '0.65 Cr';
  currentDate = 'Sep 30, 2023';
  grossMOIC = 'Gross MOIC: 1.06×';
  grossIRR = 'Gross IRR: 6.15%';
  returnOnCapital = 'Return on Invested Capital: +0.04 Cr';
  selectedFund: any;
  fundConfig: any;
  asOfDate: any;
  currencySymbol: string = '';
  numberFormat: string = 'en-IN';
  fundSizeUnit: string = ''
  constructor(private store: Store, private fundService: FundService, private getCurrencyByUnitsPipe: GetCurrencyByUnitsPipe) {
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
    // this.initializeChart();
    this.getStoreData();
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    this.updateChartData();
  }

  private calculateDateRange(period: string): { startDate: string; endDate: string } {
    const endDate = moment(this.asOfDate || new Date()).format('YYYY-MM-DD');
    let startDate: string;

    switch (period) {
      case '3M':
        startDate = moment(endDate).subtract(3, 'months').format('YYYY-MM-DD');
        break;
      case '6M':
        startDate = moment(endDate).subtract(6, 'months').format('YYYY-MM-DD');
        break;
      case '1Y':
        startDate = moment(endDate).subtract(1, 'year').format('YYYY-MM-DD');
        break;
      case '5Y':
        startDate = moment(endDate).subtract(5, 'years').format('YYYY-MM-DD');
        break;
      case 'Max':
        // For Max, set a very early date (e.g., 100 years back)
        // API will return all available data
        startDate = moment(endDate).subtract(100, 'years').format('YYYY-MM-DD');
        break;
      default:
        startDate = moment(endDate).subtract(1, 'year').format('YYYY-MM-DD');
    }

    return { startDate, endDate };
  }

  private initializeChart(chartData?: any[]) {
    let labels = [];
    let drawdowns: any[] = [];
    let residualValues: any[] = [];
    let capitalReedemed: any[] = [];
    let distributions: any[] = [];
    let navArray: any[] = [];
    let xirrArray: any[] = [];
    let numberFormat = this.fundConfig.get('number_format')
    let getCurrencyByUnitsPipe = this.getCurrencyByUnitsPipe
    chartData.forEach((point) => {
      const x = moment(point.as_on_date).format('YYYY-MM-DD');
      drawdowns.push(+point.funded_committed);
      residualValues.push(+point.residal_value);
      capitalReedemed.push(+point.redemption_amount);
      distributions.push(+point.distibution);
      navArray.push(+point.nav);
      xirrArray.push(+point.xirr);
      labels.push(point.as_on_date);
    });

    // Update chart options
    let yAxisLableFormatter = function () {
      let value = this.value
      let labelFormat = ''
      return getCurrencyByUnitsPipe.transform(value, true);
    }
    this.chartOptions = {
      chart: { type: 'line', backgroundColor: 'transparent', height: 352, spacing: [20, 20, 20, 80] },
      title: { text: '' },
      xAxis: {
        categories: labels,
        type: 'datetime',
        lineColor: '#181818',
        lineWidth: 2,
        tickColor: 'transparent',
        labels: {
          style: { color: '#757575', fontSize: '14px', fontFamily: 'Instrument Sans' },
          formatter: function () {
            const date = new Date(this.value as number);
            const month = date.toLocaleDateString(this.numberFormat, { month: 'short' });
            const year = date.getFullYear();
            return `${month} ${year}`;
          }
        }
      },
      yAxis: {
        title: { text: '' },
        tickInterval: 0.2,
        gridLineColor: '#DCDCDC',
        gridLineWidth: 1,
        min: 0,
        labels: {
          style: { color: '#000', fontSize: '14px', fontFamily: 'Instrument Sans' },
          formatter: yAxisLableFormatter
        }
      },
      plotOptions: {
        line: {
          marker: { enabled: true, radius: 3.5, states: { hover: { radius: 5 } } },
          lineWidth: 3,
          states: { hover: { lineWidth: 3 } }
        }
      },
      series: [
        { name: 'Growth', type: 'line', data: residualValues, color: '#00305B' },
        { name: 'Drawdowns', type: 'line', data: drawdowns, color: '#C08A84' },
        { name: 'Capital Redeemed', type: 'line', data: capitalReedemed, color: '#28a745' },
        { name: 'Distributions', type: 'line', data: distributions, color: '#ffc107' },
        { name: 'NAV', type: 'line', data: navArray, color: '#17a2b8' },
        { name: 'XIRR', type: 'line', data: xirrArray, color: '#6f42c1' }
      ],
      legend: { enabled: true },
      tooltip: {
        shared: true,
        backgroundColor: 'white',
        borderColor: '#DCDCDC',
        borderRadius: 4,
        shadow: true,
        useHTML: true,
        formatter: function () {
          const date = new Date((this as any).category);
          const formattedDate = date.toLocaleDateString(numberFormat, { month: 'short', day: 'numeric', year: 'numeric' });
          let tooltip = `<div style=\"font-size: 12px; margin-bottom: 4px;\">${formattedDate}</div>`;
          (this as any).points.forEach((point: any) => {
            const color = point.series.color;
            tooltip += `<div style=\"margin: 2px 0;\">\n<span style=\"color: ${color};\">●</span>\n<span style=\"margin-left: 4px;\">${point.series.name}: ${getCurrencyByUnitsPipe.transform(point.y, true)}</span>\n</div>`;
          });
          return tooltip;
        }
      },
      credits: { enabled: false },

    };
    // Recreate chart with new data
    this.chart = new Chart(this.chartOptions);
  }

  private updateChartData() {
    // Calculate date range based on selected period
    const dateRange = this.calculateDateRange(this.selectedPeriod);

    // Fetch performance data with the new date range
    this.fetchPerformanceData(dateRange.startDate, dateRange.endDate);
  }

  getStoreData() {
    this.store.select(selectSelectedDate).subscribe(fundState => {
      console.log('Fund State from Store:', fundState);
      this.asOfDate = fundState?.asOfDate;
      this.selectedFund = fundState?.fundDetails;
      this.fundConfig = fundState.fundDetails?.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());

      console.log('Fund Configurations:', this.fundConfig);
      this.fetchPerformanceData();
      this.fetchFundOverview();
    })
  }
  fetchPerformanceData(startDate?: string, endDate?: string) {
    // Use provided dates or calculate from selected period if not provided
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : this.calculateDateRange(this.selectedPeriod);

    // Build API request parameters
    const apiParams = {
      fundGuid: this.selectedFund.guid,
      classGuid: this.selectedFund.guid,
      asOnDate: this.asOfDate,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    };

    this.fundService.getPerformanceData(apiParams, 'VC_VD_GRAPH').subscribe({
      next: (sk) => {
        console.log('Fund Performance Graph Data:', sk.performance.vc_vd_graph);
        console.log('Date Range:', dateRange);
        this.initializeChart(sk.performance.vc_vd_graph);
      },
      error: (error) => {
        console.error('Error fetching performance data:', error);
      }
    });
  }

  fetchFundOverview() {
    this.fundService.getPerformanceData({ fundGuid: this.selectedFund.guid, classGuid: this.selectedFund.guid, asOnDate: this.asOfDate }, 'CAPITAL_SUMMARY,METADATA').subscribe({
      next: (sk) => {
        console.log('Fund Performance Data:', sk);
        this.overviewData.capital_summary = sk.performance && sk.performance.capital_summary ? sk.performance.capital_summary : {};
        this.overviewData.metadata = sk.performance && sk.performance.metadata ? sk.performance.metadata : {};

        this.overviewData.metadata.nav = this.overviewData.metadata.nav ? this.overviewData.metadata.nav : '-';
      },
      error: (error) => {
        // Handle error response
      }
    });
  }
}
