import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss'
})
export class TopNavbarComponent {
  navigationItems = [
    { label: 'FUNDS', icon: 'folder', active: false },
    { label: 'INSIGHTS', icon: 'chart', active: false },
    { label: 'ASK BARING', icon: 'star', active: false }
  ];

  onNavigationClick(item: any) {
    // Reset all items
    this.navigationItems.forEach(navItem => navItem.active = false);
    // Set clicked item as active
    item.active = true;
  }

  onSearchClick() {
    console.log('Search clicked');
  }

  onNotificationClick() {
    console.log('Notification clicked');
  }

  onProfileClick() {
    console.log('Profile clicked');
  }
}