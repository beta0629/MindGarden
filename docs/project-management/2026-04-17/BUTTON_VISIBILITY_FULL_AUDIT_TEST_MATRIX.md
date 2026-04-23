# 전역 버튼 가시성 — 전수 점검 매트릭스 (자동·수동·CI)

**작성일**: 2026-04-23  
**에픽**: 랜딩/로그인/관리·ERP 전역 버튼 가시성·A11y  
**정렬**: [Wave 2 체크리스트](./BUTTON_VISIBILITY_WAVE2_TEST_CHECKLIST.md) · `docs/standards/TESTING_STANDARD.md` · [core-solution-testing](../../../.cursor/skills/core-solution-testing/SKILL.md)

---

## 1. 기존 Playwright 범위 vs 공개 라우트(역할: 비로그인)

| 경로 | 스펙(파일) | 상태 |
|------|------------|------|
| `/` | `tests/e2e/tests/landing/landing-home-header.spec.ts` | **커버됨** (GNB, 스크롤 0/80, chromium 시각 스냅샷) |
| `/landing` | `tests/e2e/tests/landing/counseling-landing-buttons.spec.ts` | **커버됨** (히어로 CTA·문의 submit) |
| `/login` | `tests/e2e/tests/auth/login-register-visibility-smoke.spec.ts` | **커버됨** (히어로·Primary 로그인) |
| `/register` | `tests/e2e/tests/auth/login-register-visibility-smoke.spec.ts` | **커버됨** (히어로·Primary 회원가입) |

**기타(동일 `tests/landing`·`tests/auth` 하위)**  
- `tests/e2e/tests/auth/oauth-preregistered-kakao-naver.spec.ts` — OAuth **골격**·env 미설정 시 skip (버튼 가시 `goto /login` 수준, 전체 OAuth 비안정).  
- Wave 2 문서에 나온 `tests/e2e/tests/register.spec.ts`는 **상위 `tests/`** — 회원가입 폼 상세 스모크(본 매트릭스의 `tests/landing`·`tests/auth` 묶음 실행에 **포함되지 않음**; 필요 시 별도 명령).

---

## 2. 추가 권장 라우트(역할×화면) — 수동·향후 자동

| 역할 | 권장 화면(예시) | Playwright | 비고 |
|------|----------------|------------|------|
| **비로그인(공개)** | 위 4 경로 | 커버됨 | 모바일/태블릿 뷰포트는 **추가 스펙 권장** (현재 데스크톱 1280×800 위주) |
| **어드민** | `/admin` 계열, 사용자·매핑 모달, ERP 목록/하단 액션 | **미자동(전용 스펙 없음)** | Wave 2 §Wave 3 수동·아래 §3.2 |
| **상담사** | 로그인 후 상담사 대시보드·기록/일정 | **미자동** | 동일 |
| **내담자** | 로그인 후 내담자 대시보드·마이페이지 | **미자동** | 동일 |

---

## 3. 자동(Playwright) — 경로·명령

**전역 랜딩 + 인증(공개) 스모크 묶음 (chromium)**

```bash
cd tests/e2e && npx playwright test tests/landing tests/auth/ --project=chromium
```

- **주의**: 인자를 `tests/auth`(**슬래시 없음**)로 주면 Playwright가 **`tests/auth.spec.ts`(이메일 로그인 회귀)** 까지 경로 프리픽스로 잡는다. **비로그인·버튼 가시성만** 보려면 **`tests/auth/`(폴더, 끝에 슬래시)** 또는 아래 **명시적 파일**을 쓴다.
- **버튼 가시·Wave2 범위만(가장 좁게)**:
  `npx playwright test tests/landing/landing-home-header.spec.ts tests/landing/counseling-landing-buttons.spec.ts tests/auth/login-register-visibility-smoke.spec.ts --project=chromium`

아래는 요청에 따른 **동일 뜻(슬래시 없음)** — 리포·CI에서 `auth.spec.ts`가 섞이지 않게 할 때는 위 `tests/auth/` 권장.

```bash
cd tests/e2e && npx playwright test tests/landing tests/auth --project=chromium
```

**Wave 2 문서에 있는 단일/부분 실행 예 (참고)**

```bash
cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts --project=chromium
cd tests/e2e && npx playwright test tests/auth/login-register-visibility-smoke.spec.ts --project=chromium
cd tests/e2e && npx playwright test tests/landing/counseling-landing-buttons.spec.ts --project=chromium
```

- **baseURL**: `playwright.config.ts` — `BASE_URL` 미설정 시 `http://localhost:3000` (로컬 호스트일 때 `webServer`로 프론트 기동). **운영·시크릿 URL 하드코딩 금지** — 항상 env·로컬.

---

## 4. 수동 — 역할×화면×스크롤

| 역할 | 화면 | 스크롤/상태 | 확인 포인트 (요지) |
|------|------|-------------|-------------------|
| 비로그인 | `/`, `/landing`, `/login`, `/register` | 0 / ~80px / 섹션 끝 | GNB·Primary·푸터 CTA·모달이 배경/레이어에 묻이지 않음 |
| 어드민 | 통합 로그인 후 관리·ERP | 목록 끝·모달 열림 | 하단 고정·테이블 행 액션·저장/승인 Primary |
| 상담사 | 대시보드·상담 기록 | 스크롤·사이드 패널 | 동일(겹침·z-index) |
| 내담자 | 대시보드·마이페이지 | 스크롤 | 동일 |

Wave 2 [§2·§3](BUTTON_VISIBILITY_WAVE2_TEST_CHECKLIST.md)의 DevTools(Contrast, Stacking, Overflow 등)를 역할별 핵심 화면에 **표본 적용**하면 전수 점검 효율이 좋다.

---

## 5. 로그인 필요 시 — `storageState` / 기존 패턴(구현은 최소)

프로젝트 `playwright.config.ts`에는 **전역 `storageState`·`auth.setup` 프로젝트가 아직 없음** (검색 기준: 저장소 내 `storageState` 미사용). 아래는 **권장 방향**만 기술한다.

- **`storageState`**: 역할별로 한 번 로그인한 뒤 `storageState` JSON을 생성·CI 아티팩트로 쓰는 Playwright 권장 패턴. **비밀번호·토큰은 리포에 남기지 말 것.**
- **기존 옵트인 스캐폴드**: `tests/e2e/tests/admin/admin-e2e-scaffold.spec.ts` — `ADMIN_E2E=1` 및 `ADMIN_E2E_EMAIL` / `ADMIN_E2E_PASSWORD`(env)로 로그인 후 URL 대기. 상세: `docs/project-management/2026-04-23/PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md`
- **자격 증명 소스**: [core-solution-testing](../../../.cursor/skills/core-solution-testing/SKILL.md) — `E2E_TEST_*`, `E2E_CONSULTANT_*` 등; **CI는 GitHub Secrets 등으로 주입**, 저장소에 평문 커밋 금지.

**코더 인계**: 역할별 버튼 가시 E2E를 추가할 때는 (1) `storageState` + setup 프로젝트 도입, 또는 (2) 기존 env 로그인 스캐폴드를 확장하는 **한 가지로 통일**하는 것이 유지보수에 유리하다.

---

## 6. CI — 스냅샷(`toHaveScreenshot`) 주의

- `landing-home-header.spec.ts`는 **chromium**에서 `header-scroll-y0` / `header-scroll-y80` 시각 스냅샷을 사용한다.
- 기준선 파일명이 **OS·브라우저별**로 갈릴 수 있음(예: `*-chromium-darwin.png` vs `*-chromium-linux.png`). **CI 머신**에서 최초 1회 `--update-snapshots`로 기준선을 생성·커밋하거나, **Linux 전용** CI 러너에 맞춰 스냅샷을 정리할 것.
- 픽셀 플랩이 잦으면 `maxDiffPixelRatio` 조정·스냅샷 제거 후 class·`toBeVisible`만으로 회귀 보도록 완화 가능(Wave 2 체크리스트와 동일 취지).

---

## 7. axe(`@axe-core/playwright`) 도입 시 합의 사항( bullet )

- **의존성**: `tests/e2e/package.json`에 패키지 추가·버전은 팀 합의 후 고정(재현성).
- **범위**: 1단계는 **공개 랜딩·로그인/회원가입**에 한해 `injectAxe` + `checkA11y` (또는 동등 API), Violations **0**을 목표로 할지 **심각도 필터**할지 합의.
- **CI**: headless·동일 `BASE_URL`에서 실행; 스냅샷과 별도로 **결정적이지 않은 위반**이 있으면 플랙 분리 정책 합의.
- **롤·로그인 화면**: axe를 확장할 때 **저장소에 시크릿·계정 URL을 넣지 않고**, env + `storageState` 또는 옵트인 스펙으로만 수행.
- **표준 갱신**: 도입 시 `docs/standards/TESTING_STANDARD.md`·본 매트릭스·Wave 2 [§5](BUTTON_VISIBILITY_WAVE2_TEST_CHECKLIST.md) a11y 메모를 **한 번에** 갱신.

---

## 8. 한 줄 요약

공개 4라우트는 기존 `tests/landing`·`tests/auth`로 **자동 커버**; 어드민·상담사·내담자는 **수동+향후 `storageState`/env 로그인 스펙**으로 확장. CI는 **스냅샷 OS 정렬**·axe는 **팀 합의 후** 단계적 도입.
