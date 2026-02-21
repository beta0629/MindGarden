---
name: core-solution-rules
description: Core Solution(MindGarden) 프로젝트 전체 룰 인덱스. 백엔드·프론트·API·코드스타일 표준 적용 시 참조할 스킬과 문서 목록.
---

# Core Solution 룰 (전체)

이 프로젝트는 **Core Solution / MindGarden** 표준을 따릅니다. 작업 유형에 따라 아래 스킬과 문서를 적용하세요.

## 개발 순서 (DB 우선)

**DB 관련 기능 추가·수정 시** 반드시 다음 순서를 따릅니다.

1. **DB 테이블·스키마 조회** → 기존 테이블, 칼럼, 쿼리, 프로시저 확인
2. **필요 시 DB 수정** → 테이블/칼럼 생성·수정, 쿼리·프로시저 수정
3. **백엔드 개발** → Entity, Repository, Service, API
4. **프론트엔드 개발** → 화면·연동 구현

상세 규칙은 `/core-solution-database-first` 스킬을 참조하세요.

## 필수 준수 사항

- **멀티테넌트**: tenantId 없는 데이터·API·쿼리는 절대 허용 안 됨. `/core-solution-multi-tenant` 참조.
- **표준화**: 디자인·소스 코드는 docs/standards/ 문서 및 디자인 시스템을 반드시 따름. `/core-solution-standardization` 참조.

## 사용할 스킬

| 작업 유형 | 적용 스킬 |
|----------|-----------|
| **DB 설계·테이블·쿼리·프로시저** | `/core-solution-database-first` |
| **멀티테넌트 (tenantId 필수)** | `/core-solution-multi-tenant` |
| **디자인·소스 표준화** | `/core-solution-standardization` |
| Java/Spring 백엔드 코드 | `/core-solution-backend` |
| React/JS/TS 프론트엔드 코드 | `/core-solution-frontend` |
| **아토믹 디자인** (Atoms/Molecules/Organisms) | `/core-solution-atomic-design` |
| API 호출·연동 코드 | `/core-solution-api` |
| 코드 포맷·스타일 정리 | `/core-solution-code-style` |
| 단위·통합·E2E·보안 테스트 | `/core-solution-testing` |
| 핵심 비즈니스 흐름 및 UI 규칙 | `/core-solution-business-flow` |

- Agent 채팅에서 `/` 입력 후 스킬 이름 검색하여 수동 호출 가능
- 관련 작업 시 Agent가 자동으로 위 스킬 중 적절한 것을 적용할 수 있음

## 표준 문서 위치 (docs/standards/)

- **CODE_STYLE_STANDARD.md** — 코드 스타일·포맷 (Java/JS)
- **BACKEND_CODING_STANDARD.md** — Controller/Service/Repository/Entity/DTO
- **FRONTEND_DEVELOPMENT_STANDARD.md** — 프론트 구조·상수화·디자인 시스템
- **API_CALL_STANDARD.md** — StandardizedApi 필수 (프론트 API 호출)
- **COMPONENT_STRUCTURE_STANDARD.md** — 컴포넌트 계층·시맨틱 태그
- **API_INTEGRATION_STANDARD.md**, **API_DESIGN_STANDARD.md**
- **DTO_NAMING_STANDARD.md**, **ERROR_HANDLING_STANDARD.md**, **LOGGING_STANDARD.md**
- **TESTING_STANDARD.md** — 단위/통합/E2E/보안/성능 테스트 (테스트 에이전트: core-tester)

작업 전 해당 영역 표준 문서를 참조하고, 위 스킬 규칙을 준수하세요.
