import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-navigation-button',
  imports: [CommonModule],
templateUrl: './dashboard-navigation-button.html',
  styleUrl: './dashboard-navigation-button.scss'
})
export class DashboardNavigationButton {
  @Input() label: string = 'View Portfolio';
  @Input() routerLink: string = '';
  @Input() showWhiteHover: boolean = false;
  @Output() public onClickChild: EventEmitter<any> = new EventEmitter<any>();

  public isHovered: boolean = false;
  constructor(public router:Router) {}
  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }

  onClickEvent() {
    if(this.routerLink){
      this.router.navigateByUrl(this.routerLink);
    }else {
      this.onClickChild.emit();
    }
    
  }
}
