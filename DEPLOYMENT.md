# PTP-102 Trial App — Deployment Guide

## Platform: 4EVERLAND (IPFS-based, Decentralized Hosting)

**Live URL:** `https://ptp102-trial-portal-3bccrlcn-drdsp2.ipfs.4everland.app/`

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

## Step 3: Configure Google OAuth

**This is critical.** Google OAuth will reject login requests from unknown domains.

### Go to Google Cloud Console
- Visit [console.cloud.google.com](https://console.cloud.google.com)
- Select the project that owns the OAuth Client ID

### Add Your Domain to Authorized Origins
- Go to **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID and click **Edit**
- Under **Authorized JavaScript origins**, click **Add URI**
- Add your live URL:
  ```
  https://ptp102-trial-portal-3bccrlcn-drdsp2.ipfs.4everland.app
  ```
- Click **Save**

**Note:** If your 4EVERLAND URL changes on redeploy (hash changes), you'll need to update this. Consider using a custom domain to avoid this.

---

## Step 4: Test the Live Site

Open your live URL and verify:

| Test | Expected Result |
|---|---|
| Landing page loads | ✅ Hero section, animated logo visible |
| Vet Login works | ✅ Google OAuth popup opens and succeeds |
| Patient list loads | ✅ Data from UIBakery backend appears |
| Regulatory banner shows | ✅ Amber FDA warning banner at top |
| Dose calculator works | ✅ Calculates infusion rates correctly |

---

## IPFS Considerations

### URL Stability
- The 4EVERLAND URL contains a deployment hash (`3bccrlcn`)
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

## Troubleshooting

### Build Fails on 4EVERLAND
Check that `dist/` is generated locally first:
```bash
npm run build
ls dist/
```

### Google OAuth Error: "redirect_uri_mismatch"
You forgot to add the 4EVERLAND URL to Google Cloud Console. Go back to Step 3.

### URL Changed After Redeploy
This is normal for IPFS hosting. Either:
- Update the URL in Google Cloud Console each time, OR
- Set up a custom domain in 4EVERLAND for a permanent URL

---

## What's Next?

1. **Update Google OAuth** with the live URL (Step 3 above)
2. **Invite veterinarians** — Send them the portal URL
3. **Monitor access** — Check 4EVERLAND analytics for traffic
4. **Backup data** — Your UIBakery database backs up automatically
5. **FDA audit prep** — Export audit logs from the Compliance Dashboard

---

## Need Help?

If anything fails, tell me exactly which step and the error message — I'll fix it immediately.
