import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ToolbarModule } from 'primeng/toolbar';

// Highcharts
import { HighchartsChartModule } from 'highcharts-angular';

const PRIMENG_MODULES = [
  ButtonModule,
  CardModule,
  TableModule,
  InputTextModule,
  DropdownModule,
  CalendarModule,
  ChartModule,
  PanelModule,
  TabViewModule,
  MenuModule,
  AvatarModule,
  BadgeModule,
  ToolbarModule
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighchartsChartModule,
    ...PRIMENG_MODULES
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighchartsChartModule,
    ...PRIMENG_MODULES
  ]
})
export class SharedModule { }