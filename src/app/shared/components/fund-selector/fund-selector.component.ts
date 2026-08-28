import { Component, Input, OnInit, DestroyRef, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { setFundData } from '../../../store/fund/fund.action';
import { setAllDates, setSelectedDate } from '../../../store/date/date.action';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FundService } from '../../../core/services/fund.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { selectAuthState } from '../../../store/auth';
import { User } from '../../../model/models';
import { ReadinessService } from '../../../core/loading/readiness.service';
import { ReadinessContext, TASK } from '../../../core/loading/readiness.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-fund-selector',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './fund-selector.component.html',
  styleUrls: ['./fund-selector.component.scss'],
})
export class FundSelectorComponent {
  private readonly destroyRef = inject(DestroyRef);
  @Input() selectedFund: any;
  // No placeholder defaults: these are investor-facing identity/date fields and a
  // hardcoded fallback is indistinguishable from real data once rendered. The
  // previous defaults ('Inception: 31 Dec 2022' / 'Account ID - INV-83627JQA') were
  // dispatched into the store for every fund.
  @Input() inceptionDate: string = '';
  @Input() accountId: string = '';
  fundList: any;
  activeTab: any;
  asOfDate: any;
  dataDates: any = [];
  userDetails: User;
  currentFundGuid: string = '';
  /** The readiness context currently in force, so a same-context nav is a no-op. */
  private activeContext: ReadinessContext | null = null;

  constructor(
    private fundService: FundService,
    private store: Store,
    private router: Router,
    private readiness: ReadinessService,
  ) {}

  /** The manifest governing the current screen, from route data. */
  private currentContext(): ReadinessContext | null {
    let route = this.router.routerState.root;
    while (route.firstChild) route = route.firstChild;
    // No default. Defaulting is what made /insights open a DASHBOARD session whose
    // tasks that route never requests, hanging the overlay at 10%. A screen that
    // declares no context has no readiness work, and callers must handle null.
    return (route.snapshot.data?.['readinessContext'] as ReadinessContext) ?? null;
  }

  onFundChange(fund: string) {
    this.selectedFund = fund;
    // Handle fund selection logic here
    console.log('Selected fund:', fund);
  }

  ngOnInit(): void {
    localStorage.removeItem('fundInvestorToken');
    this.getUserDetails();
    // Seed the required-task set before the first request goes out. This is what
    // stops the indicator declaring completion during the quiet gaps between waves.
    // Session lifecycle belongs to ReadinessRouteBinder, which runs for EVERY route.
    // Opening one here too would double-open: the second open replaces the task map
    // and bumps the epoch, orphaning the fund-list request the first one was
    // tracking. This component only reports fund identity and resolves its predicate.
    this.loadRouterChange();
    this.getFunds();
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  getFunds() {
    this.fundService.getFunds({ offset: 0, limit: 100 }, TASK.FUNDS).subscribe({
      next: (response) => {
        this.fundList = response.funds;
        console.log('Funds fetched successfully:', this.fundList);
        if (this.fundList.length > 0) {
          this.selectedFund = this.fundList[0];
          this.currentFundGuid = this.selectedFund.guid;
          // First load never issues getFundInvestorToken - it falls back to
          // userDetails.user_guid. Only onFundSelect fetches a token, so marking it
          // required here would wait for a request that is never sent.
          this.readiness.setActiveFund(this.selectedFund?.guid ?? null);
          this.readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
          if(this.selectedFund && this.selectedFund.isInvestorCard && !this.selectedFund.user_guid){
             this.selectedFund = {
            ...this.selectedFund,
            user_guid:this.userDetails.user_guid
          }
          }
          this.store.dispatch(
            setFundData({
              fundData: this.selectedFund,
              date: this.selectedFund?.inception_date || this.inceptionDate,
            })
          );
          let skurls = ['/dashboard', '/portfolio'];
          if (this.router.url == '/dashboard') {
            this.activeTab = 'PERFORMANCE';
            this.getAsOfDates('PERFORMANCE');
          } else if (this.router.url == '/portfolio') {
            this.activeTab = 'PORTFOLIO';
            this.getAsOfDates('PORTFOLIO');
          }
        } else {
          // No funds: nothing downstream will ever be requested, so release every
          // task that is still waiting rather than leaving the overlay up forever.
          this.readiness.closeUnstarted('skipped');
        }
      },
      error: (error) => {
        console.error('Error fetching funds:', error);
        // The fund list is the root of the dependency chain - without it no
        // downstream request is issued, so nothing else can settle on its own.
        this.readiness.closeUnstarted('skipped');
      },
    });
  }

  onFundSelect(fund: any) {
    // A different fund is a different required-data context. Opening a new session
    // advances the epoch, so a slow response for the previous fund can no longer
    // score against this one.
    // Tell readiness which fund the next session belongs to BEFORE opening it, so
    // fund-scoped tasks (the investor-token call) refresh for the new fund.
    this.readiness.setActiveFund(fund?.guid ?? null);
    const context = this.currentContext();
    // Only the readiness-tracked screens have a session to reopen.
    if (context) this.readiness.openSession(context);

    // ONE source of truth for "will the investor-token call actually be made?".
    // The predicate and the branch below previously repeated the same expression,
    // and any drift between them strands the task: marked required, never issued,
    // so the checklist sits on it and the overlay cannot close.
    const willFetchInvestorToken = !!(fund?.isInvestorCard && fund?.user_guid);
    this.readiness.resolvePredicate(TASK.INVESTOR_TOKEN, willFetchInvestorToken);
    localStorage.removeItem('fundInvestorToken');
    this.currentFundGuid = fund.guid;
    if (this.router.url == '/portfolio') {
      this.activeTab = 'PORTFOLIO';
    } else {
      this.activeTab = 'PERFORMANCE';
    }
    if (willFetchInvestorToken) {
       this.selectedFund = fund;
      localStorage.setItem('userGuid', fund.user_guid);
      this.fundService.getFundInvestorToken(fund.user_guid, TASK.INVESTOR_TOKEN).subscribe({
        next: (response) => {
          if (response && response.user_token) {
            localStorage.setItem('fundInvestorToken', response.user_token);
          } else {
            localStorage.removeItem('fundInvestorToken');
          }
          this.updateFundState(this.selectedFund);
        },
        error: (error) => {
          // Without this branch the selection silently half-applied: the token was
          // already cleared at the top of onFundSelect and updateFundState never ran,
          // so the UI kept the previous fund's data under the newly selected name.
          console.error('Error fetching fund investor token:', error);
          localStorage.removeItem('fundInvestorToken');
          this.updateFundState(this.selectedFund);
        },
      });
    } else {
        if(fund.isInvestorCard){
          this.selectedFund = {
            ...fund,
            user_guid:this.userDetails.user_guid
          }
        }else {
          this.selectedFund = fund;
        }

      this.updateFundState(this.selectedFund);
    }
  }

  getAsOfDates(LOADTYPE?, event?) {
    var tabType = LOADTYPE;
    switch (this.activeTab) {
      case 'performance':
        tabType = 'PERFORMANCE';
        break;
      case 'portfolio':
        tabType = 'PORTFOLIO';
        break;
      case 'analytics':
        tabType = 'ANALYTICS';
        break;
      default:
        break;
    }
    this.fundService.getDates(this.selectedFund.guid, tabType, event, TASK.DATES).subscribe({
      next: (perfDates) => {
      const perfDate = perfDates.dates;
      this.dataDates = perfDates.dates;
      this.store.dispatch(setAllDates({ dates: perfDate }));
      this.asOfDate = perfDate.length ? perfDate[0] : this.selectedFund.as_on_date;
      this.store.dispatch(
        setSelectedDate({
          selectedDate: {
            fund_guid: this.selectedFund.guid,
            asOfDate: perfDate.length ? perfDate[0] : this.selectedFund.as_on_date,
            fundType: this.selectedFund.fund_type,
            fundDetails: this.selectedFund,
          },
        })
      );
      },
      error: (error) => {
        console.error('Error fetching as-of dates:', error);
        // Without a date nothing dispatches setSelectedDate, so no component fetch
        // is ever issued and the remaining tasks cannot settle themselves.
        this.readiness.closeUnstarted('skipped');
      },
    });
  }

  onDateChange(date: string) {
    this.asOfDate = date;
    this.store.dispatch(
      setSelectedDate({
        selectedDate: {
          fund_guid: this.selectedFund.guid,
          asOfDate: date,
          fundType: this.selectedFund.fund_type,
          fundDetails: this.selectedFund,
        },
      })
    );
    console.log('Selected date:', date);
  }

  nagivationTab(activeTab) {
    this.activeTab = activeTab;
    // this.getAsOfDates(activeTab);
  }

  loadRouterChange() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        // <app-fund-selector> sits under *ngIf in the layout, so it is destroyed and
        // rebuilt on every visit to insights/notifications/profile. Without teardown
        // each rebuild leaves a zombie listener that still calls getAsOfDates, so a
        // later tab switch fires the dates request once per past visit.
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const context = this.currentContext();
        // Same screen - a repeated navigation must not refetch.
        if (context === this.activeContext) return;
        this.activeContext = context;

        // Funds have not loaded yet; the initial load covers this navigation.
        if (!this.selectedFund?.guid) return;
        // Documents and Insights do not use as-of dates.
        if (context !== 'DASHBOARD' && context !== 'PORTFOLIO') return;

        this.activeTab = context === 'PORTFOLIO' ? 'PORTFOLIO' : 'PERFORMANCE';
        this.getAsOfDates(this.activeTab);
      });
  }

  getUserDetails() {
    let hasAuth = false;
    this.store
      .select(selectAuthState)
      .subscribe((authState) => {
        this.userDetails = authState.userData;
      })
      .unsubscribe();
    return hasAuth;
  }

  updateFundState(fundData) {
    this.store.dispatch(
      setFundData({ fundData, date: fundData?.inception_date || this.inceptionDate })
    );
    this.getAsOfDates(this.activeTab);
  }
}
