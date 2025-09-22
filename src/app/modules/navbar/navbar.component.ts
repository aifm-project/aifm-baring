import { Component } from '@angular/core';

interface NavigationItem {
  label: string;
  icon: string;
  active?: boolean;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  navigationItems: NavigationItem[] = [
    { label: 'FUNDS', icon: 'pi pi-folder', active: true },
    { label: 'INSIGHTS', icon: 'pi pi-chart-line' },
    { label: 'ASK BARING', icon: 'pi pi-star' }
  ];

  userNotifications = 3;
}