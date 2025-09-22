import { Component, OnInit } from '@angular/core';

interface Fund {
  name: string;
  type: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
}

@Component({
  selector: 'app-fund',
  templateUrl: './fund.component.html',
  styleUrls: ['./fund.component.scss']
})
export class FundComponent implements OnInit {
  funds: Fund[] = [
    {
      name: 'Baring Private Equity Asia Fund VII',
      type: 'Growth Capital',
      value: '$2.5B',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      name: 'Baring Private Equity Asia Fund VI',
      type: 'Buyout',
      value: '$1.8B',
      change: '+8.3%',
      changeType: 'positive'
    },
    {
      name: 'Baring Vostok Fund',
      type: 'Emerging Markets',
      value: '$950M',
      change: '-2.1%',
      changeType: 'negative'
    }
  ];

  selectedFund: Fund | null = null;

  ngOnInit(): void {
    this.selectedFund = this.funds[0];
  }

  selectFund(fund: Fund): void {
    this.selectedFund = fund;
  }
}