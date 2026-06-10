# PTP-102 Trial App — Deployment Guide

## Platform: Cloudflare Pages (Free, Secure, Unlimited Bandwidth)

---

## Step 1: Push Code to GitHub

### 1.1 Create a GitHub Repository
- Go to [github.com/new](https://github.com/new)
- Name it: `ptp102-trial-portal`
- Make it **Private** (this contains clinical trial code)
- Do NOT initialize with README (we already have files)

### 1.2 Push Your Code

Open terminal in your project folder and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "PTP-102 trial portal - ready for deployment"

# Connect to GitHub (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ptp102-trial-portal.git

# Push to main branch
git push -u origin main
```

**Verify:** Go to `https://github.com/YOUR_USERNAME/ptp102-trial-portal` — you should see all your files.

---

## Step 2: Connect to Cloudflare Pages

### 2.1 Sign Up / Log In
- Go to [dash.cloudflare.com](https://dash.cloudflare.com)
- Sign up (free) or log in
- If you don't have a domain with Cloudflare, that's fine — Pages works with any domain later

### 2.2 Create a New Pages Project
- In the Cloudflare dashboard, click **Pages** in the left sidebar
- Click **Create a project**
- Select **Connect to Git**
- Authorize Cloudflare to access your GitHub account
- Select the `ptp102-trial-portal` repository
- Click **Begin setup**

### 2.3 Configure Build Settings

Fill in these exact values:

| Setting | Value |
|---|---|
| **Project name** | `ptp102-trial-portal` |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | `cd src && npm install && npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | *(leave empty)* |

Click **Save and Deploy**

### 2.4 Wait for First Build
- Cloudflare will build your app (takes 1–2 minutes)
- You'll get a temporary URL like: `https://ptp102-trial-portal.pages.dev`

**Do NOT share this URL yet** — we need to add your domain first.

---

## Step 3: Add Your Custom Domain

### 3.1 Add Domain to Cloudflare Pages
- In your Pages project, go to **Custom domains**
- Click **Set up a custom domain**
- Enter: `trial.byrocktechnologies.com` *(or your preferred subdomain)*
- Click **Continue**

### 3.2 Add DNS Record
- Cloudflare will show you a DNS record to add (usually a CNAME)
- If your domain is already on Cloudflare: click **Activate domain** (Cloudflare handles it automatically)
- If your domain is elsewhere: Log into your domain registrar and add the CNAME record shown

### 3.3 Wait for SSL
- Cloudflare will automatically issue an SSL certificate
- This takes 1–5 minutes
- Status will show **Active** when ready

---

## Step 4: Configure Google OAuth for Your Domain

**This is critical.** Google OAuth will reject login requests from unknown domains.

### 4.1 Go to Google Cloud Console
- Visit [console.cloud.google.com](https://console.cloud.google.com)
- Select the project that owns the OAuth Client ID: `632400607726-b997todqjmo3083mm5a1rjv7hnkdrae2`

### 4.2 Add Your Domain to Authorized Origins
- Go to **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID and click **Edit**
- Under **Authorized JavaScript origins**, click **Add URI**
- Add: `https://trial.byrocktechnologies.com`
- *(Also add the Cloudflare Pages URL temporarily: `https://ptp102-trial-portal.pages.dev`)*
- Click **Save**

### 4.3 Add Redirect URIs
- Under **Authorized redirect URIs**, add:
  - `https://trial.byrocktechnologies.com`
- Click **Save**

**Note:** Changes take 5–10 minutes to propagate.

---

## Step 5: Enable Security Protection

### 5.1 Password-Protect the Site (Recommended for Trial Phase)
- In Cloudflare dashboard, go to your Pages project
- Click **Settings** → **General**
- Scroll to **Access policy**
- Enable **Password protection**
- Set a password (share with approved veterinarians only)

### 5.2 Enable Additional Security Headers
These are already configured in `vercel.json` — Cloudflare will apply them automatically.

---

## Step 6: Test Everything

### 6.1 Open Your Live URL
Go to: `https://trial.byrocktechnologies.com`

### 6.2 Test These Flows
| Test | Expected Result |
|---|---|
| Landing page loads | ✅ Hero section, animated logo visible |
| Vet Login works | ✅ Google OAuth popup opens and succeeds |
| Patient list loads | ✅ Data from UIBakery backend appears |
| Regulatory banner shows | ✅ Amber FDA warning banner at top |
| AE Report button visible | ✅ Red floating button on vet screens |
| Dose calculator works | ✅ Calculates infusion rates correctly |

### 6.3 Test on Mobile
- Open the URL on your phone
- Verify layout is responsive

---

## Step 7: Optional — Connect Your ByRock Domain

If you want the portal linked from your main WordPress site:

### 7.1 Add a Login Button in WordPress
- Log into your WordPress admin
- Add a menu item or button: **"Veterinarian Portal"**
- Link to: `https://trial.byrocktechnologies.com`

### 7.2 Make It Stand Out
Use a button style like:
```
🔗 Veterinarian Portal →
Background: #6b7f3a (ByRock green)
Text: White
Opens in new tab
```

---

## Troubleshooting

### Build Fails on Cloudflare
**Check:** Does `dist/` folder exist after local build?
```bash
cd src
npm run build
ls ../dist/
```
If empty, check the build output for errors.

### Google OAuth Error: "redirect_uri_mismatch"
**Fix:** You forgot Step 4. Go back to Google Cloud Console and add your exact domain.

### Page Shows 404 on Refresh
**Fix:** SPA routing is handled by Cloudflare Pages automatically — but if you see issues, the `vercel.json` file in the repo should handle it.

### Styles Look Broken (No Tailwind)
**Fix:** This is a known Tailwind content warning. The CSS builds fine despite the warning. If styles are actually missing, check that `dist/assets/index-*.css` is generated and loaded.

---

## What's Next After Deployment?

1. **Invite veterinarians** — Send them the portal URL + password
2. **Monitor access** — Check Cloudflare analytics for traffic
3. **Backup data** — Your UIBakery database backs up automatically
4. **FDA audit prep** — Export audit logs from the Compliance Dashboard

---

## Need Help?

If anything fails at any step, tell me exactly which step and the error message — I'll fix it immediately.
