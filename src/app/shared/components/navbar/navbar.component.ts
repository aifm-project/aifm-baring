import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  userEmail: string | null = null;
  showUserMenu = false;
  unreadNotifications = 3;
  currentUrl = '';
  private destroy$ = new Subject<void>();
  userProfileImage:string = "./../../../assets/icons1/User.png";

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getUserEmail();
    this.getUserProfileUrl()
    this.currentUrl = this.router.url;

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.url;
      });
  }

  isActiveRoute(route: string): boolean {
    return this.currentUrl.includes(route);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


    getUserProfileUrl() {
      this.authService.getUserPic().subscribe(sk=>{
        this.userProfileImage = sk || "./../../../assets/icons1/User.png"
      })
  }

  
}
