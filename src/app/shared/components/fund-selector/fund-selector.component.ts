import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { setFundData } from '../../../store/fund/fund.action';
import { setAllDates, setSelectedDate } from '../../../store/date/date.action';
import { RouterModule, Router,NavigationStart } from '@angular/router';
import { FundService } from '../../../core/services/fund.service';
import {filter} from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { selectAuthState } from '../../../store/auth';
import { User } from '../../../model/models';

@Component({
  selector: 'app-fund-selector',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './fund-selector.component.html',
  styleUrls: ['./fund-selector.component.scss']
})
export class FundSelectorComponent {
  @Input() selectedFund: any;
  @Input() inceptionDate: string = 'Inception: 31 Dec 2022';
  @Input() accountId: string = 'Account ID - INV-83627JQA';
  fundList: any;
  activeTab: any;
  asOfDate: any;
  dataDates: any = [];
  userDetails: User;

  constructor(private fundService: FundService, private store: Store, private router: Router) {
  }

  onFundChange(fund: string) {
    this.selectedFund = fund;
    // Handle fund selection logic here
    console.log('Selected fund:', fund);
  }

  ngOnInit(): void {
    this.getUserDetails()
    this.loadRouterChange()
    this.getFunds();
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  getFunds(){
    this.fundService.getFunds({offset: 0, limit: 100}).subscribe({
      next: (response) => {
       this.fundList = response.funds;
       console.log('Funds fetched successfully:', this.fundList);
       if(this.fundList.length > 0){
        this.selectedFund = this.fundList[0];
         if(this.selectedFund.isInvestorCard && !this.selectedFund['user_guid']){
        this.selectedFund['user_guid'] = this.userDetails.user_guid
      }
        this.store.dispatch(setFundData({ fundData: this.selectedFund, date: this.inceptionDate }));
        let skurls = ['/dashboard','/portfolio'];
        if(this.router.url =='/dashboard'){
           this.getAsOfDates('PERFORMANCE');
        }else if(this.router.url =='/portfolio') {
          this.getAsOfDates('PORTFOLIO');
        }

       }
      },
      error: (error) => {
        console.error('Error fetching funds:', error);
      }
    });
  }

  onFundSelect(fund:any) {
    localStorage.removeItem('fundInvestorToken');
    this.selectedFund = fund
    if(this.selectedFund.isInvestorCard){
      localStorage.setItem('userGuid',this.selectedFund.user_guid)
      if(!this.selectedFund['user_guid']){
        this.selectedFund['user_guid'] = this.userDetails.user_guid
      }
    }
     this.store.dispatch(setFundData({ fundData: this.selectedFund, date: this.inceptionDate }));
     if(fund.isInvestorCard){
      this.fundService.getFundInvestorToken(this.selectedFund['user_guid']).subscribe({
        next: (response) => {
          if(response && response.user_token){
            localStorage.setItem('fundInvestorToken', response.user_token);
          }
          this.getAsOfDates('PERFORMANCE');
        }
      });
     } else {
       this.getAsOfDates('PERFORMANCE');
     }
   
    console.log('Selected fund:', fund);
  }

    getAsOfDates(LOADTYPE?, event?) {
    var tabType = LOADTYPE
    switch (this.activeTab) {
      case 'performance':
        tabType = "PERFORMANCE"
        break;
      case 'portfolio':
        tabType = "PORTFOLIO"
        break;
      case 'analytics':
        tabType = "ANALYTICS"
        break;
      default:
        break;
    }
    this.fundService.getDates(this.selectedFund.guid, tabType, event).subscribe(perfDates => {
      const perfDate = perfDates.dates;
      this.dataDates = perfDates.dates;
      this.store.dispatch(setAllDates({ dates: perfDate }));
      this.asOfDate = perfDate.length ? perfDate[0] : this.selectedFund.as_on_date;
      this.store.dispatch(setSelectedDate({
        selectedDate: {
          fund_guid: this.selectedFund.guid,
          asOfDate: perfDate.length ? perfDate[0] : this.selectedFund.as_on_date,
          fundType: this.selectedFund.fund_type,
          fundDetails: this.selectedFund
        }
      }));
    });
  }

  onDateChange(date: string) {
    this.asOfDate = date;
    this.store.dispatch(setSelectedDate({
      selectedDate: {
        fund_guid: this.selectedFund.guid,
        asOfDate: date,
        fundType: this.selectedFund.fund_type,
        fundDetails: this.selectedFund
      }
    }));
    console.log('Selected date:', date);
  }

  loadAsOfDate(activeTab){
    // this.getAsOfDates(activeTab);
  }

  loadRouterChange(){
     this.router.events.pipe(
      filter((event) => event instanceof NavigationStart)
    ).subscribe((sk:any) => {
        if(sk.url.includes('/portfolio')){
           this.getAsOfDates('PORTFOLIO');
        }else if(sk.url.includes('/dashboard')) {
          this.getAsOfDates('PERFORMANCE');
        }
        console.log("")
    });
  }

  getUserDetails(){
      let hasAuth = false;
        this.store.select(selectAuthState).subscribe(authState => {
          this.userDetails = authState.userData
        }).unsubscribe();
        return hasAuth;
  }
}
