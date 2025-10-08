import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent {
  
  onViewAllInsights() {
    console.log('Navigate to insights page');
  }

  onSummarizeInsights() {
    console.log('Summarize insights');
  }

  onReadInsight(type: string) {
    console.log('Read insight:', type);
  }
}
