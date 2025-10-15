import { createReducer, on } from '@ngrx/store';
import { setAllDates, setSelectedDate, clearDates } from './date.action';

export interface DateState {
  dates: string[];
  selectedDate: {
    fund_guid: string;
    asOfDate: string | null;
    fundType: string;
    fundDetails: any;
  } | null;
}

export const initialState: DateState = {
  dates: [],
  selectedDate: null,

};

export const dateReducer = createReducer(
  initialState,
  on(setAllDates, (state, { dates }) => ({ ...state, dates })),
  on(setSelectedDate, (state, { selectedDate }) => ({ ...state, selectedDate })),
  on(clearDates, () => initialState)
);
