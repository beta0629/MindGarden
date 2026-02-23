---
name: core-solution-design-system-css
description: Core Solution(MindGarden) 디자인 시스템 CSS 원칙. 전체 디자인 시스템 정리·재구축 시 불필요·레거시 CSS 모두 정리, 아토믹 디자인 관련 CSS만 사용. 정리·재구축은 반드시 서브에이전트와 본 스킬로 진행.
---

# 디자인 시스템 CSS 룰 (전체 정리·아토믹 전용)

프론트엔드 스타일 수정·추가·정리 시 이 스킬을 적용하세요.

**전체 디자인 시스템 정리·재구축 시 (필수)**  
- **불필요한 모든 CSS 정리**: 사용하지 않는 파일, 중복 정의, `.backup.*` 등 일체 삭제.  
- **레거시 CSS 모두 정리**: `*Old*.css`, `*Legacy*.css`, 사용 중단된 `MGModal.css`, `Modal.css`, `ScheduleModalOld.css` 등 삭제. 삭제된 파일을 import하는 코드는 즉시 제거.  
- **아토믹 디자인 관련 CSS만 사용**: 디자인 토큰 + `06-components/` 공통 컴포넌트 + atoms/molecules/organisms 전용 스타일만 유지.  
- **실행 방식**: 위와 같은 대규모 정리·재구축은 **반드시 서브에이전트(core-coder) + 본 스킬**로 진행. 계획 문서 `docs/css-refactoring-plan-full-design-system.md` 참고 후 단계별 실행. 직접 대량 삭제·수정 금지.

## 필수 원칙

- **아토믹 디자인 관련 CSS만 사용**: 디자인 토큰(`unified-design-tokens.css`, `00-core/`, `01-settings/`), 공통 컴포넌트 스타일(`06-components/`), 페이지/오거나이즘/몰레큘/아톰 전용 스타일만 유지. 그 외 레거시·중복·테마가 레이아웃을 덮어쓰는 CSS는 제거.
- **레거시 CSS 사용 금지**: `*.backup.*`, `*Old*.css`, 사용 중단된 `MGModal.css`, `Modal.css`, `ScheduleModalOld.css` 등 import·참조 금지. 삭제된 파일을 import하는 코드 즉시 제거.
- **Single Source of Truth**: 모달·버튼·카드 등 공통 컴포넌트 스타일은 `06-components/`(예: `_unified-modals.css`, `_buttons.css`, `_cards.css`)와 디자인 토큰에만 정의. 테마 CSS(`*B0KlA*.css` 등)는 색상·타이포만 덮어쓰고, 레이아웃(높이, flex, width) 간섭 금지.
- **정리·재구축 시 서브에이전트·스킬스 사용**: 전체 디자인 시스템 CSS 대청소, 불필요·레거시 CSS 모두 삭제, 아토믹 디자인 관련 CSS만 남기는 재구축 작업은 **반드시 서브에이전트(core-coder) + 본 스킬(core-solution-design-system-css)** 로 진행. 계획 문서 `docs/css-refactoring-plan-full-design-system.md` 참고 후 단계별 실행. 직접 대량 수정 금지.

## 허용되는 CSS 구조

1. **토큰·설정**: `styles/unified-design-tokens.css`, `00-core/`, `01-settings/`, `themes/`
2. **공통 컴포넌트**: `styles/06-components/` (`_unified-modals.css`, `_buttons.css`, `_cards.css`, `_loading.css` 등)
3. **아토믹 계층별 스타일**: 각 컴포넌트 폴더 내 `*.css` 또는 `*.module.css` (atoms/molecules/organisms/templates/pages)
4. **페이지/기능 전용**: 특정 페이지·기능용 CSS는 해당 라우트/도메인 폴더에만 두고, 공통 스타일은 06-components로 이관

## 금지

- 삭제된 또는 사용 중단된 CSS 파일 import
- 테마/레거시 CSS에서 공통 컴포넌트(모달·버튼 등)의 레이아웃(높이, flex, min-height 등) 재정의
- `.backup` 파일 생성·유지 (정리 시 삭제)

## Reference

- `docs/css-refactoring-plan-full-design-system.md` (전체 CSS 정리·재구축 계획)
- `docs/css-refactoring-plan-modal.md` (모달 Single Source of Truth)
- `frontend/src/styles/main.css` (진입점, 06-components 및 토큰 import만 유지)
