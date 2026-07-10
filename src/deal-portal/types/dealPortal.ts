export type DealRole =
  | 'investor'
  | 'licensee_eval'
  | 'licensee_diligence'
  | 'licensee_exclusive';

export type DealTier = 'none' | 'evaluation' | 'diligence' | 'exclusive';

export type Region =
  | 'north_america'
  | 'eu'
  | 'uk'
  | 'uae'
  | 'apac'
  | 'global';

export interface DealProfile {
  id: string;
  user_id: string;
  company: string | null;
  role: DealRole;
  tier: DealTier;
  nda_signed_at: string | null;
  nda_expires_at: string | null;
  stripe_customer_id: string | null;
  region_of_interest: Region | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  event: string;
  amount: number | null;
  triggered_at?: string | null;
}

export interface TermSheet {
  id: string;
  template_id: string;
  template_name: string;
  status: 'draft' | 'proposed' | 'negotiated' | 'signed' | 'executed';
  prospect_company: string | null;
  prospect_user_id: string | null;
  region: Region | null;
  upfront_fee: number | null;
  milestone_schedule: Milestone[];
  royalty_rate: number;
  minimum_annual_royalty: number | null;
  exclusivity_months: number;
  sublicensing_allowed: boolean;
  created_by: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface TermSheetVersion {
  id: string;
  term_sheet_id: string;
  version: number;
  content: TermSheet;
  proposed_by: 'prospect' | 'byrock';
  created_at: string;
}

export interface RegionMarketplace {
  region: Region;
  status:
    | 'available'
    | 'under_evaluation'
    | 'under_negotiation'
    | 'licensed'
    | 'reserved';
  base_licence_fee: number | null;
  royalty_rate: number;
  licensee_company: string | null;
  licensee_user_id: string | null;
  exclusivity_expires_at: string | null;
  notes: string | null;
}

export interface CMCMilestone {
  id: string;
  phase: string;
  milestone_id: string;
  title: string;
  target_month: number | null;
  acceptance_criteria: string | null;
  status: 'pending' | 'in_progress' | 'complete' | 'blocked';
  deliverables: string[] | null;
  budget_estimate_low: number | null;
  budget_estimate_high: number | null;
}

export interface CMCDocument {
  id: string;
  category: 'regulatory' | 'cmc' | 'manufacturing' | 'development_plan';
  title: string;
  file_path: string | null;
  version: string | null;
  access_tier_min: 'evaluation' | 'diligence' | 'exclusive';
  uploaded_by: string | null;
  created_at: string;
}

export interface CapTableEntry {
  id: string;
  shareholder_name: string;
  share_class: 'ordinary' | 'preferred' | 'licence_unit' | 'option';
  shares: number;
  percentage: number;
  vesting_schedule: Record<string, unknown> | null;
  is_employee_pool: boolean;
}

export interface ESOPGrant {
  id: string;
  participant_id: string;
  units: number;
  exercise_price: number | null;
  vesting_schedule: Record<string, unknown> | null;
  grant_date: string | null;
  expiry_date: string | null;
}

export interface IPAsset {
  id: string;
  title: string;
  type: 'patent' | 'trademark' | 'biomarker' | 'trade_secret';
  jurisdiction: string | null;
  status: string | null;
  filing_date: string | null;
  assignee: string | null;
  application_number: string | null;
  description: string | null;
}

export interface FinancialProjection {
  id: string;
  year: number;
  revenue: number | null;
  cogs: number | null;
  gross_profit: number | null;
  operating_expenses: number | null;
  ebit: number | null;
  operating_cash_flow: number | null;
  sam_cases: number | null;
  tam_cases: number | null;
  price_per_treatment: number;
  cost_per_treatment: number;
  gross_margin_percent: number;
}

export interface DealAccessLog {
  id: string;
  user_id: string;
  document_id: string | null;
  document_type: string | null;
  action: 'view' | 'download' | 'share' | 'edit' | 'propose_term_sheet';
  ip_address: string | null;
  user_agent: string | null;
  watermarked_snapshot_path: string | null;
  created_at: string;
}

export interface NDARow {
  id: string;
  user_id: string;
  template_version: string;
  company_name: string | null;
  signed_at: string | null;
  expires_at: string | null;
  signature_provider: string | null;
  signature_envelope_id: string | null;
  status: 'pending' | 'signed' | 'expired' | 'revoked';
  created_at: string;
}
