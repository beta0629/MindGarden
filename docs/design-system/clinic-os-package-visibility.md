# Clinic-OS Package Visibility (공개 노출)

**Status**: PASS·Ship  
**Admin UI**: `/admin/package-pricing` (list + detail)  
**Public surfaces**: tenant home intro, `/legal/products` (footer link only)

## SSOT

| Item | Rule |
|------|------|
| Flag | `extraData.publicVisible` (boolean) on `CONSULTATION_PACKAGE` common codes |
| Missing / null | Treat as **`true`** (backward compatible — existing packages stay public until turned off) |
| Public filter | `isActive === true` **and** `publicVisible !== false` |
| Orthogonal | `isActive` = ops use; `publicVisible` = PG/homepage disclosure |
| No new Flyway column | JSON in `extraData` only |
| No product CRUD in this PR | Toggle only |

## Admin UI (minimal Clinic-OS)

- **List card**: badge or toggle 「공개 노출」 next to 사용 여부; quick toggle rewrites `extraData` preserving other keys
- **Detail**: `SettingSwitchRow` under 사용 여부 — label 「공개 노출 (홈·/legal/products)」
- Shot ref: `shot-package-visibility-tobe.png` (layout polish backlog if file absent)

## Public

- Home + `/legal/products` + BE HTML: only packages with publicVisible
- Hardcoding forbidden; empty → fail-closed empty state

## Worth (non-blocking)

- Shot pixel polish, English eyebrow, grouping
