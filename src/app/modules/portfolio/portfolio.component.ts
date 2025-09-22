import { Component, OnInit } from '@angular/core';

interface PortfolioCompany {
  id: string;
  name: string;
  sector: string;
  region: string;
  investmentDate: Date;
  investmentAmount: number;
  currentValue: number;
  status: 'active' | 'exited' | 'ipo';
  description: string;
  website: string;
  logo: string;
}

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnInit {
  portfolioCompanies: PortfolioCompany[] = [
    {
      id: '1',
      name: 'TechCorp Asia',
      sector: 'Technology',
      region: 'Singapore',
      investmentDate: new Date('2021-03-15'),
      investmentAmount: 50000000,
      currentValue: 75000000,
      status: 'active',
      description: 'Leading fintech platform providing digital payment solutions across Southeast Asia.',
      website: 'https://techcorp-asia.com',
      logo: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      id: '2',
      name: 'GreenEnergy Solutions',
      sector: 'Energy',
      region: 'China',
      investmentDate: new Date('2020-08-22'),
      investmentAmount: 80000000,
      currentValue: 120000000,
      status: 'active',
      description: 'Renewable energy company specializing in solar and wind power generation.',
      website: 'https://greenenergy-solutions.com',
      logo: 'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      id: '3',
      name: 'HealthTech Innovations',
      sector: 'Healthcare',
      region: 'India',
      investmentDate: new Date('2019-11-10'),
      investmentAmount: 35000000,
      currentValue: 85000000,
      status: 'ipo',
      description: 'Digital healthcare platform connecting patients with medical professionals.',
      website: 'https://healthtech-innovations.com',
      logo: 'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      id: '4',
      name: 'LogiFlow Systems',
      sector: 'Logistics',
      region: 'Japan',
      investmentDate: new Date('2018-05-18'),
      investmentAmount: 60000000,
      currentValue: 45000000,
      status: 'exited',
      description: 'Supply chain management and logistics optimization platform.',
      website: 'https://logiflow-systems.com',
      logo: 'https://images.pexels.com/photos/3184305/pexels-photo-3184305.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    }
  ];

  filteredCompanies: PortfolioCompany[] = [];
  selectedSector = 'All';
  selectedRegion = 'All';
  selectedStatus = 'All';

  sectors = ['All', 'Technology', 'Healthcare', 'Energy', 'Logistics', 'Finance'];
  regions = ['All', 'Singapore', 'China', 'India', 'Japan', 'South Korea'];
  statuses = ['All', 'active', 'exited', 'ipo'];

  ngOnInit(): void {
    this.filteredCompanies = [...this.portfolioCompanies];
  }

  applyFilters(): void {
    this.filteredCompanies = this.portfolioCompanies.filter(company => {
      const sectorMatch = this.selectedSector === 'All' || company.sector === this.selectedSector;
      const regionMatch = this.selectedRegion === 'All' || company.region === this.selectedRegion;
      const statusMatch = this.selectedStatus === 'All' || company.status === this.selectedStatus;
      
      return sectorMatch && regionMatch && statusMatch;
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'exited': return 'status-exited';
      case 'ipo': return 'status-ipo';
      default: return '';
    }
  }

  getReturnPercentage(company: PortfolioCompany): number {
    return ((company.currentValue - company.investmentAmount) / company.investmentAmount) * 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}