# Clinic-OS Package Page Width (`/admin/package-pricing`)

**Status**: SSOT  
**Scope**: content shell width only — not toggle UX, not `publicVisible`  
**Route**: `/admin/package-pricing` (list + detail)

## SSOT purpose

`/admin/package-pricing` **content width** must equal **Admin Dashboard V2** content shell width: the same effective max-width behavior and horizontal stage margins. **Do not invent a new page-level max-width.**

| Item | Rule |
|------|------|
| Target | Admin Dashboard V2 content stage width |
| Max-width | Inherit dashboard unlock — **no new numeric max-width** |
| Horizontal gutters | Same as dashboard stage (layout main + `ContentArea` padding) |
| Page shell | Full stage width |

## Reference

- **Shell**: `AdminDashboardV2` + `AdminCommonLayout` (`.mg-v2-ad-dashboard-v2`)
- **Unlock** (dashboard):

```css
.mg-v2-ad-dashboard-v2 .mg-v2-ad-b0kla__container {
  max-width: none;
  width: 100%;
}
```

- **Twins** (same `max-width: none; width: 100%` pattern): ClientManagement, Mapping Clinic-OS (`ContentArea` page class, no outer `--mg-container-max` column)

## Forbidden

- `--mg-container-max` (or any page-level container-max) that insets the list from the LNB with large gray gutters
- Centered narrow column for the page shell
- Any new invented max-width number for the page shell
- A constrained wrapper around the **entire list** that reads as a narrow white column

## Allowed narrow elements

- **Form controls only** (e.g. builder-select `max-width: 300px`)
- Individual package cards (grid items) may keep card chrome
- Detail **form** cards (`mg-v2-ad-b0kla__card` / form-card) stay — intentional form surfaces
- The **page shell** itself remains full stage width

## List wrapper

- **Forbidden**: outer constrained wrapper (e.g. list-wide `section.mg-v2-ad-b0kla__card`) that cages the whole list into a narrow white column
- **Allowed**: individual `mg-v2-package-pricing-card` items
- Title + content sit on the **dashboard stage at full width**

## Toggle UX (out of scope)

In-place row toggle only, no blink/full-page loading — tracked separately (PR #968). **This document covers width only.**

## Implementation checklist

- [ ] No outer `mg-v2-ad-b0kla__container` inviting base container-max on list/detail
- [ ] Page class on `ContentArea`: `mg-v2-package-pricing` + `mg-v2-package-pricing--clinic-os` (or equivalent)
- [ ] Shell CSS: `max-width: none; width: 100%` — no `padding: 0` override that fights dashboard `ContentArea` gutters
- [ ] List: no outer narrow white `mg-v2-ad-b0kla__card` around the whole list; section title + `mg-v2-package-pricing-cards-grid` on stage
- [ ] Detail: form cards kept; shell full width
- [ ] Selector/markup match dashboard stage width (same horizontal stage as Admin Dashboard V2)
- [ ] No dead compound unlock selectors after markup changes
