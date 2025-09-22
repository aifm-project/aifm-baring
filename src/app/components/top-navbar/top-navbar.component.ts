import { Component } from '@angular/core';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.scss']
})
export class TopNavbarComponent {
  navigationItems: NavigationItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Projects', icon: 'pi pi-folder', route: '/projects' },
    { label: 'Tasks', icon: 'pi pi-check-square', route: '/tasks' },
    { label: 'Reports', icon: 'pi pi-chart-bar', route: '/reports' }
  ];

  userNotifications = 3;
  userName = 'John Doe';
  userAvatar = 'assets/images/avatar.jpg';

  onNotificationClick() {
    console.log('Notifications clicked');
  }

  onProfileClick() {
    console.log('Profile clicked');
  }

  onLogout() {
    console.log('Logout clicked');
  }
}