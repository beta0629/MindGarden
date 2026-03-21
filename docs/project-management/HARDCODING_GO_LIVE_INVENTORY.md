# 운영 반영 전 하드코딩 인벤토리 (색상·CI 프리커밋 기준)

**수집일**: 2026-03-21  
**기준**: `scripts/design-system/automation/pre-commit-hardcoding-check.sh` (hex, rgb/rgba/hsl) + explore 서브에이전트 스캔  
**참조**: `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17

---

## 1. Phase 1 — 운영 핫스팟 ✅ (적용 커밋: `d1ec2dd1c`)

| 파일 | 처리 |
|------|------|
| `frontend/src/App.js` | 세션 로딩 오버레이 → `var(--cs-glass-strong)` (토큰 파일에 rgba 정의) |
| `frontend/src/components/admin/AdminDashboard.js` | `barColor` → `var(--ad-b0kla-green)` |
| `frontend/src/components/compliance/ComplianceDashboard.js` | 상태색 → `var(--mg-success-400)` 등 |
| `frontend/src/components/erp/PurchaseRequestForm.js` | 인라인 색 → mg/cs 토큰 |
| `frontend/src/components/consultant/ConsultantClientList.js` | `activeColor` 토큰만 사용 |

---

## 2. Phase 2 — 샘플·테스트·대용량 CSS (후속 PR)

상위 파일(건수 근사): `DashboardDesignGuideSample.css`, `IntegrationTest.js`, `AdminDashboardSample.css`, `ConsultantDashboard.css`, `glassmorphism.css`, `IOSCardSample.css`, `emergency-design-fix.css`, `SalaryExportModal.js`, `TenantCodeManagement.css`, `PgApprovalManagement.css` 등.

`unified-design-tokens.css`는 정의 전용이므로 본 목적의 “위반”이 아님.

---

## 3. 토큰 매핑 가이드

- 포인트/브랜드: `var(--mg-primary-500)`, `var(--ad-b0kla-green)` (`dashboard-tokens-extension.css`)
- 테두리: `var(--mg-gray-200)`, `var(--mg-border_primary)` (정의 확인 후 사용)
- 배경: `var(--mg-color-surface-main)`, `var(--color-bg-surface)`
- 오버레이: `var(--mg-overlay)`

---

## 4. 완료 조건

- Phase 1 파일에 대해 프리커밋 패턴 grep 시 **hex/rgba 리터럴 0건** (허용 목록: `#fff`/`#ffffff`/`#000`/`#000000`만 스크립트 예외와 일치 시)
- 터치한 파일에서 `// ⚠️ 표준화 2025-12-05` 잔여 주석 정리

**위임**: core-coder (`/core-solution-frontend`, `/core-solution-design-system-css`)
