import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthenticatedLayoutComponent } from './layout.component';

@NgModule({
  imports: [AuthenticatedLayoutComponent, RouterModule],
  exports: [AuthenticatedLayoutComponent],
})
export class LayoutModule {}
