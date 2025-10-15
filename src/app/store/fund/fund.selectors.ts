import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FundState } from './fund.reducer';

export const selectFundState = createFeatureSelector<FundState>('fundState');

export const selectFundData = createSelector(
  selectFundState,
  (state) => state.fundData
);

export const selectFundDate = createSelector(
  selectFundState,
  (state) => state.date
);
export const selectDocumentData = createSelector(
  selectFundState,
  (state) => state.documentData
);
