import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSelectedDate } from '../../../store/date';
import { FundService } from '../../../core/services/fund.service';
import * as Highcharts from 'highcharts';
import { Chart, ChartModule } from 'angular-highcharts';
import { Router } from '@angular/router';

interface IndustryData {
  name: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-distribution-chart',
  standalone: true,
  imports: [CommonModule, ChartModule],
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
  constructor(public store: Store, public fundService: FundService) {}

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
    this.store.select(selectSelectedDate).subscribe((fundState) => {
      console.log('Fund State from Store:', fundState);
      this.selectedFund = fundState.fundDetails;
      this.asOfDate = fundState?.asOfDate;
      this.fundConfig = fundState.fundDetails?.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());
      console.log('Fund Configurations:', this.fundConfig);
      this.getPortfolioData();
    });
  }
  getPortfolioData() {
    let queryParams = {
      asOnDate: this.asOfDate,
      type: 'DISTRIBUTION_INDUSTRY',
      currentAsOnDate: this.asOfDate,
    };
    this.fundService.portfolioData(this.selectedFund.guid, queryParams).subscribe({
      next: (response) => {
        console.log('Portfolio Data fetched successfully:', response);
        this.industryData = [];
        if (response.portfolio && response.portfolio.distribution_industry) {
          this.industryData = response.portfolio.distribution_industry.map((item: any) => ({
            name: item.key,
            percentage: item.value.toFixed(2),
            color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
          }));
        }
        this.drawPieChart();
      },
      error: (error) => {
        console.error('Error fetching Portfolio Data:', error);
      },
    });
  }

  drawPieChart() {
    const data = this.industryData.map((item) => ({
      name: item.name,
      y: +item.percentage,
      color: item.color,
    }));
    this.chartOptions = {
      chart: {
        type: 'pie',
        height:"435.5px",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        background: 'transparent',
        custom: {
          labelContent: {
            name: 'Total',
            value: '2 877 820',
          },
          label: null,
        },
        events: {
          render() {
            const chart = this,
              series = chart.series[0],
              custom = chart.options.chart.custom;

            let customLabel = custom.label;
            let currentContent = custom.labelContent;
            const htmlContent = `${currentContent.name}<br/>
                                     <strong>${currentContent.value}</strong>`;

            if (!customLabel) {
              // Create the label on initial render
              customLabel = custom.label = chart.renderer
                .label(htmlContent)
                .css({
                  color: 'var(--highcharts-neutral-color-100, #000)',
                  textAnchor: 'middle',
                })
                .add();
            } else {
              // Update the label content on subsequent renders (e.g., after hover)
              customLabel.attr({
                text: htmlContent,
              });
            }

            const x = series.center[0] + chart.plotLeft,
              y = series.center[1] + chart.plotTop - customLabel.attr('height') / 2;

            customLabel.attr({
              x,
              y,
            });
            // Set font size based on chart diameter
            customLabel.css({
              fontSize: `${series.center[2] / 12}px`,
            });
          },
        },
      },
      title: {
        text: '',
      },
      accessibility: {
        point: {
          valueSuffix: '%',
        },
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
      },
      legend: {
        enabled: false,
      },
      credits:{
        enabled:false,
      },
      plotOptions: {
        series: {
          allowPointSelect: true,
          cursor: 'pointer',
          borderRadius: 0,
          dataLabels: [
            {
              enabled: false,
              distance: 20,
              format: '{point.name}',
              padding: 8, // adds space between each label
              connectorPadding: 10, // increases space before the connector line
            },
            {
              enabled: false,
              distance: -15,
              format: '{point.percentage:.0f}%',
              style: {
                fontSize: '0.9em',
              },
            },
          ],
          showInLegend: true,
          // 3. Add point events for dynamic center label
          point: {
            events: {
              mouseOver: function () {
                const chart = this.series.chart;
                // Set the custom content to the hovered point's data
                chart.options.chart.custom.labelContent = {
                  name: this.name,
                  // Use a more specific format for the percentage
                  value: Highcharts.numberFormat(this.percentage, 0, '.', ',') + '%',
                };
                // Re-render the chart to update the center label
                chart.redraw();
              },
              mouseOut: function () {
                const chart = this.series.chart;
                // Reset the custom content to the default "Total"
                chart.options.chart.custom.labelContent = {
                  name: 'Total',
                  value: '2 877 820',
                };
                // Re-render the chart to update the center label
                chart.redraw();
              },
            },
          },
        },
      },
      series: [
        {
          name: 'Industries',
          type: 'pie',
          colorByPoint: true,
          innerSize: '95%',
          data: data,
        },
      ],
    };
    this.chart = new Chart(this.chartOptions);
  }

  
}
