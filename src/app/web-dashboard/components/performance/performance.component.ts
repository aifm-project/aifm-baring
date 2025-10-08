import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartModule } from 'angular-highcharts';
import * as Highcharts from 'highcharts';

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
  chartOptions: Highcharts.Options = {};
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

  ngOnInit() {
    this.initializeChart();
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    this.updateChartData();
  }

  private initializeChart() {
    const growthData: ChartDataPoint[] = [
      { x: Date.UTC(2022, 11, 1), y: 0.62 },
      { x: Date.UTC(2023, 2, 1), y: 0.58 },
      { x: Date.UTC(2023, 5, 1), y: 0.64 },
      { x: Date.UTC(2023, 8, 1), y: 0.76 },
      { x: Date.UTC(2023, 11, 1), y: 0.82 },
      { x: Date.UTC(2024, 2, 1), y: 0.86 },
      { x: Date.UTC(2024, 5, 1), y: 0.94 },
      { x: Date.UTC(2024, 8, 1), y: 1.02 },
      { x: Date.UTC(2024, 11, 1), y: 1.08 },
      { x: Date.UTC(2025, 2, 1), y: 1.12 }
    ];

    const drawdownsData: ChartDataPoint[] = [
      { x: Date.UTC(2022, 11, 1), y: 0.38 },
      { x: Date.UTC(2023, 2, 1), y: 0.36 },
      { x: Date.UTC(2023, 5, 1), y: 0.42 },
      { x: Date.UTC(2023, 8, 1), y: 0.48 },
      { x: Date.UTC(2023, 11, 1), y: 0.52 },
      { x: Date.UTC(2024, 2, 1), y: 0.54 },
      { x: Date.UTC(2024, 5, 1), y: 0.54 },
      { x: Date.UTC(2024, 8, 1), y: 0.54 },
      { x: Date.UTC(2024, 11, 1), y: 0.54 },
      { x: Date.UTC(2025, 2, 1), y: 0.54 }
    ];

    this.chartOptions = {
      chart: { type: 'line', backgroundColor: 'transparent', height: 352, spacing: [20, 20, 20, 80] },
      title: { text: '' },
      xAxis: {
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
        },
        plotLines: [{ value: Date.UTC(2023, 8, 1), color: '#181818', width: 2, zIndex: 5 }]
      },
      yAxis: {
        title: { text: '' },
        min: 0.2,
        max: 1.2,
        tickInterval: 0.2,
        gridLineColor: '#DCDCDC',
        gridLineWidth: 1,
        labels: {
          style: { color: '#000', fontSize: '14px', fontFamily: 'Instrument Sans' },
          formatter: function() { return (this.value as number).toFixed(2) + ' Cr'; }
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
        { name: 'Growth', type: 'line', data: growthData, color: '#00305B', marker: { fillColor: '#00305B', lineColor: '#00305B', states: { hover: { fillColor: 'white', lineColor: '#00305B', lineWidth: 3 } } } },
        { name: 'Drawdowns', type: 'line', data: drawdownsData, color: '#C08A84', marker: { fillColor: '#C08A84', lineColor: '#C08A84', states: { hover: { fillColor: 'white', lineColor: '#C08A84', lineWidth: 3 } } } }
      ],
      legend: { enabled: false },
      tooltip: {
        shared: true,
        backgroundColor: 'white',
        borderColor: '#DCDCDC',
        borderRadius: 4,
        shadow: true,
        useHTML: true,
        formatter: function() {
          const date = new Date((this as any).x);
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          let tooltip = `<div style=\"font-size: 12px; margin-bottom: 4px;\">${formattedDate}</div>`;
          (this as any).points.forEach((point: any) => {
            const color = point.series.color;
            tooltip += `<div style=\"margin: 2px 0;\">\n              <span style=\"color: ${color};\">●</span>\n              <span style=\"margin-left: 4px;\">${point.series.name}: ${point.y.toFixed(2)} Cr</span>\n            </div>`;
          });
          return tooltip;
        }
      },
      credits: { enabled: false }
    };

    this.chart = new Chart(this.chartOptions);
  }

  private updateChartData() {
    this.initializeChart();
  }
}
