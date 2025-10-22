import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-news-and-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './news-and-insights.component.html',
  styleUrls: ['./news-and-insights.component.scss']
})
export class NewsAndInsightsComponent {
  selectedTopic = '';
  selectedSort = '';
  searchQuery = '';

  newsItems = [
    {
      id: 1,
      category: 'Macroeconomics',
      title: 'Covid-19 lockdown and the strange investment conundrum',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/9c20b86987460e8b8058daf80661f02810665486?width=1720',
      isFeatured: true,
      hasVideo: true
    },
    {
      id: 2,
      category: 'Macroeconomics',
      title: 'Achieving sustainable growth: Make sustainability the focus',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/034c892bfc7c29406cc130cb54307fd822277c5e?width=840',
      hasVideo: false
    },
    {
      id: 3,
      category: 'Fund News',
      title: 'Rahul Bhasin on where to look for big returns over the next 5-10 years',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/41a0b697b32c347e388fec71acc61dfe0562cfc0?width=342',
      hasVideo: false
    },
    {
      id: 4,
      category: 'Macroeconomics',
      title: 'Key is to deliver returns over a 20-year period',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b72feb79b0bbd2a3a375500e2810ef82ce50ee8f?width=840',
      hasVideo: false
    },
    {
      id: 5,
      category: 'Portfolio Highlights',
      title: 'Baring PE exits Muthoot Finance, it\'s third in 3 weeks',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/316040d49001e99cbac017f480e653867a23b394?width=839',
      hasVideo: false
    },
    {
      id: 6,
      category: 'Macroeconomics',
      title: 'Achieving sustainable growth: Make sustainability the focus',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/2b9e276c328c51fe93269e5ba5c55ca2a8fd66f8?width=840',
      hasVideo: true
    },
    {
      id: 7,
      category: 'Macroeconomics',
      title: 'An attractive time to get more aggressive: Baring India',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b72feb79b0bbd2a3a375500e2810ef82ce50ee8f?width=840',
      hasVideo: false
    },
    {
      id: 8,
      category: 'Portfolio Highlights',
      title: 'Covid-19 lockdown and the strange investment conundrum',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/73baddb2931b101facd12fece6ee8aefa9301bc5?width=840',
      hasVideo: false
    },
    {
      id: 9,
      category: 'Macroeconomics',
      title: 'Baring\'s Rahul Bhasin remains a big bull in long-term India story',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/034c892bfc7c29406cc130cb54307fd822277c5e?width=840',
      hasVideo: false
    },
    {
      id: 10,
      category: 'Fund News',
      title: 'Baring Scores 4th Exit in a month with Vardhman',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/c64f830994f2e307ef25f8131031f179628322f9?width=840',
      hasVideo: false
    },
    {
      id: 11,
      category: 'Macroeconomics',
      title: 'Baring Private Equity India invests $12 mn in Aditya Auto',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/8fc252200e24de9f202cd53701d8fa04dccef17b?width=840',
      hasVideo: false
    },
    {
      id: 12,
      category: 'Macroeconomics',
      title: 'Baring Scores 4th Exit in a month with Vardhman',
      date: 'Jul 6, 2025',
      readTime: '7 mins',
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/8a20946b1089d22ab8219c582f732eab20f6aabb?width=840',
      hasVideo: true
    }
  ];

  spotlightArticle = {
    category: 'Industry Spotlight',
    title: 'Electric Vehicles and the Future of Transportation',
    description: 'Once a niche bet, electric vehicles now stand at the crossroads of policy, innovation, and consumer demand. This moment offers a lens into how industries and investments evolve.',
    relatedNews: [
      {
        category: 'Portfolio Highlights',
        title: 'Baring Private Equity India invests $12 mn in Aditya Auto',
        date: 'Jul 6, 2025',
        readTime: '7 mins',
        image: 'https://api.builder.io/api/v1/image/assets/TEMP/f099eb391b416577aefcbd57cb7b4216f56e845a?width=342'
      },
      {
        category: 'Macroeconomics',
        title: 'The Rise and Fall of Electric Vehicle Industry in India',
        date: 'Jul 6, 2025',
        readTime: '7 mins',
        image: 'https://api.builder.io/api/v1/image/assets/TEMP/ec75522bb34c70fe47a4b505a9fbab9ce906e404?width=342',
        hasVideo: true
      },
      {
        category: 'Fund News',
        title: 'Rahul Bhasin on where to look for big returns over the next 5-10 years',
        date: 'Jul 6, 2025',
        readTime: '7 mins',
        image: 'https://api.builder.io/api/v1/image/assets/TEMP/41a0b697b32c347e388fec71acc61dfe0562cfc0?width=342'
      }
    ]
  };

  newsletterEmail = '';

  onTopicChange() {
    console.log('Topic changed:', this.selectedTopic);
  }

  onSortChange() {
    console.log('Sort changed:', this.selectedSort);
  }

  onSearch() {
    console.log('Search:', this.searchQuery);
  }

  onSubscribeNewsletter() {
    if (this.newsletterEmail) {
      console.log('Subscribe:', this.newsletterEmail);
      this.newsletterEmail = '';
    }
  }
}
