# SCREEN SPEC: Admin Dark Mode C-2b (LNB, ContentArea, B0KlA)

## 1. Overview
- **Phase**: 2 Set F
- **Target**: LNB (Sidebar), ContentArea, B0KlA Cards & Tables
- **Goal**: Extend the dark mode cascade to LNB, main content areas, and B0KlA specific components without breaking the light mode.

## 2. Token Definitions & Cascade
All tokens must be defined under `[data-theme="dark"]` to ensure light mode is preserved.

### 2.1 LNB (Sidebar)
- **Background**: `--mg-dark-lnb-bg` (Alias for `#2C2C2C`)
- **Text**: `--mg-dark-lnb-text` (Alias for `--mg-gray-200` or `#E5E7EB`)
- **Hover/Active**: `--mg-dark-lnb-hover` (Alias for `#374151`)
- **Border**: `--mg-dark-lnb-border` (Alias for `#4B5563`)

### 2.2 ContentArea
- **Background**: `--mg-dark-content-bg` (Alias for `#1F2937` or `--mg-gray-900`)
- **Text**: `--mg-dark-content-text` (Alias for `--mg-gray-100` or `#F3F4F6`)
- **Border**: `--mg-dark-content-border` (Alias for `#374151` or `--mg-gray-700`)

### 2.3 B0KlA Cards & Tables
- **Card Background**: `--mg-dark-card-bg` (Alias for `#374151` or `--mg-gray-800`)
- **Card Border**: `--mg-dark-card-border` (Alias for `#4B5563` or `--mg-gray-700`)
- **Table Row Background**: `--mg-dark-table-row-bg` (Alias for transparent or `#374151`)
- **Table Row Hover**: `--mg-dark-table-row-hover` (Alias for `#4B5563`)
- **Table Header Background**: `--mg-dark-table-header-bg` (Alias for `#1F2937`)

## 3. Files to Modify
1. `frontend/src/styles/unified-design-tokens.css`: Add dark mode token aliases.
2. `frontend/src/styles/dashboard-tokens-extension.css`: Add component-specific dark tokens.
3. `frontend/src/components/admin/CommonCodeManagementB0KlA.css` (or `AdminDashboardB0KlA.css`): Apply tokens using `[data-theme="dark"]` selector.
4. LNB CSS (`frontend/src/components/admin/AdminDashboard/molecules/Sidebar.css` or similar): Apply dark tokens.

## 4. Acceptance Criteria
- [ ] LNB sidebar background changes to `#2C2C2C` in dark mode.
- [ ] ContentArea background and text colors adapt to dark mode.
- [ ] B0KlA cards and tables display correctly in dark mode with appropriate hover states.
- [ ] Light mode remains completely unaffected.
- [ ] No hardcoded hex values are used directly in component CSS for dark mode; all must use CSS variables.
