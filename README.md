# BRANDIRASCK Influencers — Netlify-only

Standalone Influencers platform. **No Vercel dependency.**

## Architecture

- `public/` → Public Influencer site (Netlify)
- `admin/` → Admin site (Netlify)
- `netlify/functions/api.js` → Central API (Netlify Functions)
- `netlify/functions/cleanup.js` → Scheduled cleanup (Netlify Scheduled Function)
- `sql/schema.sql` → PostgreSQL schema

The Admin and Public sites must point to the same deployed Netlify API site's function URL:

`/api`

## Environment variables (API Netlify site only)

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_PASSWORD` (optional fallback; prefer hash)
- `SESSION_SECRET` (reserved for session hardening)
- `CRON_SECRET` (optional; scheduled function is already private to Netlify)

Never put database credentials in `public/` or `admin/`.

## Database

Run `sql/schema.sql` against PostgreSQL before using the API.

## Workflow

Admin generates code → Influencer verifies code → registration → review → digital contract acceptance → temporary PDF upload → Admin review/approval → public ACTIVE catalog.

## Netlify deployment

### 1) API site
Deploy the repository root as a Netlify site. Netlify will use `netlify.toml` and deploy `netlify/functions/api.js` plus the scheduled cleanup function.

Set the environment variables above in the API site's Netlify environment settings.

### 2) Public site
Deploy the `public/` folder as a separate Netlify site. In `public/index.html`, replace the placeholder API URL with the API site's URL.

### 3) Admin site
Deploy the `admin/` folder as a separate Netlify site. In `admin/index.html`, replace the placeholder API URL with the same API site's URL.

### 4) Test
1. Open `/api?action=health`.
2. Admin login.
3. Generate a code.
4. Verify it from Public.
5. Complete registration and accept the contract.
6. Upload/store the temporary PDF.
7. Approve from Admin.
8. Confirm the profile appears in Public Catalog.

The contract and PDF content should still be reviewed/approved as final business/legal content before production use.
