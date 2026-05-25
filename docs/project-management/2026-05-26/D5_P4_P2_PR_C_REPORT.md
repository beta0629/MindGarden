# D5 P4 i18n Phase 2 PR-C 트랙 C 정착 보고서

## §0 메타

| 항목 | 값 |
|------|-----|
| 브랜치 | `develop` |
| 베이스 SHA (PR-B 정착) | `fa9cf5ae1` |
| PR-C 정착 SHA | `2146b6f14` |
| 작업 일시 | 2026-05-26 |
| 범위 | 트랙 C — 운영 도메인 `window.alert`/`window.confirm` + bare `alert` → `useConfirm`/`useAlert` 훅 치환 |
| 합의서 참조 | `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §6.1 PR-C 행 |

---

## §1 잔존 alert/confirm 정밀 분류 (치환 전 전수 분석)

### 1.1 운영 도메인 치환 대상 (총 11건)

| # | 파일 | 라인 | 종류 | 메시지 |
|---|------|------|------|--------|
| 1 | `components/academy/ClassList.js` | 72 | `window.confirm` | '정말 삭제하시겠습니까?' |
| 2 | `components/academy/CourseList.js` | 75 | `window.confirm` | '정말 삭제하시겠습니까?' |
| 3 | `components/academy/EnrollmentList.js` | 69 | `window.confirm` | '정말 수강을 취소하시겠습니까?' |
| 4 | `components/admin/DashboardManagement.js` | 173 | `window.confirm` | `"{{name}}" 대시보드를 삭제하시겠습니까?…` (interpolation) |
| 5 | `components/admin/aiProvider/sections/ApiKeyManager.js` | 62 | `window.confirm` | `${providerId.toUpperCase()} API 키를 삭제하시겠습니까?` |
| 6 | `components/admin/onboarding/AdminOnboarding.jsx` | 59 | `window.confirm` | `t('admin:onboarding.confirm.approve', …)` (이미 i18n) |
| 7 | `components/admin/onboarding/AdminOnboarding.jsx` | 68 | bare `alert` | `t('admin:onboarding.msg.approveSuccess', …)` |
| 8 | `components/admin/onboarding/AdminOnboarding.jsx` | 72 | bare `alert` | `t('admin:onboarding.msg.errorDecision', …)` |
| 9 | `components/admin/onboarding/AdminOnboarding.jsx` | 80 | bare `alert` | `t('admin:onboarding.msg.rejectReasonRequired', …)` |
| 10 | `components/admin/onboarding/AdminOnboarding.jsx` | 91 | bare `alert` | `t('admin:onboarding.msg.rejectSuccess', …)` |
| 11 | `components/clinical/DiagnosticReportEditor.js` | 114 | `window.confirm` | `t('report:diagnostic.approveConfirm', …)` (이미 i18n) |
| 12 | `components/clinical/SOAPNoteEditor.js` | 70 | `window.confirm` | '이 SOAP 노트를 최종 승인하시겠습니까?…' |
| 13 | `components/schedule/ScheduleClientNotesSection.js` | 233 | `window.confirm` | '이 특이사항을 삭제할까요?' |
| 14 | `components/community/CommunityFeed.js` | 140 | bare `alert` | '신고가 접수되었습니다. 관리자가 검토 후 처리합니다.' |

### 1.2 변경 금지 (사용자 정의 래퍼)

| 파일 | 라인 | 사유 |
|------|------|------|
| `utils/notification.js` | 176, 191 | 내부 wrapper 함수 (`confirm(message,callback)`, `alert(message,callback)`) — 도메인 호출이 아닌 유틸 인터페이스 |

### 1.3 테스트/스토리북 범위 외 (변경 금지)

| 파일 | 라인 | 사유 |
|------|------|------|
| `components/ui/Icon/Icon.stories.js` | 90–93 | storybook 파일 |
| `components/ui/Card/Card.test.example.js` | 35 | 테스트 예제 파일 |

---

## §2 useConfirm/useAlert 훅 치환 결과 (10 파일, 14건)

### 2.1 파일별 치환 매트릭스

| 파일 | 치환 전 | 훅 | variant | messageKey / message |
|------|---------|-----|---------|---------------------|
| `academy/ClassList.js` | `window.confirm('정말 삭제…')` | `useConfirm` | `danger` | `modal.delete.confirm.message` |
| `academy/CourseList.js` | `window.confirm('정말 삭제…')` | `useConfirm` | `danger` | `modal.delete.confirm.message` |
| `academy/EnrollmentList.js` | `window.confirm('정말 수강을 취소…')` | `useConfirm` | `warning` | `modal.enrollment.cancel.confirm.message` |
| `admin/DashboardManagement.js` | `window.confirm(\`"${name}"…\`)` | `useConfirm` | `danger` | `modal.dashboard.delete.confirm.message` + interpolation `{name}` |
| `admin/aiProvider/sections/ApiKeyManager.js` | `window.confirm(\`${id} API 키…\`)` | `useConfirm` | `danger` | `modal.apiKey.delete.confirm.message` + interpolation `{providerId}` |
| `admin/onboarding/AdminOnboarding.jsx` | `window.confirm(t(…))` | `useConfirm` | `warning` | `message: t('admin:onboarding.confirm.approve', …)` |
| `admin/onboarding/AdminOnboarding.jsx` | bare `alert(t(…))` ×4 | `useAlert` | `success`/`danger`/`warning` | `message: t('admin:onboarding.msg.*', …)` |
| `clinical/DiagnosticReportEditor.js` | `window.confirm(t(…))` | `useConfirm` | `info` | `message: t('report:diagnostic.approveConfirm', …)` |
| `clinical/SOAPNoteEditor.js` | `window.confirm('이 SOAP 노트…')` | `useConfirm` | `info` | `modal.soapNote.approve.confirm.message` |
| `schedule/ScheduleClientNotesSection.js` | `window.confirm('이 특이사항…')` | `useConfirm` | `danger` | `modal.scheduleNote.delete.confirm.message` |
| `community/CommunityFeed.js` | bare `alert('신고가 접수…')` | `useAlert` | `success` | `modal.community.report.success.message` |

### 2.2 공통 치환 패턴

**Before (window.confirm)**:
```js
const ok = window.confirm('메시지');
if (!ok) return;
```

**After (useConfirm)**:
```jsx
// 1. import
import { useConfirm } from '../../hooks/useConfirm';
// 2. 컴포넌트 최상위 훅 선언
const [confirm, ConfirmModal] = useConfirm();
// 3. 핸들러 내 await 호출
const ok = await confirm({
  variant: 'danger',
  messageKey: 'modal.delete.confirm.message',
});
if (!ok) return;
// 4. JSX return 끝에 모달 렌더
<ConfirmModal />
```

---

## §3 locale 보강

### 3.1 common.json `modal.*` 추가 (7 leaves)

| 키 | 값 |
|----|----|
| `modal.delete.confirm.message` | `정말 삭제하시겠습니까?` |
| `modal.enrollment.cancel.confirm.message` | `정말 수강을 취소하시겠습니까?` |
| `modal.dashboard.delete.confirm.message` | `"{{name}}" 대시보드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.` |
| `modal.apiKey.delete.confirm.message` | `{{providerId}} API 키를 삭제하시겠습니까?` |
| `modal.soapNote.approve.confirm.message` | `이 SOAP 노트를 최종 승인하시겠습니까? 승인 후에는 공식 상담 기록으로 저장됩니다.` |
| `modal.scheduleNote.delete.confirm.message` | `이 특이사항을 삭제할까요?` |
| `modal.community.report.success.message` | `신고가 접수되었습니다. 관리자가 검토 후 처리합니다.` |

- `error.json` 추가 없음 (모든 메시지가 common.modal.* 패턴에 해당)
- AdminOnboarding/DiagnosticReportEditor는 이미 네임스페이스 키 사용 (`admin:`, `report:`) → 신규 locale 키 불필요, `message:` 직접 전달 패턴 사용

---

## §4 가드 결과

| 가드 항목 | 결과 |
|----------|------|
| `npm run lint:codemod-mappings` | ✅ PASS (가드 1·2 모두 통과) |
| locale JSON valid | ✅ PASS (python3 json.load 검증) |
| ESLint 0 errors (변경 10 파일) | ✅ 0 errors, 25 warnings (기존 comma-dangle 스타일) |
| `window.alert/confirm` 운영 도메인 잔존 | ✅ **0건** (notification.js 래퍼 함수 2건만 잔존 — 변경 금지 대상) |
| ko leaves 증가 (추가만, 기존 무수정) | ✅ 1,378 → **1,385** (+7 leaves) |
| D11 가드 (CI/BI 하드코딩 검사) | ✅ PASS (커밋 훅 통과 확인) |
| DB 변경 | ✅ 0줄 |
| Phase 1 + PR-A + PR-B 정착물 무수정 | ✅ 훅 SSOT / i18n/index.js 무수정 확인 |

---

## §5 KPI 갱신

| 지표 | PR-B 정착 (`fa9cf5ae1`) | PR-C 정착 (`2146b6f14`) | 변화 |
|------|------------------------|------------------------|------|
| ko total leaves | 1,378 | **1,385** | +7 |
| `window.alert/confirm` 운영 도메인 잔존 | 10건 | **0건** | -10 (100%) |
| bare `alert` 운영 도메인 잔존 | 5건 | **0건** | -5 (100%) |
| 변경 파일 | — | 11파일 | — |
| useTranslation 사용 파일 수 | ~285 | **285** | +0 (훅 useTranslation 포함, 기존 파일들) |

### 5.1 window.alert/confirm 잔존 0 검증

```
$ grep -rEn "window\.(alert|confirm)\(" frontend/src \
    --include="*.js" --include="*.jsx" \
    | grep -v "node_modules" | grep -v "\.test\." | grep -v "\.stories\."

frontend/src/utils/notification.js:176:   const result = window.confirm(message);
frontend/src/utils/notification.js:191:   window.alert(message);
```

→ `notification.js` 2건만 잔존 = **사용자 정의 래퍼 함수** (변경 금지)  
→ **운영 도메인 도메인 호출 잔존 0건 달성** ✅

---

## §6 잔여 작업

| 항목 | 상태 | 사유 |
|------|------|------|
| `notification.js` 래퍼 함수 (`window.confirm`, `window.alert`) | 변경 금지 | 사용자 정의 유틸 인터페이스, 도메인 호출 아님 |
| `Icon.stories.js` bare alert 4건 | 범위 외 | storybook 파일 |
| `Card.test.example.js` bare alert 1건 | 범위 외 | 테스트 예제 파일 |
| PR-D (다음 트랙) | 미착수 | 합의서 §6.1 PR-D 범위 |

---

## §7 Phase 1 + PR-A + PR-B 회귀 0 검증

| 대상 | 검증 방법 | 결과 |
|------|----------|------|
| i18n/index.js | git diff HEAD~1 -- frontend/src/i18n/index.js | ✅ 무수정 |
| `hooks/useConfirm.js` | git diff HEAD~1 -- frontend/src/hooks/useConfirm.js | ✅ 무수정 |
| `hooks/useAlert.js` | git diff HEAD~1 -- frontend/src/hooks/useAlert.js | ✅ 무수정 |
| `locales/ko/admin.json` (PR-A/B 703 leaves) | git diff HEAD~1 -- frontend/src/locales/ko/admin.json | ✅ 무수정 |
| `locales/ko/settings.json` (PR-B 67 leaves) | git diff HEAD~1 -- 해당 파일 | ✅ 무수정 |
| D11 가드 (CI/BI 보호 시스템) | 커밋 훅 자동 실행 | ✅ PASS |
