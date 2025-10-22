import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  isRead: boolean;
  hasAction: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {
  selectedFilter = 'all';
  
  filters = [
    { id: 'all', label: 'All Notifications' },
    { id: 'fund-updates', label: 'Fund Updates' },
    { id: 'documents', label: 'Documents & Reports' },
    { id: 'events', label: 'Events & Webinars' },
    { id: 'insights', label: 'Insights Update' }
  ];

  notifications: Notification[] = [
    {
      id: 1,
      title: 'Quarterly Report Available',
      description: 'The latest quarterly performance report for Fund VIII is available in your Documents section. It includes key portfolio highlights, valuation updates, and the fund manager\'s commentary on market trends.',
      date: 'Oct 15, 2024',
      category: 'Documents and reports',
      isRead: false,
      hasAction: true
    },
    {
      id: 2,
      title: 'Distribution Notice Issued',
      description: 'Fund VI has declared a distribution. Details are now available in your dashboard.',
      date: 'Oct 15, 2024',
      category: 'Fund Updates',
      isRead: false,
      hasAction: true
    },
    {
      id: 3,
      title: 'Capital Call Reminder',
      description: 'You have an active capital call of ₹25,00,000 for Fund VII. Kindly ensure that the transfer is completed by the due date. You can view bank details and instructions in the call notice.',
      date: 'Sept 12, 2024',
      category: 'Fund Updates',
      isRead: true,
      hasAction: false
    },
    {
      id: 4,
      title: 'Distribution Declared',
      description: 'A distribution has been declared for Fund VI. Details of the disbursed amount and transaction date are now available in your dashboard. Funds will reflect in your registered account shortly.',
      date: 'August 24, 2024',
      category: 'Fund Updates',
      isRead: true,
      hasAction: false
    },
    {
      id: 5,
      title: 'Upcoming Investor Webinar',
      description: 'Join the fund manager and investment team for a live discussion on Fund IX\'s current performance and future outlook. The session will include Q&A.',
      date: 'August 13, 2024',
      category: 'Events and webinars',
      isRead: false,
      hasAction: true
    }
  ];

  get filteredNotifications(): Notification[] {
    if (this.selectedFilter === 'all') {
      return this.notifications;
    }
    return this.notifications.filter(n => this.getCategoryId(n.category) === this.selectedFilter);
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  selectFilter(filterId: string): void {
    this.selectedFilter = filterId;
  }

  getCategoryId(category: string): string {
    const map: { [key: string]: string } = {
      'Documents and reports': 'documents',
      'Fund Updates': 'fund-updates',
      'Events and webinars': 'events',
      'Insights Update': 'insights'
    };
    return map[category] || 'all';
  }

  onNotificationClick(notification: Notification): void {
    console.log('Notification clicked:', notification);
  }

  onViewMore(): void {
    console.log('View more clicked');
  }
}
