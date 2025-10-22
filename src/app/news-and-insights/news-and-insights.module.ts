import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NewsAndInsightsComponent } from './news-and-insights.component';

const routes = [
  {
    path: '',
    component: NewsAndInsightsComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NewsAndInsightsComponent,
    RouterModule.forChild(routes),
  ],
})
export class NewsAndInsightsModule {}
