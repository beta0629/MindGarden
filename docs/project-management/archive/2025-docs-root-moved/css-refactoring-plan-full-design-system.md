# 전체 디자인 시스템 CSS 정리·재구축 계획서

## 1. 목표
- **불필요한·레거시 CSS 전부 정리**, **아토믹 디자인 관련 CSS만 사용**하도록 재구축.
- Single Source of Truth: 공통 컴포넌트(모달, 버튼, 카드 등)는 `06-components/`와 디자인 토큰만 사용. 테마는 색상·타이포만.

## 2. 스킬·서브에이전트 (필수)
- **스킬**: `.cursor/skills/core-solution-design-system-css/SKILL.md` — 전체 디자인 정리·레거시 삭제·아토믹 전용 재구축 시 이 스킬과 본 계획서를 따름. 스킬스에 해당 내용이 명시되어 있음.
- **실행**: 작업은 **반드시 서브에이전트(core-coder)** 로 진행. 직접 대량 CSS 삭제·수정 없이, 서브에이전트와 스킬스를 사용해 오류 없이 일관되게 진행.

## 3. 삭제·정리 대상 (우선순위)

### 3.1 즉시 삭제
- `frontend/src/**/*.backup.*` (이미 1차 정리에서 다수 삭제됨, 잔여분 제거)
- 사용 중단된 레거시 CSS 파일:
  - `Modal.css` (UnifiedModal 사용으로 대체)
  - `ScheduleModalOld.css` (있으면 삭제, ScheduleModalOld.js가 참조하면 해당 import 제거 후 삭제)
  - 기타 `*Old*.css`, `*Legacy*.css` 패턴

### 3.2 import 정리
- 삭제된 파일을 import하는 모든 소스에서 해당 import 제거 (예: `MGModal.css` → 이미 MGModal.js에서 제거됨)
- `ScheduleModalOld.js`가 있다면 라우트·사용처 확인 후 제거 또는 `ScheduleModal`(UnifiedModal 기반)로 대체

### 3.3 테마 CSS 역할 제한
- `ScheduleB0KlA.css`, `AdminDashboardB0KlA.css`, `mindgarden-design-system.css` 등에서:
  - `.mg-modal`, `.mg-modal__body` 등 **공통 컴포넌트의 height/min-height/flex** 제어 규칙 제거 (이미 모달 정리에서 진행)
  - 테마 클래스는 **색상, border, font** 등 스킨만 담당

## 4. 유지·강화 구조 (아토믹 전용)

- `frontend/src/styles/main.css`: 토큰 → 06-components → 테마 → 유틸리티 순서 유지.
- `06-components/`: `_unified-modals.css`, `_buttons.css`, `_cards.css`, `_loading.css`, `_header.css`, `_dropdowns.css`, `_notifications.css` 등만 사용. 중복 정의 금지.
- 컴포넌트 단위 CSS: 각 atoms/molecules/organisms 폴더 내 전용 CSS만 두고, 공통 스타일은 06-components로 이관.

## 5. 진행 순서 (서브에이전트 실행 시)

1. **삭제된 CSS를 참조하는 import 일괄 제거** (예: `MGModal.css`, `Modal.css`, `ScheduleModalOld.css` 등 — grep 검색 후 해당 import 라인 삭제). **빌드 오류 방지 최우선.**
2. **잔여 백업·레거시 파일 검색 후 삭제** (`.backup.*`, `*Old*.css`, `*Legacy*.css`, 사용 중단 Modal/공통 CSS)
3. **테마 CSS에서 공통 컴포넌트 레이아웃 규칙 재검토·제거** (height, flex, min-height 등)
4. **main.css 외 불필요한 전역 CSS import 정리** (index.css 등에서 중복 import 제거 가능 여부 확인)
5. **빌드 통과 확인** (`cd frontend && npm run build:ci`) 후 커밋

## 6. 참고
- 모달 전용 정리: `docs/css-refactoring-plan-modal.md`
- 스킬: `.cursor/skills/core-solution-design-system-css/SKILL.md`
