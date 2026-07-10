# Deal Portal — Security Review

## Row-Level Security (RLS)
- All new deal tables (`deal_profiles`, `ndas`, `cap_table_entries`, `esop_grants`, `financial_projections`, `term_sheets`, `term_sheet_versions`, `licences`, `region_marketplace`, `cmc_milestones`, `cmc_documents`, `ip_portfolio`, `compliance_register`, `investor_updates`, `deal_access_logs`) have RLS enabled.
- Helper functions `is_admin()`, `is_investor()`, and `has_deal_access(tier)` centralise access checks.
- Policies restrict reads/writes to own records, tier-appropriate roles, or admins.

## Watermarking
- `generateWatermark(userName, company)` produces `{user} | {company} | {timestamp} | CONFIDENTIAL — BYROCK DEAL ROOM`.
- Watermark is applied to downloads; further PDF/image overlay integration should be added in `useWatermarkedDownload`.

## Audit Trail
- `deal_access_logs` records user, document, action, IP, user agent, and watermarked snapshot path.
- Frontend hooks should call this table on every view/download/share/edit/propose action.

## Anonymisation
- `trial_events_deal_room` view strips vet and owner PII before exposing trial events to deal users.
- Components query only this view, never the underlying `trial_events` table.

## Storage
- `deal-room-documents` bucket is private, file-size limited to 50 MB, and restricted to PDF, XLSX, Markdown, PNG, JPEG.
- Storage policies allow owner upload and owner/admin read/delete.

## Auth
- `AuthContext` exposes `dealProfile`, `dealTier`, `hasDealAccess()`, `isInvestor`, `isLicensee`.
- `ProtectedDealRoute` enforces authentication + profile + tier + role before rendering.
- `NDAGate` enforces signed/unexpired NDA.

## Remaining Risks
- Watermark overlay on actual file bytes is not yet implemented.
- DocuSign/OpenSign e-signature integration is stubbed.
- Audit-log writes are best-effort and not yet guaranteed by every component.
- No rate limiting on deal endpoints beyond Supabase defaults.
