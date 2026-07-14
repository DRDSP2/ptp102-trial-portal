# Porting the Certificate / Licence Request Flow — Research & Plan

**Status:** READ-ONLY research complete. No code or DB changes made.
**Date:** 2026-07-14
**Repos:** `ptp102-regulatory-platform` (source, cloned for research) · `ptp102-trial-portal` ("Veterinary Laminitis Trials 3", target)

---

## 0. Headline finding (read this first)

The original task assumed the regulatory platform has a working **certificate / licence request flow** to port into the trial portal. After mapping both codebases, that assumption is **false**:

- **Regulatory platform (`ptp102-regulatory-platform`):** The entire "deal room" is a **localStorage demo**. `DealRoom.tsx` stores profile/term-sheet data in `localStorage`, shows `alert()`s instead of writing requests, and **never calls Supabase** for deal-room data. Its only "request-like" screen (`TermSheetView`) flips a local status and pops an alert — no DB insert. The two deal tables that *do* exist in SQL (`deal_room_owners`, `deal_room_transactions`) are **not referenced by any UI** (verified by grep — the helper functions `getDealTransactions`/`createDealTransaction`/`updateDealTransaction` are defined but called nowhere).
- **Trial portal (`ptp102-trial-portal`):** Already has a **real, DB-backed licence / term-sheet negotiation flow** that is more mature than anything in the regulatory platform: `term_sheets` + `term_sheet_versions` tables, a `useTermSheet` hook with full CRUD, a prospect-facing `TermSheetNegotiationPage` with redline negotiation, and an admin `AdminDealPaymentsPanel` that reads a `licences` table. Storage buckets (`deal-room-documents`, `ptp102-trial-media`) already exist.

**Conclusion:** There is nothing to "port" from regulatory → trial. The trial portal is *ahead*. The real work is **filling the trial portal's own gaps** (admin issuance, certificate generation, signed-document storage) — and optionally borrowing the regulatory platform's `deal_room_transactions` *schema pattern* as a cleaner generic "request + approval" model.

---

## 1. Regulatory platform — deal room map (for reference)

| Item | Detail |
|---|---|
| Routing | `react-router-dom` v7. Routes in `src/app/App.tsx`. `DealRoom` mounted at `/admin/deal-room/*` (admin only) and `/deal/*` (admin+deal). Sub-paths `/deal/data-room`, `/deal/term-sheet`, `/deal/transactions` are **vestigial** — `DealRoom` ignores its `page` prop and manages its own view state. |
| Component | Single file `src/features/dealroom/DealRoom.tsx` (834 lines). Sub-views inline. State in `localStorage` (`byrock_dealroom_profile`, `byrock_dealroom_terms`). NDA gate is the only enforced workflow (localStorage). |
| "Request" UI | `TermSheetView` (lines 616–758): fields `prospect_company`, `region`, `upfront_fee`, `royalty_rate`, `exclusivity_months`, dynamic `milestones[]`, `signed_name`. Status enum `draft→proposed→negotiated→signed→executed`. `submitTermForLegal` just sets status + `alert()`. No persistence. |
| DB tables (unwired) | `deal_room_owners` (`id`→`auth.users`, `company_name`, `email`, `deal_tier`, `deal_status`, `metadata`). `deal_room_transactions` (`id`, `owner_id`, `transaction_type`, `amount_usd`, `currency`, `status` default `'pending'`, `notes`, `signed_document_url`, `approved_at`, `approved_by`, `created_at`). RLS present in `supabase/schema.sql` / `complete_setup.sql`. |
| Auth roles | App-level `Role = 'vet' | 'admin' | 'deal'` (`src/hooks/use-auth.tsx`). No `isInvestor`/`isLicensee`/`hasDealAccess`. DB helpers: `is_admin()`, `is_vet()`, `current_vet_id()`, `current_admin_id()`. **No `is_investor`/`is_licensee`/`hasDealAccess`.** ⚠️ Bug: `getAdministratorByEmail` queries `admin_users` but schema defines `administrators`. |
| Storage | **None.** No buckets created, no `createSignedUrl`/`getPublicUrl` anywhere. Document "downloads" are `alert()` calls. |
| Admin review | **None exists.** No screen lists/approves requests. |

---

## 2. Trial portal — current state (target)

| Capability | Status | Location |
|---|---|---|
| Term sheet (licence request) tables | ✅ Live | `term_sheets`, `term_sheet_versions` (`src/migrations/038_deal_portal_commercial.sql`, lines 20–51). Status enum `draft/proposed/negotiated/signed/executed`. RLS policies at lines 82–101. |
| Licences table | ✅ Exists (read-only UI) | `licences` — read by `src/admin/components/AdminDealPaymentsPanel.tsx:26` (region, status, fee_amount, fee_paid, stripe_payment_intent_id, expires_at). |
| Prospect term-sheet flow | ✅ Live | `useTermSheet` (`src/deal-portal/hooks/useTermSheet.ts`) + `TermSheetNegotiationPage` + `TermSheetBuilder` + `TermSheetRedline`. Writes `term_sheets` / `term_sheet_versions` via Supabase client. |
| Auth context | ✅ Richer than regulatory | `src/context/AuthContext.tsx` exposes `dealProfile`, `dealTier` (`none/evaluation/diligence/exclusive`), `isInvestor`, `isLicensee`, `hasDealAccess(minTier)`. |
| Storage buckets | ✅ Exist | `deal-room-documents` + `ptp102-trial-media` (`src/migrations/048_deal_portal_bootstrap.sql`, `1796000003_...`). RLS + signed-URL helper pattern already in use (e.g. `CMCDataRoom.tsx` uses `createSignedUrl`). |
| Admin term-sheet **approval → licence issuance** | ❌ **Missing** | No code path inserts a `licences` row or transitions an accepted term sheet to `executed`/creates a licence. `AdminDealPaymentsPanel` only **reads** licences. |
| **Certificate generation** | ❌ **Missing** | No certificate record, template, or PDF generation for an issued licence. |
| Signed-term-sheet document storage | ⚠️ Partial | `term_sheets`/`licences` have no `signed_document_url` column wired; `deal_room_documents` bucket exists but isn't used for executed term sheets. |

---

## 3. Gap analysis

| # | Gap | Severity | Notes |
|---|---|---|---|
| G1 | No admin flow to issue a `licences` row from an accepted term sheet | **High** | Core of "licence request" lifecycle is incomplete. Prospect can propose; admin can only *view* payments/licences, never create them. |
| G2 | No certificate generation on licence issuance | **High** | "Certificate/licence" deliverable absent. Need a `certificates` table + PDF/template. |
| G3 | Term-sheet status never advanced to `signed`/`executed` by admin | **Med** | Status enum exists but no admin action drives it; prospect redlines only. |
| G4 | Signed document not stored | **Med** | No `signed_document_url` persistence / upload to `deal-room-documents` bucket on execution. |
| G5 | (Optional) Generic request model | **Low** | Regulatory platform's `deal_room_transactions` shows a reusable `transaction_type`+`status`+`approved_by` pattern that could generalize certificates/licences/other requests. Not required. |

**What the regulatory platform contributes:** only the *schema pattern* of `deal_room_transactions` (a generic request row with `status`, `approved_at`, `approved_by`). Nothing functional.

---

## 4. Recommended phased plan (trial portal only)

> No work should begin until the user confirms scope (see §5). This plan is for the trial portal's *own* gaps, not a port.

### Phase A — Admin licence issuance (closes G1, G3)
1. Add admin UI in `AdminDealPaymentsPanel` (or new `AdminTermSheetReview`): list prospects' `term_sheets` with status `proposed`/`negotiated`; action buttons **Accept / Reject / Request changes**.
2. On Accept: a DB function / RPC `issue_licence(term_sheet_id)` that (a) sets `term_sheets.status='executed'`, (b) inserts a `licences` row (region, fee_amount, expires_at, term_sheet_id, status='active'), (c) writes `deal_access_logs`. Auth: admin-only via `is_admin()`.
3. Respect existing RLS: add admin UPDATE policy on `term_sheets` (currently only prospect drafts updatable — `038` line 94).

### Phase B — Certificate generation (closes G2)
4. New migration `055_deal_portal_certificates.sql`: `certificates(id, licence_id→licences, holder_user_id, region, certificate_number UNIQUE, issued_at, expires_at, document_url, status)`. RLS: holder + admin read; admin write.
5. Extend `issue_licence` RPC to also insert a `certificates` row and generate a `certificate_number` (e.g., `BYR-LIC-<year>-<seq>`).
6. UI: prospect "My Certificates" section (add to `DealOverviewPage` nav grid) + download/PDF render. Reuse `createSignedUrl` + `deal-room-documents` bucket for the generated PDF.

### Phase C — Signed document persistence (closes G4)
7. Add `signed_document_url` to `term_sheets` (and/or `licences`), upload executed PDF to `deal-room-documents` on Accept, store URL.

### Phase D — (Optional) generalize (closes G5)
8. If more request types are expected, model them on `deal_room_transactions` (type + status + approver) instead of per-type tables. Otherwise skip.

**Sequencing risk:** Phases A→B→C are sequential (each depends on prior data). Estimated effort small-to-medium; most infra (tables, buckets, auth helpers, signed-URL pattern) already exists.

---

## 5. Ambiguities / decisions needed from user

1. **Scope confirmation:** Given the regulatory platform has no real flow, is the goal to (a) just complete the trial portal's own licence→certificate lifecycle (recommended), or (b) literally recreate the regulatory platform's `deal_room_transactions` model in the trial portal?
2. **Certificate format:** PDF generated client-side (jsPDF, already a pattern in regulatory platform's `generate-consent-pdf` edge fn) vs server-side edge function vs static HTML download?
3. **Payment coupling:** `licences` references `stripe_payment_intent_id`. Should licence issuance be gated on payment (`fee_paid=true`), or issued independently of Stripe for now?
4. **Admin surface:** Extend `AdminDealPaymentsPanel` vs new dedicated `AdminTermSheetReview` page — preference?

---

## Appendix — evidence pointers
- Regulatory: `src/features/dealroom/DealRoom.tsx:184` (no props), `:616–758` (term sheet view, alert-only), `src/lib/api.ts:380–429` (unwired helpers), `supabase/schema.sql:430–469` (tables).
- Trial: `src/deal-portal/hooks/useTermSheet.ts` (CRUD), `src/deal-portal/pages/TermSheetNegotiationPage.tsx`, `src/admin/components/AdminDealPaymentsPanel.tsx:26` (licences read-only), `src/migrations/038_deal_portal_commercial.sql:20–101`, `src/context/AuthContext.tsx:32–36`.
