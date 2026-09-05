# BRANDIRASCK — Netlify-only deployment

This project uses **one Netlify site** for the Public portal, Admin portal, and Netlify Functions API. There is no Vercel dependency and no separate API site is required.

## Routes
- Public: `/influencers`
- Admin: `/admin/influencers`
- API: `/api`
- Function: `/.netlify/functions/api`

Both frontends call `/api`, so they always reach the same Netlify Function and the same PostgreSQL database.

## Netlify settings
Deploy the repository root. Do not set `admin/` or `public/` as the Netlify base directory. The included `netlify.toml` sets the publish directory to `.` and functions directory to `netlify/functions`.

## Environment variables
Set these in the Netlify site: `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`. Keep secrets server-side.

## Database
Run `sql/schema.sql` once against the PostgreSQL database.

## Smoke test
1. Open `/api?action=health`; it should return JSON with `ok: true`.
2. Open `/admin/influencers`, login, and generate a code.
3. Open `/influencers`, enter the generated code, and continue.
4. Complete Review → Contract → Confirm → PDF.
5. In Admin, verify the registration appears under Temporary Registrations.
6. Approve it.
7. Open `/influencers` and verify the approved profile appears in Catalog.
