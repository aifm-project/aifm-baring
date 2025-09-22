@@ .. @@
 import { Component } from '@angular/core';
-import { CommonModule } from '@angular/common';
-import { ButtonModule } from 'primeng/button';
-import { AvatarModule } from 'primeng/avatar';
-import { BadgeModule } from 'primeng/badge';
-import { TooltipModule } from 'primeng/tooltip';
 
 interface NavigationItem {
   label: string;
@@ .. @@
 
 @Component({
   selector: 'app-top-navbar',
-  standalone: true,
-  imports: [CommonModule, ButtonModule, AvatarModule, BadgeModule, TooltipModule],
   templateUrl: './top-navbar.component.html',
   styleUrls: ['./top-navbar.component.scss']
 })