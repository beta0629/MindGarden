---
name: core-solution-standardization
description: 디자인 및 소스 표준화 원칙 준수. docs/standards/ 문서 및 디자인 시스템 반드시 따름
---

# 디자인 및 소스 표준화 (Standardization)

Core Solution(MindGarden)의 모든 코드·UI는 **표준화 원칙**을 따릅니다.

## 디자인·개발 단일 출력 원칙

- **목표**: 디자인(core-designer)과 개발(core-coder) 산출물이 **한 사람이 한 것처럼** 동일한 디자인·코드가 나와야 한다.
- **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `frontend/src/styles/unified-design-tokens.css`, `AdminDashboardB0KlA.css`만 참조한다. 이외 임의 색상·값 사용 금지.
- **토큰·클래스명 통일**: 디자이너가 명시한 `var(--mg-*)`, `mg-v2-*`, `mg-v2-ad-b0kla__*` 등을 코더가 그대로 사용한다. 별칭·추측 금지.

## 1. 디자인 표준화

### 1.1 디자이너 필수 숙지 — 펜슬(Pencil) 디자인 가이드

**core-designer**는 일관된 디자인·레이아웃을 위해 **펜슬 가이드를 반드시 이해·숙지**해야 합니다.

- **필수 문서**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`
  - 펜슬(.pen) 단일 소스 설명: `mindgarden-design-system.pen`(B0KlA·레이아웃), `pencil-new.pen`(아토믹 컴포넌트)
  - B0KlA 색상 팔레트·레이아웃 구조·섹션 블록·타이포·반응형 브레이크포인트
  - **디자이너 숙지 체크리스트**: 설계 전·설계 시 해당 문서의 체크리스트를 적용
- **적용**: 새 화면·컴포넌트 설계 시 위 가이드와 두 .pen 파일에 정의된 시각 언어만 사용. 가이드에 없는 색·간격·컴포넌트 사용 금지.

### 1.2 아토믹·토큰·클래스

- **기준: 아토믹 디자인**: 디자인 표준은 아토믹 디자인(Atoms → Molecules → Organisms → Templates → Pages)을 기준으로 합니다. `/core-solution-atomic-design` 스킬 준수.
- **디자인 토큰**: 색상·간격·폰트는 `var(--mg-*)` CSS 변수만 사용. 하드코딩 금지
- **컴포넌트**: `MGButton`, `FormInput`, `CustomSelect`, `MGModal` 등 공통 컴포넌트를 atoms/molecules 계층에 맞게 사용
- **클래스명**: `mg-v2-*`, `cs-*` 등 디자인 시스템 규칙 준수

### 버튼·UI 색상
- **디자인 가이드에 정의된 색상만 사용**: `mindgarden-design-system.pen`, `unified-design-tokens.css`, `AdminDashboardB0KlA.css`에 정의된 토큰만 사용. 가이드에 없는 색상 사용 금지.
- **예외**: 삭제·환불 등 위험 액션용 danger 색상이 B0KlA/가이드에 없으면, 먼저 디자인 가이드에 추가한 후 사용. 임시로 `unified-design-tokens.css`의 `--color-danger` 사용 가능.

### 참조 문서
- **디자이너 필수**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬 가이드 숙지 후 설계
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` — 반응형·Pencil 레이아웃 프레임
- `frontend/src/styles/unified-design-tokens.css`

## 2. 소스 코드 표준화

### 백엔드 (Java/Spring)
- Controller/Service/Repository/Entity/DTO 구조 준수
- 네이밍, 예외 처리, 로깅 표준 준수

### 프론트엔드 (React)
- StandardizedApi로 API 호출 (apiGet/apiPost 직접 호출 금지)
- 상수화 (API URL, CSS 클래스, 라벨)
- 시맨틱 태그, 단일 책임

### 공통
- 매직 넘버·문자열 하드코딩 금지
- 네이밍 규칙 준수 (PascalCase, camelCase, UPPER_SNAKE_CASE)

### 참조 문서
- `docs/standards/BACKEND_CODING_STANDARD.md`
- `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`
- `docs/standards/CODE_STYLE_STANDARD.md`
- `docs/standards/API_CALL_STANDARD.md`
- `docs/standards/COMPONENT_STRUCTURE_STANDARD.md`

## 3. 페이지 수정 시 연관 요소 전체 수정

**한 페이지를 수정하면, 그 페이지와 연관된 모든 부수 요소도 함께 찾아 수정**합니다.

- **모달**: 해당 페이지에서 열리는 모달(생성/수정/상세/확인/환불 등) — 디자인·아이콘·버튼 스타일 통일
- **버튼**: 메인 액션, 보조 액션, 목록 내 액션 버튼 — 어드민 대시보드 표준 버튼 스타일 적용
- **연관 컴포넌트**: 페이지가 import하는 컴포넌트, 라우트·네비게이션으로 연결되는 위젯·카드
- **절차**: 페이지 수정 전 `import`·`Route`·모달 트리거 검색으로 연관 파일 파악 → 함께 수정

결과적으로 메인 페이지와 모달·버튼·위젯이 **동일한 디자인 시스템**으로 일관되게 표시되어야 합니다.

## 4. 규칙

- **문서 참조 시 최신 문서 우선**: 동일 주제 문서가 여러 개 있으면 수정일·버전이 높은 최신 문서를 참조. 과거·아카이브 문서를 쓰면 이전 표준으로 되돌아갈 수 있음
- 새 코드 작성 시 해당 영역 표준 문서를 먼저 확인
- 기존 표준과 충돌하는 방식 금지
- 표준 문서에 없는 패턴은 추가 전 문서 업데이트 후 적용
