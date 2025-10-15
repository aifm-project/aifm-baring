import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DateState } from './date.reducer';

export const selectDateState = createFeatureSelector<DateState>('dateState');

export const selectAllDates = createSelector(
  selectDateState,
  (state) => state.dates
);

export const selectSelectedDate = createSelector(
  selectDateState,
  (state) => state.selectedDate
);

