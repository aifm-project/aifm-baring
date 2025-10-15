import { ActionReducer } from '@ngrx/store';
import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';

export interface AuthState {
  userData: any | null;
  token: string | null;
  accountInfo: any | null;
  accountConfigs: { [key: string]: any } | null;
}

export const initialState: AuthState = {
  userData: null,
  token: null,
  accountInfo: null,
  accountConfigs: null,
};

const baseAuthReducer = createReducer(
  initialState,
  on(AuthActions.setAuthData, (state, { userData, token }) => ({
    ...state,
    userData,
    token,
  })),
  on(AuthActions.setAccountInfo, (state, { accountInfo }) => ({
    ...state,
    accountInfo: { ...state.accountInfo, ...accountInfo },
  })),
  on(AuthActions.setAccountConfigs, (state, { accountConfigs }) => ({
    ...state,
    accountConfigs: { ...state.accountConfigs, ...accountConfigs },
  })),
  on(AuthActions.clearAuthData, () => initialState)
);

// Meta-reducer to always preserve userData and token when updating accountInfo/configs
export function preserveAuthMetaReducer(reducer: ActionReducer<AuthState>): ActionReducer<AuthState> {
  return (state, action) => {
    const nextState = reducer(state, action);
    if (state && nextState && action.type !== AuthActions.clearAuthData.type) {
      return {
        ...nextState,
        userData: nextState.userData ?? state.userData,
        token: nextState.token ?? state.token,
      };
    }
    return nextState;
  };
}

// Meta-reducer for localStorage persistence



// Chain meta-reducers: preserveAuthMetaReducer -> localStorageSyncReducer -> baseAuthReducer
export function authReducer(state: AuthState | undefined, action: any) {
  return baseAuthReducer(state, action);
}

