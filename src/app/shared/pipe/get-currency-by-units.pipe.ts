import { Pipe, PipeTransform } from '@angular/core'
import { Store } from '@ngrx/store';
import { selectFundData } from '../../store/fund';

@Pipe({
  name: 'getCurrencyByUnits'
})
export class GetCurrencyByUnitsPipe implements PipeTransform {
  fundConfigMap: Map<string, string>;
  currencySymbol: string;
  numberFormat: string;
  constructor(private store: Store) {
      this.store.select(selectFundData).subscribe(fundState => {
          let fundConfig = fundState.fund_configuration_classes.map((item) => [item.fund_key, item.fund_value]);
          this.fundConfigMap = new Map(fundConfig);
         this.numberFormat = this.fundConfigMap.get("number_format");
        })
  }
  transform(amount, addCurrency: boolean= false,addCurrencySymbol:boolean=false,fixedNumber:number=2): any {
    if(!this.fundConfigMap && !this.fundConfigMap.size) {
      this.getStoreData();
    }
    this.currencySymbol = this.fundConfigMap.get('fund_currency');

    if(amount && amount!=='-' && amount!== -1000000){
      if (['Cr','Cr.'].includes(this.fundConfigMap.get('fund_size_unit'))) {
        amount = (amount / 10000000);
        let coreAmount = this.numberWithCommas((amount).toString(),this.numberFormat,fixedNumber);

        let amountData =   amount ? addCurrency ? coreAmount  + ' Cr' : coreAmount : amount;
        return addCurrencySymbol ? this.currencySymbol +' '+  amountData : amountData;

      } else if (this.fundConfigMap.get('fund_size_unit') === 'M') {
        amount = (amount / 1000000);
        let coreAmount = this.numberWithCommas((amount).toString(),this.numberFormat,fixedNumber);

        let amountData =  amount ? addCurrency ? coreAmount + ' M' : coreAmount : amount;
        return addCurrencySymbol ? this.currencySymbol +' '+  amountData : amountData;
      }else if(this.fundConfigMap.get('fund_size_unit') === 'mm'){
        amount = (amount / 100000000);
        let amountData =   amount ? addCurrency ? (amount).toFixed(fixedNumber) + ' mm' : (amount / 100000000).toFixed(fixedNumber) : amount;
        return addCurrencySymbol ? this.currencySymbol +' '+  amountData : amountData;
      } else if(this.fundConfigMap.get('fund_size_unit') === 'Mn'){
        amount = (amount / 1000000);
        let amountData =   amount ? addCurrency ? (amount).toFixed(fixedNumber) + ' Mn' : (amount / 100000000).toFixed(fixedNumber) : amount;
        return addCurrencySymbol ? this.currencySymbol +' '+  amountData : amountData;
      }else if(this.fundConfigMap.get('fund_size_unit') === ''){
        let coreAmount = this.numberWithCommas((amount).toString(),this.numberFormat,fixedNumber);
        let amountData =   amount ? addCurrency ? coreAmount  + ' Cr' : coreAmount : amount;
        return addCurrencySymbol ? this.currencySymbol +' '+  amountData : amountData;
      }
      else {
        amount = (amount / 10000000);
        let coreAmount = this.numberWithCommas((amount).toString(),this.numberFormat,fixedNumber);
        return amount ? coreAmount :  amount ;
      }
    }else {
      // if(amount == 0){
      //   return 0;
      // }else{
      return ' - '
      //}
    }

  }

  numberWithCommas(value: string | number, localFormat: string, isDecimalDigits?: number): string {
   return value ? (+value).toLocaleString(localFormat, {
          minimumFractionDigits: (isDecimalDigits ? isDecimalDigits : 0),
          maximumFractionDigits: isDecimalDigits,
        }) : '';
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
