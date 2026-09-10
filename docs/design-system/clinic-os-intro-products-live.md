# Clinic-OS Intro Products — LIVE SSOT

**Status**: PASS·Ship  
**Scope**: Tenant home intro product list + public `/legal/products`

## SSOT (do not hardcode rows)

| Surface | Source |
|---------|--------|
| Home intro product block | Tenant `CONSULTATION_PACKAGE` — **active + `extraData.publicVisible !== false` only** |
| `/legal/products` | **Same** filtered list / same molecule |
| Admin visibility | `/admin/package-pricing` 「공개 노출」 toggle — see `clinic-os-package-visibility.md` |
| Admin product CRUD | **Backlog** — not this hotfix |

Runtime API: `GET /api/v1/auth/tenant/by-subdomain` → `consultationPackages` (already filtered server-side).

## LIVE note

MindGarden LIVE has on the order of **~32** active packages. That count is **observational only**.  
**Never** hardcode or force-expose all 32 on public surfaces. Public home / `/legal/products` / footer crawl show **opted-in (`publicVisible`) packages only**.

## Layout shot

- Target: `shot-tenant-home-products-tobe.png` (layout reference; quiet Clinic-OS card rows: name · detail · price)
- Worth backlog: English “CONSULTING MENU” eyebrow, grouping — not blocking

## Empty

Fail-closed: empty / inactive → 「미등록 / 확인 필요」 style empty state. No platform fake catalog.
