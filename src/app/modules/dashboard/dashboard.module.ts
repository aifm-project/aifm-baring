import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { DashboardComponent } from './dashboard.component';
import { NavbarModule } from '../navbar/navbar.module';
import { FundModule } from '../fund/fund.module';
import { OverviewModule } from '../overview/overview.module';
import { PerformanceModule } from '../performance/performance.module';
import { OnlineSeminarModule } from '../online-seminar/online-seminar.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { DocumentsModule } from '../documents/documents.module';
import { InsightModule } from '../insight/insight.module';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { FooterModule } from '../footer/footer.module';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  }
];

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    NavbarModule,
    FundModule,
    OverviewModule,
    PerformanceModule,
    OnlineSeminarModule,
    PortfolioModule,
    DocumentsModule,
    InsightModule,
    NewsletterModule,
    FooterModule
  ],
  exports: [
    DashboardComponent
  ]
})
export class DashboardModule { }