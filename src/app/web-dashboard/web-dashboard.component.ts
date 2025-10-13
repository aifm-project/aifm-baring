import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OverviewComponent } from './components/overview/overview.component';
import { PerformanceComponent } from './components/performance/performance.component';
import { OnlineSeminarComponent } from './components/online-seminar/online-seminar.component';
import { DocumentsPreviewComponent } from './components/documents-preview/documents-preview.component';
import { InsightsComponent } from './components/insights/insights.component';
import { InvestmentTableComponent } from '../web-portfolio/components/investment-table/investment-table.component';

@Component({
  selector: 'app-web-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OverviewComponent,
    PerformanceComponent,
    OnlineSeminarComponent,
    InvestmentTableComponent,
    DocumentsPreviewComponent,
    InsightsComponent,
  ],
  templateUrl: './web-dashboard.component.html',
  styleUrls: ['./web-dashboard.component.scss']
})
export class WebDashboardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
