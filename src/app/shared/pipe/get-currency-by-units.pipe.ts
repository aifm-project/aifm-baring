import { Pipe, PipeTransform } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFundData } from '../../store/fund';

@Pipe({
  name: 'getCurrencyByUnits',
  pure: false
})
export class GetCurrencyByUnitsPipe implements PipeTransform {
  private fundConfigMap: Map<string, string> = new Map();
  private currencySymbol: string = '';
  private numberFormat: string = 'en-IN';
  private fundSizeUnit: string = '';

  constructor(private store: Store) {
    this.store.select(selectFundData).subscribe(fundState => {
      if (fundState?.fund_configuration_classes?.length) {
        this.fundConfigMap = new Map(
          fundState.fund_configuration_classes.map(
            (item: any) => [item?.fund_key, item?.fund_value]
          )
        );
        this.currencySymbol = this.fundConfigMap.get('fund_currency') || 'INR';
        this.fundSizeUnit = this.fundConfigMap.get('fund_size_unit') || 'Cr';
        this.numberFormat = this.fundConfigMap.get('number_format') || 'en-IN';
      }
    });
  }

  transform(
    amount: number | string | null | undefined,
    addCurrencyUnit: boolean = true,
    addSymbol: boolean = false,
    fixedDigits: number = 2,
    isAbsolute: boolean = false
  
  ): string {
    if (
      amount === null ||
      amount === undefined ||
      amount === '-' ||
      amount === '' ||
      amount === '-1000000' ||
      amount === -1000000
    ) {
      return ' - ';
    }
    if(!this.fundConfigMap){
      this.getStoreData();
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return ' - ';

    const fundCurrency = this.fundConfigMap.get('fund_currency') || 'INR';
    const fundUnit = this.fundConfigMap.get('fund_size_unit') || '';
    const localFormat = this.resolveLocale(fundCurrency);
    this.currencySymbol = addSymbol ? this.formatCurrencySymbol(fundCurrency) : '';
    
    const { dividedAmount, displayUnit } = this.divideByUnit(numericAmount, fundUnit, isAbsolute);

    const formatted = this.formatNumber(dividedAmount, localFormat, fixedDigits);
    if (formatted === 'NaN' || formatted === 'undefined') return ' - ';

    let result = `${this.currencySymbol} ${formatted}`;
    if (addCurrencyUnit && displayUnit) result += ` ${displayUnit}`;

    return result.trim();
  }

  private divideByUnit(amount: number, unit: string,isAbsolute: boolean): { dividedAmount: number; displayUnit: string } {
    if (!unit) return { dividedAmount: amount, displayUnit: '' };

    switch (unit) {
      case 'Cr':
      case 'Cr.':
        return { dividedAmount: isAbsolute ? amount : (amount / 1e7), displayUnit: 'Cr' };
      case 'M':
      case 'Mn':
        return { dividedAmount: isAbsolute ? amount : (amount / 1e6), displayUnit: unit };
      case 'mm':
        return { dividedAmount: isAbsolute ? amount : (amount / 1e8), displayUnit: 'mm' };
      default:
        return { dividedAmount: amount, displayUnit: '' };
    }
  }

  private formatNumber(value: number, locale: string, digits: number): string {
    try {
      return value.toLocaleString(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    } catch {
      return ' - ';
    }
  }

  private formatCurrencySymbol(code: string): string {
    if (!code) return '';
    switch (code.toUpperCase()) {
      case 'INR':
        return '₹';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return code;
    }
  }

  private resolveLocale(currency: string): string {
    if (!currency) return 'en-IN';
    switch (currency.toUpperCase()) {
      case 'INR':
        return 'en-IN';
      case 'USD':
      case 'EUR':
      case 'GBP':
        return 'en-US';
      default:
        return 'en-IN';
    }
  }
  
  getStoreData() {
    this.store.select(selectFundData).subscribe(fundState => {
      this.fundConfigMap = fundState.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());
      this.numberFormat = this.fundConfigMap.get("number_format");
    });
  }
}