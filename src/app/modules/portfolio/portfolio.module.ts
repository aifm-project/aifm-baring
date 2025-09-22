import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { PortfolioComponent } from './portfolio.component';

@NgModule({
  declarations: [
    PortfolioComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    PortfolioComponent
  ]
})
export class PortfolioModule { }