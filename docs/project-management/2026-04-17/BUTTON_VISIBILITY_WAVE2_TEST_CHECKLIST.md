# 버튼 가시성 Wave 2 — 수동·자동 검증 체크리스트

**작성일**: 2026-04-23  
**에픽**: 랜딩/로그인 등 버튼 가시성·A11y (Wave 2)  
**정렬**: Wave 1 [core-debugger 체크리스트](BUTTON_VISIBILITY_A11Y_PARALLEL_BATCH.md#6-w1d--core-debugger-프롬프트-복붙) · `docs/standards/TESTING_STANDARD.md`  
**자동 E2E**: `tests/e2e/tests/landing/landing-home-header.spec.ts` (비로그인 `/`, 데스크톱)

---

## 1. 자동 (Playwright)

| 단계 | 항목 | 기준 |
|------|------|------|
| A1 | 비로그인 `/` | `context.clearCookies` + storage 초기화 후 진입 |
| A2 | 뷰포트 | 1280×800 (데스크톱 GNB) |
| A3 | 스크롤 0 | `header.mg-header`에 `mg-header--transparent`, **로그인**·**회원가입** `toBeVisible` |
| A4 | 스크롤 80px | `mg-header--default`, transparent 클래스 제거, 동일 버튼 `toBeVisible` (투명→불투명 전환 회귀) |
| A5 | 시각 기준 (선택) | **chromium**에서 헤더 `toHaveScreenshot` 2장 (`header-scroll-y0` / `header-scroll-y80`) |

**실행 예**

```bash
cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts --project=chromium
```

**스냅샷(시각) 기준선**: `tests/landing/landing-home-header.spec.ts-snapshots/*.png` — OS·브라우저별 파일명(예: `*-chromium-darwin.png` vs `*-chromium-linux.png`). **새 환경·CI 머신**에서는 최초 1회 `... --update-snapshots`로 해당 OS 기준선을 생성·커밋하거나, 시각 기준이 불필요하면 스펙의 `toHaveScreenshot`만 임시 제거하고 A3·A4(class·가시성)만 통과시켜도 된다.

---

## 2. 수동 — 재현 3단계 (Wave1 debugger 대응)

1. **환경**: `BASE_URL` 기본 `http://localhost:3000` 또는 스테이징(비밀·고정 URL 저장소에 추가 금지). 브라우저 시크릿, 줌 100%.
2. **스크롤**: (a) 맨 위 `scrollY=0` (b) 약 80px 하단 스크롤 — 헤더 배경/대비가 바뀌는지 확인.
3. **역할**: 비로그인(쿠키·로컬 스토리지 없음)으로 `/`만 검증.

---

## 3. 수동 — DevTools 체크리스트 (Wave1 §6)

| 항목 | 확인 |
|------|------|
| **Contrast** | 투명·스크롤 후 헤더에서 **회원가입(Primary)**·**로그인(Outline)** 라벨이 배경과 구분되는지 |
| **Computed** | `color`·`background`·`opacity`·`filter`·(가능 시) `mix-blend-mode` — transparent 시 inherit/토큰 충돌 여부 |
| **Stacking** | 헤더 `z-index`·Layers — 히어로/오버레이에 버튼이 가리지 않는지 |
| **Overflow** | `overflow: hidden`·flex shrink로 라벨이 잘리지 않는지 |
| **forced-colors** | (가능 시) 고대비 모드에서 라벨·포커스 링이 보이는지 |

---

## 4. 코더 머지 후 smoke (3 bullet)

- [ ] 위 Playwright 스펙이 **chromium**에서 다시 **전부 통과**하는지.
- [ ] 랜딩 `/`에서 스크롤 0/80px 모두 **로그인·회원가입**이 눈에 잘 띄는지(수동 §2·§3).
- [ ] (도입 시) `@axe-core/playwright` 등 **프로젝트 표준이 생기면** 동일 패턴으로 홈 헤더에 한 번 스캔해 Violations 0 목표.

---

## Wave 3 — 코더 터치 영역 (UnifiedLogin·모달·ERP·테이블)

**목적**: 전역 버튼 가시성 패치가 **통합 로그인·모달·ERP MGButton·관리 테이블/행 액션**에 회귀 없이 유지되는지 빠르게 확인한다.

### 수동 스모크 (5줄)

1. **`/login` (UnifiedLogin)**: 좌측 히어로(CoreSolution)·폼 내 **로그인** Primary가 한 화면에서 잘리지 않고 보이는지(줌 100%, 데스크톱 폭 기준).
2. **모달 (UnifiedModal·SocialSignup 등)**: 열린 상태에서 Primary/확인·취소·닫기가 서로 겹치거나 `opacity`/`z-index`에 묻히지 않는지.
3. **ERP 화면**: 목록·필터·테이블 하단 고정 영역이 **저장·승인·요청**류 Primary를 가리지 않는지(스크롤 끝까지 확인).
4. **관리자 테이블**: 행 액션·아이콘 버튼이 보이거나(라벨/툴팁) 고대비에서도 구분되는지.
5. **`/register`**: 히어로·**회원가입** submit이 동일하게 가시적인지(로그인과 동일 패턴).

### Playwright (자동 경로)

- `tests/e2e/tests/landing/landing-home-header.spec.ts` — 비로그인 `/` GNB·헤더 variant
- `tests/e2e/tests/auth/login-register-visibility-smoke.spec.ts` — `/login`·`/register` 히어로 + Primary submit
- `tests/e2e/tests/register.spec.ts` — 회원가입 폼·중복확인 버튼 등 상세 스모크(기존)

**실행 예 (랜딩 + 로그인/회원가입 가시성 묶음, chromium)**

```bash
cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts tests/auth/login-register-visibility-smoke.spec.ts --project=chromium
```

---

## Wave 4 — `/landing` (상담센터 랜딩) 히어로·문의 CTA

**목적**: `App.js`의 `/landing` (CounselingCenterLanding)에서 히어로 Primary·문의 폼 submit이 비로그인·스토리지 초기화 후에도 가시적인지 회귀 방지.

### 수동 스모크 (3줄)

1. **환경·세션**: 브라우저 시크릿·storage 비움(또는 `BASE_URL` 로컬), 줌 100%, 데스크톱 폭.
2. **`/landing`**: 상단 히어로에 **상담 예약하기**(Primary)가 잘리지 않고 보이는지 확인.
3. **하단 문의**: **상담 문의하기** 폼의 **문의하기** submit이 보이는지(필요 시 섹션까지 스크롤).

### Playwright (자동 경로)

- `tests/e2e/tests/landing/counseling-landing-buttons.spec.ts` — 비로그인 `/landing`, `section.counseling-hero`·`form.counseling-contact__form` 내 버튼 `toBeVisible` (스냅샷 없음, 역할/이름 기준)

**Wave 2·3 + Wave 4 함께 (chromium)**

```bash
cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts tests/auth/login-register-visibility-smoke.spec.ts tests/landing/counseling-landing-buttons.spec.ts --project=chromium
```

---

## 5. a11y 자동화 메모

현재 `tests/e2e/package.json`에 **`@axe-core/playwright` 미포함** — E2E 내 기존 axe 패턴도 없음. 도입·표준화 시 본 섹션을 스킬/표준에 맞게 갱신하고, §4 마지막 bullet을 자동 점검으로 승격한다.
