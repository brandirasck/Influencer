# BRANDIRASCK — API connection

## Architecture

Use **one central Netlify site** for the API and PostgreSQL, plus static Admin/Public frontends.

### Central API / Admin

Repository root deployment:

- Publish directory: `.`
- Functions directory: `netlify/functions`
- API: `/api`
- Scheduled cleanup: `netlify/functions/cleanup.js`

### Public

Static frontend only. `public/api-config.js` points to the central API URL.

### Admin

The Admin frontend is also included in the central API deployment and `admin/api-config.js` points to the same central API.

## Environment variables

Set on the central API Netlify site:

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `ALLOWED_ORIGINS` (recommended)

Run `npm run hash-password` locally to generate the Admin password hash.

## Database

Run `sql/schema.sql` once.

## Test

1. `/api?action=health` returns `ok:true`.
2. Admin login works.
3. Generate a code.
4. Public validates the code.
5. Complete registration and accept the contract.
6. PDF is uploaded temporarily.
7. Admin approves.
8. Profile appears in Public Catalog.
