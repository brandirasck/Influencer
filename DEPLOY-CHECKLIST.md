# Netlify deployment checklist

## Important
Do NOT deploy only the `admin/` or `public/` folder as the Netlify project root if you want the shared Function to be available. Point both Netlify sites to the GitHub repository root.

### Admin site
Build settings:
- Base directory: leave empty
- Publish directory: `admin`
- Functions directory: `netlify/functions`

### Public site
Build settings:
- Base directory: leave empty
- Publish directory: `public`
- Functions directory: `netlify/functions`

### Environment variables
Both sites that execute the API function must have:
- `DATABASE_URL` = same PostgreSQL connection string

Admin additionally needs:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH` (preferred)
- `SESSION_SECRET`

### Database
Run `sql/schema.sql` once. It creates `registration_codes`, `temporary_registrations`, `catalog_influencers`, admin sessions, and the server-side code-attempt lock table.

### Smoke test
- `/api?action=health` → `ok:true`
- Admin login → works
- Generate code → works
- Public correct code → continues
- Public wrong code → red inline error under code field
- 4 wrong attempts → 1 minute lock
- 5th wrong attempt after unlock → 30 minute lock
- 6th wrong attempt after unlock → 6 hour lock
- Registration → Admin Temporary Registrations
- PDF → available for 30 minutes
- Admin approval → Catalog
