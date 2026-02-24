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

- **서브에이전트·스킬스 활용**: 코드·디자인·테스트 **수정 시 반드시 서브에이전트와 스킬스를 사용**한다. 직접 수정보다 서브에이전트 위임을 우선한다. 작업 유형별 매핑은 아래 [서브에이전트 활용 매핑](#서브에이전트-활용-매핑)을 참조한다.
- **멀티테넌트**: tenantId 없는 데이터·API·쿼리는 절대 허용 안 됨. `/core-solution-multi-tenant` 참조.
- **표준화**: 디자인·소스 코드는 docs/standards/ 문서 및 디자인 시스템을 반드시 따름. `/core-solution-standardization` 참조.
- **디자인·개발 일관성**: core-designer와 core-coder 산출물은 **한 사람이 한 것처럼** 동일한 디자인·코드가 나와야 한다. 토큰·클래스명·구조를 통일하고, 단일 소스(`mindgarden-design-system.pen`, `unified-design-tokens.css`)만 사용한다.
- **페이지 수정 시 연관 요소 전체 수정**: 한 페이지를 수정할 때는 메인 화면뿐 아니라 모달·버튼·연관 컴포넌트 등 **연관된 모든 부수 요소**를 찾아 함께 수정한다. import·모달·라우트 검색으로 연관 파일을 파악한다.

## 서브에이전트 활용 매핑

**수정 작업 시 반드시 아래 매핑에 맞는 서브에이전트를 호출**한다. 매핑에 없는 작업 유형은 이 표에 추가한 뒤, 해당 서브에이전트를 사용하도록 한다.

| 작업 유형 | 서브에이전트 | 적용 스킬 | 비고 |
|----------|--------------|----------|------|
| React/JS 컴포넌트 코드 작성·수정 | core-coder | /core-solution-frontend | 프론트엔드 소스 |
| Java/Spring 백엔드 코드 | core-coder | /core-solution-backend | API, Service, Entity 등 |
| UI/UX·레이아웃·비주얼 설계 | core-designer | /core-solution-standardization | 시안·토큰·스펙 정의 선행 |
| 헤더·푸터·공통 레이아웃 수정 | core-coder | /core-solution-frontend, /core-solution-atomic-design | B0KlA·디자인 토큰 준수 |
| 스케줄·캘린더·모달 UI 수정 | core-coder | /core-solution-frontend | core-designer 시안 있으면 참조 |
| 매핑·ERP·비즈니스 로직 | core-coder | /core-solution-erp, /core-solution-business-flow | |
| 단위·통합·E2E 테스트 | core-tester | /core-solution-testing | 코드 구현은 하지 않음 |
| DB 스키마·Entity 설계 | core-coder | /core-solution-database-first | |
| 리포트·차트·대시보드 UI | core-coder | /core-solution-frontend | core-designer 시안 있으면 참조 |
| 설정·시스템 페이지 | core-coder | /core-solution-frontend, /core-solution-atomic-design | |
| API 설계·연동 | core-coder | /core-solution-api, /core-solution-backend | |
| **작업 전 플랜·조사·영역 분석** | **explore** | /core-solution-documentation | 넓은 범위 작업 전 현황·누락·우선순위 조사 (플랜 서브에이전트) |
| **문서 작성·정리·체계화** | **generalPurpose** | /core-solution-documentation | 표준 문서·가이드 작성·수정·재구성 (문서 전용 서브에이전트). 플랜(explore) 후 진행 권장 |
| 새 작업 유형 추가 시 | — | — | docs/standards/SUBAGENT_USAGE.md 절차 따름 |

- **explore** 서브에이전트: 코드베이스 탐색·분석, **작업 전 플랜·조사** 시 사용 (수정 작업 아님). 문서 작업 시 1단계로 사용.
- **generalPurpose** 서브에이전트: 복합 연구·다단계 작업, **문서 작성·정리** 시 /core-solution-documentation 스킬과 함께 사용.
- **UI/레이아웃·비주얼 작업**: 반드시 **core-designer(설계·시안 선행)** → **core-coder(구현)** 순서. `docs/standards/SUBAGENT_USAGE.md`의 [서브에이전트 검토 요약] 및 [UI/레이아웃·비주얼 작업 시 워크플로우] 참고.

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
| **모달 추가·수정** | `/core-solution-unified-modal` |
| **문서 작성·정리·체계화** | `/core-solution-documentation` |

- Agent 채팅에서 `/` 입력 후 스킬 이름 검색하여 수동 호출 가능
- 관련 작업 시 Agent가 자동으로 위 스킬 중 적절한 것을 적용할 수 있음

## 문서 전담 (문서관리 서브에이전트)

- **문서 추가·이동·삭제·구조 정리·인덱스 갱신**은 **문서관리 서브에이전트 전담**이다. generalPurpose + `/core-solution-documentation` 스킬로 요청한다. 문서가 분산되거나 예전 문서를 참고해 개발하면 혼선이 커지므로, 문서 작업은 이 흐름으로만 수행한다.
- 문서 진입점: **docs/README.md**. 표준 목록: **docs/standards/README.md**.

## 문서 참조 시 주의 (최신 문서 우선)

**문서를 참조할 때는 반드시 최신 문서부터 확인**합니다.

- `docs/standards/`, `docs/design-system/` 등 동일 주제 문서가 여러 개 있으면 **최신 수정일·버전이 높은 문서**를 우선 참조
- `docs/archive/`, `docs/project-management/archive/` 등 **과거·아카이브 문서**를 우선 사용하면 이전 표준으로 되돌아갈 수 있음
- 불확실하면 파일 수정일·버전 히스토리 확인 후 최신 문서 사용

## 표준 문서 위치 (docs/standards/)

- **SUBAGENT_USAGE.md** — 서브에이전트 활용 매핑, 누락 영역 추가 절차
- **CODE_STYLE_STANDARD.md** — 코드 스타일·포맷 (Java/JS)
- **BACKEND_CODING_STANDARD.md** — Controller/Service/Repository/Entity/DTO
- **FRONTEND_DEVELOPMENT_STANDARD.md** — 프론트 구조·상수화·디자인 시스템
- **API_CALL_STANDARD.md** — StandardizedApi 필수 (프론트 API 호출)
- **COMPONENT_STRUCTURE_STANDARD.md** — 컴포넌트 계층·시맨틱 태그
- **MODAL_STANDARD.md** — UnifiedModal 공통 모달, size(small/medium/large/fullscreen) 사용 가이드
- **API_INTEGRATION_STANDARD.md**, **API_DESIGN_STANDARD.md**
- **DTO_NAMING_STANDARD.md**, **ERROR_HANDLING_STANDARD.md**, **LOGGING_STANDARD.md**
- **TESTING_STANDARD.md** — 단위/통합/E2E/보안/성능 테스트 (테스트 에이전트: core-tester)
- **ERP_TROUBLESHOOTING.md** — ERP 연동·거래 생성 트러블슈팅 (로그·API·체크리스트)
- **TENANT_CONTEXT_USAGE.md** — TenantContextHolder set/clear/getRequiredTenantId 사용 표준
- **SUBAGENT_USAGE.md** — 서브에이전트 매핑·플랜+문서 워크플로우

작업 전 해당 영역 표준 문서를 참조하고, 위 스킬 규칙을 준수하세요.
