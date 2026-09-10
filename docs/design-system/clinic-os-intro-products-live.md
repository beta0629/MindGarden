# Clinic-OS Intro Products — LIVE SSOT

**Status**: PASS·Ship  
**Scope**: Tenant home intro product list + public `/legal/products`

## SSOT (do not hardcode rows)

| Surface | Source |
|---------|--------|
| Home intro product block | Tenant `CONSULTATION_PACKAGE` common codes (active) |
| `/legal/products` | **Same** list / same molecule |
| Admin edit (existing) | `/admin/package-pricing` — **not** in this hotfix |

Runtime API: `GET /api/v1/auth/tenant/by-subdomain` → `consultationPackages: [{ name, description, price }]`.

## LIVE note

MindGarden LIVE has on the order of **~32** active packages (single-session, multi-session, assessments, etc.).  
That count is **observational** — render always from DB/API for the current tenant host. Never paste LIVE rows into FE/BE as literals.

## Layout shot

- Target: `shot-tenant-home-products-tobe.png` (layout reference; quiet Clinic-OS card rows: name · detail · price)
- Worth backlog: English “CONSULTING MENU” eyebrow, grouping — not blocking

## Empty

Fail-closed: empty / inactive → 「미등록 / 확인 필요」 style empty state. No platform fake catalog.
