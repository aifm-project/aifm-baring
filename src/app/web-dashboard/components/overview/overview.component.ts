import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef, DestroyRef, inject } from '@angular/core';
import { FundService } from '../../../core/services/fund.service';
import { selectFundData } from '../../../store/fund';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { selectDateState, selectSelectedDate } from '../../../store/date';
import { selectAuthState } from '../../../store/auth';
import { User } from '../../../model/models';
import { Tooltip } from 'bootstrap';
import { selectedFundDate$ } from '../../../shared/rxjs/selected-fund-date';
import { TASK } from '../../../core/loading/readiness.model';
import { ReadinessService } from '../../../core/loading/readiness.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface OverviewData {
  capital_summary: {
    total_commitment: string;
    total_value: string;
    distribution: string;
    capital_redeemed: string;
    residual_value: string;
    funded: string;
    growth: string;
    unfunded: string;
  },
  metadata: {
    fund_tvpi: any;
    inception_date: string;
    aum: string;
    nav: string;
    as_on_date: string;
    benchmark_name: string;
    units: string;
    residual_value: string;
    return: string;
    tvpi: string;
    xirr: string;
    commitment: string;
    moic : string;
    gross_moic : string;
    gross_irr : string;
    roic : string;
    portfolio_residual_asset_value : string;
  }
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements AfterViewInit {
  private readonly readiness = inject(ReadinessService);
  private readonly destroyRef = inject(DestroyRef);
  // Dynamic tooltip properties
  infoIconAlt: string = 'Investment Overview Information';
  infoIconTitle: string = 'A snapshot of the fund’s key information, including strategy, size, and performance highlights';

  @ViewChildren('infoIcon') infoIconElements!: QueryList<ElementRef>;

  public overviewData: OverviewData = {
    capital_summary: {
      total_commitment: '-',
      total_value: '-',
      distribution: '-',
      capital_redeemed: '-',
      residual_value: '-',
      funded: '-',
      growth: '-',
      unfunded: '-'
    },
    metadata: {
      inception_date: '-',
      aum: '-',
      nav: '-',
      as_on_date: '-',
      benchmark_name: '-',
      units: '',
      residual_value: '-',
      return: '-',
      tvpi: '-',
      fund_tvpi:'-',
      xirr: '-',
      commitment: '-',
      moic: '-',
      gross_moic: '-',
      gross_irr: '-',
      roic: '-',
      portfolio_residual_asset_value : '-'
    }
  };
  /**
   * True while this section's request is in flight. Starts true so the period
   * before the first request is issued (waiting on fund/date selection) reads as
   * "loading" rather than as a grid of '-' placeholders.
   *
   * Scoped to this component on purpose: it is set and cleared by this section's
   * own fetch, so it cannot be stranded by an unrelated slow request the way the
   * old global request counter could.
   */
  isLoading = true;

  /** True when the last overview fetch failed, so an error is not rendered as '-'. */
  loadFailed = false;
  selectedFund: any;
  fundConfig: Map<string, string> = new Map<string, string>();
  asOfDate: any;
  private currencySymbol: string = '';
  private numberFormat: string = 'en-IN';
  private fundSizeUnit: string = ''
  userDetails: User;
  constructor(
    private fundService: FundService,
    private store: Store,

  ) {
    this.store
      .select(selectFundData)
      // Torn down with the component: a surviving store subscription keeps mutating
      // a destroyed component's state on every later dispatch, and where the
      // callback fetches, it keeps issuing requests from a screen the user has left.
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fundState => {
      if (fundState?.fund_configuration_classes?.length) {
        this.fundConfig = new Map(
          fundState.fund_configuration_classes.map(
            (item: any) => [item?.fund_key, item?.fund_value]
          )
        );
        this.currencySymbol = this.fundConfig.get('fund_currency') || 'INR';
        this.fundSizeUnit = this.fundConfig.get('fund_size_unit') || 'Cr';
        this.numberFormat = this.fundConfig.get('number_format') || 'en-IN';
      }
    });
  }

  ngOnInit() {
    this.getUserDetails()
    this.getStoreData();
  }

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  private initializeTooltips() {
    // Initialize Bootstrap tooltips with responsive placement
    this.infoIconElements.forEach((element: ElementRef) => {
      const tooltipElement = element.nativeElement;
      new Tooltip(tooltipElement, {
        placement: 'auto',
        trigger: 'hover focus',
        html: false,
        delay: { show: 100, hide: 100 }
      });
    });
  }

  fetchFundOverview() {
    const issuedEpoch = this.readiness.epoch();
    this.isLoading = true;
    this.loadFailed = false;
    this.fundService.getPerformanceData({ fundGuid: this.selectedFund.guid, classGuid: (this.selectedFund.isInvestorCard ? this.selectedFund.user_guid :  this.selectedFund.guid), asOnDate: this.asOfDate }, 'CAPITAL_SUMMARY,METADATA', TASK.OVERVIEW).subscribe({
      next: (sk) => {
      // Stale-response guard. Components fire their fetch from inside a store
      // subscriber and nothing aborts the previous request, so a slow response for
      // the fund the user just left can still land here. Without this it overwrites
      // the current fund's figures - one fund's numbers under another fund's name,
      // visually identical to a correct screen.
        if (issuedEpoch !== this.readiness.epoch()) return;
        this.isLoading = false;
        this.loadFailed = false;
        this.overviewData.capital_summary = sk.performance && sk.performance.capital_summary ? sk.performance.capital_summary : {};
        if(this.overviewData.capital_summary.hasOwnProperty('distribution')){
          let distribution = this.overviewData.capital_summary.distribution;
          let capital_redeemed = this.overviewData.capital_summary.capital_redeemed;
          let totalDistribution:any = ((+distribution) + (+capital_redeemed));
          this.overviewData.capital_summary.distribution = totalDistribution;
        }
        
        this.overviewData.metadata = sk.performance && sk.performance.metadata ? sk.performance.metadata : {};

        let tvpi  = this.userDetails.user_sub_role == 'Investor Role' ? (this.overviewData.metadata.fund_tvpi ? Number( this.overviewData.metadata.fund_tvpi) : '-'):(this.overviewData.metadata.tvpi ? Number( this.overviewData.metadata.tvpi) : '-')
        this.overviewData.metadata.tvpi = tvpi.toLocaleString(this.numberFormat, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })+'x';
        let xirr = this.overviewData.metadata.xirr ? Number(this.overviewData.metadata.xirr) : '-';
        this.overviewData.metadata.xirr = xirr!='-' ?  xirr.toLocaleString(this.numberFormat) + '%' : xirr;
        this.overviewData.metadata.gross_irr = this.overviewData.metadata.gross_irr ? Number((+this.overviewData.metadata.gross_irr*100)).toLocaleString(this.numberFormat,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + '%' : '-';
         this.overviewData.metadata.gross_moic = this.overviewData.metadata.gross_moic ? Number((+this.overviewData.metadata.gross_moic)).toLocaleString(this.numberFormat,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + 'x' : '-';
        let moic = this.overviewData.metadata.moic ? Number(this.overviewData.metadata.moic) : '-';
        this.overviewData.metadata.moic = moic!='-' ?  moic.toLocaleString(this.numberFormat) + '%' : moic;
        let units = this.overviewData.metadata.units ? Number(this.overviewData.metadata.units) : '-';
        this.overviewData.metadata.units = units.toLocaleString(this.numberFormat, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
      },
      error: (error) => {
        // Previously swallowed. Every metric field initialises to '-', so a failed
        // request rendered identically to a fund that genuinely has no data - the
        // investor could not tell "nothing to report" from "we could not ask".
        console.error('Error fetching fund overview:', error);
        this.isLoading = false;
        this.loadFailed = true;
      }
    });
  }
  getStoreData() {
    selectedFundDate$(this.store, this.destroyRef).subscribe(fundState => {
      this.asOfDate = fundState?.asOfDate;
      this.selectedFund = fundState.fundDetails;
      this.fundConfig = fundState.fundDetails?.fund_configuration_classes.reduce((map, obj) => {
        map.set(obj.fund_key, obj.fund_value);
        return map;
      }, new Map<string, string>());

      this.numberFormat = this.fundConfig.get("number_format");
      this.fetchFundOverview();
    })
  }

    getUserDetails() {
        this.store
          .select(selectAuthState)
          .subscribe((authState) => {
            this.userDetails = authState.userData;
          })
          .unsubscribe();
      }
}
