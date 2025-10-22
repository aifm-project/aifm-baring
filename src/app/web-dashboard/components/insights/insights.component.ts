import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent {

  constructor(private router: Router) {}

  onViewAllInsights() {
    this.router.navigate(['/insights']);
  }

  onSummarizeInsights() {
    console.log('Summarize insights');
  }

  onReadInsight(type: string) {
    console.log('Read insight:', type);
  }
}
