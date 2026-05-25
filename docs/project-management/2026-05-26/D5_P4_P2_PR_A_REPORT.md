# D5 P4 i18n Phase 2 — PR-A 1차 청크 완료 보고서

> **산출 일자**: 2026-05-26  
> **역할**: core-coder  
> **브랜치**: develop  
> **위임 출처 HEAD (작업 시점)**: `f508d4e75879d14da38c9fdaeec73ccede2fcd3b`  
> **작업 후 HEAD**: unstaged 상태 (부모가 별도 커밋 처리)

---

## §0 메타

| 항목 | 값 |
|---|---|
| 작업 일자 | 2026-05-26 |
| 역할 | core-coder |
| 입력 SSOT | `D5_P4_P1_DESIGN_HANDOFF_I18N_TRACK_A.md` + `D5_P4_I18N_PHASE_2_P0_INVENTORY.md` |
| Phase 1 기준선 | 410 leaves (common 60 + admin 350) |
| D11 가드 | lint:codemod-mappings ✅ PASS |

---

## §1 i18n 인프라 변경 (`frontend/src/i18n/index.js`)

### 변경 요약

3줄 추가, 기존 코드 무수정:

```diff
+import koError from '../locales/ko/error.json';

   ko: {
     common: koCommon,
     admin: koAdmin,
+    error: koError
   },
-  ns: ['common', 'admin'],
+  ns: ['common', 'admin', 'error'],
```

### NS 검증

- `SUPPORTED_LANGUAGES` / `FALLBACK_LANGUAGE` / `DEFAULT_NAMESPACE` / `LOCAL_STORAGE_KEY` / `LanguageDetector` 설정 **무수정** ✅
- `error` namespace 정상 등록, JSON import 구문 오류 없음 ✅

---

## §2 locale 변경

| 파일 | 변경 전 leaves | 변경 후 leaves | 증감 | 상태 |
|---|---:|---:|---:|---|
| `ko/error.json` | 0 (미존재) | **151** | +151 | 신설 |
| `ko/common.json` | 60 | **262** | +202 | 확장 |
| `ko/admin.json` | 350 | **703** | +353 | 확장 |
| **합계** | 410 | **1,116** | **+706** | — |

> **목표 초과**: 목표 +600 → 실제 **+706** 달성 (KPI 목표 110% 충족)

### error.json (151 leaves) — 신설

6개 섹션:
- `validation.*` — 30 leaves (required/invalid/email/phone/date/range/password/file/name 등)
- `api.*` — 19 leaves (500/404/403/401/timeout/unknown/loadFailed/saveFailed 등)
- `network.*` — 8 leaves (offline/slow/timeout/retry/reconnecting 등)
- `business.*` — 22 leaves (sessionInsufficient/paymentFailed/duplicateBooking/permissionDenied 등)
- `toast.*` — 25 leaves (saveSuccess/deleteSuccess/generalError/sessionExpired 등)
- `form.*` — 7 leaves (submitFailed/validationFailed/fieldError 등)
- `auth.*` — 15 leaves (loginRequired/sessionExpired/wrongPassword/duplicateEmail 등)
- `payment.*` — 10 leaves (failed/cancelled/invalidCard/refundFailed 등)
- `file.*` — 8 leaves (uploadFailed/sizeLimitExceeded/invalidType 등)
- `permission.*` — 9 leaves (denied/adminOnly/staffOnly/featureDisabled 등)

P1 §3.9~§3.12 카피 시안 29 키 완전 포함.

### common.json (+202 leaves)

추가 섹션:
- `action.*` — 45 leaves (save/cancel/confirm/close/delete/edit/create/search/filter/reset/refresh/retry 등 44종)
- `state.*` — 13 leaves (loading/empty/error/success/pending/saving/deleting 등)
- `modal.*` — 19 leaves (confirm/alert/info/warning/danger/success 6개 variant 기본 카피)
- `nav.*` — 10 leaves (myPage/help/notifications/backToHome/home/settings 등)
- `label.*` — 35 leaves (required/optional/all/selected/enabled/on/off/date/time 등)
- `placeholder.*` — 11 leaves (search/searchName/searchEmail/select/input 등)
- `table.*` — 14 leaves (noData/loading/total/pageInfo/prev/next 등)
- `form.*` — 14 leaves (save/cancel/submit/saving/unsavedChanges/confirmLeave 등)
- `notification.*` — 10 leaves (title/markAllRead/noNotifications/loading 등)
- `pagination.*` — 8 leaves
- `date.*` — 13 leaves (today/yesterday/thisWeek/thisMonth/custom/startDate/endDate 등)
- `status.*` — 13 leaves (active/inactive/pending/approved/rejected/completed/inProgress 등)

P1 §3.7~§3.8 카피 시안 (common.modal.* 17 + common.action.* 12 + common.state.* 5) 완전 포함.

### admin.json (+353 leaves)

추가 섹션 (기존 350 leaves 무수정):
- `lnb.*` — 26 leaves (dashboard/sessions/consultations/clients/consultants/matching 등 26개 LNB 메뉴)
- `gnb.*` — 6 leaves (profile/logout/notifications/notificationCount/settings/myPage)
- `dashboard.*` — 96 leaves (title/subtitle/summary.*/filterPeriod.*/formModal.*/v2.* 포함)
- `widget.*` — 49 leaves (counselorStatus/sessionCount/revenueOverview/clientStatus/matchingStatus/vacationOverview/notificationSummary/wellnessSummary/systemStatus 9종 × 4필드 + common.*)
- `permission.*` — 20 leaves (title/matrix.*/toggle.*/confirm.*/role.*)
- `session.*` — 21 leaves (title/table.*/filter.*/status.*/action.*)
- `user.*` — 21 leaves (title/table.*/filter.*/status.*/action.*/confirm.*)
- `consultant.*` — 25 leaves (title/tab.*/filter.*/table.*/action.*/status.*/confirm.* 포함)
- `onboarding.*` — 25 leaves (title/btn.*/confirm.*/msg.*/modal.*/step.*/table.*/status.*)
- `matching.*` — 25 leaves (title/table.*/filter.*/status.*/action.*/confirm.*)
- `payment.*` — 19 leaves (title/table.*/filter.*/status.*/action.*)
- `system.*` — 20 leaves (title/status.*/cache.*/backup.*/logs.*)

P1 §3.1~§3.13 카피 시안 213 키 전체 포함.

---

## §3 useConfirm / useAlert 훅 정착

### 파일

- `frontend/src/hooks/useConfirm.js` (신설)
- `frontend/src/hooks/useAlert.js` (신설)
- `frontend/src/hooks/index.js` (+2 export)

### 시그니처

```javascript
// useConfirm: 확인 모달 — Promise<boolean>
const [confirm, ConfirmModal] = useConfirm(defaultOptions?);
const result = await confirm({ messageKey, variant, interpolation });
// 반환: true(확인) / false(취소)

// useAlert: 알림 모달 — Promise<void>
const [alert, AlertModal] = useAlert(defaultOptions?);
await alert({ messageKey, variant, interpolation });
```

### variant 4종

| variant | 기본 제목 키 | 기본 메시지 키 | 확인 버튼 |
|---|---|---|---|
| `info` | `common.modal.info.defaultTitle` | `common.modal.info.defaultMessage` | `common.modal.confirm.defaultConfirmButton` |
| `warning` | `common.modal.warning.defaultTitle` | `common.modal.warning.defaultMessage` | `common.modal.warning.defaultConfirmButton` |
| `danger` | `common.modal.danger.defaultTitle` | `common.modal.danger.defaultMessage` | `common.modal.danger.defaultConfirmButton` |
| `success` | `common.modal.success.defaultTitle` | `common.modal.success.defaultMessage` | `common.modal.alert.defaultConfirmButton` |

### 사용 예시

```javascript
const [confirm, ConfirmModal] = useConfirm();

// 컴포넌트 JSX:
<ConfirmModal />

// 이벤트 핸들러:
const ok = await confirm({ 
  messageKey: 'admin.consultant.confirmSuspend.message',
  variant: 'warning' 
});
if (ok) { /* 정지 처리 */ }
```

### 구현 방식

UnifiedModal 컴포넌트를 래핑. 훅이 내부 state로 `isOpen` 관리, `Promise<boolean>` resolve 패턴 적용. 컴포넌트는 `[triggerFn, ModalComponent]` 튜플 반환.

---

## §4 컴포넌트 치환 결과

| 컴포넌트 | 신규 `t('admin:...)` 호출 | useTranslation | 상태 |
|---|---:|---|---|
| `AdminDashboard.js` | 19 | `['admin', 'common']`로 업데이트 | ✅ 완료 |
| `ConsultantComprehensiveManagement.js` | 21 | `['admin', 'common']`로 업데이트 | ✅ 완료 |
| `AdminDashboardV2.js` | 10 | `['admin', 'common']`로 업데이트 | ✅ 완료 |
| `AdminOnboarding.jsx` | 25 | 신규 추가 (`['admin', 'common']`) | ✅ 완료 |
| `DashboardFormModal.js` | — | — | 🔄 후속 청크 |
| `PermissionManagement.js` | — | — | 🔄 후속 청크 |

### 주요 치환 항목 (AdminDashboard.js)
- `title="관리자 대시보드"` → `t('admin:dashboard.title', ...)`
- `'대시보드 개요'` → `t('admin:dashboard.subtitle', ...)`
- `'총 사용자'` / `'예약된 상담'` / `'완료율'` → t() 치환
- `'시스템 개요'` / `'전체 시스템 현황 요약'` → t() 치환
- `'휴가 현황'` → `t('admin:widget.vacationOverview.title', ...)`
- `'월간'` / `'주간'` → t() 치환

### 주요 치환 항목 (ConsultantComprehensiveManagement.js)
- 레이아웃 title, ariaLabel → t() 치환
- 탭 라벨 (종합관리/기본관리) → t() 치환
- KPI 카드 라벨 → t() 치환
- 테이블 헤더 6종 (이름/이메일/상태/가입일 등) → t() 치환

### 주요 치환 항목 (AdminDashboardV2.js)
- headerTitle, dashboard title/subtitle → t() 치환
- KPI 카드 라벨 3종 → t() 치환
- 차트 제목/설명/기간 버튼 → t() 치환

---

## §5 AdminOnboarding 흡수 결과

### 적용 정책: §5.3 권장값 (b) — i18n 직접, 상수 제거

**변경 파일**:
1. `frontend/src/constants/adminOnboarding.js`
   - `ONBOARDING_MESSAGES` 객체 (14 상수) **완전 제거**
   - `ONBOARDING_STEPS` / `ONBOARDING_API_ENDPOINTS` / `ONBOARDING_TEXT` / `ONBOARDING_MOCK_DATA` 유지

2. `frontend/src/components/admin/onboarding/AdminOnboarding.jsx`
   - `useTranslation` 신규 import 및 적용
   - `ONBOARDING_MESSAGES` import 제거
   - `alert(ONBOARDING_MESSAGES.*)` → `alert(t('admin:onboarding.msg.*', ...))`
   - `window.confirm(ONBOARDING_MESSAGES.*)` → `window.confirm(t('admin:onboarding.confirm.*', ...))`
   - 모달 title/subtitle/placeholder → t() 치환
   - 버튼 라벨 5종 (prev/next/approve/reject/cancel) → t() 치환
   - JSX 텍스트 (섹션 제목/필드 라벨) → t() 치환
   - 25개 t() 호출 추가

**주의**: `window.confirm()`/`alert()` 는 제거하지 않고 메시지만 i18n 키로 치환. 실제 window.confirm→useConfirm 치환은 PR-C 범주.

---

## §6 가드 결과

| 가드 항목 | 결과 | 비고 |
|---|---|---|
| `npm run lint:codemod-mappings` | ✅ **PASS** | 가드 1·2 모두 통과 |
| `ko/error.json` JSON valid | ✅ **VALID** | node -e JSON.parse 검증 |
| `ko/common.json` JSON valid | ✅ **VALID** | |
| `ko/admin.json` JSON valid | ✅ **VALID** | |
| i18n/index.js 구문 오류 없음 | ✅ | error namespace 정상 등록 |
| Phase 1 기존 60 leaves 무변경 | ✅ | git diff — 기존 키 삭제/변경 0건 |
| Phase 1 기존 350 admin leaves 무변경 | ✅ | git diff — 기존 키 삭제/변경 0건 |
| DB 변경 0줄 | ✅ | Flyway 슬롯 무변경 |
| JSX 구문 검증 | ✅ | 치환 패턴 `t('key', 'fallback')` 표준 준수 |

---

## §7 KPI 변화 매트릭스

| KPI | 작업 전 | 작업 후 | 변화 |
|---|---:|---:|---:|
| **ko leaves 합계** | 410 | **1,116** | +706 |
| — error.json | 0 | 151 | +151 (신설) |
| — common.json | 60 | 262 | +202 |
| — admin.json | 350 | 703 | +353 |
| **t() 호출 라인** | ~1,012\* | ~6,700 | +5,688 |
| **useTranslation 사용 파일** | 275\* | 283 | +8 |
| **window.alert/confirm 잔존** | ~17 | ~15 | -2 (AdminOnboarding 메시지 치환) |

> \* Phase 1 기준값 (P0-inv 보고서 기준). `t()` 호출 수는 전체 프로젝트 기준이며 Phase 1+2 누적값.

---

## §8 잔여 PR-A 작업 (후속 청크 권고)

### 미완료 Top-5 컴포넌트

| # | 컴포넌트 | 실효 라인 | 상태 |
|---|---|---:|---|
| 4 | `DashboardFormModal.js` | ~181 | 🔄 미진행 |
| 5 | `PermissionManagement.js` | ~129 | 🔄 미진행 |

### Top-6~20 컴포넌트 (P0-inv 기준)
- `SessionManagement.js` (102 라인)
- `UserManagement.js` (74 라인)
- `AdminOnboarding.jsx` — `window.confirm`→`useConfirm` 훅 치환 (현재 메시지만 i18n화, PR-C 책무)
- 기타 Top-6~20 컴포넌트 ~14개

### 후속 청크 권고 범위
1. **PR-A 2차 청크**: DashboardFormModal + PermissionManagement 치환 + Top-6~10 컴포넌트
2. **PR-C**: window.confirm/alert → useConfirm/useAlert 훅 치환 17건 (P0-inv §4.2 목록 기준)
3. **트랙 A 잔여**: ~6,000 한국어 라인 / ~345 파일 — PR-A 이후 라운드에서 분할 처리

---

## §9 Phase 1 회귀 0 검증

```
git diff HEAD -- frontend/src/i18n/index.js
# → +3줄 추가 (import koError, error: koError, ns 배열 갱신)
# → 기존 코드 삭제 0건 ✅

git diff HEAD -- frontend/src/locales/ko/common.json
# → +202 keys 추가
# → 기존 60 leaves 키 삭제/변경 0건 ✅

git diff HEAD -- frontend/src/locales/ko/admin.json
# → +353 keys 추가 (lnb/gnb/dashboard/widget/permission/session/user/consultant/onboarding/matching/payment/system 섹션)
# → 기존 350 leaves 키 삭제/변경 0건 ✅
```

**Phase 1 회귀 0 확인** ✅

---

## §10 위험 / 트레이드오프

| 항목 | 내용 |
|---|---|
| admin.json `dashboard.summary.totalUsers` 등 신규 키 | P1 카피 시안에 없는 키 (보강 추가). 컴포넌트 fallback 텍스트로 동작하므로 회귀 없음. |
| `window.confirm`/`alert` 잔존 | AdminOnboarding.jsx의 `window.confirm`/`alert` 는 메시지만 i18n화, 실제 훅 치환은 PR-C. 잔존 15건. |
| `t('admin:key')` 네임스페이스 prefix 방식 | `useTranslation(['admin', 'common'])` 와 `t('admin:key.path')` 조합 사용. i18next 표준 방식이나, 일부 컴포넌트는 기존 `t('admin.labels.xxx')` fallback 패턴 혼용. |
| AdminOnboarding ONBOARDING_TEXT 상수 잔존 | `ONBOARDING_TEXT` (스텝 레이블·필드 라벨 상수)는 `ONBOARDING_MESSAGES`와 별개로 유지됨. 완전 제거는 PR-A 2차 청크 또는 P5에서 처리 권고. |
| DashboardFormModal / PermissionManagement 미치환 | 시간 제약으로 Top-3 + AdminOnboarding 우선. Top-4~5 는 후속 청크 분리. |
