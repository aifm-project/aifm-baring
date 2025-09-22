import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FundComponent } from './fund.component';

@NgModule({
  declarations: [
    FundComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    FundComponent
  ]
})
export class FundModule { }