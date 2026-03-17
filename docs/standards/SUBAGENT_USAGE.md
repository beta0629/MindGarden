# 서브에이전트 활용 표준

> 코드·디자인·테스트·문서 수정 시 서브에이전트 사용 규칙  
> @author MindGarden | @since 2025-02-22

## 서브에이전트 검토 요약 (사용 전 참고)

작업 요청 시 **먼저 아래 표로 적합한 서브에이전트와 스킬을 선택**한 뒤 호출한다.

| 서브에이전트 | 역할 | 적용 스킬 | 비고 |
|--------------|------|-----------|------|
| **core-planner** | **전반 기획·Phase 설계·분배실행**. 담당 배정 후 서브에이전트 호출·결과 취합·최종 보고. 직접 코드·디자인·디버깅 안 함 | /core-solution-planning | 복합·다단계 작업 시 1단계로 호출. 분배실행 표에 designer·coder·debugger·component-manager·tester 등 명시 |
| **core-designer** | UI/UX·레이아웃·비주얼 **설계만** (시안·토큰·스펙). **코드 작성 안 함** | /core-solution-standardization, /core-solution-design-handoff, /core-solution-common-modules | **펜슬 가이드 숙지 필수**. 새 컴포넌트 설계 시 공통 모듈 우선 검토(COMMON_MODULES_USAGE_GUIDE) |
| **core-publisher** | **HTML 마크업 전담**. designer 스펙을 아토믹·BEM 기반 HTML로 작성. JS/React·CSS 수정 안 함 | /core-solution-publisher, /core-solution-atomic-design, /core-solution-common-modules | 퍼블리싱 단계. 마크업 시 공통 클래스·구조 우선 사용 |
| **core-coder** | React/JS·Java/Spring **코드 구현**. designer 스펙 + **publisher HTML** 기반으로 수정 | /core-solution-frontend, /core-solution-atomic-design, /core-solution-common-modules 등 | publisher HTML → JSX·로직 연동. 새 기능·UI 시 공통 모듈 우선 검토 |
| **core-debugger** | **디버그 전용**. 에러·500 원인 분석, 로그·스택트레이스 해석, 재현 절차·수정 제안. **코드 수정은 core-coder 위임**. 필요 시 **shell**과 연계해 서버 로그·DB 확인 | /core-solution-debug | 오류 원인 파악·수정 제안 시 사용 |
| **core-tester** | 단위·통합·E2E·보안 **테스트 작성·실행**. 코드 구현 안 함 | /core-solution-testing | |
| **core-component-manager** | **화면·서버 컴포넌트 관리**. 중복 컴포넌트 여부 제안·적재적소 배치 제안·문서화. **core-coder와 한 팀**으로 협업(제안 → 코더 실행). 코드 직접 작성 안 함 | /core-solution-encapsulation-modularization, /core-solution-atomic-design, /core-solution-common-modules | 공통 모듈 목록·가이드 반영. 제품에 타입 없으면 generalPurpose + 역할 프롬프트 |
| **explore** | 코드베이스 탐색·**작업 전 플랜·조사** (수정 작업 안 함) | /core-solution-documentation (문서 시) | 넓은 범위 작업 전 1단계 |
| **generalPurpose** | 복합·다단계, **문서 작성·정리** | /core-solution-documentation | |
| **shell** | 터미널·git·빌드 명령 실행 | — | |

### UI/레이아웃·비주얼 작업 시 워크플로우 (필수)

레이아웃 변경, 대시보드/리포트 UI 개선, 새 화면 비주얼 설계 등은 **설계 → 퍼블리싱 → 구현** 순서를 따른다.

| 단계 | 서브에이전트 | 스킬 | 산출물 |
|------|--------------|------|--------|
| **1. 기획** | **core-planner** | /core-solution-planning | 기획서·요구사항·범위 (선택) |
| **2. 설계** | **core-designer** | /core-solution-standardization, /core-solution-design-handoff | 레이아웃·토큰·클래스명 스펙 |
| **3. 퍼블리싱** | **core-publisher** | /core-solution-publisher, /core-solution-atomic-design | **HTML 마크업** (designer 스펙 기반) |
| **4. 구현** | **core-coder** | /core-solution-frontend, /core-solution-atomic-design | publisher HTML → JSX·로직·스타일 연결 |

- **퍼블리셔**: HTML 마크업 전담. designer 스펙의 클래스·구조를 HTML로 작성. JS/CSS 수정 안 함.
- **코더**: publisher HTML을 기반으로 React/JSX 변환·이벤트·상태·API 연동.
- 상세 매핑은 아래 [작업 유형별 서브에이전트 매핑](#작업-유형별-서브에이전트-매핑) 참고.

## 원칙

- **캡슐화·모듈화**: 모든 코어 에이전트(기획·디자이너·퍼블리셔·코더 등)는 작업 시 **경량화·단순화·반복 제거**를 위해 `/core-solution-encapsulation-modularization` 스킬을 적용한다. 단위를 캡슐화·모듈화하고, 동일·유사 작업은 공통 모듈·스펙·문서로 한 번만 정의해 재사용한다.
- **공통 모듈 우선**: 새 기능·UI·마크업·구현 시 **기존 공통 모듈(UnifiedModal, ContentHeader, BadgeSelect, StandardizedApi 등)을 먼저 검토·사용**한다. `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`, `/core-solution-common-modules` 스킬 참조. **core-designer, core-publisher, core-coder, core-component-manager**는 해당 작업 시 이 원칙을 적용한다.
- **직접 수정 금지**: Agent가 코드/디자인/테스트를 직접 수정하지 않고, 해당 영역 서브에이전트를 호출한다.
- **누락 시 추가**: 매핑에 없는 작업 유형이 발견되면 `.cursor/skills/core-solution-rules/SKILL.md`의 [서브에이전트 활용 매핑] 섹션에 행을 추가한 뒤, 해당 서브에이전트를 사용한다.

## 작업 유형별 서브에이전트 매핑

| 작업 유형 | 서브에이전트 | 적용 스킬 |
|----------|--------------|----------|
| **HTML 마크업 (퍼블리싱)** | **core-publisher** | /core-solution-publisher, /core-solution-atomic-design |
| React/JS 컴포넌트 코드 | core-coder | /core-solution-frontend |
| Java/Spring 백엔드 | core-coder | /core-solution-backend |
| UI/UX·레이아웃·비주얼 설계 | core-designer | /core-solution-standardization, /core-solution-design-handoff |
| 헤더·푸터·공통 레이아웃 | core-coder | /core-solution-frontend, /core-solution-atomic-design |
| 스케줄·캘린더·모달 UI | core-coder | /core-solution-frontend |
| 매핑·ERP·비즈니스 로직 | core-coder | /core-solution-erp, /core-solution-business-flow |
| 단위·통합·E2E 테스트 | core-tester | /core-solution-testing |
| DB 스키마·Entity | core-coder | /core-solution-database-first |
| 리포트·차트·대시보드 UI | core-coder | /core-solution-frontend |
| 설정·시스템 페이지 | core-coder | /core-solution-frontend, /core-solution-atomic-design |
| API 설계·연동 | core-coder | /core-solution-api, /core-solution-backend |
| **에러·500 원인 분석·수정 제안** | **core-debugger** | /core-solution-debug |
| **서버 상태·에러 로그 확인·긴급 복구** | **shell** → **core-debugger** → **core-coder** | /core-solution-server-status |
| **배포·CI 워크플로 수정** | **core-coder** | /core-solution-deployment |
| **작업 전 플랜·조사·영역 분석** | **explore** | /core-solution-documentation |
| **문서 작성·정리·체계화** | **generalPurpose** | /core-solution-documentation |
| **화면·서버 컴포넌트 중복 제안·적재적소 배치 제안**(코더와 한 팀) | **core-component-manager** | /core-solution-encapsulation-modularization |
| 코드베이스 탐색·분석 | explore | — |

- **디버그 전용**: 500·API 오류 등 원인 분석·수정 제안은 **core-debugger** + **/core-solution-debug** 사용. 에이전트 정의: `.cursor/agents/core-debugger.md`, 스킬: `.cursor/skills/core-solution-debug/SKILL.md`. 디버거는 필요 시 **shell** 서브에이전트와 연계해 서버 로그(tail, journalctl 등)·DB(읽기 전용 쿼리) 확인을 요청할 수 있다. (제품에서 core-debugger 타입이 지원되지 않으면 **generalPurpose**로 호출 시 프롬프트에 "core-debugger 역할로 .cursor/agents/core-debugger.md 및 core-solution-debug 스킬을 참고하여 디버깅만 수행해주세요"를 명시한다.)

- **서버 상태·긴급 복구 전용**: 개발·운영 서버 상태 확인, 에러 로그 수집, 긴급 복구(백업 복원·재시작), 원인 분석 후 core-coder 즉시 조치는 **/core-solution-server-status** 스킬 적용. 순서: **shell**(SSH·상태·로그·복구 실행) → **core-debugger**(로그 해석·원인·core-coder용 태스크 작성) → **core-coder**(수정 적용). 스킬: `.cursor/skills/core-solution-server-status/SKILL.md`.

**문서 전담**: 새 문서 작성, 기존 문서 이동·이름 변경·삭제, docs 구조 정리, 인덱스(docs/README.md, standards/README.md) 갱신은 **반드시 문서관리 서브에이전트(generalPurpose + core-solution-documentation)** 로 수행한다. 문서를 분산 배치하거나 예전 문서를 그대로 참조하면 개발 혼선이 커지므로, 문서 작업은 전담 흐름으로만 진행한다. 진입점: [docs/README.md](../README.md).

## 플랜 서브에이전트 + 문서 전용 서브에이전트 워크플로우

문서를 바탕으로 체계화된 프로젝트를 유지하려면 **작업 전 플랜**과 **문서 전용** 흐름을 함께 사용한다.

| 단계 | 서브에이전트 | 용도 |
|------|--------------|------|
| **1. 플랜·조사** | **explore** | 문서화할 영역·기존 docs·누락 항목·우선순위 조사. "어디를 문서로 남길지" 목록 산출. |
| **2. 문서 작성·정리** | **generalPurpose** | 조사 결과를 바탕으로 docs/ 작성·수정·재구성. **/core-solution-documentation** 스킬 적용. |

- **문서 정리해줘**, **표준 문서 만들어줘** 등 요청 시: 먼저 **explore**로 현재 docs 구조·관련 코드·표준 목록을 파악한 뒤, **generalPurpose**로 실제 문서를 작성·수정한다.
- **문서 전담**: 문서 추가/이동/삭제/구조 변경은 **문서관리 서브에이전트 전담**이다. 다른 에이전트는 코드 수정만 하고, 문서 쪽은 "문서는 docs/standards/XXX 반영" 등 위치를 명시해 문서 전담 흐름으로 넘긴다.
- **스킬**: `.cursor/skills/core-solution-documentation/SKILL.md` — 문서 위치 체계, 품질 체크리스트, 플랜+문서 연계 규칙, **문서 전담 원칙**.

## 누락 영역 추가 절차

1. 새 작업 유형 식별 (예: 리포트·차트 컴포넌트 수정)
2. `.cursor/skills/core-solution-rules/SKILL.md` → [서브에이전트 활용 매핑] 테이블에 행 추가
3. 이후 해당 유형 작업 시 지정한 서브에이전트 호출

## 참조

- 메인 룰: `.cursor/skills/core-solution-rules/SKILL.md`
- **문서 작성·체계화**: `.cursor/skills/core-solution-documentation/SKILL.md`
- **디버깅·원인 분석 문서**: `docs/debug/` — core-debugger 산출물·재현 절차·수정 제안 문서 목차는 [docs/debug/README.md](../debug/README.md)
- 레이아웃 관련: `docs/layout/README.md` → 서브에이전트 활용
