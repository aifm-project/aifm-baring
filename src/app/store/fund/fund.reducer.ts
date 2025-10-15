import { createReducer, on } from '@ngrx/store';
import { setFundData, clearFundData, setDocumentData } from './fund.action';

export interface FundState {
  fundData: any | null;
  date: string | null;
    documentData: any[] | null;
}

export const initialState: FundState = {
  fundData: null,
  date: null,
  documentData: null,
};

export const fundReducer = createReducer(
  initialState,
  on(setFundData, (state, { fundData, date }) => ({
    ...state,
    fundData,
    date,
  })),
  on(setDocumentData, (state, { documentData }) => ({
    ...state,
    documentData,
  })),
  on(clearFundData, () => initialState)
);
