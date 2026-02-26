---
name: core-solution-planning
description: 전반 기획 절차·산출물·서브에이전트 가동 계획. 프로젝트·펜슬(B0KlA)·아토믹 디자인·LNB/GNB·색상 등 기획 필수 지식, 화면설계서 작성 및 디자이너 전달 방법 포함.
---

# Core Solution 기획 스킬

이 스킬은 **기획에이전트(core-planner)** 및 “전반 기획이 필요한 작업”에 적용합니다. 기획을 잘 해야 설계·구현·검증이 끊기지 않고, **core-designer, core-coder, core-debugger, explore, core-tester**가 순서대로 가동됩니다.

## 0. 기획 시 필수 지식 — 프로젝트·디자인 시스템·레이아웃

기획 시 **아래 개념을 알고 있어야** 합니다. LNB/GNB·색상·아토믹 계층을 정확히 써야 디자이너·코더가 일관되게 구현합니다.

### 0.0 프로젝트 기본

- **프로젝트**: MindGarden(마인드가든), Core Solution 표준. 도메인: 상담 매칭·스케줄·회기·결제·멀티테넌트. 역할: ADMIN, CONSULTANT, CLIENT, STAFF 등.
- **참조**: `docs/standards/`, `docs/project-management/`, `docs/layout/README.md`.

### 0.1 펜슬·아토믹 디자인

- **펜슬(Pencil)**: `mindgarden-design-system.pen` — 디자인 스펙 단일 소스. **B0KlA**는 어드민 대시보드용 비주얼 스펙. 어드민 화면은 B0KlA·어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample) 기준으로 기술.
- **아토믹 디자인**: Atoms → Molecules → Organisms → Templates → Pages. 기획 시 "상단 바", "목록 테이블", "모달 폼" 등을 Organism/블록 단위로 배치를 적는다.
- **스킬**: `/core-solution-atomic-design`, `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`.

### 0.2 공통 레이아웃·LNB·GNB

- **공통 레이아웃**: **GNB(상단) + LNB(좌측) + 메인 콘텐츠**. `AdminCommonLayout`, `DesktopLayout`/`MobileLayout` 참조.
- **LNB(좌측 로컬 네비)**: 사이드바 260px, 배경 `#2C2C2C`, 메뉴 높이 44px, 활성 `#3D5246`. 모바일은 드로어(햄버거). `DesktopLnb.js`, `RESPONSIVE_LAYOUT_SPEC.md` §3.1, `LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`.
- **GNB(상단 글로벌 네비)**: 높이 64px, 배경 `#FAF9F7`, 구분선 `#D4CFC8`. 로고·검색·알림·프로필. `DesktopGnb.js`, `RESPONSIVE_LAYOUT_SPEC.md` §3.2.
- **메인**: LNB 오른쪽(데스크톱). 배경 `#FAF9F7`~`#F2EDE8`. `ContentArea` + `ContentHeader` + 본문.

#### 0.2.1 어드민 페이지 기본 구조 — AdminCommonLayout 필수

- **어드민(관리자) 대시보드·관리 화면**의 **기본 레이아웃**은 **AdminCommonLayout**을 사용한다.
- **모든 신규 어드민 페이지**는 반드시 **AdminCommonLayout**으로 감싸서 구현한다. (GNB·LNB가 공통으로 노출되도록.)
- 기획서·화면설계서·코더 전달문에 **“본문은 AdminCommonLayout의 children으로 넣고, title/loading 등 props만 페이지별로 지정”** 이라고 명시한다.
- **참조**: `frontend/src/components/layout/AdminCommonLayout.js`, `docs/layout/README.md`. 적용 예: 공통코드 관리, 회기 관리, 패키지 요금 관리, 사용자 관리 등.

### 0.3 색상·디자인 토큰

- **단일 소스**: `frontend/src/styles/unified-design-tokens.css`. 하드코딩 색상 금지.
- **토큰**: `--mg-primary-*`, `--mg-success-*`, `--mg-error-*`, `--mg-warning-*`. 어드민 B0KlA: `--ad-b0kla-green`, `mg-v2-ad-b0kla__*` 클래스.
- **참조**: `RESPONSIVE_LAYOUT_SPEC.md`, `unified-design-tokens.css`.

---

## 0.4 사용자 관점 우선 — 기획 시 먼저 할 일

기획 단계에서 **사용자 입장**을 가장 먼저 생각합니다. "사용자가 편하게 사용할 것인가"를 기준으로 다음 세 가지를 정하고, 이 내용을 **core-designer(디자이너)에게 넘깁니다.**

| 항목 | 내용 | 디자이너 전달 |
|------|------|----------------|
| **사용성(편하게 사용)** | 누가(역할), 어떤 목적으로, 어떤 흐름으로 쓰는지. 클릭·입력·이동이 최소로 되게 할지, 자주 쓰는 동작을 앞에 둘지 등. | 사용자 시나리오·우선 동작·제약을 core-designer 전달문에 포함 |
| **정보 노출 범위** | 어떤 정보를, **누구에게**(역할별), **어느 수준까지** 보여 줄지. 숨길 필드·마스킹·권한별 노출 여부. | "노출할 정보·역할별 범위·비노출 항목"을 core-designer 전달문에 명시 |
| **레이아웃(배치)** | 화면·영역별로 **무엇을 어디에** 둘지. 상단/좌측/본문/모달 구분, 블록 순서, 강조할 영역. | "화면별·블록별 배치 요구사항"을 core-designer 전달문에 포함 |

- **순서**: (1) 사용자가 편하게 쓰는 흐름·사용성 → (2) 정보 노출 범위 정하기 → (3) 레이아웃(배치) 정하기. 이 결과를 **디자이너에게 넘겨** 시안·토큰·구체 레이아웃을 설계하게 합니다.
- **core-designer 호출 시**: 전달하는 태스크 설명에 위 세 가지(사용성 요구·정보 노출 범위·레이아웃/배치 요구)를 반드시 포함합니다.

## 0.5 화면설계서 작성 및 디자이너 전달

UI/비주얼이 포함된 기능을 기획할 때는 **화면설계서**를 작성한 뒤, 이를 **core-designer에게 전달**하여 시안·토큰·레이아웃을 설계하게 합니다.

### 화면설계서에 포함할 항목

| 항목 | 설명 |
|------|------|
| **화면 개요** | 화면명, 접근 권한(역할), 권장 라우트, 주요 동작(목록/등록/수정/상세 등) |
| **사용성 요구** | §0.4와 동일. 누가, 어떤 목적·흐름으로 쓰는지, 자주 쓰는 동작 배치 |
| **정보 노출 범위** | 목록/폼에 노출할 필드, 역할별 노출·비노출, 마스킹 여부 |
| **레이아웃(배치)** | LNB/GNB/메인 구분, 상단 바(제목·액션), 본문(테이블·카드·폼), 모달·드로어 사용 여부. 블록 순서(위→아래, 좌→우) |
| **영역·컴포넌트** | 상단 바·ContentHeader·ContentArea·테이블·UnifiedModal 등. B0KlA·mg-v2-ad-b0kla__* 클래스 참조 여부 |
| **색상·토큰 참조** | `unified-design-tokens.css`, B0KlA(어드민), 주조/보조/테두리 색. §0.3 참조 |
| **완료 기준** | 디자이너 산출물로 "코더가 구현할 수 있는지" 검증 가능한 체크리스트 |

### 작성·저장 위치

- **저장**: `docs/design-system/` 또는 `docs/project-management/` 아래, 예: `docs/design-system/SCREEN_SPEC_기능명.md`.
- **기획서와 연계**: 기획서(예: `docs/project-management/기능명_PLAN.md`)에 "화면설계서: docs/design-system/SCREEN_SPEC_기능명.md"를 명시하고, Phase 1(core-designer) 호출 시 해당 문서 경로를 전달.

### 디자이너 호출 시 전달

1. **화면설계서 경로** 또는 본문 요약을 프롬프트에 포함.
2. **§0.4 세 가지**(사용성·정보 노출·레이아웃 요구)를 태스크 설명에 반드시 포함.
3. **참조 지정**: 어드민 대시보드 샘플, `mindgarden-design-system.pen` B0KlA, `/core-solution-unified-modal`, `/core-solution-atomic-design`, `docs/standards` 등.
4. **산출 요청**: "화면별 레이아웃·블록/컴포넌트 구성·디자인 토큰·시안(또는 스펙 문서). 코드 작성 없음."

이렇게 작성한 화면설계서와 전달문을 바탕으로 core-designer가 시안을 설계하고, 이후 core-coder가 해당 산출물을 참조해 구현합니다.

## 1. 기획이 필요한 경우

- 새 기능·화면·API·배치 작업을 한 번에 정리하고 싶을 때
- 여러 화면·역할·시스템에 걸친 변경을 단계별로 나누고 싶을 때
- 버그·이슈가 여러 영역에 걸쳐 있어 원인 분석·수정 순서를 정하고 싶을 때
- 리팩터링·마이그레이션·표준 적용 범위와 순서를 정하고 싶을 때

## 2. 기획 절차 (권장 순서)

| 단계 | 내용 | 담당 |
|------|------|------|
| 1. 요구·배경 | 무엇을 왜 하는지, 목표 1~2문장 | core-planner |
| 2. 범위·경계 | 포함/제외, 영향 화면·API·DB·역할 | core-planner |
| 3. 의존성·순서 | 선행 작업, DB·API·공통 컴포넌트·시안 | core-planner |
| 4. Phase 설계 | 탐색 → 설계 → 구현 → 분석/수정 제안 → 테스트 등 단계 나누기 | core-planner |
| 5. 리스크·제약 | 기존 코드/DB/API 충돌, 성능·보안·멀티테넌트 | core-planner |
| 6. 산출물·완료 기준 | 단계별 “완료 조건”·체크리스트 | core-planner |
| 7. 실행 위임문 | Phase별 서브에이전트 타입 + 전달할 태스크 설명(프롬프트) 초안 | core-planner |

## 3. Phase별 서브에이전트 매핑

| Phase 유형 | 서브에이전트 | 전달 시 포함할 내용 |
|------------|--------------|---------------------|
| 코드베이스·영역 조사 | **explore** | 검색 목적, 키워드·경로·패턴, 산출 형태(목록·요약·파일 경로) |
| UI/UX·레이아웃·비주얼 설계 | **core-designer** | 설계 대상(화면·컴포넌트), 참조 시안·토큰·제약, 산출물 형태 |
| 코드 작성·수정 | **core-coder** | 대상 파일·기능, 입출력·API·DB, 참조 표준 문서 |
| 원인 분석·수정 제안 | **core-debugger** | 증상·재현 절차, 로그·확인 포인트, 수정 제안 전달 대상(core-coder) |
| 단위·통합·E2E·보안 테스트 | **core-tester** | 대상 모듈·API·화면, 시나리오·완료 기준 |

## 4. 실행 위임 시 유의사항

- **설계 우선**: UI/비주얼이 바뀌는 작업은 반드시 **core-designer(설계)** → **core-coder(구현)** 순서. 기획서에 이 순서를 명시한다.
- **병렬 가능한 Phase**: 서로 의존이 없으면 “explore A 영역”과 “explore B 영역”을 동시에 호출하는 등 병렬 실행을 명시할 수 있다.
- **태스크 설명은 구체적으로**: 각 서브에이전트에 넘길 프롬프트에는 “무엇을, 어떤 기준으로, 어떤 범위에서” 할지가 들어가야 한다. 모호하면 해당 에이전트가 잘못된 범위로 작업할 수 있다.
- **표준·스킬 참조**: core-coder/core-designer 호출 시 참조할 표준 문서·스킬(예: `/core-solution-database-first`, `/core-solution-frontend`)을 태스크 설명에 포함하면 일관성이 높아진다.
- **어드민 신규 페이지**: core-coder에 어드민 화면 구현을 위임할 때는 **“AdminCommonLayout으로 감싸고, 본문은 children, title/loading 등만 페이지별 지정”** 이라고 태스크에 명시한다(§0.2.1).

## 5. 기획 산출물 체크리스트

- [ ] 목표·범위·의존성이 한눈에 보이는가?
- [ ] 각 Phase에 “어떤 서브에이전트를 호출할지”가 적혀 있는가?
- [ ] 각 Phase에 “호출 시 전달할 태스크 설명(프롬프트) 초안”이 있는가?
- [ ] UI/비주얼 변경 시 core-designer → core-coder 순서가 지켜지는가?
- [ ] 완료 기준·체크리스트로 “다 했는지” 검증할 수 있는가?
- [ ] 어드민 신규 페이지인 경우 “AdminCommonLayout 적용”이 코더 전달문·완료 기준에 포함되어 있는가?

기획에이전트(core-planner)는 이 스킬을 적용해 기획 문서와 실행 위임문을 만들고, 실제 서브에이전트 호출은 부모 에이전트 또는 사용자가 수행합니다.
