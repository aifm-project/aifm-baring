// Reusable selector for a specific account config value
import { MemoizedSelector } from '@ngrx/store';

export const selectAccountConfigValue = (key: string): MemoizedSelector<object, any> =>
  createSelector(selectAccountConfigs, (configs) => (configs ? configs[key] : null));
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('authState');

export const selectUserData = createSelector(
  selectAuthState,
  (state) => state.userData
);

export const selectToken = createSelector(
  selectAuthState,
  (state) => state.token
);

export const selectAccountInfo = createSelector(
  selectAuthState,
  (state) => state.accountInfo
);

export const selectAccountConfigs = createSelector(
  selectAuthState,
  (state) => state.accountConfigs
);
