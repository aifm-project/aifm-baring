import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { setFundData } from '../../../store/fund/fund.action';
import { setAllDates, setSelectedDate } from '../../../store/date/date.action';
import { RouterModule } from '@angular/router';
import { FundService } from '../../../core/services/fund.service';
import { CommonModule } from '@angular/common';

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

  constructor(private fundService: FundService, private store: Store) {
  }

  onFundChange(fund: string) {
    this.selectedFund = fund;
    // Handle fund selection logic here
    console.log('Selected fund:', fund);
  }

  ngOnInit(): void {
    this.getFunds();
  }

  getFunds(){
    this.fundService.getFunds({offset: 0, limit: 100}).subscribe({
      next: (response) => {
       this.fundList = response.funds;
       console.log('Funds fetched successfully:', this.fundList);
       if(this.fundList.length > 0){
        this.selectedFund = this.fundList[0];
        this.store.dispatch(setFundData({ fundData: this.selectedFund, date: this.inceptionDate }));
        this.getAsOfDates('PERFORMANCE');
       }
      },
      error: (error) => {
        console.error('Error fetching funds:', error);
      }
    });
  }

  onFundSelect(fund: string) {
    this.getAsOfDates('PERFORMANCE');
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
}
