import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortfolioOverviewComponent } from './components/portfolio-overview/portfolio-overview.component';
import { InvestmentTableComponent } from './components/investment-table/investment-table.component';
import { DistributionChartComponent } from '../shared/components/distribution-chart/distribution-chart.component';

@Component({
  selector: 'app-web-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PortfolioOverviewComponent,
    InvestmentTableComponent,
    DistributionChartComponent,
  ],
  templateUrl: './web-portfolio.component.html',
  styleUrls: ['./web-portfolio.component.scss'],
})
export class WebPortfolioComponent {}
