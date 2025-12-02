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
import { interval } from 'rxjs';

interface ChartDataPoint {
  x: number;
  y: number;
  // Assuming your API data point has these fields for full dynamic display
  nav?: number;
  moic?: string; // or number, depends on your data
  irr?: string; // or number
  return_on_capital?: number;
  drawdowns?: number;
  as_on_date?: string;
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
  };
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
    funded_committed: string;
  };
}

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, ChartModule, SharedModule],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss'],
})
export class PerformanceComponent implements OnInit {
  chartOptions: any = {};
  chart!: any;
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
      unfunded: '-',
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
      commitment: '-',
      funded_committed: '-',
    },
  };

  periods = [
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
    { label: 'Max', value: 'Max' },
  ];

  // ** ORIGINAL DEFAULT VALUES **
  navValue = '-';
  drawdownsValue = '-';
  currentDate = '-';
  grossMOIC = 'Gross MOIC: -';
  grossIRR = 'Gross IRR: -';
  returnOnCapital = 'Return on Invested Capital: -';
  public seletedDate;
  // ** NEW PROPERTIES ** - These will be bound to the HTML and updated on chart hover
  selectedChartDate: string = this.currentDate;
  selectedNav: string = this.navValue;
  selectedGrossMOIC: string = this.grossMOIC;
  selectedGrossIRR: string = this.grossIRR;
  selectedReturnOnCapital: string = this.returnOnCapital;
  selectedDrawdowns: string = this.drawdownsValue;
  chartDataPoints: any[] = []; // To store the full data array for lookup

  selectedFund: any;
  fundConfig: any;
  asOfDate: any;
  currencySymbol: string = '';
  numberFormat: string = 'en-IN';
  fundSizeUnit: string = '';

  constructor(
    private store: Store,
    private fundService: FundService,
    private getCurrencyByUnitsPipe: GetCurrencyByUnitsPipe
  ) {
    this.store.select(selectFundData).subscribe((fundState) => {
      if (fundState?.fund_configuration_classes?.length) {
        this.fundConfig = new Map(
          fundState.fund_configuration_classes.map((item: any) => [
            item?.fund_key,
            item?.fund_value,
          ])
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
        startDate = moment(endDate).subtract(100, 'years').format('YYYY-MM-DD');
        break;
      default:
        startDate = moment(endDate).subtract(1, 'year').format('YYYY-MM-DD');
    }

    return { startDate, endDate };
  }

  private initializeChart(chartData?: any[]) {
    // 1. ** NEW ** Store the chart data for lookup
    this.chartDataPoints = chartData;

    let labels = [];
    let drawdowns: any[] = [];
    let residualValues: any[] = [];
    let capitalReedemed: any[] = [];
    let distributions: any[] = [];
    let navArray: any[] = [];
    let xirrArray: any[] = [];
    let numberFormat = this.fundConfig.get('number_format');
    let getCurrencyByUnitsPipe = this.getCurrencyByUnitsPipe;

    chartData.forEach((point) => {
      // NOTE: Ensure your API data has 'moic', 'irr', 'return_on_capital', and 'drawdowns'
      // These are crucial for updating the metric sidebar correctly.
      const x = moment(point.as_on_date).format('YYYY-MM-DD');
      drawdowns.push(+point.funded_committed); // Assuming funded_committed is a proxy for drawdowns line
      residualValues.push(+point.residal_value);
      capitalReedemed.push(+point.redemption_amount);
      distributions.push(+point.distibution);
      navArray.push(+point.nav);
      xirrArray.push(+point.xirr);
      labels.push(point.as_on_date);
    });

    // Update chart options
    let yAxisLableFormatter = function () {
      let value = this.value;
      let labelFormat = '';
      return getCurrencyByUnitsPipe.transform(value, true, false, 0, false);
    };

    // ** NEW ** Get the component instance to update its properties
    const component = this;

    this.chartOptions = {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        height: 410,
        spacing: [20, 20, 20, 20],
        events: {
          load: function () {
            const chart = this;
            const series = chart.series[0];
            const lastPoint = series.data[series.data.length - 1];
            lastPoint.firePointEvent('click');
          },
        },
      },
      title: { text: '' },
      xAxis: {
        categories: labels,
        type: 'datetime',
        lineColor: '#181818',
        lineWidth: 2,
        maxStaggerLines: 12,
        interval: 4,
        tickColor: 'transparent',
        plotLines: [
          {
            value: labels.indexOf(this.asOfDate),
            width: 2, // Set the line thickness to 2px
            color: '#000000', // Set the line color to black
            zIndex: 100,
          },
        ],
        labels: {
          style: { color: '#757575', fontSize: '14px', fontFamily: 'Instrument Sans' },
          formatter: function () {
            const date = new Date(this.value as number);
            const month = date.toLocaleDateString(component.numberFormat, { month: 'short' });
            const year = date.getFullYear();
            return `${month} ${year}`;
          },
        },
      },
      yAxis: {
        title: { text: '' },
        tickAmount: 10,
        gridLineColor: '#DCDCDC',
        gridLineWidth: 1,
        min: 0,
        labels: {
          style: { color: '#000', fontSize: '14px', fontFamily: 'Instrument Sans' },
          formatter: yAxisLableFormatter,
        },
      },
      plotOptions: {
        series: {
          marker: {
            enabled: true,
            symbol: 'circle',
            radius: 6,
            fillColor: undefined,
            lineWidth: 0,
            // states: {
            //   select: {
            //     enabled: true,
            //     radius: 6,
            //     lineWidth: 2,
            //     fillColor: '#ffffff',
            //   },
            // },
          },
          point: {
            events: {
              click: function () {
                let index = this.index;

                const dataPoint = component.chartDataPoints[index];

                if (dataPoint) {
                  // Update component properties with the data from the hovered point
                  component.selectedChartDate = moment(dataPoint.as_on_date).format('MMM DD, YYYY');
                  component.selectedNav =
                    component.getCurrencyByUnitsPipe.transform(
                      dataPoint.nav,
                      false,
                      true,
                      2,
                      true
                    ) || '-';

                  // *** IMPORTANT: Map these properties to your actual data structure (dataPoint.moic, etc.) ***
                  // Using dummy data fields for MOIC/IRR/Return as they are not explicitly defined in the chart series
                  component.selectedGrossMOIC = `Gross MOIC: ${dataPoint.moic || '-'}`;
                  component.selectedGrossIRR = `Gross IRR: ${dataPoint.irr || '-'}`;
                  component.selectedReturnOnCapital = `Return on Invested Capital:  ${
                    dataPoint.return_on_capital
                      ? component.getCurrencyByUnitsPipe.transform(
                          dataPoint.return_on_capital || 0,
                          false,
                          false
                        )
                      : '-'
                  }`;
                  component.selectedDrawdowns = component.getCurrencyByUnitsPipe.transform(
                    dataPoint.funded_committed || 0,
                    true,
                    true
                  );
                }
                this.series.xAxis.update({
                  plotLines: [
                    {
                      color: '#000000',
                      width: 2,
                      value: this.x,
                      zIndex: 100,
                    },
                  ],
                });
              },
            },
          },
        },
      },
      series: [
        {
          name: 'Drawdowns',
          type: 'line',
          data: drawdowns,
          color: '#C08A84',
          yAxis: 0,
          marker: {
            symbol: 'circle',
            states: {
              hover: {
                fillColor: '#ffffff',
                lineColor: '#C08A84',
                lineWidth: 2,
                zIndex: 100000,
              },
            },
          },
        },
        {
          name: 'Growth (NAV)',
          type: 'line',
          data: navArray,
          color: '#00305B',
          yAxis: 0,
          marker: {
            symbol: 'circle',
            states: {
              hover: {
                fillColor: '#ffffff',
                lineColor: '#00305B',
                lineWidth: 2,
                zIndex: 100000,
              },
            },
          },
        },
      ],

      legend: { enabled: false },
      tooltip: {
        shared: true,
        enabled: true,
        useHTML: true,
        formatter: function () {
          const date = new Date(this.category);
          const formattedDate = date.toLocaleDateString(numberFormat, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          let tooltip = `<div style="font-size: 13px; font-weight: 600; margin-bottom: 6px; font-family: 'Instrument Sans';">${formattedDate}</div>`;
          (this as any).points.forEach((point: any) => {
            const color = point.series.color;
            const formattedValue = getCurrencyByUnitsPipe.transform(point.y, true, false, 0, false);
            tooltip += `<div style="margin: 4px 0; font-family: 'Instrument Sans'; font-size: 12px;">\n<span style="color: ${color}; margin-right: 4px;">●</span>\n<span>${point.series.name}: ${formattedValue}</span>\n</div>`;
          });
          return tooltip;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#DCDCDC',
        borderWidth: 1,
        borderRadius: 4,
        shadow: true,
        style: {
          color: '#000',
          padding: '8px',
        },
      },
      credits: { enabled: false },
    };
    // Recreate chart with new data
    this.chart = new Chart(this.chartOptions);
  }

  private updateChartData() {
    const dateRange = this.calculateDateRange(this.selectedPeriod);
    this.fetchPerformanceData(dateRange.startDate, dateRange.endDate);
  }

  getStoreData() {
    this.store.select(selectSelectedDate).subscribe((fundState) => {
      this.asOfDate = fundState?.asOfDate;
      this.selectedFund = fundState?.fundDetails;
      this.fundConfig = fundState.fundDetails?.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());

      // Update the initial value of the dynamic properties with the latest "As Of Date" data
      this.currentDate = moment(this.asOfDate).format('MMM DD, YYYY');
      this.selectedChartDate = this.currentDate;

      this.fetchPerformanceData();
      this.fetchFundOverview();
    });
  }

  fetchPerformanceData(startDate?: string, endDate?: string) {
    const dateRange =
      startDate && endDate ? { startDate, endDate } : this.calculateDateRange(this.selectedPeriod);

    const apiParams = {
      fundGuid: this.selectedFund.guid,
      classGuid: this.selectedFund.isInvestorCard
        ? this.selectedFund.user_guid
        : this.selectedFund.guid,
      asOnDate: this.asOfDate,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };

    this.fundService.getPerformanceData(apiParams, 'VC_VD_GRAPH').subscribe({
      next: (sk) => {
        this.initializeChart(sk.performance.vc_vd_graph);
      },
      error: (error) => {
        console.error('Error fetching performance data:', error);
      },
    });
  }

  fetchFundOverview() {
    this.fundService
      .getPerformanceData(
        {
          fundGuid: this.selectedFund.guid,
          classGuid: this.selectedFund.isInvestorCard
            ? this.selectedFund.user_guid
            : this.selectedFund.guid,
          asOnDate: this.asOfDate,
        },
        'CAPITAL_SUMMARY,METADATA'
      )
      .subscribe({
        next: (sk) => {
          this.overviewData.capital_summary =
            sk.performance && sk.performance.capital_summary ? sk.performance.capital_summary : {};
          this.overviewData.metadata =
            sk.performance && sk.performance.metadata ? sk.performance.metadata : {};

          // Update initial dynamic values based on the latest overview data
          this.overviewData.metadata.nav = this.overviewData.metadata.nav
            ? this.overviewData.metadata.nav
            : '-';
          this.selectedNav =
            this.getCurrencyByUnitsPipe.transform(
              this.overviewData.metadata.nav,
              false,
              true,
              2,
              true
            ) || '-';

          this.overviewData.metadata.funded_committed = this.overviewData.metadata.funded_committed
            ? this.overviewData.metadata.funded_committed
            : '-';
          // this.selectedDrawdowns =
          //   this.getCurrencyByUnitsPipe.transform(this.overviewData.metadata.funded_committed, true, true,2,true) ||
          //   '-';
        },
        error: (error) => {
          // Handle error response
        },
      });
  }
}
