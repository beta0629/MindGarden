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

- **서브에이전트·스킬스 활용**: 코드·디자인·테스트 **수정 시 반드시 서브에이전트와 스킬스를 사용**한다. `core-coder`(코드), `core-designer`(UI/UX·디자인), `core-tester`(테스트) 등 작업 유형에 맞는 서브에이전트를 호출하고, 해당 영역 스킬(`/core-solution-frontend`, `/core-solution-backend` 등)을 적용한다. 직접 수정보다 서브에이전트 위임을 우선한다.
- **멀티테넌트**: tenantId 없는 데이터·API·쿼리는 절대 허용 안 됨. `/core-solution-multi-tenant` 참조.
- **표준화**: 디자인·소스 코드는 docs/standards/ 문서 및 디자인 시스템을 반드시 따름. `/core-solution-standardization` 참조.
- **디자인·개발 일관성**: core-designer와 core-coder 산출물은 **한 사람이 한 것처럼** 동일한 디자인·코드가 나와야 한다. 토큰·클래스명·구조를 통일하고, 단일 소스(`mindgarden-design-system.pen`, `unified-design-tokens.css`)만 사용한다.
- **페이지 수정 시 연관 요소 전체 수정**: 한 페이지를 수정할 때는 메인 화면뿐 아니라 모달·버튼·연관 컴포넌트 등 **연관된 모든 부수 요소**를 찾아 함께 수정한다. import·모달·라우트 검색으로 연관 파일을 파악한다.

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
| **ERP 연동·거래 생성·트러블슈팅** | `/core-solution-erp` |

- Agent 채팅에서 `/` 입력 후 스킬 이름 검색하여 수동 호출 가능
- 관련 작업 시 Agent가 자동으로 위 스킬 중 적절한 것을 적용할 수 있음

## 문서 참조 시 주의 (최신 문서 우선)

**문서를 참조할 때는 반드시 최신 문서부터 확인**합니다.

- `docs/standards/`, `docs/design-system/` 등 동일 주제 문서가 여러 개 있으면 **최신 수정일·버전이 높은 문서**를 우선 참조
- `docs/archive/`, `docs/project-management/archive/` 등 **과거·아카이브 문서**를 우선 사용하면 이전 표준으로 되돌아갈 수 있음
- 불확실하면 파일 수정일·버전 히스토리 확인 후 최신 문서 사용

## 표준 문서 위치 (docs/standards/)

- **CODE_STYLE_STANDARD.md** — 코드 스타일·포맷 (Java/JS)
- **BACKEND_CODING_STANDARD.md** — Controller/Service/Repository/Entity/DTO
- **FRONTEND_DEVELOPMENT_STANDARD.md** — 프론트 구조·상수화·디자인 시스템
- **API_CALL_STANDARD.md** — StandardizedApi 필수 (프론트 API 호출)
- **COMPONENT_STRUCTURE_STANDARD.md** — 컴포넌트 계층·시맨틱 태그
- **API_INTEGRATION_STANDARD.md**, **API_DESIGN_STANDARD.md**
- **DTO_NAMING_STANDARD.md**, **ERROR_HANDLING_STANDARD.md**, **LOGGING_STANDARD.md**
- **TESTING_STANDARD.md** — 단위/통합/E2E/보안/성능 테스트 (테스트 에이전트: core-tester)
- **ERP_TROUBLESHOOTING.md** — ERP 연동·거래 생성 트러블슈팅 (로그·API·체크리스트)

작업 전 해당 영역 표준 문서를 참조하고, 위 스킬 규칙을 준수하세요.
