# ERP Financial Close Screen Specification

**문서 목적**: ERP 결산 관리 어드민 화면 (UI/UX) 설계 (Phase 2)
**상위 정책**: [ERP 결산 실구현 합의서](../project-management/2026-05-28/ERP_FINANCIAL_CLOSE_IMPLEMENTATION_PLAN.md)

---

## 1. 화면 구성 (AdminCommonLayout SSOT)

### Page 위치
- **라우트**: `/admin/erp/financial-period`
- **LNB 위치**: 결제·구독 > 결산 관리 (D1 결정: `결제·구독` 그룹 하위, Default)
- **LNB i18n 키**: `admin:lnb.financialPeriod` 신설

### Section 1 — 헤더 (ContentHeader SSOT)
- **제목**: "결산 관리"
- **액션**: 우상단 `[+ 수동 마감]` (HQ_ADMIN/ADMIN 만 노출, MGButton primary)
- **필터 행**: 기간 단위 토글 (DAY/MONTH 탭, WEEK 는 dry-run only badge)
- **부가 상태 뱃지**: `dry-run=true` 시 우측 상단에 `🟡 DRY-RUN MODE` warning 토큰 뱃지 (i18n `admin:financialPeriod.banner.dryRun`)

### Section 2 — 기간 목록 (DataTable SSOT)
- **컬럼**:
  - period_type (DAY/WEEK/MONTH)
  - period_start ~ period_end
  - status (OPEN/CLOSED/REOPENED — StatusBadge SSOT 적용, 컬러: OPEN=info, CLOSED=success, REOPENED=warning)
  - total_income / total_expense / net_amount (KRW 콤마 + 우측 정렬)
  - closed_at (CLOSED 시), reopened_at (REOPENED 시)
  - 액션:
    - `HQ_ADMIN`: `[재오픈]` (CLOSED 일 때만 활성, danger outline)
    - `ADMIN`: `[상세]` (모달 트리거)
- **페이지네이션 + 정렬**: period_start desc default
- **빈 상태**: EmptyState SSOT, 메시지 "마감된 기간이 없습니다. dry-run 운영 1주 후 첫 마감이 표시됩니다."

### Section 3 — 재오픈 모달 (UnifiedModal SSOT, HQ_ADMIN only)
- **트리거**: 행 액션 `[재오픈]` 클릭
- **본문**:
  - 기간 요약 (dl/dt/dd)
  - 재오픈 사유 textarea (`<= 500자`, 최소 20자 필수, 실시간 글자수 카운터)
- **가드**: minLength=20 미달 시 `[확인]` 버튼 disabled + 헬프 텍스트 표시
- **액션**: `[취소]` (secondary) / `[재오픈 확정]` (danger)
- **성공 후 토스트**: "재오픈 완료. 거래 수정이 가능합니다." (warning 토큰)
- **audit 기록 자동**: 백엔드 책임

### Section 4 — 마감 상세 모달 (UnifiedModal, 일반 ADMIN 조회용)
- **본문**:
  - 기간 요약 + 합산 수치 (income/expense/net)
  - 마감 일시 / 사용자
  - 재오픈 이력 (있을 시)
  - 부가세 가드 결과 (일치/차이 알림)
- **액션**: `[닫기]` 만 (수정 불가)

### Section 5 — 수동 마감 모달 (HQ_ADMIN only, optional)
- **트리거**: 헤더 `[+ 수동 마감]` 버튼
- **본문**: 기간 단위 (DAY/MONTH) + period_start 선택 + 사유 (선택)
- **가드**: 미래 날짜 차단, dry-run 모드일 때만 임시 마감 가능 알림 (`text-warning`)
- **액션**: `[취소]` / `[마감 실행]`
- **성공 토스트**: "마감 완료" 또는 dry-run 시 "[DRY-RUN] 마감 시뮬레이션 완료"

---

## 2. 디자인 토큰 SSOT (하드코딩 금지)

### 상태 배지 (StatusBadge 매핑)
- **OPEN**: `--mg-color-info-100` 배경 + `--mg-color-info-700` 글자
- **CLOSED**: `--mg-color-success-100` 배경 + `--mg-color-success-700` 글자
- **REOPENED**: `--mg-color-warning-100` 배경 + `--mg-color-warning-800` 글자

### 텍스트
- **수치 (KRW)**: `--mg-font-mono` + `--mg-text-primary`
- **음수 net_amount**: `--mg-text-danger`

### 다크모드
- 모든 상태 배지 + 수치 색은 `--mg-color-*-100/700/800` 토큰 cascade 로 자동 해결 (raw hex 금지)

### 아이콘
- **마감**: `lucide-react` `<Lock>` 16px
- **재오픈**: `<Unlock>` 16px
- **dry-run**: `<FlaskConical>` 16px
- **audit**: `<History>` 16px

---

## 3. 반응형 매트릭스
- **desktop (>1024px)**: Section 2 테이블 전 컬럼 노출
- **tablet (768-1023px)**: closed_at/reopened_at 컬럼 숨김, [상세] 모달로 노출
- **mobile (<768px)**: 행 단위 카드 레이아웃 (period 요약 + status 배지 + net_amount + 액션 우측) (D2 결정: 카드 레이아웃, Default)

---

## 4. a11y (접근성)
- 테이블 `<table>` semantic, 컬럼 헤더 `<th scope="col">`
- StatusBadge 에 `aria-label="결산 상태: 마감됨"` 동적 매핑
- 재오픈 모달 textarea `aria-required="true"`, 글자수 카운터 `aria-live="polite"`
- 키보드: 행 클릭 = `Enter`/`Space` 키도 트리거

---

## 5. i18n 키 매트릭스

프론트엔드 `frontend/src/locales/ko/admin.json` 에 신설할 키 목록입니다. (디자이너 SSOT)

| 카테고리 | 키 경로 | 기본 텍스트 (KO) |
| --- | --- | --- |
| LNB | `admin:lnb.financialPeriod` | 결산 관리 |
| Page | `admin:financialPeriod.pageTitle` | 결산 관리 |
| Banner | `admin:financialPeriod.banner.dryRun` | 🟡 DRY-RUN MODE |
| Table | `admin:financialPeriod.table.headers.periodType` | 기간 단위 |
| Table | `admin:financialPeriod.table.headers.periodRange` | 대상 기간 |
| Table | `admin:financialPeriod.table.headers.status` | 상태 |
| Table | `admin:financialPeriod.table.headers.income` | 수입 |
| Table | `admin:financialPeriod.table.headers.expense` | 지출 |
| Table | `admin:financialPeriod.table.headers.net` | 순이익 |
| Table | `admin:financialPeriod.table.headers.closedAt` | 마감 일시 |
| Table | `admin:financialPeriod.table.headers.actions` | 관리 |
| Status | `admin:financialPeriod.status.open` | 오픈 |
| Status | `admin:financialPeriod.status.closed` | 마감됨 |
| Status | `admin:financialPeriod.status.reopened` | 재오픈됨 |
| Actions | `admin:financialPeriod.actions.reopen` | 재오픈 |
| Actions | `admin:financialPeriod.actions.detail` | 상세 |
| Actions | `admin:financialPeriod.actions.manualClose` | 수동 마감 |
| Reopen Modal | `admin:financialPeriod.modal.reopen.title` | 결산 재오픈 |
| Reopen Modal | `admin:financialPeriod.modal.reopen.subtitle` | 마감된 기간을 재오픈합니다. |
| Reopen Modal | `admin:financialPeriod.modal.reopen.reasonLabel` | 재오픈 사유 |
| Reopen Modal | `admin:financialPeriod.modal.reopen.reasonHelp` | 재오픈 사유를 상세히 입력해주세요. |
| Reopen Modal | `admin:financialPeriod.modal.reopen.reasonMinError` | 최소 20자 이상 입력해주세요. |
| Reopen Modal | `admin:financialPeriod.modal.reopen.confirmLabel` | 재오픈 확정 |
| Reopen Modal | `admin:financialPeriod.modal.reopen.cancelLabel` | 취소 |
| Reopen Modal | `admin:financialPeriod.modal.reopen.successToast` | 재오픈 완료. 거래 수정이 가능합니다. |
| Detail Modal | `admin:financialPeriod.modal.detail.title` | 마감 상세 내역 |
| Detail Modal | `admin:financialPeriod.modal.detail.closedAt` | 마감 일시 |
| Detail Modal | `admin:financialPeriod.modal.detail.closedBy` | 마감 처리자 |
| Detail Modal | `admin:financialPeriod.modal.detail.reopenedAt` | 재오픈 일시 |
| Detail Modal | `admin:financialPeriod.modal.detail.reopenedBy` | 재오픈 처리자 |
| Detail Modal | `admin:financialPeriod.modal.detail.reopenReason` | 재오픈 사유 |
| Detail Modal | `admin:financialPeriod.modal.detail.taxGuardOk` | 부가세 검증: 일치 |
| Detail Modal | `admin:financialPeriod.modal.detail.taxGuardDiff` | 부가세 검증: 차이 발생 |
| Manual Close | `admin:financialPeriod.modal.manualClose.title` | 수동 마감 실행 |
| Manual Close | `admin:financialPeriod.modal.manualClose.periodTypeLabel` | 기간 단위 |
| Manual Close | `admin:financialPeriod.modal.manualClose.periodStartLabel` | 시작일 |
| Manual Close | `admin:financialPeriod.modal.manualClose.reasonLabel` | 처리 사유 |
| Manual Close | `admin:financialPeriod.modal.manualClose.dryRunWarning` | 임시 마감 가능 (DRY-RUN 모드) |
| Manual Close | `admin:financialPeriod.modal.manualClose.confirmLabel` | 마감 실행 |
| Empty State | `admin:financialPeriod.emptyState.title` | 마감된 기간이 없습니다. |
| Empty State | `admin:financialPeriod.emptyState.description` | dry-run 운영 1주 후 첫 마감이 표시됩니다. |

---

## 6. 권한 매트릭스

| 역할 | 목록 조회 | 상세 모달 | 재오픈 | 수동 마감 |
| --- | --- | --- | --- | --- |
| HQ_ADMIN | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ❌ (disabled+tooltip) | ❌ |
| STAFF | ❌ (LNB 미노출) | — | — | — |
| 기타 (CLIENT/CONSULTANT) | ❌ | — | — | — |

---

## 7. 사용자 컴펜 (결재 변수 결정사항)
- **D1**: LNB 위치 — **결제·구독** 그룹 하위 (Default 적용)
- **D2**: 모바일 액션 — **행 단위 카드 레이아웃** (Default 적용)
- **D3**: 재오픈 사유 최소 글자수 — **20자** (Default 적용)

*(추후 합의서 §10 에 위 D1~D3 추가 필요)*

---

## 8. 코더 위임 분배실행 표

| 파일 | 책임 | 스킬 적용 |
| --- | --- | --- |
| `frontend/src/components/admin/erp/FinancialPeriodPage.js` | 페이지 셸 (ContentHeader + 필터 + DataTable + 모달 컨테이너) | `/core-solution-frontend` + `/core-solution-atomic-design` |
| `frontend/src/components/admin/erp/components/FinancialPeriodTable.js` | DataTable 행/컬럼 | `/core-solution-atomic-design` |
| `frontend/src/components/admin/erp/modals/ReopenFinancialPeriodModal.js` | 재오픈 모달 | `/core-solution-unified-modal` |
| `frontend/src/components/admin/erp/modals/FinancialPeriodDetailModal.js` | 상세 모달 | `/core-solution-unified-modal` |
| `frontend/src/components/admin/erp/modals/ManualClosePeriodModal.js` | 수동 마감 모달 | `/core-solution-unified-modal` |
| `frontend/src/components/admin/erp/FinancialPeriodPage.css` | 페이지 CSS (SSOT 토큰만, raw hex 금지) | `/core-solution-design-system-css` |
| `frontend/src/api/admin/financialPeriodApi.js` | API wrapper (`StandardizedApi`) | `/core-solution-api` |
| `frontend/src/locales/ko/admin.json` | i18n 시드 추가 | `/core-solution-frontend` |
| `frontend/src/components/dashboard-v2/constants/menuItems.js` | LNB 메뉴 추가 | `/core-solution-frontend` |
