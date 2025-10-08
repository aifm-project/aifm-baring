import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { FundSelectorComponent } from '../shared/components/fund-selector/fund-selector.component';
import { OverviewComponent } from './components/overview/overview.component';
import { PerformanceComponent } from './components/performance/performance.component';
import { OnlineSeminarComponent } from './components/online-seminar/online-seminar.component';
import { DistributionChartComponent } from '../shared/components/distribution-chart/distribution-chart.component';
import { DocumentsPreviewComponent } from './components/documents-preview/documents-preview.component';
import { InsightsComponent } from './components/insights/insights.component';
import { NewsletterComponent } from '../shared/components/newsletter/newsletter.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { InvestmentTableComponent } from '../web-portfolio/components/investment-table/investment-table.component';

@Component({
  selector: 'app-web-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FundSelectorComponent,
    OverviewComponent,
    PerformanceComponent,
    OnlineSeminarComponent,
    InvestmentTableComponent,
    DocumentsPreviewComponent,
    InsightsComponent,
    NewsletterComponent,
    FooterComponent,
  ],
  templateUrl: './web-dashboard.component.html',
  styleUrls: ['./web-dashboard.component.scss']
})
export class WebDashboardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
