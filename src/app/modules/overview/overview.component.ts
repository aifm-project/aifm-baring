import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';

interface OverviewMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  
  chartOptions: Highcharts.Options = {
    chart: {
      type: 'line',
      height: 300
    },
    title: {
      text: 'Portfolio Performance'
    },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    yAxis: {
      title: {
        text: 'Value (Millions)'
      }
    },
    series: [{
      name: 'Portfolio Value',
      type: 'line',
      data: [1200, 1350, 1280, 1450, 1520, 1680]
    }],
    credits: {
      enabled: false
    }
  };

  overviewMetrics: OverviewMetric[] = [
    {
      title: 'Total Portfolio Value',
      value: '$4.2B',
      change: '+15.2%',
      changeType: 'positive',
      icon: 'pi pi-chart-line'
    },
    {
      title: 'Active Investments',
      value: '47',
      change: '+3',
      changeType: 'positive',
      icon: 'pi pi-briefcase'
    },
    {
      title: 'Realized Returns',
      value: '$1.8B',
      change: '+8.7%',
      changeType: 'positive',
      icon: 'pi pi-money-bill'
    },
    {
      title: 'IRR',
      value: '18.5%',
      change: '-0.3%',
      changeType: 'negative',
      icon: 'pi pi-percentage'
    }
  ];

  ngOnInit(): void {
    // Component initialization
  }
}