import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-online-seminar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './online-seminar.component.html',
  styleUrls: ['./online-seminar.component.scss']
})
export class OnlineSeminarComponent {}
