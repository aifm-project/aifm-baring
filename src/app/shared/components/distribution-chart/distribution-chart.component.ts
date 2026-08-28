import { Component, Input, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectSelectedDate } from '../../../store/date';
import { FundService } from '../../../core/services/fund.service';
import * as Highcharts from 'highcharts';
import { Chart, ChartModule } from 'angular-highcharts';
import { Router } from '@angular/router';
import { Tooltip } from 'bootstrap';
import { selectedFundDate$ } from '../../rxjs/selected-fund-date';
import { TASK } from '../../../core/loading/readiness.model';
import { ReadinessService } from '../../../core/loading/readiness.service';

interface IndustryData {
  name: string;
  percentage: number;
  actualValue: number;
  color: string;
}

@Component({
  selector: 'app-distribution-chart',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss'],
})
export class DistributionChartComponent implements OnInit, AfterViewInit {
  private readonly readiness = inject(ReadinessService);
  /**
   * True while this section's own request is in flight. Starts true so the window
   * before the first request is issued reads as "loading" rather than as empty data.
   * Scoped per component so one slow section can never block a sibling.
   */
  isLoading = true;

  private readonly destroyRef = inject(DestroyRef);
  @Input() title: string = 'Distribution by Industries';
  @Input() showFilters: boolean = true;
  industryData: IndustryData[] = [];
  selectedFund: any;
  asOfDate: string;
  fundConfig: any;
  public chartOptions: any = {};
  chart!: Chart;
  colorSeries: string[] = ['#CEDAE3', '#85BCE3', '#00305B', '#181818', '#BCD8EC'];

  // Dynamic tooltip properties
  infoIconAlt: string = 'Distribution Chart Information';
  infoIconTitle: string = 'A breakdown of the portfolio by industry sector (e.g., healthcare, technology, consumer)';

  @ViewChildren('infoIcon') infoIconElements!: QueryList<ElementRef>;
  constructor(public store: Store, public fundService: FundService) {}

  ngOnInit(): void {
    this.getStoreData();
  }

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  private initializeTooltips() {
    // Initialize Bootstrap tooltips with responsive placement
    this.infoIconElements.forEach((element: ElementRef) => {
      const tooltipElement = element.nativeElement;
      new Tooltip(tooltipElement, {
        placement: 'auto',
        trigger: 'hover focus',
        html: false,
        delay: { show: 100, hide: 100 }
      });
    });
  }

  onFilterClick(): void {
    console.log('Filter clicked');
  }

  onSortClick(): void {
    console.log('Sort clicked');
  }

  getStoreData() {
    selectedFundDate$(this.store, this.destroyRef).subscribe((fundState) => {
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
    const issuedEpoch = this.readiness.epoch();
    this.isLoading = true;
    let queryParams = {
      asOnDate: this.asOfDate,
      type: 'DISTRIBUTION_INDUSTRY',
      currentAsOnDate: this.asOfDate,
    };
    this.fundService.portfolioData(this.selectedFund.guid, queryParams, TASK.DISTRIBUTION).subscribe({
      next: (response) => {
      // Stale-response guard. Components fire their fetch from inside a store
      // subscriber and nothing aborts the previous request, so a slow response for
      // the fund the user just left can still land here. Without this it overwrites
      // the current fund's figures - one fund's numbers under another fund's name,
      // visually identical to a correct screen.
        if (issuedEpoch !== this.readiness.epoch()) return;
        this.isLoading = false;
        console.log('Portfolio Data fetched successfully:', response);
        this.industryData = [];
        if (response.portfolio && response.portfolio.distribution_industry) {
          const allData = response.portfolio.distribution_industry.map(
            (item: any, index: number) => ({
              name: item.key,
              percentage: item.value.toFixed(2),
              actualValue: parseFloat(item.value.toFixed(2)) + ' %',
              color: this.colorSeries[index % this.colorSeries.length],
            })
          );
          // Sort by percentage descending and take top 5
          this.industryData = allData
            .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
            .slice(0, 5);
        }
        this.drawPieChart();
      },
      error: (error) => {
        this.isLoading = false;
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
        height: '360px',
        plotBackgroundColor: null,
        plotBorderWidth: 0,
        plotShadow: false,
        backgroundColor: '#E7EBEE',
        custom: {
          labelContent: {
            name: '',
            value: '',
          },
          label: null,
        },
        events: {
          load: function () {
            const chart = this;
            const series = chart.series[0];
            const lastPoint = series.data[0];
            lastPoint?.firePointEvent('click');
          },
          render() {
            const chart = this,
              series = chart.series[0],
              custom = chart.options.chart.custom;
            chart.series[0].points.forEach((p) => {
              if (p.graphic && p.graphic.element) {
                p.graphic.element.removeAttribute('stroke-linejoin');
                p.graphic.element.removeAttribute('stroke-linecap');
              }
            });
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
       pointFormat: '{series.name}: <b>{point.y}' +' %'+'</b>'
      },
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          borderRadius: 0,
          borderWidth: 0,
          states: {
            hover: { halo: false },
          },
        },
        series: {
          allowPointSelect: true,
          cursor: 'pointer',
          borderRadius: 0,
          slicedOffset: 6, // Original offset applied to all slices
          padAngle: 0,
          dataLabels: [
            {
              enabled: false,
              distance: 20,
              format: '{point.name}',
              padding: 8,
              connectorPadding: 10,
            },
            {
              enabled: false,
              distance: -15,
              format: '{point.y} %',
              style: {
                fontSize: '0.9em',
              },
            },
          ],
          showInLegend: true,

          states: {
            hover: {
              // Color Fixes: Retain original color/look
              brightness: 0,
              color: null,
              opacity: 1,
              shadow: false,
              borderRadius: 0,
              halo: {
                size: 0,
                attributes: {
                  fill: 'transparent',
                },
              }, // Thickness Effect: Double the slice offset
              slicedOffset: 12, // Double the default offset of 6
            },
          },
          point: {
            events: {
              select() {
                const chart = this.series.chart;
                chart.options.chart.custom.labelContent = {
                  name: this.name,
                  value: Highcharts.numberFormat(this.y, 2)+ ' %',
                };
                this.update(
                  {
                    borderWidth: 15,
                    borderRadius: 0,
                    borderColor: this.color,
                  },
                  false
                );

                chart.redraw();
              },
              unselect() {
                const chart = this.series.chart;

                this.update({ slicedOffset: 6, borderWidth: 0 }, false);

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
          borderWidth: 0,
          slicedOffset: 16,
          padAngle: 0,
          data: data,
        },
      ],
    };
    this.chart = new Chart(this.chartOptions);
  }
}
