# Staging deploy (`staging.m-garden.co.kr`)

Worker: `mindgarden-homepage-staging` · Wrangler env: `staging`  
This document is for a person with Cloudflare access. **Do not** use these steps for production (`m-garden.co.kr`).

## One-time Cloudflare setup

1. Log in: `npx wrangler login` (account that owns `m-garden.co.kr`).
2. Confirm the zone for `m-garden.co.kr` is in that account (needed for `custom_domain` on `staging.m-garden.co.kr`).
3. Optional check: `npx wrangler whoami`

No extra Workers secrets are required for the public homepage path used today. Clinic-OS Turnstile **secret** verification stays on Clinic-OS, not this worker.

## Build-time / runtime vars (staging)

These are set automatically by `npm run deploy:staging` for the build, and mirrored in `wrangler.toml` → `[env.staging.vars]` for the worker:

| Name | Staging value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://staging.m-garden.co.kr` |
| `NEXT_PUBLIC_SITE_INDEXABLE` | `false` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAAF8rDKpWUewMGRcN` |
| `CLINIC_OS_API_BASE_URL` | `https://mindgarden.dev.core-solution.co.kr` |
| `CLINIC_OS_TENANT_SLUG` | `mindgarden` |

`NEXT_PUBLIC_*` must be present at **build** time (inlined by Next). Staging builds also emit `X-Robots-Tag: noindex, nofollow` via `next.config.ts` when `NEXT_PUBLIC_SITE_INDEXABLE` is not `true`.

Legacy `/api/consultation` (MySQL / SMTP) is unused for the Clinic-OS inquiry path. If you still need it on staging, set those as Wrangler secrets yourself — they are not part of the default staging deploy.

## Deploy commands

From the repo root on branch you want staged:

```bash
npm ci
npm run deploy:staging
```

Equivalent expanded form:

```bash
export NEXT_PUBLIC_SITE_URL=https://staging.m-garden.co.kr
export NEXT_PUBLIC_SITE_INDEXABLE=false
export NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAF8rDKpWUewMGRcN
export CLINIC_OS_API_BASE_URL=https://mindgarden.dev.core-solution.co.kr
export CLINIC_OS_TENANT_SLUG=mindgarden

npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy --env staging
```

Wrangler config: `[env.staging]` in `wrangler.toml` (`name = "mindgarden-homepage-staging"`, custom domain `staging.m-garden.co.kr`).

## After deploy — smoke checks

```bash
curl -sI https://staging.m-garden.co.kr/ | tr -d '\r' | grep -iE 'HTTP/|x-robots-tag|cf-ray'
curl -s https://staging.m-garden.co.kr/robots.txt | head
```

Expect `X-Robots-Tag: noindex, nofollow` and robots disallow-all while indexable is false.

## Do not

- Run `deploy --env production` or change `[env.production]` as part of staging work.
- Set `NEXT_PUBLIC_SITE_INDEXABLE=true` on staging.
- Point production DNS or the production worker at this staging worker.
