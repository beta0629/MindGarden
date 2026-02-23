# 서브에이전트 활용 표준

> 코드·디자인·테스트·문서 수정 시 서브에이전트 사용 규칙  
> @author MindGarden | @since 2025-02-22

## 서브에이전트 검토 요약 (사용 전 참고)

작업 요청 시 **먼저 아래 표로 적합한 서브에이전트와 스킬을 선택**한 뒤 호출한다.

| 서브에이전트 | 역할 | 적용 스킬 | 비고 |
|--------------|------|-----------|------|
| **core-designer** | UI/UX·레이아웃·비주얼 **설계만** (시안·토큰·스펙). **코드 작성 안 함** | /core-solution-standardization | 대시보드·리포트·새 화면 레이아웃 설계 시 **선행** |
| **core-coder** | React/JS·Java/Spring **코드 구현**. designer 시안 있으면 그에 맞춤 | /core-solution-frontend, /core-solution-atomic-design 등 | 구현 단계에서 사용 |
| **core-tester** | 단위·통합·E2E·보안 **테스트 작성·실행**. 코드 구현 안 함 | /core-solution-testing | |
| **explore** | 코드베이스 탐색·**작업 전 플랜·조사** (수정 작업 안 함) | /core-solution-documentation (문서 시) | 넓은 범위 작업 전 1단계 |
| **generalPurpose** | 복합·다단계, **문서 작성·정리** | /core-solution-documentation | |
| **shell** | 터미널·git·빌드 명령 실행 | — | |

### UI/레이아웃·비주얼 작업 시 워크플로우 (필수)

레이아웃 변경, 대시보드/리포트 UI 개선, 새 화면 비주얼 설계 등은 **반드시 설계 선행 → 구현** 순서를 따른다.

| 단계 | 서브에이전트 | 스킬 | 산출물 |
|------|--------------|------|--------|
| **1. 설계** | **core-designer** | /core-solution-standardization | 레이아웃·컴포넌트 구성·토큰 사용 스펙(또는 시안 설명) |
| **2. 구현** | **core-coder** | /core-solution-frontend, /core-solution-atomic-design (필요 시 /core-solution-design-system-css) | designer 스펙대로 코드 반영 |

- designer가 **코드를 수정하지 않음**. 코더가 designer 산출물을 참고해 구현한다.
- 상세 매핑은 아래 [작업 유형별 서브에이전트 매핑](#작업-유형별-서브에이전트-매핑) 참고.

## 원칙

- **직접 수정 금지**: Agent가 코드/디자인/테스트를 직접 수정하지 않고, 해당 영역 서브에이전트를 호출한다.
- **누락 시 추가**: 매핑에 없는 작업 유형이 발견되면 `.cursor/skills/core-solution-rules/SKILL.md`의 [서브에이전트 활용 매핑] 섹션에 행을 추가한 뒤, 해당 서브에이전트를 사용한다.

## 작업 유형별 서브에이전트 매핑

| 작업 유형 | 서브에이전트 | 적용 스킬 |
|----------|--------------|----------|
| React/JS 컴포넌트 코드 | core-coder | /core-solution-frontend |
| Java/Spring 백엔드 | core-coder | /core-solution-backend |
| UI/UX·레이아웃·비주얼 설계 | core-designer | /core-solution-standardization |
| 헤더·푸터·공통 레이아웃 | core-coder | /core-solution-frontend, /core-solution-atomic-design |
| 스케줄·캘린더·모달 UI | core-coder | /core-solution-frontend |
| 매핑·ERP·비즈니스 로직 | core-coder | /core-solution-erp, /core-solution-business-flow |
| 단위·통합·E2E 테스트 | core-tester | /core-solution-testing |
| DB 스키마·Entity | core-coder | /core-solution-database-first |
| 리포트·차트·대시보드 UI | core-coder | /core-solution-frontend |
| 설정·시스템 페이지 | core-coder | /core-solution-frontend, /core-solution-atomic-design |
| API 설계·연동 | core-coder | /core-solution-api, /core-solution-backend |
| **작업 전 플랜·조사·영역 분석** | **explore** | /core-solution-documentation |
| **문서 작성·정리·체계화** | **generalPurpose** | /core-solution-documentation |
| 코드베이스 탐색·분석 | explore | — |

## 플랜 서브에이전트 + 문서 전용 서브에이전트 워크플로우

문서를 바탕으로 체계화된 프로젝트를 유지하려면 **작업 전 플랜**과 **문서 전용** 흐름을 함께 사용한다.

| 단계 | 서브에이전트 | 용도 |
|------|--------------|------|
| **1. 플랜·조사** | **explore** | 문서화할 영역·기존 docs·누락 항목·우선순위 조사. "어디를 문서로 남길지" 목록 산출. |
| **2. 문서 작성·정리** | **generalPurpose** | 조사 결과를 바탕으로 docs/ 작성·수정·재구성. **/core-solution-documentation** 스킬 적용. |

- **문서 정리해줘**, **표준 문서 만들어줘** 등 요청 시: 먼저 **explore**로 현재 docs 구조·관련 코드·표준 목록을 파악한 뒤, **generalPurpose**로 실제 문서를 작성·수정한다.
- **스킬**: `.cursor/skills/core-solution-documentation/SKILL.md` — 문서 위치 체계, 품질 체크리스트, 플랜+문서 연계 규칙.

## 누락 영역 추가 절차

1. 새 작업 유형 식별 (예: 리포트·차트 컴포넌트 수정)
2. `.cursor/skills/core-solution-rules/SKILL.md` → [서브에이전트 활용 매핑] 테이블에 행 추가
3. 이후 해당 유형 작업 시 지정한 서브에이전트 호출

## 참조

- 메인 룰: `.cursor/skills/core-solution-rules/SKILL.md`
- **문서 작성·체계화**: `.cursor/skills/core-solution-documentation/SKILL.md`
- 레이아웃 관련: `docs/layout/README.md` → 서브에이전트 활용
