import { Component, ElementRef, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Account } from './model/models';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [MessageService],
})
export class App implements OnInit {
accountInfo: Account;
  constructor(private _elementRef: ElementRef,
    private titleService: Title,
  ){

  }

  ngOnInit(): void {
    this._elementRef.nativeElement.removeAttribute("ng-version");
    if (this.accountInfo && this.accountInfo['name']) {
      this.titleService.setTitle(this.accountInfo['name'])
    }
  }
}
