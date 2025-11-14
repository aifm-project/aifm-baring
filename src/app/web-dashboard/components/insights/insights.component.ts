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
  featuredInsight = {
    id: 1,
    title: 'Future of Digital Transformation in Enterprise',
    category: 'MACROECONOMICS',
    date: 'Jun 5, 2025',
    readTime: '12 mins',
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/c516dc706e2479c075f2791958eb9ffb50443b4a?width=1280',
    hasVideo: true
  };

  sideInsights = [
    {
      id: 2,
      title: 'Achieving sustainable growth: Make sustainability the focus',
      category: 'MACROECONOMICS',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/ef25e34670c93b59e26fb25d6ee458d399d14b10?width=620',
      hasVideo: false
    },
    {
      id: 3,
      title: 'Baring Private Equity India invests $12 mn in Aditya Auto',
      category: 'PORTFOLIO HIGHLIGHTS',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/4fa27752bfbd803b8391d32f6c9a70b1a46f6cac?width=620',
      hasVideo: true
    }
  ];

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
