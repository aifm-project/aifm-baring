import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IndustryData {
  name: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-distribution-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss'],
})
export class DistributionChartComponent implements OnInit {
  @Input() title: string = 'Distribution by Industries';
  @Input() showFilters: boolean = true;

  industryData: IndustryData[] = [
    { name: 'Technology', percentage: 37.82, color: '#122334' },
    { name: 'Manufacturing', percentage: 25.57, color: '#4A90A4' },
    { name: 'Finance', percentage: 20.79, color: '#83C5FF' },
    { name: 'Consumer & Retail', percentage: 6.1, color: '#B8D4FF' },
    { name: 'Services', percentage: 5.19, color: '#E1ECFF' },
  ];

  constructor() {}

  ngOnInit(): void {}

  onFilterClick(): void {
    console.log('Filter clicked');
  }

  onSortClick(): void {
    console.log('Sort clicked');
  }
}
