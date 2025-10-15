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
interface ChartDataPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  chartOptions: any = {};
  chart!: Chart;
  selectedPeriod = '1Y';

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
  selectedFund:any;
  fundConfig: any;
  asOfDate: any;
  constructor(private store: Store,private fundService: FundService,private getCurrencyByUnitsPipe: GetCurrencyByUnitsPipe) {}
  ngOnInit() {
    // this.initializeChart();
    this.getStoreData();
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    this.updateChartData();
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
        return getCurrencyByUnitsPipe.transform(value,true);
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
          formatter: function() {
            const date = new Date(this.value as number);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
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
          { name: 'Growth',type:'line', data: residualValues, color: '#00305B' },
          { name: 'Drawdowns',type:'line',data: drawdowns, color: '#C08A84' },
          { name: 'Capital Redeemed',type:'line', data: capitalReedemed, color: '#28a745' },
          { name: 'Distributions',type:'line', data: distributions, color: '#ffc107' },
          { name: 'NAV',type:'line', data: navArray, color: '#17a2b8' },
          { name: 'XIRR',type:'line', data: xirrArray, color: '#6f42c1' }
        ],
      legend: { enabled: true },
      tooltip: {
        shared: true,
        backgroundColor: 'white',
        borderColor: '#DCDCDC',
        borderRadius: 4,
        shadow: true,
        useHTML: true,
          formatter: function() {
          const date = new Date((this as any).category);
          const formattedDate = date.toLocaleDateString(numberFormat, { month: 'short', day: 'numeric', year: 'numeric' });
          let tooltip = `<div style=\"font-size: 12px; margin-bottom: 4px;\">${formattedDate}</div>`;
          (this as any).points.forEach((point: any) => {
            const color = point.series.color;
            tooltip += `<div style=\"margin: 2px 0;\">\n              <span style=\"color: ${color};\">●</span>\n              <span style=\"margin-left: 4px;\">${point.series.name}: ${getCurrencyByUnitsPipe.transform(point.y,true)}</span>\n            </div>`;
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
    // this.initializeChart();
  }

  getStoreData() {
     this.store.select(selectSelectedDate).subscribe(fundState => {
       console.log('Fund State from Store:', fundState);
       this.asOfDate = fundState?.asOfDate;
       this.selectedFund=fundState?.fundDetails;
       this.fundConfig = fundState.fundDetails?.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());
      
       console.log('Fund Configurations:', this.fundConfig);
       this.fetchPerformanceData();
     })
   }
    fetchPerformanceData() {
       this.fundService.getPerformanceData({ fundGuid: this.selectedFund.guid, classGuid: this.selectedFund.guid, asOnDate: this.asOfDate },'VC_VD_GRAPH').subscribe({
      next: (sk) => {
        console.log('Fund Performance Graph Data:', sk.performance.vc_vd_graph);
        // this.updateChartData();
        this.initializeChart(sk.performance.vc_vd_graph);

      },
      error: (error) => {
        // Handle error response
      }
    });
    }
}
