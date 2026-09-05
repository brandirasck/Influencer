# BRANDIRASCK — Netlify only

## Recommended deployment

### 1. Central API + Admin site

Deploy the **repository root** as the Netlify project.

- Publish directory: `.`
- Functions directory: `netlify/functions`
- `netlify.toml` supplies `/api` redirects and scheduled cleanup.
- Set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, and `ALLOWED_ORIGINS`.

This site serves both `/admin/influencers` and `/api`.

### 2. Public site

Deploy `public/` as a separate static Netlify site. It does not need the database environment variables. `public/api-config.js` points to the central API.

If you use a different API domain, update `public/api-config.js`.

## Database

Run `sql/schema.sql` once against PostgreSQL.

## Password

Do not use plaintext Admin passwords. Generate a scrypt hash with:

```bash
npm install
npm run hash-password
```

## Smoke test

- API health → `ok:true`
- Admin login → works
- Generate code → works
- Public correct code → continues
- Wrong code → inline error
- 4th wrong attempt → 1 minute lock
- 5th → 30 minute lock
- 6th → 6 hour lock
- Registration → Admin temporary registration
- PDF → temporary for 30 minutes
- Approval → Public Active Catalog
