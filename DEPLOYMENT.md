# PTP-102 Trial App — Deployment Guide

## Platform: 4EVERLAND (IPFS-based, Decentralized Hosting)

**Live URL:** `https://ptp102-trial-portal-jqnya0na-drdsp2.ipfs.4everland.app/`

---

## What is 4EVERLAND?

4EVERLAND deploys your app to IPFS (InterPlanetary File System) with a traditional HTTP gateway. This means:
- Your app is hosted on a decentralized network
- It gets a global CDN automatically
- The URL structure is: `https://<project>-<hash>.ipfs.4everland.app/`

---

## Build & Deploy Steps

### Step 1: Build Locally

```bash
npm install
npm run build
```

Verify `dist/` exists at project root with:
- `index.html`
- `assets/` folder (JS/CSS bundles)

### Step 2: Deploy to 4EVERLAND

1. Go to [4everland.org](https://4everland.org) and log in
2. Click **Hosting** → **New Project**
3. Select **Deploy from GitHub**
4. Choose the `ptp102-trial-portal` repository
5. Build settings:
   - **Build command:** `npm install && npm run build`
   - **Output directory:** `dist`
   - **Root directory:** *(leave empty)*
6. Click **Deploy**

4EVERLAND will build and deploy automatically. Each new push to `main` triggers a redeploy.

---

## Step 3: Test the Live Site

Open your live URL and verify:

| Test | Expected Result |
|---|---|
| Landing page loads | ✅ Hero section, animated logo visible |
| Vet registration works | ✅ Form submits, account pending approval |
| Admin login works | ✅ `drdsp@pm.me` / `PTP102` |
| Patient list loads | ✅ Data from localStorage appears |
| Regulatory banner shows | ✅ Amber FDA warning banner at top |
| Dose calculator works | ✅ Calculates infusion rates correctly |

---

## Authentication

### Admin Login
- **Email:** `drdsp@pm.me`
- **Password:** `PTP102`

### Vet Login
Vets must:
1. Register via **New Registration** on the Vet Login page
2. Accept all Terms & Conditions (digital signature recorded)
3. Wait for admin approval in the **Veterinarians** tab
4. Log in with email + password after approval

**No Google Auth** — The app uses email/password authentication only. Vet T&C acceptance is recorded for compliance and can be exported as a PDF report.

---

## IPFS Considerations

### URL Stability
- The 4EVERLAND URL contains a deployment hash
- On each redeploy, this hash may change
- For a stable URL, configure a **custom domain** in 4EVERLAND settings

### SPA Routing
- 4EVERLAND automatically serves `index.html` for unknown paths (SPA-friendly)
- The `_redirects` file is Cloudflare-specific and has no effect here
- No additional routing config needed

### Security Headers
- The `_headers` file is Cloudflare-specific and has no effect on 4EVERLAND
- Security headers must be configured in 4EVERLAND dashboard if needed

---

## Data Persistence

**Important:** The app uses `localStorage` for data persistence on 4EVERLAND because the UIBakery backend runtime is not available outside the UIBakery platform.

- Data is stored per-browser
- Clearing browser data will erase all records
- For multi-user sync, a real backend API (e.g., Supabase) would be required

---

## Troubleshooting

### Build Fails on 4EVERLAND
Check that `dist/` is generated locally first:
```bash
npm run build
ls dist/
```

### URL Changed After Redeploy
This is normal for IPFS hosting. Either:
- Use the new URL from 4EVERLAND dashboard, OR
- Set up a custom domain in 4EVERLAND for a permanent URL

### Data Disappeared After Refresh
Data is stored in browser `localStorage`. If you:
- Switched browsers → Data won't carry over
- Cleared cookies/storage → Data is erased
- Used incognito mode → Data won't persist

---

## What's Next?

1. **Invite veterinarians** — Send them the portal URL
2. **Monitor access** — Check 4EVERLAND analytics for traffic
3. **FDA audit prep** — Export audit logs from the Compliance Dashboard
4. **Custom domain** — Configure in 4EVERLAND for a stable URL

---

## Need Help?

If anything fails, tell me exactly which step and the error message — I'll fix it immediately.
