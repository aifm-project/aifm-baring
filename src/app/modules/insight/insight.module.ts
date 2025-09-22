import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { InsightComponent } from './insight.component';

@NgModule({
  declarations: [
    InsightComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    InsightComponent
  ]
})
export class InsightModule { }