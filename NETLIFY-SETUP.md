# BRANDIRASCK — final setup

This package fixes the application-side deployment and security issues found in the supplied project. One manual step is intentionally required: the production PostgreSQL URL and Admin secrets cannot be embedded in a ZIP or Git repository.

## 1. Central API + Admin Netlify site

Deploy the repository root. Keep:

- Publish directory: `.`
- Functions directory: `netlify/functions`

The Admin URL used by the packaged frontends is:

`https://brandirascK-admin.netlify.app`

If your final Netlify domain is different, edit `admin/api-config.js` and `public/api-config.js`.

## 2. Environment variables

In the central API/Admin Netlify site add:

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `ALLOWED_ORIGINS` (recommended)

Example:

`ALLOWED_ORIGINS=https://brandirascK-admin.netlify.app,https://beautiful-croquembouche-528a2e.netlify.app`

Never commit the real values.

## 3. Generate the Admin password hash

On a local machine with Node.js 18+:

```bash
npm install
npm run hash-password
```

Enter a strong password of at least 12 characters and copy the generated `scrypt$...` value to `ADMIN_PASSWORD_HASH`.

## 4. Database

Run `sql/schema.sql` once on the production PostgreSQL database.

## 5. Public Netlify site

Deploy the `public/` directory as a separate static site. It does **not** need `DATABASE_URL` because it calls the central API.

The packaged `public/api-config.js` already points to the current central API domain.

## 6. Verification

1. Open `https://brandirascK-admin.netlify.app/api?action=health`.
2. Confirm `ok:true`.
3. Open `/admin/influencers`.
4. Log in.
5. Generate a code.
6. Open the Public site and validate the code.
7. Complete registration and contract acceptance.
8. Confirm the temporary PDF appears in Admin.
9. Approve the registration.
10. Confirm the profile appears in the Public Catalog.

## What was fixed in the code

- Removed the insecure Admin password SHA-256 comparison/plaintext fallback.
- Added Node.js `scrypt` password hashing and verification.
- Added `SESSION_SECRET`-based HMAC storage for Admin session tokens.
- Added security response headers and configurable CORS origins.
- Centralized the API URL so Public and Admin can use one API deployment.
- Added the server acceptance timestamp to the generated contract before PDF creation.
- Added a password-hash generator command.
- Updated deployment documentation so it matches the central-API architecture.
