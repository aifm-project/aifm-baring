import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { FundSelectorComponent } from '../shared/components/fund-selector/fund-selector.component';
import { PortfolioOverviewComponent } from './components/portfolio-overview/portfolio-overview.component';
import { InvestmentTableComponent } from './components/investment-table/investment-table.component';
import { DistributionChartComponent } from '../shared/components/distribution-chart/distribution-chart.component';
import { NewsletterComponent } from '../shared/components/newsletter/newsletter.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-web-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FundSelectorComponent,
    PortfolioOverviewComponent,
    InvestmentTableComponent,
    DistributionChartComponent,
    NewsletterComponent,
    FooterComponent,
  ],
  templateUrl: './web-portfolio.component.html',
  styleUrls: ['./web-portfolio.component.scss'],
})
export class WebPortfolioComponent {}
