import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardNavigationButton } from '../../../shared/components/dashboard-navigation-button/dashboard-navigation-button';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule,DashboardNavigationButton],
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
