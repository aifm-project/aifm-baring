import { createAction, props } from '@ngrx/store';

export const setAllDates = createAction(
  '[Date] Set All Dates',
  props<{ dates: string[] }>()
);

export const setSelectedDate = createAction(
  '[Date] Set Selected Date',
  props<{ selectedDate: { fund_guid: string; asOfDate: string | null; fundType: string, fundDetails: any } }>()
);

export const clearDates = createAction('[Date] Clear Dates');
