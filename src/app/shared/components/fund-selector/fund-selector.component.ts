import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fund-selector',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './fund-selector.component.html',
  styleUrls: ['./fund-selector.component.scss']
})
export class FundSelectorComponent {
  @Input() selectedFund: string = 'Baring Private Equity India AIF 2';
  @Input() inceptionDate: string = 'Inception: 31 Dec 2022';
  @Input() accountId: string = 'Account ID - INV-83627JQA';

  constructor() {}

  onFundChange(fund: string) {
    this.selectedFund = fund;
    // Handle fund selection logic here
    console.log('Selected fund:', fund);
  }
}
