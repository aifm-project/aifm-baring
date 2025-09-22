import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Newsletter {
  id: string;
  title: string;
  description: string;
  publishDate: Date;
  downloadUrl: string;
  featured: boolean;
  category: string;
}

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent implements OnInit {
  subscriptionForm: FormGroup;
  newsletters: Newsletter[] = [
    {
      id: '1',
      title: 'Q4 2023 Market Review',
      description: 'Comprehensive analysis of market performance and key trends from the fourth quarter of 2023.',
      publishDate: new Date('2024-01-15'),
      downloadUrl: '#',
      featured: true,
      category: 'Quarterly Review'
    },
    {
      id: '2',
      title: 'Private Equity Outlook 2024',
      description: 'Our annual outlook covering market predictions, investment strategies, and emerging opportunities.',
      publishDate: new Date('2024-01-01'),
      downloadUrl: '#',
      featured: true,
      category: 'Annual Outlook'
    },
    {
      id: '3',
      title: 'ESG Integration Update',
      description: 'Latest developments in ESG integration across our portfolio companies and investment processes.',
      publishDate: new Date('2023-12-15'),
      downloadUrl: '#',
      featured: false,
      category: 'ESG Update'
    },
    {
      id: '4',
      title: 'Technology Sector Spotlight',
      description: 'Deep dive into technology investments and digital transformation trends across Asia Pacific.',
      publishDate: new Date('2023-12-01'),
      downloadUrl: '#',
      featured: false,
      category: 'Sector Focus'
    }
  ];

  isSubscribed = false;
  subscriptionMessage = '';

  constructor(private fb: FormBuilder) {
    this.subscriptionForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      company: [''],
      interests: [[]],
      frequency: ['monthly']
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  onSubscribe(): void {
    if (this.subscriptionForm.valid) {
      const formData = this.subscriptionForm.value;
      console.log('Newsletter subscription:', formData);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubscribed = true;
        this.subscriptionMessage = 'Thank you for subscribing! You will receive our latest newsletters and updates.';
        this.subscriptionForm.reset();
      }, 1000);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.subscriptionForm.controls).forEach(key => {
      const control = this.subscriptionForm.get(key);
      control?.markAsTouched();
    });
  }

  downloadNewsletter(newsletter: Newsletter): void {
    console.log(`Downloading newsletter: ${newsletter.title}`);
    // Implement download functionality
  }

  getInterestOptions() {
    return [
      { label: 'Market Analysis', value: 'market-analysis' },
      { label: 'ESG Updates', value: 'esg-updates' },
      { label: 'Technology Trends', value: 'technology-trends' },
      { label: 'Portfolio Updates', value: 'portfolio-updates' },
      { label: 'Industry Insights', value: 'industry-insights' }
    ];
  }

  getFrequencyOptions() {
    return [
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'Quarterly', value: 'quarterly' }
    ];
  }
}