import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { PerformanceComponent } from './performance.component';

@NgModule({
  declarations: [
    PerformanceComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    PerformanceComponent
  ]
})
export class PerformanceModule { }