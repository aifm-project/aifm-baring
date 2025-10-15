import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { NewsletterComponent } from './components/newsletter/newsletter.component';
import { FundSelectorComponent } from './components/fund-selector/fund-selector.component';
import { DistributionChartComponent } from './components/distribution-chart/distribution-chart.component';
import { GetCurrencyByUnitsPipe } from './pipe/get-currency-by-units.pipe';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NavbarComponent,
    FooterComponent,
    NewsletterComponent,
    FundSelectorComponent,
    DistributionChartComponent,
    GetCurrencyByUnitsPipe
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    NewsletterComponent,
    FundSelectorComponent,
    DistributionChartComponent,
    GetCurrencyByUnitsPipe
  ],
  providers: [GetCurrencyByUnitsPipe],
})
export class SharedModule {}
