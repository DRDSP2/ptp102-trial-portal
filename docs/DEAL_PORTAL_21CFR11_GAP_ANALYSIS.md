# Deal Portal — 21 CFR Part 11 Gap Analysis

## Scope
This document records the current compliance posture of the PTP-102 Deal Portal against 21 CFR Part 11 (Electronic Records; Electronic Signatures) requirements.

## Implemented Controls

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Closed system controls (11.10(a)) | Partial | AuthContext enforces authenticated access; RLS restricts data by user/role. |
| Audit trails (11.10(b), 11.10(e)) | Partial | `deal_access_logs` captures view/download/share/edit/propose_term_sheet actions per user. |
| Operational checks (11.10(f)) | Partial | Tiered access via `has_deal_access()` and `ProtectedDealRoute`. |
| Authority checks (11.10(g)) | Partial | Role checks for investor/licensee/admin via `deal_profiles` and `admin_users`. |
| Device checks (11.10(h)) | Not implemented | Device/location binding not enforced. |
| Education/training (11.10(i)) | Not implemented | No training attestation workflow in app. |
| Electronic signatures (11.50, 11.70, 11.200) | Partial | NDA signing records name/timestamp; no independent e-sig provider (DocuSign/OpenSign stubbed). |
| Signature manifestation (11.50(a)) | Partial | NDASigningPage displays signer name and timestamp. |
| Signature linking (11.50(b)) | Partial | `ndas.user_id` links signature to authenticated user. |
| Unique signatures (11.200(a)) | Partial | Supabase auth guarantees unique identity; NDA signature is tied to that identity. |
| Biometrics (11.200(b)) | Not applicable | Not used. |
| Controls for closed systems (11.10) | Partial | See above; full validation documentation pending. |

## Gaps
1. **Device binding**: no check that the device is authorised or known.
2. **Training attestation**: no evidence that users completed 21 CFR Part 11 training.
3. **Independent e-signature provider**: currently stores a typed name; DocuSign/OpenSign integration is stubbed.
4. **Audit immutability**: `deal_access_logs` allows admin inserts; append-only enforcement recommended.
5. **Electronic record retention**: rely on Supabase backup/retention; explicit policy not coded.
6. **Periodic access review**: no automated reviewer reassignment.

## Recommendations
- Integrate DocuSign or OpenSign for legally binding NDA signatures before commercial use.
- Make `deal_access_logs` insert-only for non-admin users and immutable for admins.
- Add a training attestation step before deal-room access.
- Document SOPs for user access provisioning, de-provisioning, and periodic review.
