# BRANDIRASCK Influencers — Standalone

Standalone Vercel project for `/influencers` and `/admin/influencers`. It has no runtime dependency on the existing BRANDIRASCK website.

## Production setup
1. Create a PostgreSQL database.
2. Run `sql/schema.sql`.
3. Set environment variables from `.env.example`.
4. Install dependencies and deploy to Vercel.
5. The domain/routing step is intentionally separate and should be done only after this standalone project is verified.

## Data retention model
- Registration code: 30 minutes and one-time use.
- Unapproved registration + PDF: temporary, maximum 30 minutes.
- Vercel cron calls `/api/cleanup` every 5 minutes to delete expired temporary records and expired codes.
- Only approved public catalog data is persisted in `catalog_influencers`.

## Contract
The current browser contract screen is a technical placeholder for the final legal text. Replace it with the supplied BRANDIRASCK contract before production signing.

## Important
The current PDF is a temporary technical PDF generator used to validate the workflow. It must be replaced with the final branded PDF layout once the actual contract and logo assets are supplied/approved.


## Agreement V1
The onboarding contract now includes: independent work outside BRANDIRASCK, 15% agency commission for agency-assigned services, platform-specific follower pricing, 4 Stories obligations, Reel one-month retention, Collab Reel two-month retention and ad rights, publishing schedule compliance, content rights, follower verification, Catalog usage, Promo Code 10% reward (excluding Influencer Collaboration), confidentiality, payment, cancellation/termination, suspension, digital acceptance, and server timestamps. Replace only if a later signed legal contract supersedes this version.
