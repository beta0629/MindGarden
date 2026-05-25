# D5 P4 i18n Phase 2 — PR-L Wave-1 정착 보고서 (2026-05-26)

> **산출 유형**: PR 정착 보고서 (core-coder)
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §5.8 §C9=a (PR-L 단독) / §5.10 §C10=a (fallback 1회 일괄 제거 + 누락 키 자동 시드)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C4.md` (P0-inv-c4, develop `766ee3580`)
> **보조 JSON**:
> - `reports/d5-p4-i18n-inventory-c4-fallback-top30-20260526.json`
> - `reports/d5-p4-i18n-inventory-c4-key-parity-20260526.json`
> - `reports/d5-p4-i18n-inventory-c4-namespace-20260526.json`

---

## §0 메타

| 항목 | 값 |
|---|---|
| 작업 일자 | 2026-05-26 (KST 07:50 ±) |
| 작업 브랜치 | `develop` |
| Wave-1 시작 SHA | `766ee3580` (P0-inv-c4 정착 직후) |
| 모델 | core-coder (Opus 4.7 위임) |
| Wave-1 commit 수 | 3 (commit-1: 시드 / commit-2: Top-30 codemod / commit-3: Pattern-C/D 흡수) |

---

## §1 commit-1 — 5 namespace 신설 + 481 키 시드

### 1.1 commit SHA / 변경 파일

(아래 §5 부속 SHA 합본 참조)

### 1.2 신설 namespace 5종 — 신규 ko.json 파일

| 신규 파일 | 키 카운트 (leaf) | 비고 |
|---|---:|---|
| `frontend/src/locales/ko/manualNotification.json` | **81** | 어드민 수동 알림 도메인 |
| `frontend/src/locales/ko/terms.json` | **73** | 이용약관 SSOT (TermsOfService) |
| `frontend/src/locales/ko/testNotification.json` | **63** | 어드민 테스트 알림 도메인 |
| `frontend/src/locales/ko/systemConfig.json` | **46** | 시스템 설정 (SystemConfigManagement) |
| `frontend/src/locales/ko/smsTemplate.json` | **36** | SMS 템플릿 (SmsTemplateManagementPage) |
| **합계** | **299** | — |

### 1.3 기존 namespace 확장 (admin / common)

| namespace | 시드 추가 키 (leaf) | 비고 |
|---|---:|---|
| `admin` | **+168** | `dashboard.summary.*` 외 — 구조 충돌 0건 |
| `common` | **+12** | `state.dataLoading` / `loading` / `cancel` / `header.*` — 구조 충돌 1건 (아래 §1.5) |
| **합계** | **+180** | — |

### 1.4 action namespace 흡수

| 키 | 처리 |
|---|---|
| `action:close` (1건, `UnifiedModal.js:168`) | `common.action.close = '닫기'` 이미 존재 — defaultNS=`common` 로 자동 resolve. 별도 namespace 신설 불요. |
| `action:save` (1건, `i18n/index.js:16` 코멘트 내부) | 코드 호출 0 (코멘트 예시) — 시드 불요. `common.action.save = '저장'` 이미 존재. |

> 결과: `action` namespace 신규 신설 0건. 합계 시드 **479 / 481 키** (action 2건 skip — 기존 `common.action.*` 로 해결).

### 1.5 시드 충돌 처리

| 충돌 키 | 처리 방식 |
|---|---|
| `admin:dashboard.summary.bookedConsultations` | `seed_plan` `mode_first` 값 `'오늘 예약된 상담'` 자동 채택 (옵션 `'예약된 상담'` 폐기). 디자이너 카피 검토 필요 — `AdminDashboard.js:821` 1라인. **수동 review 필요 표시**. |
| `common:header.menu` (구조 충돌) | 기존 `common.header.menu = '메뉴 열기'` 문자열을 `{open: '메뉴 열기'}` nested 로 변환 (seed `header.menu.open` 수용). 구 키 경로 (`common:header.menu`) 코드 참조 0건 — 회귀 0. 의미적 동일 (`open` 서브키에 동일 한국어 보존). |

### 1.6 Phase 1 정착물 무수정 검증 (i18n/index.js)

`frontend/src/i18n/index.js` 변경 범위:
- ✅ `SUPPORTED_LANGUAGES = ['ko']` 보존
- ✅ `FALLBACK_LANGUAGE = 'ko'` 보존
- ✅ `DEFAULT_NAMESPACE = 'common'` 보존
- ✅ `returnEmptyString: false` 보존
- ✅ `interpolation.escapeValue: false` 보존
- ✅ `react.useSuspense: false` 보존
- ➕ 신규 import 5건 (manualNotification / terms / testNotification / systemConfig / smsTemplate)
- ➕ `resources.ko` 등록 5건
- ➕ `ns` 배열에 5건 push (배열 가독성 위해 multiline 으로 정렬)

### 1.7 .gitignore 보강

`smsTemplate.json` 이 기존 `*template*` 글로벌 패턴에 매칭되어 ignored — exception 라인 1개 추가:

```
# Exception: i18n smsTemplate namespace JSON (NOT secrets — UI labels)
!frontend/src/locales/ko/smsTemplate.json
```

### 1.8 commit-1 게이트 매트릭스

| 게이트 | 결과 |
|---|---|
| `npm run lint:codemod-mappings` (가드 1·2) | ✅ PASS (총 매핑 57건 · 57/57 라이트+다크 정의) |
| ESLint `src/i18n/index.js` | ✅ 0 error / 1 warning (사전 존재) |
| JSON 문법 (7 파일) | ✅ 전수 PASS |
| Production build (`cd frontend && npm run build`) | ✅ PASS (번들 생성 완료) |
| Phase 1 정착물 무수정 | ✅ SUPPORTED_LANGUAGES / FALLBACK_LANGUAGE / DEFAULT_NAMESPACE 보존 |
| 기존 9 namespace 기존 키 보존 | ✅ admin / common 만 확장 (구조 충돌 1건은 `header.menu` 의미적 동등 변환) |

---

## §2 commit-2 — Top-30 파일 Pattern-A codemod (placeholder)

(commit-2 적용 후 갱신)

---

## §3 commit-3 — Pattern-C 4 + Pattern-D 29 흡수 (placeholder)

(commit-3 적용 후 갱신)

---

## §4 KPI 갱신 (placeholder — commit-3 직후 측정)

---

## §5 commit 식별자 + push 정착

(commit 진행 시 SHA append)

---

## §6 Wave-2 권고

(Wave-1 정착 직후 갱신)

---

## §7 산출 보고서 / 산출물 경로

| 산출물 | 절대 경로 |
|---|---|
| 본 보고서 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_P2_PR_L_WAVE1_REPORT.md` |
| 시드 스크립트 (1-shot, 본 commit 이후 폐기 가능) | `/tmp/seed_pr_l_wave1.py` |
| Top-30 codemod 스크립트 (commit-2 진입) | `/tmp/codemod_pr_l_wave1.py` |
| Pattern-D codemod 스크립트 (commit-3 진입) | `/tmp/codemod_pr_l_wave1_multiline.py` |
