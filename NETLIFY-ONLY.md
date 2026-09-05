# BRANDIRASCK — Netlify only

You can run Admin and Public as two Netlify sites from the same GitHub repository. Both sites must use the same PostgreSQL database and include the same Netlify Function API. No Vercel is required.

## Admin Netlify site
- Repository: this repository root
- Publish directory: `admin`
- Functions directory: `netlify/functions`
- Environment variables: `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`

## Public Netlify site
- Repository: this repository root
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Environment variables: `DATABASE_URL`

Both frontends call `/api`, and Netlify redirects `/api` to the local function. Therefore Admin and Public can remain on separate Netlify domains while sharing one PostgreSQL database.

## Database
Run `sql/schema.sql` once against PostgreSQL.

## Test
1. Open `https://YOUR-ADMIN.netlify.app/api?action=health` and confirm `ok:true`.
2. Login Admin and generate a code.
3. Open Public and enter that exact code.
4. A wrong code is shown inline under the field in red; there are no browser alert popups for code validation.
5. Wrong attempts are tracked server-side per device cookie: 4th wrong attempt → 1 minute lock; 5th → 30 minutes; 6th and later → 6 hours.
6. Correct validation resets the failed-attempt counter.
