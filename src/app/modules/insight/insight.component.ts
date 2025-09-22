import { Component, OnInit } from '@angular/core';

interface Insight {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  authorTitle: string;
  publishDate: Date;
  readTime: number;
  category: string;
  tags: string[];
  featured: boolean;
  imageUrl: string;
  viewCount: number;
}

@Component({
  selector: 'app-insight',
  templateUrl: './insight.component.html',
  styleUrls: ['./insight.component.scss']
})
export class InsightComponent implements OnInit {
  insights: Insight[] = [
    {
      id: '1',
      title: 'The Future of Private Equity in Asia: Trends and Opportunities',
      summary: 'Exploring the evolving landscape of private equity investments across Asian markets and identifying key growth opportunities for 2024.',
      content: 'Full article content would go here...',
      author: 'Sarah Chen',
      authorTitle: 'Managing Director, Asia Pacific',
      publishDate: new Date('2024-01-20'),
      readTime: 8,
      category: 'Market Analysis',
      tags: ['Asia', 'Private Equity', 'Trends', 'Growth'],
      featured: true,
      imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      viewCount: 1247
    },
    {
      id: '2',
      title: 'ESG Integration: Beyond Compliance to Value Creation',
      summary: 'How environmental, social, and governance factors are becoming central to investment strategies and value creation.',
      content: 'Full article content would go here...',
      author: 'Michael Johnson',
      authorTitle: 'Head of ESG',
      publishDate: new Date('2024-01-15'),
      readTime: 6,
      category: 'ESG',
      tags: ['ESG', 'Sustainability', 'Value Creation', 'Investment'],
      featured: false,
      imageUrl: 'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      viewCount: 892
    },
    {
      id: '3',
      title: 'Technology Disruption in Traditional Industries',
      summary: 'Analyzing how digital transformation is reshaping traditional sectors and creating new investment opportunities.',
      content: 'Full article content would go here...',
      author: 'David Kim',
      authorTitle: 'Partner, Technology Investments',
      publishDate: new Date('2024-01-10'),
      readTime: 10,
      category: 'Technology',
      tags: ['Technology', 'Digital Transformation', 'Innovation', 'Disruption'],
      featured: true,
      imageUrl: 'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      viewCount: 1456
    },
    {
      id: '4',
      title: 'Healthcare Innovation: Investment Opportunities in MedTech',
      summary: 'Exploring the rapidly evolving medical technology landscape and identifying promising investment opportunities.',
      content: 'Full article content would go here...',
      author: 'Dr. Lisa Wang',
      authorTitle: 'Principal, Healthcare Investments',
      publishDate: new Date('2024-01-05'),
      readTime: 7,
      category: 'Healthcare',
      tags: ['Healthcare', 'MedTech', 'Innovation', 'Investment'],
      featured: false,
      imageUrl: 'https://images.pexels.com/photos/3184305/pexels-photo-3184305.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      viewCount: 734
    }
  ];

  featuredInsights: Insight[] = [];
  regularInsights: Insight[] = [];
  selectedCategory = 'All';
  
  categories = ['All', 'Market Analysis', 'ESG', 'Technology', 'Healthcare', 'Strategy'];

  ngOnInit(): void {
    this.categorizeInsights();
  }

  private categorizeInsights(): void {
    this.featuredInsights = this.insights.filter(insight => insight.featured);
    this.regularInsights = this.insights.filter(insight => !insight.featured);
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedCategory === 'All') {
      this.featuredInsights = this.insights.filter(insight => insight.featured);
      this.regularInsights = this.insights.filter(insight => !insight.featured);
    } else {
      this.featuredInsights = this.insights.filter(insight => 
        insight.featured && insight.category === this.selectedCategory
      );
      this.regularInsights = this.insights.filter(insight => 
        !insight.featured && insight.category === this.selectedCategory
      );
    }
  }

  readInsight(insight: Insight): void {
    insight.viewCount++;
    console.log(`Reading insight: ${insight.title}`);
    // Navigate to full article or open modal
  }

  shareInsight(insight: Insight): void {
    console.log(`Sharing insight: ${insight.title}`);
    // Implement sharing functionality
  }
}