# PTP-102 Trial Portal — Production UI Review

**Date:** 2026-07-18 · **Scope:** 61 components, 11 pages, 20 UI primitives, deal portal · **Method:** 6 parallel senior reviewers, read-only · **No code was changed.**

---

## 1. Executive summary

The portal has a **genuinely good foundation**: uniform shadcn/Radix primitives, exemplary form accessibility wiring (`form.tsx` auto-wires `aria-describedby`/`aria-invalid`), a thoughtful tamper-evident audit viewer, mobile column-hiding table patterns, and individual standouts (`QuickAddNote`, `AdverseEventReporter`'s success screen, `ReasonForChangeDialog`, `VetShipmentPanel`).

But it is **not production-ready for its three audiences**. Six reviewers independently converged on the same dominant defect class: **async operations fail silently across the app** — clinical forms, adverse-event reports, consent signing, deletes, x-ray analyses. A vet on barn Wi-Fi cannot distinguish "saved" from "lost". In an FDA-framed product, that is the single most damaging pattern possible, and it appears in **20+ locations**.

**Overall score: 4.1 / 10** (solid base, product design language never systematized)

| Dimension | /10 | One-liner |
|---|---|---|
| Primitive API consistency | 8 | Uniform shadcn pattern |
| Component architecture | 5 | God components (1,263 / 1,164 / 1,263 LOC), ~2,000 LOC dead code shipped |
| Token architecture | 3 | Brand olive absent from tokens, hardcoded 50× in 13 files |
| WCAG AA contrast | 5 | Brand 4.45:1 (fail), focus ring 2.56:1 (fail), destructive 3.6:1 (fail) |
| Loading & empty states | 3 | `Skeleton` exists, never imported; 23 hand-rolled spinners |
| Error handling / state UX | 3 | 6+ P0 silent-failure sites incl. safety-critical forms |
| Responsive design | 6 | Good table patterns exist, not systematized; touch targets under 44px |
| Dark mode | 1 | Tokens exist, unreachable, incompatible with hardcoded colors |

---

## 2. P0 — fix before any vet, consultant, or investor touches it

Grouped; each item verified with file:line by reviewers.

### Theme A — Silent failures & data integrity (the barn vet loses data)

1. **All three core clinical forms fail silently.** `AddTreatmentForm.tsx:139-141`, `AddAssessmentForm.tsx:132-134`, `AddLabResultForm.tsx:131-133` — catch blocks are `console.error` only. Button stops spinning; no error shown; vet can't tell saved vs failed → duplicate entries or lost dose records (the core trial datum).
2. **AdverseEventReporter has NO error handling at all.** `AdverseEventReporter.tsx:71-115` — no try/catch anywhere. A failed submit of a 21 CFR 511.1 safety report leaves the dialog in limbo, report lost. The component where loss is legally worst has the weakest protection.
3. **Informed-consent lifecycle: zero error handling in all four handlers** (`InformedConsentWorkflow.tsx:322-347, 638-698, 700-750, 752-757`). Plus: scanned uploads stored as base64 in localStorage/DB (`QuotaExceededError` on a 10 MB phone photo); signature canvas coordinates unscaled on high-DPR phones (ink offset from finger); PI name/phone render as `[Name]`/`[Phone]` placeholders in the regulatory PDF; consultant role can't view consent documents at all.
4. **Batch-number "Other / manual entry" self-destructs after one keystroke** — `AddTreatmentForm.tsx:230-237`. The manual input unmounts itself on first character; the sentinel `'__manual__'` can be submitted as a lot number. **Drug-lot traceability is broken.**
5. **X-ray analysis displays but silently never persists** — `HoofXrayPortal.tsx:279-297` — every landmark/measurement saved with `.catch(() => {})`. Vet believes a diagnostic analysis is recorded; reload and it's gone.
6. **Eligibility determination fails silently** — `EnrollmentEligibilityScreen.tsx:133-160` — no try/catch; `lastSavedAt` set locally even on failure. FDA gating record.

### Theme B — Regulatory credibility (the FDA consultant finds contradictions)

7. **FDA export reads stale state — first click exports `RECORD COUNT: 0`.** `MasterTrialsTable.tsx:67-71` awaits `loadRegulatoryData()` then reads the *previous render's* state. Stamped `EXPORT DATE` on wrong data.
8. **All `datetime-local` defaults are UTC, not local time** — `AddTreatmentForm.tsx:50`, `AddAssessmentForm.tsx:71`, `AddLabResultForm.tsx:49`, `AdverseEventReporter.tsx:50`. Every clinical timestamp is silently shifted by the vet's tz offset — audit-trail integrity defect.
9. **Read-only consultant is shown write controls.** `DashboardPage.tsx:58-63` — `isStaff` includes consultant → Bulk Lock/Freeze, Enroll Patient, supply admin, x-ray Run Analysis all visible. Gate on `role === 'admin'`; build a dedicated read-only consultant view.
10. **Vet password reset is a fake no-op that reports success** — `PasswordResetRequestScreen.tsx:36-55` — a `Math.random()` token in the browser, no email ever sent, "Password updated successfully!" shown, new password then fails at real Supabase login. Worse: it writes an audit row claiming a password UPDATE that never happened — **the FDA audit trail lies.** Replace with the consultant screen's working `supabase.auth.resetPasswordForEmail` pattern.
11. **Video Library playback broken for every uploaded video** — `CaseWorkspace.tsx:617-623` — raw storage path in `<video src>` against a private bucket; sibling `NoteAttachment` does it right via `useSecureDownloadUrl`. Gait videos can't be reviewed.

### Theme C — Onboarding dead ends

12. **Pending-approval auto-check can never resolve** — `PendingApprovalScreen.tsx:18-27` polls the localStorage mock vet store while production registration writes only Supabase. A new vet sits on "Pending Review" forever despite the on-screen "checking every 5 seconds" promise.
13. **Login status-check reads the wrong data source** — `VeterinarianLoginScreen.tsx:55-77` — mock returns `[]` for every real vet → flashes misleading "terms not accepted" dead-end error.

### Theme D — Design system foundations

14. **Brand olive `#6b7f3a` is in zero design tokens** — hardcoded 50× across 13 files; `bg-primary` resolves to near-black, not brand. White-on-olive = **4.45:1, fails AA** (needs 4.5). One token nudge (`#64752f`) fixes it.
15. **Global CSS `button,a,input,select,textarea{min-height:44px}` silently kills the size-variant API** — `index.css:30-33`. Button `sm`/`default` all render 44px; **Checkbox `h-4 w-4` inflates to 44×44px**; declared size props are an API lie.

---

## 3. P1 highlights (top 12 of ~60)

- **Split-brain data layer** — auth in Supabase, clinical data in per-browser localStorage mock (`featureFlags.ts` defaults all flags false); no cross-tab/device sync; clearing browser data destroys the trial record. Root cause of recurring stale-cache bugs (`a559a68`, `415cb62`, `72f5be2`).
- **Compliance tabs render blank on empty** — `AdminComplianceDashboard.tsx` `{list?.map() || <p>None</p>}` — `[]` is truthy, fallback never renders (5 sites). Stat cards flash fake zeros while loading.
- **Audit trail: no export, no pagination, timestamps without timezone** — branded "FDA-Ready Audit Trail" but can't be extracted for an inspection binder.
- **Touch targets <44px** on the most safety-critical controls (inputs 36px, AE checkboxes 16px, timeline buttons 28px).
- **Dosage has no safety rails** — `volume × concentration` with string-only validation: negatives, `50000`, and `NaN` all submit; no rounding (2449.9999999999995 stored); no dose confirmation step; batch optional.
- **Protocol-hour integrity** — free-text hour entry + ±1h fuzzy matching silently corrupts the dose-compliance record.
- **Two divergent screening UIs** (`PatientsList` vs `AdminScreeningPanel`) — whether the vet gets an email + audit `reasonForChange` depends on which door the admin used.
- **Qualification-load error drops the vet into the onboarding wizard** — `DashboardPage.tsx:42` skips the error slot; network failure looks like "unqualified".
- **Investor headline stats hardcoded** ("$598.6M", "96.5%") contradicting the data-driven FinancialDashboard — 30-second credibility damage.
- **"Upload Protocol Version" uploads no file** — fabricates a `pdfUrl` that 404s; document control looks broken.
- **No global session-expiry path** — expired JWT lands in the silent catches; biggest "stranded barn vet" vector on long shifts.
- **Focus ring 2.56:1 and destructive 3.6:1** — both fail WCAG; one-token fixes.

---

## 4. Proposed component architecture

Three layers, one direction of data flow. New primitives marked ★.

```
src/
  components/
    ui/                  # primitives (existing 20 + ★ below)
      ★ spinner.tsx / loading-button.tsx
      ★ empty-state.tsx
      ★ query-state.tsx        # loading/error/empty tri-state wrapper
      ★ full-page-loader.tsx
      ★ status-pill.tsx        # semantic success/warning/danger/info
      ★ data-table.tsx         # the PatientsList responsive pattern, systematized
      ★ form-success-screen.tsx
    auth/
      ★ auth-gate.tsx          # single owner of isLoading→role→pending→terms
      ★ auth-card.tsx          # one parameterized login card (vet/admin/consultant)
    clinical/            # form & workflow components (existing, refactored)
    compliance/          # audit, consent, protocol surfaces
    deal/                # investor portal (existing deal-portal/)
  hooks/
    ★ use-trial-mutation.ts    # THE mutation contract (see §5)
    ★ use-screening-action.ts  # one hook for both screening UIs
  lib/
    tokens.css           # brand tokens incl. fixed-contrast palette
    reports/             # jsPDF builders extracted from components
    datetime.ts          # ★ local-time datetime-local helper
    protocol.ts          # ★ single DOSE_SCHEDULE source of truth
```

**Kill list (~3,200 LOC dead weight):** `PatientDetailDialog` (541, zero imports), `TrialOperationsHub` + 7 card children + `useTrialOperations` + `useTreatmentCountdown` (~2,000, localStorage-only "readiness" that must never resurface as truth), dead `src/actions/*.ts` SQL configs that contradict the mock layer, orphaned audit `TabsContent`.

---

## 5. Props / API design (the five contracts that close the most findings)

### 5.1 `useTrialMutation` — eliminates the entire silent-failure class

```ts
type UseTrialMutationOptions<TArgs, TResult> = {
  mutationFn: (args: TArgs) => Promise<TResult>;
  successToast?: string | ((r: TResult) => string);
  errorTitle?: string;                    // inline Alert title, never console-only
  notify?: { email?: boolean; whatsapp?: boolean }; // replaces 4 duplicated send-email blocks
  onSuccess?: (r: TResult) => void;
};
type UseTrialMutationResult<TArgs, TResult> = {
  mutate: (args: TArgs) => Promise<TResult | undefined>; // never throws to caller
  isPending: boolean;
  error: string | null;                   // render in <Alert> — always visible
  reset: () => void;
};
```
Detects JWT/401 → routes to global session-expired toast + login. Every one of findings A1–A6, plus ~15 P1s, closes by migrating call sites to this one hook.

### 5.2 `<QueryState>` — kills the truthiness/blank-card bug class

```ts
type QueryStateProps<T> = {
  data: T[] | null | undefined;
  isLoading: boolean;
  error: Error | null;
  skeleton: ReactNode;                    // layout-matching, never bare "Loading…"
  empty: ReactNode;                       // <EmptyState icon title guidance cta/>
  children: (data: T[]) => ReactNode;     // only called with real, non-empty data
};
```

### 5.3 `<DataTable>` — the proven PatientsList pattern as a primitive

```ts
type Column<T> = {
  key: string; header: ReactNode;
  render: (row: T) => ReactNode;
  hideBelow?: 'sm' | 'md' | 'lg';        // responsive column hiding, declarative
  summaryFor?: string;                    // folds into mobile sub-line (Breed/Age pattern)
};
type DataTableProps<T> = {
  columns: Column<T>[]; rows: T[];
  rowActions?: (row: T) => ReactNode;     // rendered ≥40px, tooltip-labeled
  onRowOpen?: (row: T) => void;
  caption?: string;                       // accessible table caption
};
```

### 5.4 `<AuthGate>` — one routing authority (replaces 5 copy-pasted useEffects)

```ts
type AuthGateProps = {
  require: 'vet' | 'admin' | 'consultant' | 'any';
  requireTerms?: boolean;
  fallback: ReactNode;                    // <FullPageLoader/>, never bare text
  children: ReactNode;
};
```

### 5.5 Brand tokens (WCAG-locked)

```css
:root {
  --brand: 79 39% 33%;        /* #64752f — 4.55:1 vs white, AA pass */
  --brand-foreground: 0 0% 100%;
  --ring: 240 5% 46%;         /* 4.6:1 — WCAG 1.4.11 pass */
  --destructive: 0 72% 51%;   /* #dc2626 — 4.83:1 vs white, AA pass */
}
```
Plus a `tokens.test.ts` asserting ≥4.5:1 text pairs and ≥3:1 ring — the palette is one nudge from compliance; lock it permanently. Replace the global 44px element-selector rule with a `.touch-target` utility / pseudo-element hit areas so Checkbox stops inflating and size variants tell the truth.

---

## 6. Roadmap (impact ÷ effort)

**Phase 0 — Barn-proof the trial core (2–3 days, ~40 findings)**
1. `useTrialMutation` + migrate the 6 P0 silent-failure forms (copy QuickAddNote's pattern).
2. Local-time `datetime-local` helper in all 4 forms.
3. `__manual__` batch fix (separate mode state; block sentinel from submit).
4. FDA export: build from awaited return value, not stale state.
5. Consultant read-only gating (`role === 'admin'` on all write controls).
6. Vet reset → `resetPasswordForEmail`; pending-approval poll → Supabase source.
7. Video Library via `useSecureDownloadUrl`; x-ray persist error surfacing.
8. Brand/ring/destructive token fixes + `text-silver-text` → `text-muted-foreground` (22 spots).

**Phase 1 — Systematize (1 week)**
`<QueryState>`, `<DataTable>`, `<AuthGate>`, `<AuthCard>`, `EmptyState`, `Spinner`/`LoadingButton`, dose-schedule single source, dose-confirmation step in AddTreatmentForm, screening unification, audit CSV export + timezone, kill list executed, console.log/`alert()` purge.

**Phase 2 — Credibility polish (1 week)**
Compliance constants single source (INAD/protocol/sponsor), consent workflow breakup (1,164 LOC) + storage-based signed PDFs, print stylesheet for compliance surfaces, investor KPI consistency hook, offline-first queued submissions for the barn persona, ErrorBoundary per tab, touch-target pass.

---

## 7. Best practices going forward

1. **No mutation without visible feedback.** A catch block that only logs is a bug, by policy; `useTrialMutation` makes the right thing the easy thing.
2. **Regulatory artifacts never depend on render timing.** Exports/PDFs build from freshly awaited values passed as arguments; signed documents live in Storage, never data-URIs in rows.
3. **One source per truth.** Dose schedule, compliance constants, brand color, support email — each defined exactly once, imported everywhere.
4. **Read-only is a separate component, not a ternary.** `ConsultantView` variants make the guarantee reviewable in one place.
5. **Empty/error/loading are designed states.** Every list ships with all three; "blank white card" is a bug.
6. **Dead code doesn't ship.** If a feature isn't wired (NCIE pipeline, trial-ops hub), it's deleted or behind an explicit flag — never visible as FDA-flavored empty UI.
7. **Contrast budget in CI.** `tokens.test.ts` + lint rule banning arbitrary hex in `className` so the 50-site drift can't regress.
