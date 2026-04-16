# 버튼 가시성·모달 회귀 — 수동 스모크 체크리스트

**목적**: 통합 로그인 primary 제출 버튼의 **대비(배경·글자)**, `SessionIdleWarningModal` 푸터 버튼 **전체 라벨·잘림 없음**, **UnifiedModal** 푸터 액션 영역 1곳의 시각적 일관성을 배포 전·회귀 시 빠르게 검증한다.  
**성격**: 수동 스모크(자동화 E2E와 병행 가능). `docs/standards/TESTING_STANDARD.md` 및 **테스트 피라미드** 관점에서 E2E 비중은 낮게 두고, UI 회귀·접근성·레이아웃은 본 체크리스트로 보완한다.

---

## 목차

1. [사전 조건](#사전-조건)
2. [1. 통합 로그인 — primary 제출 버튼 대비](#1-통합-로그인--primary-제출-버튼-대비)
3. [2. 세션 만료 임박 모달 — SessionIdleWarningModal](#2-세션-만료-임박-모달--sessionidlewarningmodal)
4. [3. UnifiedModal 푸터 액션 — 임의 1곳 시각 확인](#3-unifiedmodal-푸터-액션--임의-1곳-시각-확인)
5. [완료 기록](#완료-기록)
6. [참고 — 코드·DOM 위치](#참고--코드dom-위치)

---

## 사전 조건

- [ ] 검증 환경: **개발 또는 스테이징** (운영은 변경 금지·읽기 전용 점검만 권장).
- [ ] 브라우저: Chromium 기준 1종 + 필요 시 Safari/Firefox 중 1종(텍스트 잘림은 엔진별로 다를 수 있음).
- [ ] 뷰포트: 데스크톱 너비(예: 1280px 이상) + **좁은 너비**(예: 375px)에서 각 시나리오 1회씩 수행 권장.
- [ ] 개발자 도구: **Elements**(구조)·**Computed**(색·폰트)·필요 시 **Accessibility**(이름·대비) 탭을 열어둔다.

---

## 1. 통합 로그인 — primary 제출 버튼 대비

**대상 화면**: 통합 로그인 (`UnifiedLogin` — 라우트는 배포 환경의 `/login` 등 로그인 진입점과 동일).

### 절차

1. [ ] 로그인 페이지로 이동한다.
2. [ ] **제출(로그인)** 버튼을 찾는다. `type="submit"` 이고 **primary** 스타일인 버튼이어야 한다.
3. [ ] 버튼이 **비활성/로딩이 아닌 상태**에서, 배경색과 전경(글자)색이 **동시에 식별 가능**한지 육안으로 확인한다.
4. [ ] (권장) DevTools에서 해당 버튼 노드를 선택하고, 배경·글자 **computed color**로 대비가 충분한지 확인한다 (내부 기준: WCAG AA 이상 권장, 팀 팔레트 기준이 있으면 그에 따름).
5. [ ] 뷰포트 너비를 **좁혀도** 버튼 라벨이 한 줄로 읽히거나, 줄바꿈 시에도 글자가 잘리지 않는지 확인한다.

### 기대 결과

- Primary 버튼의 **배경**과 **라벨 텍스트** 대비가 명확하며, 회색 배경 위 회색 글자처럼 **구분이 흐려지지 않음**.
- 포커스 링(키보드 탭)이 있을 경우 버튼 경계가 식별 가능함.

### 실패 시 확인할 CSS / DOM 힌트

- **컴포넌트**: `frontend/src/components/auth/UnifiedLogin.js` — 제출 `MGButton`, `variant="primary"`, `buildErpMgButtonClassName({ variant: 'primary', ... })`.
- **DOM**: `<button>` 에 `mg-` / ERP 버튼 유틸 클래스가 붙어 있는지, **다른 전역 규칙이 `color`·`background`를 덮어쓰지 않는지** 확인.
- **CSS**: 상위 요소의 `opacity`, `filter`, `mix-blend-mode`, 다크/라이트 테마 변수(`--*`) 오버라이드.
- **잘림**: `overflow: hidden` + 고정 `height`, `line-height` 충돌, `flex` 자식 `min-width: 0` 없이 축소되는 경우.

---

## 2. 세션 만료 임박 모달 — SessionIdleWarningModal

**대상**: `SessionIdleWarningModal` — 제목 **「세션 만료 임박」**, 본문은 정적 안내 문구.

### 절차

1. [ ] **로그인된 상태**에서 세션 만료 임박 조건을 만든다.  
   - **권장**: 백엔드 `GET /api/v1/auth/session-info` 응답의 `maxInactiveInterval`, `lastAccessedTime`, `serverNow`를 참고해, 앱이 경고를 띄우기 직전 타이밍까지 대기한다 (구체 지연은 `SESSION_IDLE_WARNING_MS` 상수와 서버 설정에 따름).  
   - **대안(개발 전용)**: 세션 TTL을 짧게 둔 환경에서 비활성 상태로 대기하거나, 세션 연장 없이 시간 경과를 유도한다 (환경 정책 준수).
2. [ ] 모달이 열리면 제목이 **「세션 만료 임박」** 인지 확인한다.
3. [ ] 푸터에 **두 개의 버튼**이 보이는지 확인한다: **로그아웃**(아웃라인) · **연장**(primary). 각 버튼에 **아이콘 + 텍스트 라벨**이 함께 표시되는지 확인한다 (`로그아웃`, `연장` 전체 문자).
4. [ ] 데스크톱·모바일 너비 모두에서 **라벨이 잘리지 않음**(ellipsis, `…` 로 끊기지 않음).
5. [ ] (선택) **연장** 클릭 시 모달이 닫히고 세션이 갱신되는지, **로그아웃** 클릭 시 로그아웃 흐름으로 이어지는지 확인한다.

### 기대 결과

- `UnifiedModal` `actions` 슬롯에 렌더된 두 `MGButton`의 텍스트 **「로그아웃」「연장」** 이 **완전히 보임**.
- 아이콘과 텍스트 사이 간격이 붕괴되지 않음 (`mg-v2-icon-inline` 등).

### 실패 시 확인할 CSS / DOM 힌트

- **컴포넌트**: `frontend/src/components/common/SessionIdleWarningModal.js`.
- **DOM**: 최상위 모달 루트는 `role="dialog"` 인 `UnifiedModal` 포털; 푸터는 **`div.mg-modal__actions`** 내부에 버튼 두 개.
- **CSS**: `.mg-modal__actions` 의 `flex-wrap`, `gap`, `justify-content`, 자식 `min-width` / `flex-shrink: 1` 로 인한 텍스트 축소.
- **z-index**: 오버레이 `zIndex={9990}` — 다른 모달/토스트에 가려지지 않는지.
- **혼동 방지**: 상담 **회기 연장**용 `SessionExtensionModal` 과 이름·역할이 다름 — 본 체크는 **HTTP 세션 만료 경고** 모달만 대상으로 한다.

---

## 3. UnifiedModal 푸터 액션 — 임의 1곳 시각 확인

**목적**: 공통 `UnifiedModal` 의 **`.mg-modal__actions`** 레이아웃·버튼 스타일이 한 화면에서 정상인지 샘플 1건으로 회귀를 잡는다.

### 절차

1. [ ] 아래 중 **하나**를 선택해 해당 화면까지 진입한다 (권한·데이터가 막히면 다른 항목으로 대체 가능).
   - **A**: `FormModal` 을 쓰는 화면(예: 공통 폼 모달이 열리는 관리 화면).
   - **B**: `MappingEditModal` 등 `UnifiedModal` + `actions` 가 있는 화면.
   - **C**: 대시보드 위젯 등 `UnifiedModal` 로 상세를 여는 화면.
2. [ ] 모달을 연다. **헤더·본문·푸터(actions)** 가 세로로 구분되는지 확인한다.
3. [ ] 푸터의 **primary / secondary(또는 outline)** 버튼이 **한 줄 또는 의도된 줄바꿈**으로 배치되고, 라벨이 잘리지 않는지 확인한다.
4. [ ] 모달이 `loading` 상태일 때(해당 화면이 지원하면) 로딩 오버레이가 푸터·본문 관계를 깨지 않는지 확인한다.

### 기대 결과

- 푸터 영역(`mg-modal__actions`) 내 버튼 정렬·간격이 디자인 시스템과 일치하고, 회귀 시 깨진 flex/overflow 징후가 없음.

### 실패 시 확인할 CSS / DOM 힌트

- **컴포넌트 루트**: `frontend/src/components/common/modals/UnifiedModal.js` — `actions` → `div.mg-modal__actions`.
- **전역 스타일**: `main.css` 등의 `.mg-modal`, `.mg-modal--small|medium|large`, `.mg-modal--alert` 변형.
- **중첩 모달**: z-index·포커스 트랩 이슈로 푸터가 보이지 않는 경우, 상위 `position`·`overflow` 스택 확인.

---

## 완료 기록

| 일자 | 실행자 | 환경 (dev/stage) | 브라우저 | 결과 (통과/이슈 요약) |
|------|--------|------------------|----------|------------------------|
|      |        |                  |          |                        |

---

## 참고 — 코드·DOM 위치

| 항목 | 경로 / 요약 |
|------|-------------|
| 통합 로그인 primary 제출 | `frontend/src/components/auth/UnifiedLogin.js` |
| 세션 만료 경고 모달 | `frontend/src/components/common/SessionIdleWarningModal.js` |
| UnifiedModal (푸터 `.mg-modal__actions`) | `frontend/src/components/common/modals/UnifiedModal.js` |
| 표시 경계·숫자 필드 | `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` (세션 모달 본문은 SafeText·정적 문구) |

**core-solution-testing 스킬 정합**: 자동화가 있는 부분은 Playwright(`tests/e2e/tests/**/*.spec.ts`)로 보완하고, 본 문서는 **레이아웃·대비·잘림** 등 도구로 잡기 어려운 회귀를 수동으로 게이트한다.
