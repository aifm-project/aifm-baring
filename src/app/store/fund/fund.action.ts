import { createAction, props } from "@ngrx/store";

export const loadAccountData = createAction('[Auth] Load Account Data');

export const setFundData = createAction(
  '[Auth] Set Fund Data',
  props<{ fundData: any; date: string }>()
);

export const setDocumentData = createAction(
  '[Auth] Set Document Data',
  props<{ documentData: any[] }>()
);

export const clearFundData = createAction('[Auth] Clear Fund Data');