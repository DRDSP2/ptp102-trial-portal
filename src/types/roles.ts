export type ClinicalRole = 'vet' | 'admin';

export type DealRole =
  | 'investor'
  | 'licensee_eval'
  | 'licensee_diligence'
  | 'licensee_exclusive';

export type UserRole = ClinicalRole | DealRole;

export type DealTier = 'none' | 'evaluation' | 'diligence' | 'exclusive';

export type Region =
  | 'north_america'
  | 'eu'
  | 'uk'
  | 'uae'
  | 'apac'
  | 'global';

export type {
  CapTableEntry,
  CMCDocument,
  CMCMilestone,
  DealAccessLog,
  DealProfile,
  ESOPGrant,
  FinancialProjection,
  IPAsset,
  Milestone,
  NDARow,
  RegionMarketplace,
  TermSheet,
  TermSheetVersion,
} from '@/deal-portal/types/dealPortal';
