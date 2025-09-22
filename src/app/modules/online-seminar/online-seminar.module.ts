import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { OnlineSeminarComponent } from './online-seminar.component';

@NgModule({
  declarations: [
    OnlineSeminarComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    OnlineSeminarComponent
  ]
})
export class OnlineSeminarModule { }