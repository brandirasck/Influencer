# Netlify-only deployment checklist

## API Netlify site
- Deploy repository root.
- Confirm Netlify Functions are enabled.
- Set `DATABASE_URL`.
- Set `ADMIN_USERNAME`.
- Set `ADMIN_PASSWORD_HASH`.
- Set `SESSION_SECRET`.
- Optionally set `CRON_SECRET`.
- Run `sql/schema.sql` in PostgreSQL.
- Test `/.netlify/functions/api?action=health`.

## Public Netlify site
- Deploy `public/`.
- Use the built-in `/api` route in `public/index.html`.
  `/api`
- Redeploy.

## Admin Netlify site
- Deploy `admin/`.
- Use the same built-in `/api` route in `admin/index.html`.
- Redeploy.

## End-to-end test
- Admin login works.
- Generate code works.
- Public validates the generated code.
- Reusing the same code fails.
- Registration reaches Admin as `PENDING_REVIEW`.
- Contract acceptance is recorded.
- PDF is stored temporarily.
- Admin can view PDF.
- Admin approval creates an `ACTIVE` catalog profile.
- Public Catalog displays only `ACTIVE` profiles.
- Scheduled cleanup removes expired temporary records/codes.
