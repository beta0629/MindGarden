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
- **라이브러리 활용**: 프로젝트에 필요한 기능(파일 업로드, 날짜/폼 검증, 차트 등)에 **적합한 검증된 라이브러리**가 있으면 사용하여 오류를 줄인다. 직접 구현보다 라이브러리를 쓰면 검증·에러 처리·엣지 케이스가 통일되어 유지보수와 버그 감소에 유리하다. (예: 파일 업로드 → react-dropzone)

## 서브에이전트 활용 매핑

**수정 작업 시 반드시 아래 매핑에 맞는 서브에이전트를 호출**한다. 매핑에 없는 작업 유형은 이 표에 추가한 뒤, 해당 서브에이전트를 사용하도록 한다.

| 작업 유형 | 서브에이전트 | 적용 스킬 | 비고 |
|----------|--------------|----------|------|
| **HTML 마크업 (퍼블리싱)** | **core-publisher** | /core-solution-publisher, /core-solution-atomic-design | designer 스펙 → HTML. JS/CSS 수정 안 함 |
| React/JS 컴포넌트 코드 작성·수정 | core-coder | /core-solution-frontend | 프론트엔드 소스. publisher HTML 기반 |
| Java/Spring 백엔드 코드 | core-coder | /core-solution-backend | API, Service, Entity 등 |
| UI/UX·레이아웃·비주얼 설계 | core-designer | /core-solution-standardization, /core-solution-design-handoff | 시안·토큰·스펙 정의 선행. 산출물은 publisher 전달 |
| 헤더·푸터·공통 레이아웃 수정 | core-coder | /core-solution-frontend, /core-solution-atomic-design | B0KlA·디자인 토큰 준수 |
| 스케줄·캘린더·모달 UI 수정 | core-coder | /core-solution-frontend | core-designer 시안 있으면 참조 |
| 매핑·ERP·비즈니스 로직 | core-coder | /core-solution-erp, /core-solution-business-flow | |
| 단위·통합·E2E 테스트 | core-tester | /core-solution-testing | 코드 구현은 하지 않음 |
| DB 스키마·Entity 설계 | core-coder | /core-solution-database-first | |
| 리포트·차트·대시보드 UI | core-coder | /core-solution-frontend | core-designer 시안 있으면 참조 |
| 설정·시스템 페이지 | core-coder | /core-solution-frontend, /core-solution-atomic-design | |
| API 설계·연동 | core-coder | /core-solution-api, /core-solution-backend | |
| **에러·500 원인 분석·수정 제안** | **core-debugger** | /core-solution-debug | 로그·스택트레이스 해석, 재현 절차·수정 제안. 코드 수정은 core-coder 위임 |
| **서버 상태·에러 로그·긴급 복구** | **shell** → **core-debugger** → **core-coder** | /core-solution-server-status | 개발·운영 서버 상태/로그/복구 후 원인 분석·core-coder 조치 |
| **배포·CI 워크플로 수정** | **core-coder** | /core-solution-deployment | GitHub Actions·systemd·배포 체크리스트·롤백 |
| **전반 기획·단계 설계·실행 계획** | **core-planner** | /core-solution-planning | 범위·Phase·산출물 정리, **분배실행(역할별 실행 분배)** 표 작성 — 디자인(core-designer)·코더(core-coder)·디버그(core-debugger)·**컴포넌트관리(core-component-manager)**·쉘(shell)·문서정리(generalPurpose)·탐색(explore)·테스터(core-tester)에 맞춰 분배. 컴포넌트 정리 Phase 시 component-manager + core-coder 함께 배정 권장. 실행은 해당 서브에이전트 호출로 진행 |
| **화면·서버 컴포넌트 중복·적재적소 배치 제안** | **core-component-manager** | /core-solution-encapsulation-modularization, /core-solution-atomic-design | 코더와 한 팀(제안 → core-coder 실행). 코드 직접 작성 안 함 |
| **작업 전 플랜·조사·영역 분석** | **explore** | /core-solution-documentation | 넓은 범위 작업 전 현황·누락·우선순위 조사 |
| **문서 작성·정리·체계화** | **generalPurpose** | /core-solution-documentation | 표준 문서·가이드 작성·수정·재구성. 기획(explore/core-planner) 후 진행 권장 |
| 새 작업 유형 추가 시 | — | — | docs/standards/SUBAGENT_USAGE.md 절차 따름 |

- **core-planner** 에이전트: **기획 오케스트레이터**. 사용자 명령 → 기획이 담당 배정(분배실행 표) → 서브에이전트 실행(병렬 가능) → **결과를 기획에게 보고** → 기획이 취합해 **사용자에게 최종 보고**. 역할별(디자인·코더·디버그·쉘·문서정리·탐색·테스터) 담당·전달 프롬프트 명시. `/core-solution-planning` 스킬 적용.
- **explore** 서브에이전트: 코드베이스 탐색·분석, **작업 전 조사** 시 사용 (수정 작업 아님). 문서·기획 시 1단계로 사용.
- **generalPurpose** 서브에이전트: 복합 연구·다단계 작업, **문서 작성·정리** 시 /core-solution-documentation 스킬과 함께 사용.
- **서버 상태·긴급 복구**: 개발·운영 서버 상태·에러 로그 확인, 긴급 복구(백업 복원·재시작), 원인 분석 후 core-coder 즉시 조치는 **shell** → **core-debugger** → **core-coder** 순서로 진행. `/core-solution-server-status` 스킬 적용.
- **UI/레이아웃·비주얼 작업**: **core-designer(설계)** → **core-publisher(HTML 마크업)** → **core-coder(JSX·로직·스타일)** 순서. `docs/standards/SUBAGENT_USAGE.md` 참고.

## 사용할 스킬

| 작업 유형 | 적용 스킬 |
|----------|-----------|
| **DB 설계·테이블·쿼리·프로시저** | `/core-solution-database-first` |
| **멀티테넌트 (tenantId 필수)** | `/core-solution-multi-tenant` |
| **디자인·소스 표준화** | `/core-solution-standardization` |
| **디자이너 산출물·코더 전달 형식** | `/core-solution-design-handoff` (core-designer 전용) |
| **퍼블리셔 HTML 마크업 표준** | `/core-solution-publisher` (core-publisher 전용) |
| Java/Spring 백엔드 코드 | `/core-solution-backend` |
| React/JS/TS 프론트엔드 코드 | `/core-solution-frontend` |
| **아토믹 디자인** (Atoms/Molecules/Organisms) | `/core-solution-atomic-design` |
| API 호출·연동 코드 | `/core-solution-api` |
| 코드 포맷·스타일 정리 | `/core-solution-code-style` |
| 단위·통합·E2E·보안 테스트 | `/core-solution-testing` |
| 핵심 비즈니스 흐름 및 UI 규칙 | `/core-solution-business-flow` |
| **ERP 연동·거래 생성·트러블슈팅** | `/core-solution-erp` |
| **모달 추가·수정** | `/core-solution-unified-modal` |
| **전반 기획·Phase·서브에이전트 가동 계획** | `/core-solution-planning` |
| **서버 상태·에러 로그·긴급 복구** | `/core-solution-server-status` |
| **배포·CI 워크플로 수정** | `/core-solution-deployment` |
| **문서 작성·정리·체계화** | `/core-solution-documentation` |
| **캡슐화·모듈화**(경량화·반복 제거) | `/core-solution-encapsulation-modularization` |
| **에러·500 원인 분석·수정 제안**(core-debugger) | `/core-solution-debug` |

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
