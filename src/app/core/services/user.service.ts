import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { AccountDetailsSummary } from '../../model/models';

export interface SurveyPayload {
  industry: string;
  phoneNumber: string;
}

export interface ChangeRequestPayload {
  section: 'bank' | 'demat' | 'rm' | 'tax';
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(public httpClient: HttpClient) {}

  submitSurvey(payload: SurveyPayload): Observable<{ success: boolean }> {
    // MOCK — replace with a real API call once the backend contract is confirmed.
    // Real call will look like:
    // return this.httpClient.post<{ success: boolean }>(environment.serverEndPoint + 'users/survey', payload);
    console.log('[MOCK] Survey submitted:', payload);
    return of({ success: true }).pipe(delay(300));
  }

  getAccountDetails(): Observable<AccountDetailsSummary> {
    // MOCK DATA — for field-shape review with the backend team. Replace with a real API call once confirmed.
    // Real call will look like:
    // return this.httpClient.get<AccountDetailsSummary>(environment.serverEndPoint + 'users/account-details');
    const mock: AccountDetailsSummary = {
      bankAccount: {
        bank_name: 'HDFC Bank',
        account_number_masked: 'XXXX XXXX 4821',
        ifsc_code: 'HDFC0001234',
        account_type: 'Savings',
        branch: 'Bandra Kurla Complex, Mumbai',
      },
      dematAccount: {
        depository: 'NSDL',
        dp_id: 'IN300123',
        client_id: '10456789',
        demat_account_number_masked: 'IN300123-104XXXXX',
      },
      relationshipManager: {
        name: 'Priya Sharma',
        email: 'priya.sharma@baring.com',
        phone_number: '+91 98XXXXXX21',
        designation: 'Senior Relationship Manager',
      },
      taxResidency: {
        country_of_residence: 'India',
        tax_id_number_masked: 'AXXXX1234X',
        fatca_status: 'Non-Reportable',
        crs_status: 'Non-Reportable',
      },
    };
    return of(mock).pipe(delay(300));
  }

  requestAccountDetailChange(payload: ChangeRequestPayload): Observable<{ success: boolean }> {
    // MOCK — capture-only for now, no fund-manager review screen this phase.
    // Real call will look like:
    // return this.httpClient.post<{ success: boolean }>(environment.serverEndPoint + 'users/account-details/change-request', payload);
    console.log('[MOCK] Request-change captured:', payload);
    return of({ success: true }).pipe(delay(300));
  }
}
