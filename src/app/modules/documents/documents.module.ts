import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DocumentsComponent } from './documents.component';

@NgModule({
  declarations: [
    DocumentsComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    DocumentsComponent
  ]
})
export class DocumentsModule { }