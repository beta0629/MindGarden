# PR #71 시각 회귀 게이트 보고서 — MappingCreationModal 결제 방식 카드형 선택 UI

| 항목 | 값 |
|---|---|
| PR | [#71 — `[UI] MappingCreationModal 결제 방식 카드형 선택 UI 적용`](https://github.com/beta0629/MindGarden/pull/71) |
| Head SHA | `f1d9899edc04c01e103d21e6de4cc17e099a1fd9` |
| Base | `develop` (`4dee473b81fc903d34d1615fe160916a8450a7b9`) |
| 변경 LOC | +240 / -48 (코드·CSS·테스트·i18n 4 파일) + 디자인 SSOT 1 파일 cherry-pick `649d37243` |
| 디자인 SSOT | `docs/project-management/2026-05-28/MAPPING_PAYMENT_TIMING_CARD_SELECT_DESIGN.md` (§2.1 / §4 / §5) |
| 격리 워크트리 | `/Users/mind/mindgarden-pr71-tester` (detached HEAD `f1d9899ed`), baseline `/Users/mind/mindgarden-pr71-baseline` (`4dee473b8`, 검증 후 제거) |
| 게이트 결과 | **PASS** (HIGH 0 / MEDIUM 1 / LOW 3) |

## 게이트 매트릭스 결과

| 게이트 | 결과 | 비고 |
|---|---|---|
| **G1** 단위/RTL | **PASS** | PR 9 tests, 8 PASS / 1 FAIL. 신규 카드 가드 3 / 3 PASS. 1 FAIL 은 사전 회귀(LOW). |
| **G2** 정적 게이트 | **PASS** | i18n-seed PASS · lint:codemod PASS · 신규 hex 0 (D11) · 신규 ESLint 0 |
| **G3** 4-state 시각 매트릭스 | **PASS** | Default / Hover / Selected / Focus-Visible 4 상태 모두 §5 spec 토큰 일치 |
| **G4** 반응형 | **PASS** | ≥768px `1fr 1fr`, <768px `1fr` (`@media (max-width: 768px)`) |
| **G5** a11y | **PASS** | fieldset+legend+aria-labelledby, native radiogroup, sr-only, `:has()` focus-visible |
| **G6** step 4 흐름 회귀 | **PASS** | ADVANCE 기본 / SAME_DAY_CARD 선택 / 왕복 시 state 보존 / 후속 BadgeSelect·textarea 변경 0 |
| **G7** 다운스트림 통합 | **PASS** | `IntegratedMatchingSchedule` · `CheckoutSameDayModal` · `MappingScheduleCard` · `CardActionGroup` · `ScheduleServiceImpl` **diff 0 라인** |
| **G8** 정적 빌드 | **PASS** | `npm run build` 성공, 신규 selector·`:has()`·data-testid 모두 prod 번들에 임베드 |

## G1 — 단위/RTL 상세

```
PR (f1d9899ed):
  ✓ step 1 상담사 미선택 시 다음 disabled
  ✓ step 2 내담자 미선택 시 다음 disabled (swap 후)
  ✕ step 3 패키지 미선택 시 다음 disabled (default 패키지 제거)   ← LOW (사전 회귀)
  ✓ 정상 흐름 → onMappingCreated payload 검증
  ✓ ADVANCE 기본 → apiPost paymentTiming: ADVANCE
  ✓ SAME_DAY_CARD → apiPost paymentTiming + remainingSessions: 0
  ✓ [신규] native radio value SAME_DAY_CARD/ADVANCE 보존
  ✓ [신규] 카드 click → paymentTiming state 전환
  ✓ [신규] Selected 카드에 CheckCircle 아이콘 노출

baseline (develop 4dee473b8):
  ✕ step 3 패키지 미선택 시 다음 disabled (default 패키지 제거)   ← 동일 실패 재현
```

baseline 동일 실패는 PR #71 무관(`__tests__/MappingCreationModal.test.js` 207 라인은 develop 에 사전 존재). **본 게이트에서는 LOW 로 기록**.

## G3 — 4 상태 시각 매트릭스 (CSS 라인 기준 / `MappingCreationModal.css`)

| 상태 | 검증 | 라인 |
|---|---|---|
| Default | bg `--ad-b0kla-card-bg` · border 1px `--ad-b0kla-border` · title `--ad-b0kla-title-color` · sub `--ad-b0kla-text-secondary` | L684–696, 744, 750 |
| Hover | border `--ad-b0kla-green` · `box-shadow: var(--mg-shadow-sm)` | L698–701 |
| Selected | bg `--ad-b0kla-green-bg` · border 2px `--ad-b0kla-green` · `box-shadow: var(--mg-shadow-sm)` · `<CheckCircle />` (data-testid `payment-timing-card-check-${value}`) · padding `calc(--mg-spacing-md - 1px)` 보정으로 1→2px 전이 시 layout shift 0 | L703–708, JS L749–757 |
| Focus-Visible | `:has(input:focus-visible)` outline 2px `--ad-b0kla-green` · outline-offset 2px (sr-only input → 시각 outline 부모 `<label>` 로 승격) | L722–725 |

**Dark mode**: `--ad-b0kla-*` 패밀리는 `:root` 라이트만 정의되어 있으며 (`dashboard-tokens-extension.css` L150–169) `[data-theme="dark"]` / `prefers-color-scheme` 오버라이드 없음. 본 PR은 동일 family 토큰을 재사용하므로 **다른 b0kla 카드와 동일한 라이트 cascade로 폴백** — 신규 회귀 0, 사전 패밀리 이슈와 동일 (LOW).

## G5 — a11y 상세

- `<fieldset class="mg-v2-mapping-creation-modal__payment-timing" aria-labelledby="mapping-creation-payment-timing-legend">` + `<legend id="mapping-creation-payment-timing-legend">` (JS L707–716) → 명시 `role="radiogroup"` 없이도 native fieldset/legend semantic + 동일 `name` radio inputs 가 native radiogroup 형성.
- `<input type="radio" name="mapping-creation-payment-timing" class="...payment-timing-card-input">` 시각적 sr-only(`clip: rect(0,0,0,0)`, CSS L710–720) → 스크린리더는 읽고, 시각 outline 은 `:has()` 로 부모 라벨(visible 카드)에 승격.
- 키보드: native radio → Tab(첫 입력 focus) → ArrowLeft/Right/Up/Down(같은 name 사이 이동, 자동 선택) → Space/Enter(현재 선택 보존). 추가 JS handler 불필요.
- 색상 대비(WCAG AA): `--ad-b0kla-green = --mg-success-600` vs `--ad-b0kla-card-bg = --mg-white` / `--ad-b0kla-green-bg = --mg-success-50` — admin 색상 chain 의 사전 정의 검증 범위. Visual contrast 계산은 본 게이트 범위 외 (LOW 권고).

## 분류 요약

### HIGH (0)
없음.

### MEDIUM (1)
1. **`:has()` selector 의존성** — Focus-visible 링이 `:has(.payment-timing-card-input:focus-visible)` 로 부모 `<label>` 에 적용됨. Chrome 105+/Safari 15.4+/Firefox 121+ 에서만 동작. 미지원 브라우저(예: Edge Legacy, 구형 모바일) 에서는 sr-only 입력 자체에 native focus 링이 표시되지 않아 **키보드 사용자에게 focus 위치가 visual hint 없이** 보일 수 있음. 어드민 전용 UI 라 운영 임팩트 제한적이지만, fallback `.payment-timing-card-input:focus-visible + .payment-timing-card-content { outline: ... }` 형태의 sibling selector 추가를 차후 권고.

### LOW (3)
1. **사전 회귀 1건**: `step 3 패키지 미선택 disabled` 가 develop baseline `4dee473b8` 에서도 동일 재현. PR #71 무관. (별도 트랙 — `MappingCreationModal.js#388–399 resetModal` 의 default state 와 step 3 가드 `canProceed()` 의 정책 정합성 검토 필요. P0 핫픽스 후속.)
2. **b0kla 다크 cascade 미정의**: `--ad-b0kla-*` 토큰이 `:root` 라이트만 정의 — 모든 b0kla 카드(상담사·내담자·패키지·결제 방식) 공통 사전 이슈. PR #71 신규 회귀 아님.
3. **CI=true 빌드 사전 ESLint 8 파일**: `PendingDeletionList.js` · `RestoreUserModal.js` · `DormantUsersPage.js` · `mapping/CheckoutSameDayModal.js` · `WithdrawalPendingBanner.js` · `mypage/components/{WithdrawalPendingWidget,WithdrawalRequestModal}.js` · `i18n/index.js` 가 `space-before-function-paren`/`import/no-named-as-default-member` 로 prod 빌드 차단. PR #71 diff 외부, 신규 0건. `DISABLE_ESLINT_PLUGIN=true CI=false` 빌드는 SUCCESS.

## 권고

- **MERGE**: PASS. 신규 회귀 0건, 디자인 SSOT 일치, 다운스트림 영향 0.
- **차후 별도 PR**: (a) MEDIUM 1 의 `:has()` fallback selector, (b) LOW 1 의 step 3 default 패키지 제거 가드 정책 점검, (c) LOW 2 의 b0kla family `[data-theme="dark"]` 토큰 정의, (d) LOW 3 의 ESLint 8 파일 일괄 정리.

## 산출물

- 보고서: `docs/project-management/2026-05-28/PR_71_PAYMENT_TIMING_CARD_REGRESSION_REPORT.md`
- 브랜치: `docs/pr-71-payment-timing-tester-report`
- Build artifact: `frontend/build/static/css/main.9cb624ef.css` · `frontend/build/static/js/main.2d1c2254.js` (신규 selector / data-testid 임베드 확인)
