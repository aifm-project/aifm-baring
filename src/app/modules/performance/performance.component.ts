import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';

interface PerformanceData {
  fund: string;
  irr: number;
  multiple: number;
  vintage: number;
  status: string;
}

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  
  performanceChartOptions: Highcharts.Options = {
    chart: {
      type: 'column',
      height: 400
    },
    title: {
      text: 'Fund Performance Comparison'
    },
    xAxis: {
      categories: ['Fund V', 'Fund VI', 'Fund VII', 'Vostok Fund']
    },
    yAxis: {
      title: {
        text: 'IRR (%)'
      }
    },
    series: [{
      name: 'IRR',
      type: 'column',
      data: [22.5, 18.3, 15.7, 12.1],
      color: '#007bff'
    }],
    credits: {
      enabled: false
    }
  };

  performanceData: PerformanceData[] = [
    {
      fund: 'Baring Private Equity Asia Fund VII',
      irr: 15.7,
      multiple: 1.8,
      vintage: 2020,
      status: 'Active'
    },
    {
      fund: 'Baring Private Equity Asia Fund VI',
      irr: 18.3,
      multiple: 2.1,
      vintage: 2017,
      status: 'Realized'
    },
    {
      fund: 'Baring Private Equity Asia Fund V',
      irr: 22.5,
      multiple: 2.8,
      vintage: 2014,
      status: 'Realized'
    },
    {
      fund: 'Baring Vostok Fund',
      irr: 12.1,
      multiple: 1.4,
      vintage: 2019,
      status: 'Active'
    }
  ];

  selectedTimeframe = '1Y';
  timeframes = [
    { label: '1Y', value: '1Y' },
    { label: '3Y', value: '3Y' },
    { label: '5Y', value: '5Y' },
    { label: 'All', value: 'All' }
  ];

  ngOnInit(): void {
    // Component initialization
  }

  onTimeframeChange(timeframe: string): void {
    this.selectedTimeframe = timeframe;
    // Update chart data based on timeframe
  }
}