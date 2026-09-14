# 운영 승인 센터 Clinic-OS UI/UX 스펙 (Design Handoff)

**대상**: `/erp/approvals` (`ErpApprovalHub` → `OpsApprovalCenter`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**트윈**: `/erp/salary` (`SalaryQuietHeader` / `SalarySummaryStrip` / `__stage`), `/erp/purchase`  
**범위**: Frontend chrome / layout / CSS / cross-type inbox 어댑터(기존 API 재사용). **금액 계산 SSOT 변경 금지**. **PG 승인 화면·파일 금지**.

---

## 1. 개요·배경

센터 ADMIN이 급여·구매요청·환불 등 **hard money confirm** 대기 건을 **한 inbox**에서 승인·반려한다.  
기존 허브는 구매요청 카드 그리드+B0KlA였으나, Clinic-OS quiet header + summary strip + single stage table로 맞춘다.

## 2. 사용성 · 정보 노출 · 레이아웃

| 항목 | 요구 |
|------|------|
| **사용성** | ADMIN 운영자. 첫 화면에서 대기 건 수·오늘·반려 KPI → 테이블에서 승인/반려/⋮. 급여 목록 행 「승인」숏컷은 `/erp/salary`에 유지(동일 API). |
| **정보 노출** | **ADMIN only** (FE `ProtectedRoute` + BE purchase approve/reject/pending ADMIN fail-closed). 금액·요청자·유형·일시. 비ADMIN 차단. |
| **레이아웃** | quiet header → strip(대기/오늘/반려) → **단일 stage 테이블**. 카드 그리드·B0KlA·왼쪽 4px accent 금지. |

## 3. 레이아웃 구조

```
AdminCommonLayout title="승인 센터"
└─ ContentArea
   └─ ErpPageShell (.ops-approval-shell.ops-approval--clinic-os)
      ├─ headerSlot: OpsApprovalQuietHeader (h1「승인 센터」+ ghost「목록 새로고침」; NO ContentHeader)
      └─ children:
         └─ .ops-approval
            ├─ OpsApprovalSummaryStrip (대기 / 오늘 / 반려)
            └─ .ops-approval__stage (min-height 36rem, neutral-300 border / neutral-50 bg)
               └─ table (유형 · 제목 · 요청자 · 금액 · 일시 · 액션)
```

슈퍼 모드(`?mode=super`): 동일 크롬, 구매 **상위 승인** pending API만(기존 super 엔드포인트).

## 4. 토큰·버튼·금액

| 역할 | 토큰 / 규칙 |
|------|-------------|
| Primary CTA (승인) | `MGButton` solid primary — `--mg-v2-color-primary-solid` / dusty teal `#0E5F5A` |
| Ghost (새로고침) | slate text, hairline |
| Danger (반려) | `--mg-v2-color-semantic-error` |
| 행 액션 높이 | **36px** → `var(--mg-spacing-36)` (승인/반려/⋮) |
| 유입·실지급(net-to-pay) 금액 | summary·행에서 inflow 스타일 → `var(--color-red-700)` (= `#B91C1C`) |
| 지출형(구매 요청 금액) | `--mg-v2-color-semantic-info` (expense blue, purchase twin) |
| 카피 | 한국어 운영자 문구. LNB/본문에 「매칭」 대신 「배정」 |

## 5. Cross-type inbox (동일 API)

| 유형 | 목록 | 승인 | 반려 |
|------|------|------|------|
| 구매 | `GET …/purchase-requests/pending-admin` (super: pending-super-admin) | 기존 approve-admin / approve-super-admin | 기존 reject-* |
| 급여 | `GET /api/v1/admin/salary/calculations` → status `CALCULATED` | `POST /api/v1/admin/salary/approve/{id}` | 행에서는 숨김(급여 화면 숏컷·취소는 salary SSOT) |
| 환불 | `GET /api/v1/admin/refund-history?status=REQUESTED` | 인박스 CTA → `/erp/refund-management` (별도 승인 API 없음) | 동일 |

금액·세금·원천 계산 로직 **변경 금지**.

## 6. 금지 / 게이트

- `AdminDashboardB0KlA.css` import, 페이지 `mg-v2-ad-b0kla*`
- 왼쪽 4px accent (`border-left: none !important`)
- PG: `/admin/ops/pg-approval`, `PgApprovalManagement*`, `frontend-ops` pg-approval — **diff 0**
- Hex soft-gate: ADMIN_LNB §17, SETTINGS §1.3, PRE_PRODUCTION — 신규 CSS는 `--mg-v2-*` / 기존 토큰(`--color-red-700`, `--mg-spacing-36`)만
- `safeDisplay` / `SafeText` / `ErpSafeText` 경계 유지

## 7. 아토믹·공통 모듈

- Atoms: `MGButton`, `KpiNumeral`, `SafeText` / `ErpSafeText`
- Molecules: `ErpEmptyState`, `UnifiedModal`(승인·반려 코멘트)
- Organisms: QuietHeader / SummaryStrip / stage table
- Template: `AdminCommonLayout` + `ContentArea` + `ErpPageShell`

## 8. Lock test

- `frontend/src/components/erp/__tests__/OpsApprovalCenter.clinicOsChrome.test.js`
  - quiet header + summary strip + `__stage`
  - no B0KlA / no ContentHeader
  - action btn height token `--mg-spacing-36`
  - inflow amount class → `--color-red-700`
  - PG paths/files not imported

## 9. .dev 검증

1. `/erp/approvals` — quiet header「승인 센터」, strip 대기/오늘/반려, stage 테이블
2. 승인/반려 버튼 높이 36, primary teal
3. 급여 행 승인 = salary approve API; `/erp/salary` 숏컷 유지
4. PG 승인 화면 무변경
