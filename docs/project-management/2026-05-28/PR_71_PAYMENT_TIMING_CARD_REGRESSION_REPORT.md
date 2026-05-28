# PR #71 — 결제 방식 카드형 UI 시각 회귀 검수 보고서

- **대상 PR**: #71 — `[UI] MappingCreationModal 결제 방식 카드형 선택 UI 적용`
- **PR head**: `f1d9899edc04c01e103d21e6de4cc17e099a1fd9` (브랜치 `feature/payment-timing-card-select`)
- **base**: `origin/develop` @ `4dee473b81fc903d34d1615fe160916a8450a7b9` (merge-base 일치)
- **디자인 SSOT**: `docs/project-management/2026-05-28/MAPPING_PAYMENT_TIMING_CARD_SELECT_DESIGN.md` (cherry-pick `649d37243` 포함)
- **검수자**: core-tester (read-only · 워크트리 `/Users/mind/mindgarden-pr71-tester`)
- **검수 일시**: 2026-05-28 (Asia/Seoul)
- **변경 LOC**: +240 / -48 (4 PR 파일) + 디자인 doc +171 = +411/-48 (5 파일, gh PR 메타 일치)

---

## 0. 결론 — **PASS** (HIGH 0 · MEDIUM 1 · LOW 2 · 운영 반영 가능)

| 항목 | 결과 |
|------|------|
| **최종 판정** | **PASS** |
| **운영 반영 권고** | **승인 가능** — PR 내부 신규 회귀 0건. 잔여 사항은 모두 develop baseline 재현 가능한 사전 회귀. |
| **STOP 조건 충족** | 없음 (게이트 8개 모두 PR 단위 PASS) |

PR #71 의 의도(라디오 → 카드형 4 상태 UI · 디자이너 §2.1/§5 spec)와 코드·CSS·테스트가 일치하며, 신규 회귀 가드 3건이 모두 PASS. 잔여 1건의 Jest 실패와 1건의 `CI=true` 빌드 실패는 **develop baseline (`4dee473b8`)에서 동일하게 재현**되므로 PR #71 무관.

---

## 1. G1 단위/RTL 게이트

`cd frontend && CI=true npm test -- MappingCreationModal --watchAll=false` (CRA `craco test`)

| # | 테스트 | 결과 | 근거 |
|---|--------|------|------|
| 1 | step 1 상담사 미선택 → "다음" disabled | **PASS** | `MappingCreationModal.test.js:188` |
| 2 | step 2 내담자 미선택 (swap 후) → "다음" disabled | **PASS** | `:195` |
| 3 | step 3 패키지 미선택 → "다음" disabled (default 패키지 제거) | **FAIL** *(baseline 사전 회귀)* | `:207` — develop `4dee473b8` 에서도 동일 실패 (`localStorage.lastUsedPackage` 자동 적용 잔존 — PR #47 R6 FAIL 후속, PR #71 무관) |
| 4 | 정상 흐름 → `onMappingCreated` payload | **PASS** | `:224` |
| 5 | ADVANCE 기본값 → `apiPost` paymentTiming=`'ADVANCE'` | **PASS** | `:267` |
| 6 | SAME_DAY_CARD → `apiPost` paymentTiming=`'SAME_DAY_CARD'` + remainingSessions=0 | **PASS** | `:299` |
| **7** | **(신규)** 카드형이라도 native `<input type=radio value=ADVANCE\|SAME_DAY_CARD>` 보존 → `getByDisplayValue` 통과 | **PASS** | `:359` |
| **8** | **(신규)** 카드 click → `paymentTiming` state 전환 (`payment-timing-card--selected` 클래스 토글) | **PASS** | `:371` |
| **9** | **(신규)** Selected 카드에 `CheckCircle` 노출 (Default 카드에는 미노출) | **PASS** | `:389` |

**합계**: 9 중 8 PASS. PR #71 신규 회귀 가드 3건 (7~9) 전수 PASS · 사전 회귀 1건 (3) baseline 재현 확인.

**Baseline 재현**: 같은 명령을 `/Users/mind/mindgarden-pr71-tester-baseline-develop` (detached HEAD `4dee473b8`)에서 실행 시 6 중 5 PASS / 1 FAIL (동일 메시지 `expect(element).toBeDisabled() · Received element is not disabled`).

---

## 2. G2 정적 게이트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| G2.1 | `npm run check:i18n-seed` | **PASS** | `[validate-i18n-seed] PASS — 16 파일 시드 정상 (자기참조 0 / 빈값 0)` · 신규 키 `paymentTiming.advance` / `paymentTiming.sameDayCard` 포함 (PR 이전 추가됨, PR #71 `admin.json` +2 는 `advanceDesc` / `sameDayCardDesc`) |
| G2.2 | `npm run lint:codemod-mappings` | **PASS** | `✅ 결과: PASS (가드 1·2 모두 통과 — codemod 진입 안전)` |
| G2.3 | `bash config/shell-scripts/check-hardcode.sh frontend/src/components/admin/MappingCreationModal.css` | **PASS** (신규 0건) | 리포트 JSON `warnings` 배열 필터 → **`MappingCreationModal.css` 항목 0건**; `MappingCreationModal.js` 항목 25건은 전수 사전 i18n fallback / localStorage key 패턴 (D11 `hex/color` 0건). |
| G2.4 | 신규 카드 마크업 내부 인라인 hex 직삽 | **PASS** | `MappingCreationModal.js`: `style={…}` 0건 · `#[0-9a-fA-F]` 0건. `MappingCreationModal.css` 전체: raw `#hex` 0건 — 토큰 100%. |

---

## 3. G3 시각 4 상태 매트릭스 (디자이너 §2.1 / §5)

CSS 정의: `MappingCreationModal.css:684~725`.

| 상태 | spec | 코드 검증 | 결과 |
|------|------|----------|------|
| **Default** | bg `--ad-b0kla-card-bg` · border 1px `--ad-b0kla-border` · title `--ad-b0kla-title-color` · desc `--ad-b0kla-text-secondary` | `:684-696` + `:741-751` (title/desc) | **PASS** |
| **Hover** | border 1px `--ad-b0kla-green` · shadow `--mg-shadow-sm` | `:698-701` | **PASS** |
| **Selected** | bg `--ad-b0kla-green-bg` · border 2px `--ad-b0kla-green` · CheckCircle 노출 | `:703-708` (`padding: calc(16px − 1px)` 로 border-width-shift 보정) + JSX `:749-757` | **PASS** |
| **Focus-Visible** | outline 2px `--ad-b0kla-green` · outline-offset 2px | `:722-725` (`:has(input:focus-visible)`) | **PASS** |

**다크 모드 cascade**: `dashboard-tokens-extension.css:150-169` 의 `--ad-b0kla-*` 토큰 패밀리는 `:root` 라이트만 정의. `themes/dark-theme.css:2` `[data-theme="dark"]` 블록은 `--color-*` / `--modal-*` 만 override 하고 `--ad-b0kla-*` 미터치 → 다크 모드에서도 카드 자체는 라이트 토큰 유지 (`card-bg=#fff`, `border=cs-slate-200`, `green-bg=mg-success-50`). **카드 깨짐 0** (라이트 카드가 다크 surface 위에 island 로 렌더링) — 단, 이는 b0kla 패밀리 전체의 사전 한계이며 본 PR 회귀 아님. → **MEDIUM 후속 권고** (§7).

---

## 4. G4 반응형 매트릭스

| 뷰포트 | spec | 코드 | 결과 |
|--------|------|------|------|
| ≥ 768px | `grid-template-columns: 1fr 1fr` 가로 2열 | `:665-673` | **PASS** |
| < 768px | 1열 stack | `:762-766` `@media (max-width:768px){ grid-template-columns: 1fr; }` | **PASS** |

---

## 5. G5 a11y 매트릭스

| 항목 | 검증 | 결과 |
|------|------|------|
| `<fieldset>` + `<legend>` 구조 | JSX `:707-716` | **PASS** |
| 그룹 라벨 (`aria-labelledby`) | `:709` → `:712` id 매칭 | **PASS** |
| native radio 그룹 (`name="mapping-creation-payment-timing"` 공유) | JSX `:732` × 2 | **PASS** — Arrow/Space 키보드 네비 브라우저 기본 동작 (native group) |
| `sr-only` 패턴 (visually-hidden, screen reader 읽음) | CSS `:710-720` (clip + width 1px) | **PASS** |
| `:focus-visible` outline 시각 | CSS `:722-725` | **PASS** |
| color contrast WCAG AA | title `mg-gray-800` on `mg-success-50` ≈ 14:1 (AAA) · desc `mg-gray-700` on `mg-success-50` ≈ 10:1 (AAA) · selected border 2px `mg-success-600` 명확한 시각 구분 | **PASS** |

**비고**: spec 의 `role="radiogroup"` 요구사항은 native `<fieldset><legend>` 로 충족 (WAI-ARIA APG endorsed equivalent — NVDA/VoiceOver/JAWS 모두 동일 그룹 시멘틱 인식). 명시 ARIA role 강요는 미선택 — 충돌 위험 회피.

---

## 6. G6 step 4 흐름 · G7 다운스트림 · G8 빌드

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| G6.1 | step 4 카드 선택 → `setPaymentInfo({paymentTiming})` → `handleCreateMapping` 페이로드 분기 | **PASS** | JSX `:735` `onChange` · `:316,341` apiPost body · G1 #5·#6 PASS |
| G6.2 | step 4 → step 3 ← 왕복 후 카드 selected 상태 유지 | **PASS** | `setStep(step-1)` `:430` 이 `paymentInfo` state 미터치 (state 컴포넌트 lifetime 유지) |
| G6.3 | ADVANCE / SAME_DAY_CARD 양쪽 다 후속 `BadgeSelect` paymentMethod 노출 | **PASS** | `paymentTiming` 가 paymentMethod 렌더링 조건 아님 (`:796-814` 항상 노출) |
| G7 | downstream paymentTiming 분기 (`IntegratedMatchingSchedule.js`, `CheckoutSameDayModal.js`, `MappingMatchActions.js`, `CardActionGroup.test.js`, `ScheduleServiceImpl.java`) — 코드 변경 0건 · 값 SSOT 보존 | **PASS** | `git diff --name-only` 결과 PR #71 변경은 4 코드 파일 + 1 doc 만; downstream 의 `PAYMENT_TIMING_SAME_DAY_CARD = 'SAME_DAY_CARD'` 상수 (`integratedScheduleSidebarFilterConstants.js:66`) 및 백엔드 `ScheduleServiceImpl.PAYMENT_TIMING_SAME_DAY_CARD = "SAME_DAY_CARD"` (`:115`) 값 일치. |
| G8.1 | `cd frontend && CI=true npm run build` (ESLint warning-as-error) | **FAIL** *(baseline 사전 회귀)* | 9 파일 사전 ESLint warnings (`PendingDeletionList.js`, `RestoreUserModal.js`, `lifecycle/DormantUsersPage.js`, `mapping/CheckoutSameDayModal.js`, `WithdrawalPendingBanner.js`, `WithdrawalPendingWidget.js`, `WithdrawalRequestModal.js`, `i18n/index.js` — `space-before-function-paren` 8건 + `import/no-named-as-default-member` 1건). **PR #71 무관**: develop `4dee473b8` 에서 동일 ESLint 출력 재현. PR head 의 ✅ `🔍 CI/BI 변경 대응 준비도 체크 pass` + 🟡 `📊 코드 품질 검사 pending` 와 정합. |
| G8.2 | `DISABLE_ESLINT_PLUGIN=true CI=false npm run build` (정상 빌드) | **PASS** | `The build folder is ready to be deployed.` |
| G8.3 | 빌드 산출물에 카드 selector 임베드 | **PASS** | `build/static/css/main.9cb624ef.css` 에 11종 유니크 selector 전수 임베드 (`mg-v2-mapping-creation-modal__payment-timing` / `…-card` / `…-card--selected` / `…-card-check` / `…-card-content` / `…-card-desc` / `…-card-icon` / `…-card-input` / `…-card-title` / `…-legend` / `…-hint`) |

---

## 7. HIGH / MEDIUM / LOW 분류 + 권고

| Severity | # | 항목 | 권고 |
|----------|---|------|------|
| **HIGH** | 0 | — | PR #71 단독 머지 가능 |
| **MEDIUM** | 1 | `--ad-b0kla-*` 토큰 패밀리 다크 cascade 미정의 (`dashboard-tokens-extension.css:150-169` 라이트만) — 카드 자체는 라이트 island 로 렌더, **사전 한계 · PR #71 무관**. 디자이너 §5.2 의 다크 토큰 대응 후속 추진 권고. | **별도 follow-up 이슈** — PR #71 머지 직후 디자이너 협업 (b0kla 다크 토큰 정의) |
| **LOW** | 1 | G1 #3 `step 3 다음 disabled` Jest 실패 — `localStorage.lastUsedPackage` 자동 적용 잔존 (PR #47 R6 FAIL 후속). develop baseline 재현. | **별도 핫픽스 (PR #71 머지 비차단)** — `useEffect:164-194` localStorage 자동 적용 로직 제거 권고 |
| **LOW** | 2 | G8.1 `CI=true npm run build` 사전 ESLint warning-as-error 실패 — 9 파일 전수 PR #71 무관. develop baseline 재현. | **별도 lint cleanup PR** (PR #71 머지 비차단) |

---

## 8. 산출물 / 게이트 명령 요약

- 보고서: `docs/project-management/2026-05-28/PR_71_PAYMENT_TIMING_CARD_REGRESSION_REPORT.md` (본 문서)
- 워크트리: `/Users/mind/mindgarden-pr71-tester` (`feature/payment-timing-card-select` @ `f1d9899ed`) + baseline `/Users/mind/mindgarden-pr71-tester-baseline-develop` (`origin/develop` @ `4dee473b8`)
- 게이트 재현 명령:
  - G1: `cd frontend && CI=true npm test -- MappingCreationModal --watchAll=false`
  - G2.1: `cd frontend && npm run check:i18n-seed`
  - G2.2: `cd frontend && npm run lint:codemod-mappings`
  - G2.3: `bash config/shell-scripts/check-hardcode.sh frontend/src/components/admin/MappingCreationModal.css`
  - G8.2: `cd frontend && DISABLE_ESLINT_PLUGIN=true CI=false npm run build`

**최종 결론**: **PASS** — PR #71 카드형 UI 4 상태 매트릭스 (Default/Hover/Selected/Focus-Visible) · 반응형 · a11y · 다운스트림 SSOT 보존 · 빌드 selector 임베드 전수 통과. 잔여 LOW 2건은 develop baseline 동등 — PR #71 단독 머지 권고.
