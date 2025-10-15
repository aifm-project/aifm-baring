import { createAction, props } from '@ngrx/store';

export const loadAccountData = createAction('[Auth] Load Account Data');

export const setAuthData = createAction(
  '[Auth] Set Auth Data',
  props<{ userData: any; token: string }>()
);

export const clearAuthData = createAction('[Auth] Clear Auth Data');

export const setAccountInfo = createAction(
  '[Auth] Set Account Info',
  props<{ accountInfo: any }>()
);

export const setAccountConfigs = createAction(
  '[Auth] Set Account Configs',
  props<{ accountConfigs: { [key: string]: any } }>()
);
