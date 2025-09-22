import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { NewsletterComponent } from './newsletter.component';

@NgModule({
  declarations: [
    NewsletterComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    NewsletterComponent
  ]
})
export class NewsletterModule { }