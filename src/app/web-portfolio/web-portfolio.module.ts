import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { WebPortfolioComponent } from './web-portfolio.component';
import { PortfolioOverviewComponent } from './components/portfolio-overview/portfolio-overview.component';
import { InvestmentTableComponent } from './components/investment-table/investment-table.component';

const routes = [
  {
    path: '',
    component: WebPortfolioComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    WebPortfolioComponent,
    PortfolioOverviewComponent,
    InvestmentTableComponent,
    RouterModule.forChild(routes),
  ],
})
export class WebPortfolioModule {}
