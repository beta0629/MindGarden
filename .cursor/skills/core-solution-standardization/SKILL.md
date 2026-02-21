---
name: core-solution-standardization
description: 디자인 및 소스 표준화 원칙 준수. docs/standards/ 문서 및 디자인 시스템 반드시 따름
---

# 디자인 및 소스 표준화 (Standardization)

Core Solution(MindGarden)의 모든 코드·UI는 **표준화 원칙**을 따릅니다.

## 1. 디자인 표준화

- **기준: 아토믹 디자인**: 디자인 표준은 아토믹 디자인(Atoms → Molecules → Organisms → Templates → Pages)을 기준으로 합니다. `/core-solution-atomic-design` 스킬 준수.
- **디자인 토큰**: 색상·간격·폰트는 `var(--mg-*)` CSS 변수만 사용. 하드코딩 금지
- **컴포넌트**: `MGButton`, `FormInput`, `CustomSelect`, `MGModal` 등 공통 컴포넌트를 atoms/molecules 계층에 맞게 사용
- **클래스명**: `mg-v2-*`, `cs-*` 등 디자인 시스템 규칙 준수

### 참조 문서
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
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

## 3. 규칙

- 새 코드 작성 시 해당 영역 표준 문서를 먼저 확인
- 기존 표준과 충돌하는 방식 금지
- 표준 문서에 없는 패턴은 추가 전 문서 업데이트 후 적용
