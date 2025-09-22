import { Component, OnInit } from '@angular/core';

interface Seminar {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: string;
  speaker: string;
  speakerTitle: string;
  registeredCount: number;
  maxCapacity: number;
  status: 'upcoming' | 'live' | 'completed';
  tags: string[];
}

@Component({
  selector: 'app-online-seminar',
  templateUrl: './online-seminar.component.html',
  styleUrls: ['./online-seminar.component.scss']
})
export class OnlineSeminarComponent implements OnInit {
  seminars: Seminar[] = [
    {
      id: '1',
      title: 'Private Equity Market Outlook 2024',
      description: 'Comprehensive analysis of market trends, opportunities, and challenges in the private equity landscape for 2024.',
      date: new Date('2024-02-15T14:00:00'),
      duration: '60 min',
      speaker: 'John Smith',
      speakerTitle: 'Managing Director, Baring Private Equity',
      registeredCount: 245,
      maxCapacity: 500,
      status: 'upcoming',
      tags: ['Market Analysis', 'Strategy', 'Outlook']
    },
    {
      id: '2',
      title: 'ESG Integration in Private Equity',
      description: 'Best practices for incorporating Environmental, Social, and Governance factors into investment decisions.',
      date: new Date('2024-02-20T15:30:00'),
      duration: '45 min',
      speaker: 'Sarah Johnson',
      speakerTitle: 'Head of ESG, Baring Private Equity',
      registeredCount: 189,
      maxCapacity: 300,
      status: 'upcoming',
      tags: ['ESG', 'Sustainability', 'Best Practices']
    },
    {
      id: '3',
      title: 'Technology Sector Deep Dive',
      description: 'Exploring investment opportunities and trends in the technology sector across Asia-Pacific markets.',
      date: new Date('2024-01-25T13:00:00'),
      duration: '75 min',
      speaker: 'Michael Chen',
      speakerTitle: 'Partner, Technology Investments',
      registeredCount: 312,
      maxCapacity: 400,
      status: 'completed',
      tags: ['Technology', 'Asia-Pacific', 'Sector Analysis']
    }
  ];

  upcomingSeminars: Seminar[] = [];
  completedSeminars: Seminar[] = [];

  ngOnInit(): void {
    this.categorizeSemin
ars();
  }

  private categorizeSeminars(): void {
    this.upcomingSeminars = this.seminars.filter(s => s.status === 'upcoming' || s.status === 'live');
    this.completedSeminars = this.seminars.filter(s => s.status === 'completed');
  }

  registerForSeminar(seminar: Seminar): void {
    if (seminar.registeredCount < seminar.maxCapacity) {
      seminar.registeredCount++;
      // Here you would typically call an API to register the user
      console.log(`Registered for seminar: ${seminar.title}`);
    }
  }

  getRegistrationPercentage(seminar: Seminar): number {
    return (seminar.registeredCount / seminar.maxCapacity) * 100;
  }
}