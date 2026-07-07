# SCREEN SPEC: Admin Dark Mode C-3 (Global Cascade)

## 1. Overview
- **Phase**: C-3 (Global Cascade - Modal, Filter Toolbar, Table, Form)
- **Target**: UnifiedModal, ErpFilterToolbar, SavedViewChip, B0KlA Tables, B0KlA Forms (and legacy form controls mapped to dark)
- **Goal**: Extend the dark mode cascade seamlessly to all major interactive regions inside the Admin dashboard without breaking light mode. Ensure identical information density, usability, and consistent layout.

## 2. Token SSOT (`[data-theme="dark"]` Cascade)

All tokens must be defined strictly under the `[data-theme="dark"]` selector in `frontend/src/styles/unified-design-tokens.css` or `frontend/src/styles/dashboard-tokens-extension.css` to prevent Light Mode regressions.

### 2.1 Modal (`UnifiedModal` & SidePeek)
- **Overlay**: `--ad-b0kla-overlay-bg: rgba(0, 0, 0, 0.7);`
- **Panel/Body**: `--mg-color-surface-main: #1F2937;` (or `--mg-dark-content-bg`)
- **Header/Footer**: `--mg-color-surface-raised: #374151;`
- **Border**: `--mg-color-border-subtle: #4B5563;`
- **Text**: `--mg-color-text-primary: #F3F4F6;`

### 2.2 Filter Toolbar (`ErpFilterToolbar`, `SavedViewChip`, `MappingFilterSection`)
- **Toolbar Background**: `--mg-dark-toolbar-bg: #1F2937;`
- **Toolbar Border**: `--mg-dark-toolbar-border: #374151;`
- **SavedView Chip Default**: `--mg-dark-chip-bg: #374151;` / `--mg-dark-chip-text: #D1D5DB;`
- **SavedView Chip Active**: `--mg-dark-chip-active-bg: #3D5246;` / `--mg-dark-chip-active-text: #E5E7EB;`
- **Filter Inputs**: `--mg-v2-form-input-bg: #374151;`

### 2.3 Table (`B0KlA Table`)
- **Header Background**: `--ad-b0kla-table-header-bg: #374151;`
- **Header Text**: `--ad-b0kla-table-header-text: #D1D5DB;`
- **Row Background**: `--ad-b0kla-table-row-bg: transparent;`
- **Row Hover**: `--ad-b0kla-table-row-hover: #4B5563;`
- **Row Selected**: `--ad-b0kla-table-row-selected: rgba(61, 82, 70, 0.4);`
- **Border**: `--ad-b0kla-table-border: #4B5563;`

### 2.4 Form Controls (Inputs, Selects, Radios, Checkboxes)
- **Input Background**: `--mg-v2-form-bg: #374151;`
- **Input Border**: `--mg-v2-form-border: #4B5563;`
- **Input Text**: `--mg-v2-form-text: #F3F4F6;`
- **Input Focus**: `--mg-v2-form-focus-ring: rgba(61, 82, 70, 0.5);`
- **Label**: `--mg-v2-form-label: #9CA3AF;`
- **Error Text**: `--mg-v2-form-error: #F87171;`

## 3. Component Mapping Table

| Logical Area | Component / Class | Dark Mode Token / Strategy |
| :--- | :--- | :--- |
| **Modal Wrapper** | `UnifiedModal`, `.unified-modal-overlay` | Background `--ad-b0kla-overlay-bg`, Surface `--mg-color-surface-main` |
| **Toolbar** | `ErpFilterToolbar` | Container uses `--mg-dark-toolbar-bg` |
| **Chips** | `SavedViewChip` | Background `--mg-dark-chip-bg`, hover state transitions |
| **Tables** | `.b0kla-table`, `.mg-table` | `[data-theme="dark"] .b0kla-table { ... }` overrides |
| **Forms** | `.mg-v2-input`, `.mg-select` | Uses the `--mg-v2-form-*` alias inside `[data-theme="dark"]` |

## 4. Acceptance Criteria (P0 6 Routes)

**Target Routes** (SSOT: `ADMIN_DARK_MODE_C3_ROADMAP.md` §5):
1. Admin Dashboard (`/admin/dashboard`)
2. User Management — client · consultant · staff tabs (`/admin/user-management`)
3. Mapping Management (`/admin/mapping-management`)
4. Integrated Schedule (`/admin/integrated-schedule`)
5. Consultation Logs (`/admin/consultation-logs`)
6. ERP Financial (`/erp/financial`)

**Criteria (across all 6 routes)**:
- [ ] **Modal Validation**: When opening any `UnifiedModal` (e.g., Client Modal, Session Detail Modal), the overlay and panel must reflect dark theme without blinding contrast.
- [ ] **Filter Validation**: `ErpFilterToolbar` and `SavedViewChip` must be clearly legible and distinguishable from the main background.
- [ ] **Table Validation**: Data tables display headers, rows, and borders clearly. Hover and selection states function identically to light mode.
- [ ] **Form Validation**: Inside modals and SidePeeks, inputs, dropdowns, and checkboxes have proper dark backgrounds, text contrast, and a distinct `focus-visible` ring.
- [ ] **Contrast**: All text and critical UI elements must meet at least **4.5:1** contrast ratio against their dark backgrounds.
- [ ] **Light Mode Regression**: NO changes occur when `data-theme="light"` or when the theme attribute is absent.
- [ ] **Role Consistency**: Information density, roles, masking, and layout remain exactly identical; only the color palette switches.

## 5. 1280px Dark Wireframe Concept (Text)

```text
+-----------------------------------------------------------------------------+
| GNB (Dark) [Toggle: Dark Mode ON]                                           |
+-------------------------+---------------------------------------------------+
| LNB (Sidebar)           | Title: Client Management                          |
| bg: #2C2C2C             | bg: #1F2937                                       |
| text: #E5E7EB           +---------------------------------------------------+
|                         | [ErpFilterToolbar bg:#1F2937 border:#374151]      |
|                         | [Chip: All] [Chip: High Risk] ...                 |
|                         +---------------------------------------------------+
|                         | Table Header bg: #374151 text: #D1D5DB            |
|                         | Row 1 bg: trans hover: #4B5563                    |
|                         | Row 2                                             |
|                         | Row 3                                             |
|                         +---------------------------------------------------+
|                         | * UnifiedModal Overlay opens: rgba(0,0,0,0.7)     |
|                         | * Modal Panel bg: #1F2937                         |
|                         |   [Form Input bg:#374151 border:#4B5563]          |
|                         |   [Save Button] [Cancel Button]                   |
+-------------------------+---------------------------------------------------+
```

## 6. Files to Modify (Designer → Coder Handoff)

The core-coder should focus strictly on appending `[data-theme="dark"]` rules in the following files:

1. **Tokens**:
   - `frontend/src/styles/dashboard-tokens-extension.css`
   - `frontend/src/styles/unified-design-tokens.css`
2. **Modals**:
   - `frontend/src/components/06-components/_unified-modals.css`
   - `frontend/src/styles/_base/_modals.css`
3. **Dashboards & Toolbars**:
   - `frontend/src/components/admin/AdminDashboardB0KlA.css`
   - `frontend/src/components/admin/ErpFilterToolbar.css`
   - `frontend/src/styles/ErpCommon.css`
4. **Log & Chips**:
   - `frontend/src/components/admin/ConsultationLogViewPage.css`
   - `frontend/src/components/admin/ClientComprehensiveManagement/atoms/SavedViewChip.js` (or associated `.css` if styled-components are not used, otherwise via inline dark token logic)
   - Relevant toolbar CSS for Mapping/Filter sections.
