import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NotificationsComponent } from './notifications.component';

const routes = [
  {
    path: '',
    component: NotificationsComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NotificationsComponent,
    RouterModule.forChild(routes),
  ],
})
export class NotificationsModule {}
