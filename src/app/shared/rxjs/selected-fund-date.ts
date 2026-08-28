import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { selectSelectedDate } from '../../store/date';

/**
 * The selected fund/as-of-date slice, emitting only when the selection actually
 * changes and only once it is usable.
 *
 * Every consumer of this slice fires an HTTP request from its subscriber, so a
 * redundant emission is a redundant request. The slice is re-dispatched on fund
 * change, on date change and (previously) on every NavigationStart, which turned a
 * single user action into 2-4 requests per component across five components. Nothing
 * cancelled the in-flight ones, so a slow response for a previously selected fund
 * could land after - and overwrite - the current one, showing one fund's figures
 * under another fund's name with no visible difference from a correct render.
 *
 * The filter drops emissions that are not yet usable: `fundDetails` is null until
 * fund-selector dispatches, and every subscriber immediately dereferences
 * `fundDetails.fund_configuration_classes`. `asOfDate` is concatenated straight into
 * the request URL by FundService, so a missing date would reach the wire as the
 * literal `?asOnDate=undefined`.
 *
 * Pass the caller's DestroyRef so the subscription is torn down with the component.
 */
export function selectedFundDate$(store: Store, destroyRef: DestroyRef): Observable<any> {
  return store.select(selectSelectedDate).pipe(
    filter(state => !!state?.fundDetails?.guid && !!state?.asOfDate),
    distinctUntilChanged(
      (a, b) => a.fundDetails?.guid === b.fundDetails?.guid && a.asOfDate === b.asOfDate
    ),
    takeUntilDestroyed(destroyRef)
  );
}
