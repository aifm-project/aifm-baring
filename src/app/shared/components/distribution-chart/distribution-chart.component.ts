import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSelectedDate } from '../../../store/date';
import { FundService } from '../../../core/services/fund.service';
import * as Highcharts from 'highcharts';
import { Chart, ChartModule } from 'angular-highcharts';

interface IndustryData {
  name: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-distribution-chart',
  standalone: true,
  imports: [CommonModule,ChartModule],
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss'],
})
export class DistributionChartComponent implements OnInit {
  @Input() title: string = 'Distribution by Industries';
  @Input() showFilters: boolean = true;
  industryData: IndustryData[] = [];
  selectedFund: any;
  asOfDate: string;
  fundConfig: any;
  public chartOptions: any = {};
  chart!: Chart;
  constructor(public store: Store,public fundService: FundService) {}

  ngOnInit(): void {
    this.getStoreData();
  }

  onFilterClick(): void {
    console.log('Filter clicked');
  }

  onSortClick(): void {
    console.log('Sort clicked');
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
  getPortfolioData(){
    let queryParams = {asOnDate:this.asOfDate,type:'DISTRIBUTION_INDUSTRY',currentAsOnDate:this.asOfDate};
    this.fundService.portfolioData(this.selectedFund.guid, queryParams).subscribe({
      next: (response) => {
        console.log('Portfolio Data fetched successfully:', response);
        this.industryData = [];
        if(response.portfolio && response.portfolio.distribution_industry){
          this.industryData = response.portfolio.distribution_industry.map((item: any) => ({
            name: item.key,
            percentage: (item.value).toFixed(2),
            color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
          }));
        }
        this.drawPieChart();
      },
      error: (error) => {
        console.error('Error fetching Portfolio Data:', error);
      }
    });
  }

  drawPieChart() {
    const data = this.industryData.map(item => ({
      name: item.name,
      y: +item.percentage,
      color: item.color
    }))
    this.chartOptions = {
      chart: {
        type: 'pie',
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        text: ''
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            borderRadius: 5,
            dataLabels: {
                enabled: false,
                format: '<b>{point.name}</b><br>{point.percentage:.1f} %',
                distance: -50,
                filter: {
                    property: 'percentage',
                    operator: '>',
                    value: 4
                }
            }
        }
    },
        series: [{
          name: 'Industries',
          type: 'pie',
          data: data
        }],
    };
    this.chart = new Chart(this.chartOptions);
  }
}