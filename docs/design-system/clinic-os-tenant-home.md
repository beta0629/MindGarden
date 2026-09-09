# Clinic-OS Tenant Branding Home v3

**Status**: PASS·Ship  
**Scope**: Tenant host root lobby — counseling-center shared home, not platform marketing.

Host examples (SSOT `extractTenantSubdomainFromHostname` / `getTenantSubdomainFromHost`):

- Tenant lobby: `mindgarden.dev.core-solution.co.kr`, `mindgarden.core-solution.co.kr`, `mindgarden.staging.core-solution.co.kr`
- Platform apex (marketing): `dev.core-solution.co.kr`, `www.core-solution.co.kr`, `core-solution.co.kr`
- Not tenant lobby: `apply.e-trinity.co.kr`, `dev.e-trinity.co.kr` (apply/ops/trinity only)

## Ship checklist

| # | Item | Notes |
|---|------|--------|
| 1 | Mini chrome | `{센터명}` + host monospace + ghost `로그인` |
| 2 | Quiet hero | eyebrow `심리상담센터`, H1 DB center name + `천천히, 안전하게.`, lead, CTA `로그인` + text `상담 안내` |
| 3 | Soft wash slot | Decorative `#counseling-guide` under hero |
| 4 | Policy legal footer | Tenant DB merchant-legal fields; placeholders only when empty; no MindGarden literals |
| 5 | Host gate | `getTenantSubdomainFromHost()` → `TenantHomeLobby`; apex keeps platform landing |
| 6 | `--brand` accent | From tenant `primaryColor` when present |
| 7 | Motion | Enter/scroll/hover only; `prefers-reduced-motion` respected |
| 8 | Ban | No SaaS hero+3 cards+stats; no platform CTAs (`시작하기`, `센터 도입 문의`); no theme picker |

## Worth

- Soft wash polish + hover
- **상담 안내 destination**: in-page scroll to `#counseling-guide` (soft slot). Legal detail links remain in footer (`환불·취소·청약철회` / `상품·가격 안내`)
- Hero copy uses DB center name via `GET /api/v1/auth/tenant/by-subdomain` (+ `merchantLegal`, optional `primaryColor`)

## Out of scope / Backlog

- Theme catalog / onboarding `themeId` picker
- Full merchant legal onboarding+validation critic PASS (joined via merchant-legal ship in same PR)

## Implementation map

- `frontend/src/components/homepage/TenantHomeLobby.js` + `.css`
- Gate: `frontend/src/components/homepage/Homepage.js`
- Public meta: `frontend/src/utils/tenantPublicHomeMeta.js`
- Footer molecule: `frontend/src/components/tenant/MerchantLegalFooterPreview.js`
