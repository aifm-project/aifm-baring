import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MonetaryValue {
  symbol: string;
  amount: string;
  unit: string;
}

export interface PercentageValue {
  value: string;
  suffix: string;
}

export interface Company {
  name: string;
  industry: string;
  investment: MonetaryValue;
  marketValue: MonetaryValue;
  irr: PercentageValue;
  moic: PercentageValue;
  weight: PercentageValue;
  weightPercent: number;
  logo: string;
}

export interface PortfolioSummary {
  totalHoldings: number;
  totalInvestment: string;
  totalMarketValue: string;
  totalGrossIRR: string;
  totalGrossMOIC: string;
  totalReturns: string;
}

@Component({
  selector: 'app-investment-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-table.component.html',
  styleUrls: ['./investment-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestmentTableComponent {
  @Input() portfolioSummary: PortfolioSummary = {
    totalHoldings: 20,
    totalInvestment: '₹985.12 Cr',
    totalMarketValue: '₹1300.07 Cr',
    totalGrossIRR: '20.04%',
    totalGrossMOIC: '1.32X',
    totalReturns: '₹349.94 Cr'
  };
  @Input() showHeader!: boolean;
  @Input() showPortfolioSummary!: boolean;
  @Input() showStaticContent!: boolean;
  @Input() limit!: number | null;
  @Input() containerClass: 'container' | 'container-fluid' = 'container';

  companies: Company[] = [
    {
      name: 'Lohum Cleantech Pvt Ltd',
      industry: 'Electric Vehicles',
      investment: { symbol: '₹', amount: '144.89', unit: 'Cr' },
      marketValue: { symbol: '₹', amount: '239.89', unit: 'Cr' },
      irr: { value: '39.25', suffix: '%' },
      moic: { value: '1.66', suffix: 'X' },
      weight: { value: '14.60', suffix: '%' },
      weightPercent: 14.6,
      logo: 'https://api.builder.io/api/v1/image/assets/TEMP/381fa02bd05b15f959e26e5beb3aa485c9e2d6bb?width=55'
    },
    {
      name: 'Intagles Lab Pvt Ltd',
      industry: 'Auto',
      investment: { symbol: '₹', amount: '117.63', unit: 'Cr' },
      marketValue: { symbol: '₹', amount: '239.89', unit: 'Cr' },
      irr: { value: '20.08', suffix: '%' },
      moic: { value: '1.33', suffix: 'X' },
      weight: { value: '11.94', suffix: '%' },
      weightPercent: 11.94,
      logo: 'https://api.builder.io/api/v1/image/assets/TEMP/2b9059aa1ed002b184dbe9f2c77627c9b752ed20?width=66'
    },
    {
      name: 'SK Finance Limited',
      industry: 'Financial Services',
      investment: { symbol: '₹', amount: '95.00', unit: 'Cr' },
      marketValue: { symbol: '₹', amount: '95.00', unit: 'Cr' },
      irr: { value: '-', suffix: '%' },
      moic: { value: '1.00', suffix: 'X' },
      weight: { value: '9.64', suffix: '%' },
      weightPercent: 9.64,
      logo: 'https://api.builder.io/api/v1/image/assets/TEMP/eb260d59ab2ee9f6c1532eeeeb3f97ba7d00c66a?width=55'
    },
      {
      name: 'Nivara Home Finance Ltd',
      industry: 'NBFC',
      investment: { symbol: '₹', amount: '79.77', unit: 'Cr' },
      marketValue: { symbol: '₹', amount: '79.77', unit: 'Cr' },
      irr: { value: '-', suffix: '%' },
      moic: { value: '1.00', suffix: 'X' },
      weight: { value: '8.10', suffix: '%' },
      weightPercent: 8.1,
      logo: 'https://api.builder.io/api/v1/image/assets/TEMP/d863ce8853e25b1958a065c094fc0d58a7fdae50?width=56'
    },
    {
      name: 'Aditya Auto Products and Engineering India Pvt Ltd',
      industry: 'Electric Vehicles',
      investment: { symbol: '₹', amount: '65.00', unit: 'Cr' },
      marketValue: { symbol: '₹', amount: '140.35', unit: 'Cr' },
      irr: { value: '34.67', suffix: '%' },
      moic: { value: '2.16', suffix: 'X' },
      weight: { value: '6.60', suffix: '%' },
      weightPercent: 6.6,
      logo: 'https://api.builder.io/api/v1/image/assets/TEMP/e483f28efcb7140816e3c5621eb150666614829a?width=74'
    },
    {
      name: 'Koskii- Akya Retail Pvt',
      industry: 'Retail',
      investment: { symbol: '₹', amount: '60.06', unit: 'Cr' },
      marketValue: { symbol: '₹', amount: '60.06', unit: 'Cr' },
      irr: { value: '-', suffix: '%' },
      moic: { value: '1.00', suffix: 'X' },
      weight: { value: '6.10', suffix: '%' },
      weightPercent: 6.1,
      logo: 'https://api.builder.io/api/v1/image/assets/TEMP/06e4b7425bc681cf5318786ab052fd7cc96a81da?width=70'
    },
  ];

  get limitedCompanies(): Company[] {
    if (this.limit != null && this.limit > 0) {
      return this.companies.slice(0, this.limit);
    }
    return this.companies;
  }

  private maxWeight = Math.max(...this.companies.map((company) => company.weightPercent));
  private progressCache = new Map<number, number>();

  getProgressPercent(weightPercent: number): number {
    if (this.progressCache.has(weightPercent)) {
      return this.progressCache.get(weightPercent)!;
    }

    if (!Number.isFinite(weightPercent) || weightPercent <= 0) {
      return 0;
    }

    const percent = Math.min((weightPercent / this.maxWeight) * 100, 100);
    this.progressCache.set(weightPercent, percent);
    return percent;
  }

  hasMonetaryValue(value: MonetaryValue): boolean {
    return value.amount.trim() !== '-' && value.amount.trim() !== '';
  }

  hasPercentageValue(value: PercentageValue): boolean {
    return value.value.trim() !== '-' && value.value.trim() !== '';
  }

  trackByCompany(index: number, company: Company): string {
    return company.name;
  }
}
