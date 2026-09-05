# API connection — Netlify-only

The platform uses **one central Netlify API site + one PostgreSQL database**. The `admin/` and `public/` folders are static Netlify frontends and must use the exact same API URL.

## 1. Central Netlify API site

Deploy the repository root to Netlify.

Netlify Functions are located in `netlify/functions/`:

- `netlify/functions/api.js` → central API
- `netlify/functions/cleanup.js` → scheduled cleanup

The API base URL is:

`/api`

Set these environment variables on the **API Netlify site only**:

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `CRON_SECRET` (optional)

Run `sql/schema.sql` in the PostgreSQL database.

## 2. Public Netlify site

Deploy the `public/` folder as its own Netlify site.

In `public/index.html`:

```html
<script>window.BRANDIRASCK_API_URL = '/api';</script>
```

## 3. Admin Netlify site

Deploy the `admin/` folder as its own Netlify site.

In `admin/index.html`, use the **same exact API URL**:

```html
<script>window.BRANDIRASCK_API_URL = '/api';</script>
```

Do not use `/api` on the separate Admin/Public sites because that would target the current Netlify site's origin instead of the central API site.

## 4. Health check

Open:

`/api?action=health`

Expected JSON starts with:

```json
{"ok":true,"service":"brandirasck-influencers-api"}
```

## 5. End-to-end

Admin → Generate Code → Public Verify → Registration → Review → Contract Acceptance → Temporary PDF → Admin Review → Approve → Public Catalog.
