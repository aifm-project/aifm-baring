import { SelectItem } from "primeng/api";
export class Constants {
  static FUND_MANANGER = "Fund Manager";
  static OPERATIONS_TEAM = "Operations Team";
  static ADVISORY_BOARD = "Advisory Board";
  static LEGAL_AND_TAX_COUNSEL = "Legal and Tax Counsel";
  static AUDITORS = "Auditors";
  static INVESTMENT_TEAM = "Investment Team";
  static FINANCE_AND_OPERATIONS = "Finance and Operations";
  static INVESTOR_RELATIONS = "Investor Relations";
  static FOUNDER_COUNCIL = "Founders Council";
}

export class AuditEvent {
  static DASHBOARD = "DASHBOARD";
  static DASHBOARD_INVESTOR = "DASHBOARD_INVESTOR";
  static DASHBOARD_DISTRIBUTOR = "DASHBOARD_DISTRIBUTOR";
  static FUND_DETAILS = "FUND_DETAILS";
  static ABOUT = "ABOUT";
  static PERFORMANCE = "PERFORMANCE";
  static PORTFOLIO = "PORTFOLIO";
  static DATAROOM = "DATAROOM";
  static STATEMENT = "STATEMENT";
  static INVESTED = "INVESTED";
}

export const INVITED = "invited";
export const AMC = "AMC";
export const DISTRIBUTOR = "Distributor";
export const ADVISOR = "advisor";
export const INVESTOR = "investor";
export const INVESTOR_TAX_PREFIX = "AIFM_PH_";

export class DownloadFileResponse {
  message: string;
  filePath: string;
  requestId: number;
}

export class ProgressResponse {
  message: string;
  requestId: number;
}

export class FactsheetValidationResponse {
  message: string;
  errorMessage: string;
  results: NameValue[];
}

export class NameValue {
  name: string;
  value: string;
}

export class Fund {
  id: number;
  name: string;
  display_name: string;
  fund_type: string;
  created_by: number;
  admin_id: number;
  user_count: number;
  user: User;
  enabled: number;
  about_formatted_date: string;
  dataroom_formatted_date: string;
  performance_formatted_date: string;
  portfolio_formatted_date: string;
  statement_formatted_date: string;
  account_id: number;
  account: Account;
  sys_file_path: string;
  fund_rms_count: number;
  fund_team_count: number;
  fund_prospective_count: number;
  investor_count: number;
  fund_image: string;
  distributor_user_count: number;
  CURRENT_AUM: string;
  NAV_DATE: string;
  NAV: string;
  TARGET_FUND_SIZE: string;
  FUND_SIZE_UNIT: string;
  AIF_CATEGORY: string;
  STATUS: string;
  SINCE_INCEPTION: string;
  SINCE_INCEPTION_FUND: string;
  SINCE_INCEPTION_BENCHMARK: string;
  FINAL_CLOSE: string;
  FUND_TENURE: string;
  FUND_TENURE_UNIT: string;
  ANNOUNCED_DATE: string;
  FUND_STRATEGY: string;
  FUND_STATUS: string;
  EFFECTIVE_RETURNS: string;
  news: string;
  unitBalance: number;
  netNav: number;
  capitalCommitment: any;
  fundedCapitalCommitment: any;
  unfundedCapitalCommitment: any;
  totalResidualValue: any;
  totalDistribution: any;
  totalValue: any;
  commitmentFundedPr: number;
  commitmentUnfundedPr: number;
  distributionPr: number;
  residualValuePr: number;
  growthX: number;
  master_data_list: string;
  scheme_code: string;
  fund_configuration_classes: FundConfigurationClasses[];
  mangement_fees: mangement_fees[];
  incentives: incentives[];
  fund_strategies: fund_strategies[];
  fund_redemptions: FundRedemption[];
  fund_maps: FundMap[];
  fund_checked: boolean;
  in_marketplace: number;
  dataRoomDocument: DataRoomDocument;
  redemptionAmount: any;
  tvpi: number;
  capitalReedemedPr: number;
  xirr: any;
  asOfDate: any;
  fund_guid: any;
  isDataroomAccess: number;
  plan_code: string;
  investorXIRR: any;
  team_user_role: string;
  fundId: string;
}

export class Account {
  id: number;
  name: string;
  header_color: string;
  font_color: string;
  logo: string;
  domain: string;
  account_type: string;
  is_available: boolean;
  users: User;
  news: string;
  icon: string;
  header_name: string;
  logo_height: string;
  video_url: string;
  fund_count: number;
  investor_count: number;
  distributor_count: number;
  distributor_account_id: number;
  created_by: number;
  user_abouts: UserAbouts[];
  user_fees: UserFees[];
  account_email: string;
  service_email: string;
  status: string;
  account_configs: AccountConfig[];
  login_text: string;
  login_image: string;
  account_guid: any;
  multiTenant: number;
  alter_domain: string;
  arn_number: string;
  aifm_types?: aifmTypes[]
}

export class aifmTypes {
  key: string;
  value: string;
  type: string
}
export class UserAboutsResponse {
  message: string;
  account: Account;
}

export class UserAbouts {
  account_id: number;
  name: string;
  display_name: string;
  value: string;
  grouping: string;
}

export class UserFees {
  account_id: number;
  capital_commitment: string;
  percentage: string;
  current_amc: string;
}

export class AccountResponse {
  message: string;
  errorMessage: string;
  account: Account[];
}

export class AccountTokenResponse {
  errorMessage: string;
  token: string;
  url: string;
  apiUrl: string;
  account: Account;
}

export class AccountCount {
  fund_count: number;
  investor_count: number;
  distributor_count: number;
}

export class fund_strategies {
  id: number;
  fund_id: number;
  name: string;
  display_name: string;
  value: string;
  grouping: string;
}

export class mangement_fees {
  id: number;
  fund_id: number;
  name: string;
  display_name: string;
  investment: string;
  percentage: string;
}

export class incentives {
  id: number;
  fund_id: number;
  name: string;
  display_name: string;
  value: string;
}

export class aboutFundResponse {
  message: string;
  fund: Fund;
}

export class userFundResponse {
  message: string;
  funds: Fund[];
  count: any
}

export class DocumentRequest {
  fundId: any;
  companyId: number;
  userId: any;
  sys_file_path: string;
  file_name: string;
  account_id: number;
  type: string;
  fund_type: string;
  as_on_date: string;
  document_type: string;
  scheme_code?: string;
  option_name: any;
}

export class GenericResponse {
  message: string;
  errorMessage: string;
  warnMessage: string;
  filePath: string;
  warningMessage: any;
  requestId: any;
  existingSchemeCode: any;
  newSchemeCode: any;
  confirmationMessage: any;
}

export class User {
  user_id: number;
  user_name: string;
  password: string;
  oldpassword: string;
  display_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  user_role: string;
  designation: string;
  description: string;
  skills: string;
  status: string;
  user_enabled: number;
  profilePicture: string;
  sys_file_path: string;
  fund_display_name: string;
  is_read: boolean;
  is_write: boolean;
  is_available: boolean;
  profile: string;
  account_id: number;
  account: Account;
  company_id: string;
  country_code: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  team_user_role: string;
  team_user_status: string;
  tax_id: string;
  national_id: string;
  investor_type: string;
  residency_status: string;
  dateOfBirth: string;
  pan: string;
  is_first_login: boolean;
  access: string;
  is_service_user: number;
  reset_id: string;
  is_reset: number;
  is_prospectives: number;
  invite_id: string;
  invite: number;
  copy_link: string;
  user_checked: boolean;
  skillData: string[];
  teams: Team[];
  team: Team;
  account_domain: string;
  user_last_login: Date;
  access_token: string;
  wrong_password_count: number;
  access_enabled: number;
  user_type: string;
  user_sub_role: string;
  advisor_id: number;
  advisor_name: string;
  message: string;
  errorMessage: string;
  is_guest: number;
  rm_id: number;
  distributor_status: string;
  investor_status: string;
  distributor_account_id: string;
  distributor_fund_count: number;
  investor_fund_count: number;
  current_aum_investor: number;
  investor_count: number;
  join_date: Date;
  current_aum_sum: number;
  user_details: UserDetails[];
  clickStatsCounter: number;
  invite_date: Date;
  is_invited: string;
  user_guid: number;
  multiUserRole: boolean;
  multiUserSubRole: string;
  multiUserId: number;
  profileImageUrl: string;
  otp: string;
  otp_send_count: number;
  rm_guid: string;
}

export class LoginResponse {
  token: string;
  user: User;
  is_taxId: number;
  isPasswordEmty: boolean;
  maximumAttempt: boolean;
  attempts: number;
  message: string;
  multi_user_role: userRoleResponse[];
  errormessage: any;
  wrongOTPAttempts: number;
  maxWrongOTPAttempt: boolean;
  returnUrl: boolean;
  errorMessage: any;
  isOtpExpired: boolean;
}

export class userRoleResponse {
  user_sub_role: string;
  user_id: number;
}

export class userResponse {
  message: string;
  users: User[];
  userCount: number;
}

export class FundResponse {
  message: string;
  funds: Fund[];
  errorMessage: any;
}

export class FundCapData {
  investorName: string;
  investorId: string;
  investorClass: string;
  distributorName: string;
  address: string;
  city: string;
  pinCode: string;
  pan: string;
  aadhar: string;
  email: string;
  onBoardingDate: Date;
  relationshipManager: string;
  relationshipManagerEmail: string;
  distributorSetUpFee: any;
  anualDistributionFee: any;
  committmentAmount: number;
  rmName: string;
  rmEmail: string;
  managementFeeCost: any;
  managementFeeCode: any;
  amcFeeCost: any;
  amcFeeCode: any;
  opexFeeCode: any;
  opexFeeCost: any;
  gstFeeCost: any;
  tdsFeeCost: any;
  stampDutyFeeCost: any;
  drawdown: any;
  shareholdingPercent: any;
  units: any;
}

export class Metadata {
  name: string;
  values: string[];
}

export class MetadataResponse {
  metadatavalues: Metadata[];
}

export class NameValueLookup {
  values: string[];
  values1: SelectItem[];
  constructor(private metadatavalues: Metadata[], private name: string) {
    this.name = name;
    this.metadatavalues = metadatavalues;
    this.values1 = [];
  }

  lookupValues(): string[] {
    this.metadatavalues.forEach((metadatavalue) => {
      if (metadatavalue.name === this.name) {
        this.values = metadatavalue.values;
      }
    });
    return this.values;
  }
  lookupValues1(): any[] {
    this.metadatavalues.forEach((metadatavalue) => {
      console.log("metadata value:" + JSON.stringify(metadatavalue));
      if (metadatavalue.name === this.name) {
        console.log("metadatavalue.name:" + metadatavalue.name);
        this.values = metadatavalue.values;
        this.values.forEach((item) => {
          console.log("item:" + item);
          this.values1.push({ label: item, value: item });
        });

        console.log("this.name:" + this.name);
      }
    });
    console.log("values amc:" + this.values);
    //return this.values;
    return this.values1;
  }
}

export class Team {
  fund_id: number;
  user_id: number;
  is_read: boolean;
  is_write: boolean;
  user_role: string;
  user_status: string;
  user_unique_id: string;
  users: User;
  user: User;
  fund: Fund;
  profileImageUrl: string;
}

export class TeamResponse {
  message: string;
  team: Team[];
}

export class InviteUserResponse {
  message: string;
  user: User;
  errormessage: string;
  link: string;
}

export class Documents {
  id: number;
  type: string;
  name: string;
  sys_file_path: string;
  created_at: Date;
  user: User;
  formatted_date: string;
  as_on_date: string;
  formatted_as_on_date: string;
  checker_makers: CheckerMakers[];
}

export class AboutLogsResponse {
  message: string;
  documents: Documents[];
}

export class PerformanceLogsResponse {
  message: string;
  documents: Documents[];
}

export class PerformanceNav {
  label: string;
  class_value: number;
  benchmark_value: number;
}

export class PerformanceNavResponse {
  message: string;
  performance_nav: PerformanceNav[];
}

export class PortfolioSector {
  sectors: string;
  fund: any;
  benchmark: number;
  type: string;
  fund_width: number;
  benchmark_width: number;
  sector_fund_width: number;
  sector_benchmark_width: number;
}
export class PortfolioSectorPreviousMonth {
  sectors: string;
  fund: number;
  benchmark: number;
  type: string;
  fund_width: number;
  benchmark_width: number;
  sector_fund_width: number;
  sector_benchmark_width: number;
}
export class PortfolioSectorResponse {
  message: string;
  portfolioSector: PortfolioSector[];
  portfolioSectorPreviousMonth: PortfolioSectorPreviousMonth[];
}

export class PortfolioRisk {
  parameter: string;
  company_type: string;
  mitigants: string;
}

export class PortfolioRiskResponse {
  message: string;
  portfolioRisk: PortfolioRisk[];
}

export class PortfolioHoldings {
  id: number;
  companies: string;
  ending_weight: any;
  total_return: number;
  contribution_alpha: number;
  type: string;
  top10Holdings_width: number;
  top5Contributors_width: number;
  top5Detractors_width: number;
  company_logo: string;
  company_logo_org: string;
  investment_type: string;
  scheme_code: string;
}

export class PortfolioHoldingsResponse {
  message: string;
  portfolioHoldings: PortfolioHoldings[];
  errorMessage: string;
}

export class PortfolioCompany {
  company: string;
  cmp: number;
  mkt_cap: number;
  eps_cagr: number;
  p_e1: number;
  p_e2: number;
  p_b: number;
  roci: number;
  p_fcf1: number;
  p_fcf2: number;
  company_logo: string;
}

export class PortfolioCompanyResponse {
  message: string;
  portfolioCompany: PortfolioCompany[];
}

export class DataRoomDocument {
  id: number;
  fund_id: number;
  created_by: number;
  name: string;
  document_date: Date;
  document_type: string;
  sys_file_path: string;
  formatted_date: string;
  document_name: string;
  user_id: number;
  user_unique_id: string;
  role: string;
  role_type: string;
  account_id: number;
  documentPath: string;
  is_mydata: number;
  factsheet_commentary: number;
  entry_type: string;
  action_type: string;
  email_document_status: any;
  email_subject: string;
  email_body: string;
}

export class DataRoomResponse {
  message: string;
  dataRoomDocuments: DataRoomDocument[];
}

export class PerformanceStatistics {
  title: string;
  data: string;
  fund: string;
  benchmark: string;
  type: string;
  fund_id: number;
  as_on_date: Date;
}

export class FundPerformanceKeyMetadata {
  fund_id: number;
  perf_date: Date;
  inception_date: Date;
  current_aum: string;
  current_nav: number;
  clickStatsCounter: any;
  fundIpStatement: FundIpStatement;
  xirr: any;
}

export class PerformanceStatisticsResponse {
  message: string;
  performanceStatistics: PerformanceStatistics[];
}

export class PerformanceClassNames {
  class: string;
}

export class PerformanceClassNamesResponse {
  message: string;
  class_names: PerformanceClassNames[];
}

export class AsOnDatesResponse {
  message: string;
  dates: [];
}

export class PerformanceClassStats {
  stat_key: string;
  stat_value: any;
}

export class PerformanceClassStatsResponse {
  message: string;
  class_names: PerformanceClassStats[];
}

export class UpdatedDate {
  type: string;
  updated_at: Date;
}

export class UpdatedDateResponse {
  message: string;
  updatedDate: UpdatedDate[];
}

export class DebtPortfolioHolding {
  id: number;
  company: string;
  announced_date: Date;
  industry: string;
  funding_stage: string;
  funding: string;
  debt_term: number;
  amount_invested: any;
  equity_co_investment: any;
  fixed_income_irr: number;
  equity_kickers: number;
  fund_id: number;
  company_logo: string;
  company_logo_image: string;
  formatted_date: string;
  company_news: string;
  city: string;
  fair_market_value: any;
  ownership_on_fdb: number;
  as_on_date: Date;
  amount_invested_percent: number;
  fair_market_value_percent: number;
  brand: string;
  amount_invested_percent1: number;
  fair_market_value_percent1: number;
  deal_team: string;
  partner: string;
  gross_irr: number;
  gross_moic: number;
}

export class DebtPortfolioHoldingResponse {
  message: string;
  debtPortfolioHolding: DebtPortfolioHolding[];
  longPortfolio: any;
}

export class DebtPortfolioHoldingTotal {
  amount_invested: number;
  equity_co_investment: number;
  fair_market_value: number;
  amount_invested_percent: number;
  equity_co_investment_percent: number;
  fair_market_value_percent: number;
}

export class DebtPortfolioHoldingTotalResponse {
  message: string;
  debtPortfolioHoldingTotal: DebtPortfolioHoldingTotal;
}

export class ExitedPortfolioHoldingResponse {
  message: string;
  exitedPortfolioHolding: ExitedPortfolioHolding[];
}

export class ExitedPortfolioHolding {
  id: number;
  as_on_date: Date;
  fund_id: number;
  company: string;
  date: Date;
  industry: string;
  funding_round: string;
  amount_invested: any;
  exited_value: any;
  gross_moic: number;
  brand: string;
  company_logo: string;
  company_logo_image: string;
  formatted_date: string;
  company_news: string;
  city: string;
  status: string;
  gross_irr: number;
  exit_to: string;
  exit_type: string;
  amount_invested_percent: number;
  exited_value_percent: number;
}

export class ExitedPortfolioHoldingTotal {
  amount_invested: number;
  exited_value: number;
  amount_invested_percent: number;
  exited_value_percent: number;
}

export class IcInvestedCompany {
  name: string;
  value: string;
  type: string;
  company_id: number;
  news: string;
  as_on_date: Date;
  fund_id: number;
}

export class IcInvestedCompanyResponse {
  message: string;
  icInvestedCompany: IcInvestedCompany[];
}

export class DebtPortfolioStrategy {
  id: number;
  strategy: string;
  type: string;
}

export class DebtPortfolioStrategyResponse {
  message: string;
  debtPortfolioStrategy: DebtPortfolioStrategy[];
}

export class IcFundingRounds {
  id: number;
  announced_date: Date;
  transaction_name: string;
  lead_investors: string;
  other_investors: string;
  number_of_investors: number;
  funds_raised: string;
  formatted_date: string;
  existing_investors: string;
  angel_investors: string;
  existingInvestorsImages: ExistingInvestorsImages[];
}

export class ExistingInvestorsImages {
  imagesPath: string;
}

export class IcFundingRoundsResponse {
  message: string;
  icFundingRounds: IcFundingRounds[];
}

export class OperatingMetrics {
  label: string;
  label1: string;
  unit_sales_per_day: number;
  retail_stores: number;
  app_orders: number;
  metrics_date: Date;
  metrics_date1: Date;
  value1: number;
  value2: number;
  value3: number;
  value4: number;
}

export class OperatingMetricsResponse {
  message: string;
  operatingMetrics: OperatingMetrics[];
}

export class FinancialMetrics {
  metrics_date: Date;
  metrics_date1: Date;
  label: string;
  label1: string;
  gross_revenue: number;
  ebitda: number;
  revenue: number;
  name: string;
  value1: number;
  value2: number;
  value3: number;
  value4: number;
  type: string;
}

export class FinancialMetricsResponse {
  message: string;
  financialMetrics: FinancialMetrics[];
}

export class DistributionSector {
  label: string;
  amount_invested: number;
}

export class DistributionSectorResponse {
  message: string;
  distributionSector: DistributionSector[];
}

export class DistributionFunding {
  label: string;
  amount_invested: number;
}

export class DistributionFundingResponse {
  message: string;
  distributionFunding: DistributionFunding[];
}

export class UserCount {
  user_count: number;
  user_role: string;
}

export class userCountResponse {
  message: string;
  userCount: UserCount[];
}

export class AmcDistributor {
  id: number;
  amc_account_id: number;
  distributor_account_id: number;
  created_by: number;
  fund_id: number;
  account: Account;
  fund: Fund;
}

export class AmcDistributorResponse {
  message: string;
  amcDistributor: AmcDistributor[];
}

export class AmcDistributorSingalResponse {
  message: string;
  amcDistributor: AmcDistributor;
}

export class PerformanceKeyNavIrr {
  fund_id: number;
  class: string;
  stat_key: string;
  stat_value: string;
  type: string;
  date: string;
}

export class PerformanceKeyNavIrrResponse {
  message: string;
  performance_nav_irr: PerformanceKeyNavIrr[];
  errorMessage: string;
}

export class PeformanceSummary {
  fund_class_current_nav: string = "-";
  fund_class_IRR_1month: string = "-";
  fund_class_IRR_3month: string = "-";
  fund_class_IRR_6month: string = "-";
  fund_class_IRR_YTD: string = "-";
  fund_class_IRR_1Year: string = "-";
  fund_class_IRR_3Year: string = "-";
  fund_class_IRR_5Year: string = "-";
  fund_class_IRR_7Year: string = "-";
  fund_class_since_inception: string = "-";
  fund_class_IRR_1month1: number = 0;
  fund_class_IRR_3month1: number = 0;
  fund_class_IRR_6month1: number = 0;
  fund_class_IRR_YTD1: number = 0;
  fund_class_IRR_1Year1: number = 0;
  fund_class_IRR_3Year1: number = 0;
  fund_class_IRR_5Year1: number = 0;
  fund_class_since_inception1: number = 0;
  fund_class_sharpe_ratio: string = "-";
  fund_class_sortino: string = "-";
  fund_class_beta: string = "-";
  fund_class_information_ratio: string = "-";
  fund_class_treynor_measure: string = "-";
  fund_class_volatility: string = "-";
  fund_class_risk_free_rate: string = "-";
  fund_class_alpha: string = "-";
  ARITHMETIC_MEAN: string = "-";
  SD_ANNUALISED: string = "-";
  UP_CAPTURE_RATIO: string = "-";
  DOWN_CAPTURE_RATIO: string = "-";
  CAPTURE_RATIO: string = "-";
  CORELATION: string = "-";
  TRACKING_ERROR: string = "-";
  fund_class_mibor: string = "-";
  fund_class_IRR_YTM: string = "-";
  fund_class_IRR_YTM1: string = "-";
  xirr: string = "-";
  fund_class_IRR_9month: string = "-";
  fund_class_IRR_9month1: string = "-";
  fund_class_IRR_2Year: string = "-";
  fund_class_IRR_2Year1: number = 0;
  fund_class_IRR_4Year: string = "-";
  fund_class_IRR_4Year1: string = "-";
  fund_class_IRR_7Year1: string = "-";
  fund_class_IRR_10Year: string = "-";
  fund_class_IRR_10Year1: string = "-";
  fund_class_IRR_15Year: string = "-";
  fund_class_IRR_15Year1: string = "-";
}

export class FundConfiguration {
  fund_name: string;
  fund_type: string;
  fund_category: string;
  fund_strategy: string;
  fund_registration_num: string;
  fund_structure: string;
  fund_domicile: string;
  fund_currency: string;
  fund_size: string;
  fund_size_unit: string;
  fund_Tenure: string;
  fund_tenure_unit: string;
  fund_tenure_max_extension: string;
  fund_tenure_max_extension_unit: string;
  fund_commitment_period: string;
  fund_commitment_period_unit: string;
  fund_drawdown_period: string;
  fund_upfront_drawdown: string;
  fund_upfront_drawdown_unit: string;
  fund_target_return: string;
  fund_benchmark: string;
  fund_performance_display_unit: string;
  target_fund_size: string;
  fund_website: string;
  india_trustee: string;
  fund_administrator: string;
  indian_counsel: string;
  international_counsel: string;
  global_tax_advisor: string;
  india_mauritius_auditors: string;
  india_office: string;
  mauritius_office: string;
  jurisdiction: string;
  portfolio_investments: string;
  international_administrator: string;
  indian_administrator_trustee: string;
  indian_legal_counsel: string;
  international_legal_counsel: string;
  sponsor_investment_manager: string;
  contact_email: string;
  mauritius_counsel: string;
}

export class FundClasses {
  fund_num_classes: string;
  fund_class_names: string;
  fund_class_min_investment: string;
  fund_class_min_investment_unit: string;
  fund_class_operating_epenses: string;
  fund_class_operating_epenses_type: string;
  fund_class_setup_fee: string;
  fund_class_setup_fee_type: string;
  fund_class_management_fee: string;
  fund_class_equity_hurdle_rate: string;
  fund_class_equity_hurdle_rate_type: string;
  fund_class_fixedincome_hurdle_rate: string;
  fund_class_fixedincome_hurdle_rate_type: string;
  fund_class_equity_incentive_fee: string;
  fund_class_equity_incentive_fee_type: string;
  fund_class_fixedincome_incentive_fee: string;
  fund_class_fixedincome_incentive_fee_type: string;
}

export class FundConfigurationClasses {
  fund_id: number;
  account_id: number;
  fund_type: string;
  fund_key: string;
  fund_value: string;
  fund_value1?: any[];
}

export class FundConfigurationClassesResponse {
  message: string;
  fund_configuration_classes: FundConfigurationClasses[];
}

export class FundRedemption {
  redemption_class: string;
  redemption_with_exit_load: string;
  frequency: string;
  exit_load: number;
  redemption_without_exit_load: string;
  fund_id: number;
}

export class StatementInvestorResponse {
  message: string;
  statementInvestor: StatementInvestor;
}

export class AllStatementInvestorResponse {
  message: string;
  statementInvestors: StatementInvestor[];
}

export class StatementInvestor {
  arranger: string;
  investor_name: string;
  city: string;
  pin_code: string;
  pan_number: string;
  aadhar_number: string;
  email: string;
  folio_number: string;
  amount_committed: number;
  amount_drawn: number;
  drawn: number;
  xirr: number;
  effective_return: any;
  gross_nav: number;
  net_nav: number;
  class_of_units: string;
  unit_balance: number;
  unit_balance1: string;
  management_fees: number;
  setup_expenses: number;
  avendus_setup: number;
  absolute_returns: number;
  fund_id: number;
  statement_date: Date;
  total_committed: number;
  funded_committed: number;
  unfunded_committed: number;
  distibution: number;
  nav: number;
  residal_value: number;
  unit: number;
  address: string;
  statement_no: string;
  statement_inflows: StatementInflow[];
  statement_distributions: StatementDistribution[];
  statement_principal_redemptions: StatementRedemption[];
  statement_xirr_data: StatementXirrData[];
  ip_statements: IpStatement[];
  redeemed_amount: number;
  total_value: number;
  redemption_amount: any;
  tvpi: any;
  graphDistribution: number;
  graphCapitalReedemed: number;
  graphResidualValue: number;
  graphCommitmentFunded: number;
  graphCommitmentUnFunded: number;
}

export class IpStatement {
  statement_investor_id: number;
  transaction_type: string;
  transaction_date: Date;
  drawdown: number;
  recallable: number;
  redemption: number;
  units: number;
  capital_gain: number;
  interest: number;
  tds: number;
  drawdown1: string;
  recallable1: string;
  redemption1: string;
  units1: string;
  capital_gain1: string;
  interest1: string;
  tds1: string;
}

export class StatementInflow {
  statement_investor_id: number;
  fund_id: number;
  inflow_date: Date;
  amount: number;
  formatted_inflow_date: string;
}

export class StatementXirrData {
  statement_investor_id: number;
  fund_id: number;
  as_on_date: Date;
  xirr: number;
}

export class StatementDistribution {
  statement_investor_id: number;
  fund_id: number;
  distribution_date: Date;
  net_income: number;
  fixed_income: number;
  income_from_mf: number;
  income_from_fixed_deposits: number;
  income_from_equity: number;
  gross_income: number;
  formatted_distribution_date: string;
}

export class StatementRedemption {
  statement_investor_id: number;
  fund_id: number;
  redemption_date: Date;
  redemption_amount: number;
  formatted_redemption_date: string;
}

export class StatementItem {
  itemName: string;
  date: string;
  drawdown: number;
  units: number;
  distribution_interset: number;
  debt_ret: number;
  fixed_deposits_ret: number;
  equity_ret: number;
  tds: number;
  net_ret: number;
  gross_income: number;
  redemption_amount: number;
  redemptionUnits: number;

  drawdown1: string;
  units1: string;

  distribution_interset1: string;
  debt_ret1: string;
  fixed_deposits_ret1: string;
  equity_ret1: string;
  tds1: string;
  net_ret1: string;
  gross_income1: string;
  redemption_amount1: string;
}

export class InvestorDetails {
  email: string;
  investor_name: string;
  folio_number: string;
}

export class StatementInvestorsResponse {
  message: string;
  investors: InvestorDetails[];
}

export class AuditLog {
  user_id: number;
  fund_id: number;
  event: string;
  additional_info: string;
  isMobile: boolean;
}

export class PdfGenerateResponse {
  message: string;
  filename: string;
  requestId: number;
}

export class StatementTextResponse {
  message: string;
  statementText: StatementText[];
}

export class StatementText {
  fund_id: number;
  statement_text: string;
}

export class FundIpStatementResponse {
  message: string;
  fundIpStatement: FundIpStatement;
}

export class FundIpStatementAllResponse {
  message: string;
  fundIpStatements: FundIpStatement[];
}

export class FundIpStatement {
  fund_id: number;
  total_committed: number;
  funded_committed: number;
  unfunded_committed: number;
  distibution: number;
  nav: number;
  residal_value: number;
  unit: number;
  effective_return: number;
  xirr: number;
  as_on_date: Date;
  fund_return: number;
  tvpi: number;
  redemption_amount: number;
  total_value: number;
  graphDistribution: number;
  graphCapitalReedemed: number;
  graphResidualValue: number;
  graphCommitmentFunded: number;
  graphCommitmentUnFunded: number;
}

export class PrsClientInformationResponse {
  message: string;
  prsClientInformation: PrsClientInformation;
}

export class PrsClientInformation {
  id: number;
  fund_id: number;
  company_id: number;
  review_date: Date;
  date: Date;
  deal_team: string;
  client: string;
  client_no: number;
  risk_stage: string;
  industry: string;
  credit_rating: number;
  last_reviewed: string;
  date_criticized: string;
  recommended: number;
  payment_compliance: string;
  dpd: string;
  data_compliance: string;
  partner: string;
  brand: string;
  prs_equity_histories: PrsEquityHistory[];
  prs_financial_performances: PrsFinancialPerformance[];
  prs_investor_details: PrsInvestorDetails[];
  prs_liquidity_burns: PrsLiquidityBurn[];
  prs_ncds: PrsNcd[];
  prs_notes: PrsNotes[];
  prs_non_alteria_debts: PrsNonAlteriaDebt[];
  prs_loan_book_metrics: PrsLoanBookMetrics[];
  prs_fldg_margins: PrsFldgMargin[];
  prs_portfolio_metrics: PrsPortfolioMetrics[];
  prs_debt_funds_availables: PrsDebtFundsAvailable[];
}

export class PrsEquityHistory {
  prs_id: number;
  round: string;
  mm: number;
  date: Date;
  valuation: number;
}

export class PrsFinancialPerformance {
  prs_id: number;
  date: Date;
  projected_revenue: number;
  projected_net_profit: number;
  actual_revenue: number;
  actual_net_profit: number;
}

export class PrsInvestorDetails {
  prs_id: number;
  investor: string;
  shareholding: number;
  series: string;
}

export class PrsLiquidityBurn {
  prs_id: number;
  date: Date;
  rml: number;
  monthly_ebda_burn: number;
  average_ebda_burn: number;
  mfa_cash: number;
  cash_burn: number;
}

export class PrsNcd {
  prs_id: number;
  name: string;
  tranche_1: string;
  tranche_2: string;
  type: string;
  equity: string;
}

export class PrsNonAlteriaDebt {
  prs_id: number;
  lender: string;
  facility: string;
  sanctioned: number;
  os: number;
}

export class PrsNotes {
  prs_id: number;
  note: string;
}

export class PrsLoanBookMetrics {
  prs_id: number;
  date: Date;
  disbursements: number;
  aum: number;
  npa: number;
  cumulative_disbursement: number;
  cumulative_write_offs: number;
}

export class PrsFldgMargin {
  prs_id: number;
  date: Date;
  total_margin: number;
  margin_placed: number;
  uncalled_margin: number;
}

export class PrsPortfolioMetrics {
  prs_id: number;
  date: Date;
  disbursements: number;
  aum: number;
  total_borrowing: number;
  dpd: number;
  plus_dpd: number;
  unencumbered_cash: number;
}

export class PrsDebtFundsAvailable {
  prs_id: number;
  available: string;
  type: string;
  amount: number;
}

export class Note {
  id: number;
  name: string;
  note: string;
  fund_id: number;
  created_by: number;
  notes: any;
  created_at: Date;
  brand: string;
  user: User;
}

export class NoteResponse {
  message: string;
  notes: Note[];
}

export class InvestorResponse {
  message: string;
  investors: Investors[];
}

export class Investors {
  user_id: number;
  email: string;
  display_name: string;
  company_id: string;
}

export class LongPortfolio {
  id: number;
  company: string;
}

export class LongPortfolioResponse {
  message: string;
  longPortfolio: LongPortfolio[];
}

export class AifExchangeResponse {
  message: string;
  aifExchange: AifExchange[];
}

export class AifExchange {
  id: number;
  fund_id: number;
  account_id: number;
  sale_id: string;
  fund_name: string;
  sale_value: number;
  discount: number;
  return_type: string;
  return: number;
  upload_date: Date;
  strategy: string;
  fund_manager: string;
  fund_status: string;
  vintage: Date;
  maturity: Date;
  commitment: number;
  investment: number;
  last_valuation: number;
  last_valuation_date: Date;
  benchmark_return: number;
  deal_manager: string;
  availability: string;
  documents: string;
  status: string;
}

export class FileUploadResponse {
  code: number;
  errorMessage: string;
  message: string;
  result: any;
}

export class RequestStatusResponse {
  message: string;
  request_status: RequestStatus[];
  processId: any;
}

export class FundOptionResponse {
  message: string;
  menus: FundTypeMenu[];
}

export class FundTypeMenu {
  section_name: string;
  options: string;
  keys: string;
}

export class RequestStatus {
  progress_counter: number;
  request_id: number;
  error_message: string;
  status: string;
  file_path: string;
  button_name: string;
  log_text: string;
}

export class TimelineResponse {
  message: string;
  timelineItems: TimelineItem[];
}

export class TimelineItem {
  fund_id: number;
  sys_file_path: string;
  status: string;
  created_date: string;
  as_on_date: string;
  formatted_created_date: string;
}

export class FundNewsResponse {
  message: string;
  fundNews: FundNews[];
  errorMessage: string;
}

export class FundNews {
  id: number;
  account_id: number;
  fund_id: number;
  company_id: number;
  news_keyword: string;
  news_json: string;
  news_date: Date;
  sys_file_path: string;
}

export class SofPerformanceResult {
  performance: any;
  drawdowns: any;
}

export class SofPerformanceResponse {
  message: string;
  errorMessage: string;
  sofPerformamce: SofPerformamce[];
  sofDrawdowns: SofDrawdowns[];
}

export class SofPerformamce {
  name: string;
  listed: string;
  unlisted: string;
  listed1: number;
  unlisted1: number;
  overall: string;
  overall1: number;
  fund_id: number;
  as_on_date: Date;
}

export class SofDrawdowns {
  name: string;
  value: number;
  benchmark: number;
  type: string;
  fund_id: number;
  as_on_date: Date;
}

export class SofPortfolioResponse {
  message: string;
  portfolioComposition: PortfolioComposition[];
  marketComposition: PortfolioComposition[];
  sectorComposition: PortfolioComposition[];
  listedComposition: ListedComposition[];
  unListedComposition: ListedComposition[];
}

export class PortfolioComposition {
  name: string;
  value: number;
  actual_value: number;
  width: number;
}

export class ListedComposition {
  id: number;
  name: string;
  value: number;
  actual_value: number;
  width: number;
  company_logo: string;
}

export class FundMapResponse {
  message: string;
  fund_map: FundMap[];
}

export class FundMap {
  fund_id?: number;
  class_name?: string;
  scheme_code?: string;
  plan_code?: string;
  parent_portfolio_code?: string;
  since_inception_date?: Date;
  display_class?: string;
  parent_fund_id?: number;
  isInvestor?: string;
  user_id?: number;
  fund_guid?: any;
  user_guid?: any;
  name?: any;
  guid?: any;
}

export class PortfolioParentFundId {
  message?: string;
  fund_id: number;
}

export class PortfolioPipelineResponse {
  message: string;
  portfolioPipeline: PortfolioPipeline[];
}

export class PortfolioPipeline {
  fund_id: number;
  company: string;
  timing: string;
  industry: string;
  funding_round: string;
  investment_size: string;
  existing_investors: string;
  as_on_date: Date;
  portfolioPipelineImages: PortfolioPipelineImages[];
}

export class PortfolioPipelineImages {
  imagesPath: string;
}

export class DocumentLog {
  id: number;
  type: string;
  name: string;
  sys_file_path: string;
  fund_id: number;
  created_at: Date;
  user: User;
  formatted_date: string;
  as_on_date: string;
  formatted_as_on_date: string;
}

export class DocumentLogResponse {
  message: string;
  document_log: DocumentLog;
}

export class FundCommentaryResponse {
  message: string;
  iifl_fund_commentary: FundCommentary[];
}

export class FundCommentary {
  id: number;
  fund_id: number;
  as_on_date: string;
  content: string;
  type: string;
  created_by: number;
  item: string;
  heading: string;
  image_name: string;
  file_name: string;
  fund_identify: string;
}

export class FundManagerOverview {
  name: string;
  image_name: string;
  content: string;
  quote: string;
  designation: string;
}

export class ChartData {
  labels: string[];
  values: number[];
}

export class StructuredCreditPortfolio {
  name: string;
  weight: number;
  invested_amount: number;
  invested_amount_percentage: number;
  prinicipal_outstanding: number;
  prinicipal_outstanding_percentage: number;
  total_outstanding: number;
  total_outstanding_percentage: number;
  total: number;
  xirr: number;
  tenore: string;
  instrument_type: string;
  borrower: string;
  end_use: string;
  take_out: string;
}

export class PortfolioSummary {
  geography: ChartData;
  sector: ChartData;
  portfolio: StructuredCreditPortfolio[];
}

export class PortfolioSummaryResponse extends GenericResponse {
  portfolioSummary: PortfolioSummary;
}

export class ScPerformanceGraph {
  invested_amount: ChartData;
  ytm: ChartData;
}
export class PerformanceYtmGraphResponse extends GenericResponse {
  scPerformanceGraph: ScPerformanceGraph;
}
export class EquityMfPerformanceClassStatsResponse {
  message: string;
  class_name: EquityMfPerformance;
}
export class EquityMfPerformance {
  CAGR: PerformanceClassStats[];
  TOTAL: PerformanceClassStats[];
  XIRR: PerformanceClassStats[];
  PTP: PerformanceClassStats[];
  RISKRATIOS: PerformanceClassStats[];
  GENERIC_TOTAL: PerformanceClassStats[];
  dividend: any;
  RETURNS_CAGR: PerformanceClassStats[];
}

export class DebtComposition {
  maturity: PerformanceClassStats[];
  rating: PerformanceClassStats[];
  instrumentation: PerformanceClassStats[];
}
export class DebtCompositionGraphResponse extends GenericResponse {
  composition: DebtComposition;
  compositionPreviousMonth: DebtComposition;
}

export class DistributorFundResponse {
  message: string;
  distributor_fund: DistributorFund[];
  userCount: number;
}

export class DistributorFund {
  id: number;
  fund_id: number;
  account_id: number;
  accout_ids: number[];
  user_id: number;
  user_ids: number[];
  distributor_status: string;
  amc_status: string;
  amc_account_id: number;
  amc_access: string;
  distributor_access: string;
  fund: Fund;
  user: User;
  account: Account;
  is_distributor_account: number;
  isPerformance: boolean;
  isPortfolio: boolean;
  isDataroom: boolean;
  isDistributorPerformance: boolean;
  isDistributorPortfolio: boolean;
  isDistributorDataroom: boolean;
  requestedString: string;
  userCount: string;
  is_invited_fund: number;
  selectedDefaultAccess: SelectedDefaultAccess[];
  distributorAccessArray: SelectedDefaultAccess[];
  selectedFundTeam: SelectedFund[];
  optionLabelAccess: any[];
  approvedFundTeam: [];
  team: Team;
  clickStatsCounter: number;
  initial_capital: string;
  initial_capital_per: number;
  top_up: string;
  top_up_per: number;
  total_investment: string;
  si_twrr: string;
  benchmark: string;
  withrawal: string;
  withrawal_per: number;
  current_value: string;
  current_value_per: number;
  total_return_value: string;
  max: string;
  user_guid: number;
  fund_guid: any;
  link: string;
  amount: number;
}

export class DistributorFundObject {
  message: string;
  distributor_fund: DistributorFund;
  team: Team;
  investor_count: number;
  distributor_fund_count: number;
  investor_fund_count: number;
  current_aum_sum: number;
  current_aum_investor: number;
  clickStatsCounter: number;
  userTaxIdCount: number;
}

export class SelectedFundResponse {
  message: string;
  userCount: string;
  selectedFundTeam: SelectedFund[];
  approvedFundTeam: [];
  team: Team;
  clickStatsCounter: number;
  financial_data: FinancialData;
  link: string;
  amount: number;
}

export class FinancialData {
  initial_capital: string;
  initial_capital_per: number;
  top_up: string;
  top_up_per: number;
  total_investment: string;
  si_twrr: string;
  benchmark: string;
  withrawal: string;
  withrawal_per: number;
  current_value: string;
  current_value_per: number;
  total_return_value: string;
  max: string;
  commitmentAmount: number;
  fundedCommitted: number;
  unFundedCommitted: number;
  xirr: number;
  tvpi: number;
  distribution: number;
  redemptionAmount: number;
  residualValue: number;
  totalValue: number;
  residualValuePer: number;
  fundedCommittedPer: number;
  unFundedCommittedPer: number;
  distributionPer: number;
  capitalReedemedPer: number;
}

export class SelectedFund {
  value: number;
  label: string;
}

export class SelectedDefaultAccessResponse {
  message: string;
  requestedString: string;
  selectedDefaultAccess: SelectedDefaultAccess[];
}

export class SelectedDefaultAccess {
  label: string;
  value: string;
}

export class FundAccessMetadata {
  id: number;
  fund_type: string;
  fund_access: string;
}

export class FundOtherInfo {
  CURRENT_AUM: string;
  NAV_DATE: string;
  perfDate: string;
  NAV: string;
  SINCE_INCEPTION_FUND: any;
  SINCE_INCEPTION_FUND1: any;
  SINCE_INCEPTION_BENCHMARK: any;
  SINCE_INCEPTION_BENCHMARK1: any;
  TVPI: any;
  EFFECTIVE_RETURNS: any;
  fundedCapitalCommitment: any;
  residualValue: any;
  totalDistribution: any;
  totalValue: any;
  totalCapitalCommitment: any;
  FUND_AMOUNT_TO_BE_RAISED: string;
  FUND_CURRENT_VALUATION: string;
  FUND_CLOSING_DATE: string;
}

export class Mibor {
  id: number;
  mibor_date: Date;
  overnight_mibor: number;
  tenor: string;
}

export class MiborResponse {
  mibor_data: Mibor;
}

// export class CommentaryGroupName {

// }

export class StaticNewsData {
  date: Date;
  title: string;
  snippet: string;
  link: string;
  thumbnail: string;
  source: string;
  position?: number;
}

export class PdfGenerateResponseV2 {
  message: string;
  errorMessage: string;
  filePath: number;
  requestId: number;
  fileName: string;
  timeStamp: any;
  button_name: string;
  request_id: any;

}

export class OpenLinkResponse {
  message: string;
  firstTime: number;
  open_link: OpenLink;
}

export class OpenLink {
  id: number;
  account_id: number;
  created_by: number;
  link: string;
  link_type: string;
}

export class OpenLinkFund {
  id: number;
  fund_id: number;
  open_link_id: number;
  access: string;
  invited_fund: string;
  isPerformance: boolean;
  isPortfolio: boolean;
  isDataroom: boolean;
  isDistributorPerformance: boolean;
  isDistributorPortfolio: boolean;
  isDistributorDataroom: boolean;
  requestedString: string;
  userCount: string;
  selectedDefaultAccess: SelectedDefaultAccess[];
  distributorAccessArray: SelectedDefaultAccess[];
  selectedFundTeam: SelectedFund[];
  status: string;
}

export class OpenLinkFundResponse {
  message: string;
  open_link_fund: OpenLinkFund;
  open_link: OpenLink;
}

export class OpenLinkUserResponse {
  message: string;
  open_link_user: OpenLinkUser;
}

export class OpenLinkUser {
  id: number;
  fund_id: number;
  open_link_id: number;
  user_id: number;
}

export class CompanyVideoPdfResponseV2 {
  message: string;
  errorMessage: string;
  pdfvideos: CompanyVideoPdf[];
}
export class CompanyVideoPdf {
  id: number;
  fund_id: number;
  type: string;
  sys_file_path: string;
  title: string;
  file_name: string;
  order_number: string;
  safeUrl: any;
}

export class pmsFeeStructureResponse {
  message: string;
  pms_fee_structure: pmsFeeStructureData[];
}
export class pmsFeeStructureData {
  id: number;
  name: string;
  key: string;
  value: string;
  type: string;
}

export class pmsExistLoadResponse {
  message: string;
  exist_load: any[];
}

export class RealEstatePortfolioResponse {
  message: string;
  realEstatePortfolio: RealEstatePortfolio[];
}

export class RealEstatePortfolio {
  id: number;
  fund_id: number;
  as_on_date: Date;
  investment_holdings: string;
  weight: number;
  industry: string;
  location: string;
  amount_invested: number;
  principal_outstanding: number;
  provisioning: number;
  total_net_holding: number;
  brand: string;
  developer_fullname: string;
  status: string;
  amount_invested_percentage: number;
  principal_outstanding_percentage: number;
  provisioning_percentage: number;
  total_net_holding_percentage: number;
}

export class AdvisorStatusCountResponse {
  message: string;
  advisor_status_count: AdvisorStatusCount[];
  invited_count: AdvisorStatusCount[];
  user_count: number;
}

export class AdvisorStatusCount {
  status: string;
  count: number;
}

export class RealEstatePerformanceResponse {
  message: string;
  realEstatePerformance: RealEstatePerformance[];
  realEstateGraphData: RealEstateGraphData[];
  rsPerformancePayouts: RsPerformancePayouts[];
}

export class RealEstatePerformance {
  id: number;
  fund_id: number;
  as_of_date: Date;
  current_aum: string;
  nav: string;
  xirr: number;
  benchmark: string;
  gross_aum: number;
  net_aum: number;
  capital_distributed: number;
  income_distributed: number;
  gross_nav: number;
  current_nav: number;
  capital_distributed_unit: number;
  income_distributed_unit: number;
}

export class RealEstateGraphData {
  id: number;
  fund_id: number;
  as_of_date: Date;
  graph_date: Date;
  aum: number;
  irr: number;
}

export class RsPerformancePayouts {
  id: number;
  fund_id: number;
  as_of_date: Date;
  payout_date: Date;
  description: string;
  type: string;
  value: number;
  nav_per_unit: number;
  totalDrawDown: number;
  totalIncomeDistribution: number;
  totalPrincipalDistribution: number;
  totalNavPerUnit: number;
}

export class NotificationOptions {
  origin_name: string;
  origin_id: number;
}

export class Notifications {
  id: number;
  event_id: string;
  display_name: string;
  message_body: string;
  recipients: string;
  notification_mode: string;
  destination: string;
  destination_button: string;
  notification_trigger_mode: string;
  notification_status: string;
  metadata: boolean;
}

export class CreateNotification {
  fundId: number;
  eventNumber: number;
  eventHeader: any;
  messageBody: any;
  recipients: any;
  destination: any;
}

export class Recipients {
  role_type: string;
}

export class EditNotifications {
  id: number;
  messageBody: string;
  recipients: string;
  modes: string;
  displayName: string;
}

export class PollResponse {
  message: string;
  poll: Poll;
  polls: Poll[];
  errorMessage: any;
}

export class Poll {
  id: number;
  question_text: string;
  duration: number;
  expiry_date: Date;
  status: string;
  poll_options: PollOptions[];
}

export class PollOptions {
  id: number;
  option_text: string;
}

export class AccountConfig {
  account_id: number;
  key: string;
  value: any;
}

export class CheckerMakers {
  id: number;
  documnet_log: number;
  user_id: number;
  status: string;
  comments: string;
}

export class Explore {
  account_id: number;
  content: string;
  input_type: string;
  section_name: string;
  section_type: string;
  type: string;
}

export class ExploreResponse {
  message: string;
  exploreData: Explore[];
}

export class UserDetails {
  user_id: number;
  fcm_token: string;
  user_message: string;
  user_login_time: Date;
  user_logout_time: Date;
  join_date: Date;
  otp_send_count: number;
}

export class KnowMoreResponse {
  message: string;
  errorMessage: string;
  knowMoreData: KnowMoreData[];
}

export class KnowMoreData {
  account_id: number;
  content: string;
  input_type: string;
  section_name: string;
  section_type: string;
  type: string;
}

export class WoboRmInvestorResponse {
  message: string;
  user: WoboRmInvestor;
}

export class WoboRmInvestor {
  rm_guid: string;
  investor_guid: string;
  fund_guid: string;
}
