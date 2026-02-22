# 서브에이전트 활용 표준

> 코드·디자인·테스트 수정 시 서브에이전트 사용 규칙  
> @author MindGarden | @since 2025-02-22

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
| 코드베이스 탐색·분석 | explore | — |

## 누락 영역 추가 절차

1. 새 작업 유형 식별 (예: 리포트·차트 컴포넌트 수정)
2. `.cursor/skills/core-solution-rules/SKILL.md` → [서브에이전트 활용 매핑] 테이블에 행 추가
3. 이후 해당 유형 작업 시 지정한 서브에이전트 호출

## 참조

- 메인 룰: `.cursor/skills/core-solution-rules/SKILL.md`
- 레이아웃 관련: `docs/layout/README.md` → 서브에이전트 활용
