# Internal Operator Portal – Phase 0 Overview

작성일: 2025-11-13

## 목적
- 내부 운영 포털 MVP 착수 전 요구사항·UX·승인 프로세스를 정리하고, 환경 준비(ENV-01~07) 완료를 확인한다.
- 운영팀/SRE/CS/보안 등 이해관계자와 공통 기준을 맞추고 Phase 1 개발 범위를 확정한다.

## 산출물 목록
| 문서 | 경로 | 상태 |
| --- | --- | --- |
| 사용자 시나리오 & 권한 매트릭스 | [`user-flows.md`](./user-flows.md) | 진행 중 |
| 승인 & 변경 관리 프로세스 | [`approval-process.md`](./approval-process.md) | 진행 중 |
| 환경 준비 체크리스트 | [`phase0-readiness-checklist.md`](./phase0-readiness-checklist.md) | 시작 |
| UX 와이어프레임/접근성 보고 | [`ux/accessibility-report.md`](./ux/accessibility-report.md) | 준비 중 |
| 요구사항 요약 | [`requirements-summary.md`](./requirements-summary.md) | 진행 중 |
| 환경 세팅 가이드 | [`../ENV_SETUP.md`](../ENV_SETUP.md) | 완료 |

## 타임라인 (예상)
- Week 1: 요구사항 인터뷰, 사용자 시나리오 초안, ENV 티켓 발행
- Week 2: UX 시안 리뷰, 승인 프로세스 합의, Phase 1 범위 확정 회의

## 마일스톤 완료 기준
1. 위 산출물이 리뷰/승인됨
2. ENV-01~07 중 필수 항목(레포/CI, 인증, 데이터 소스, Design System)이 완료되거나 진행 중 상태 문서화
3. Phase 1 기능/테스트 명세 작성 착수 승인

## 이해관계자
- Product Owner: MindGarden HQ 운영 총괄
- Tech Lead: 내부 포털 백엔드/프런트 총괄
- SRE/DevOps 리드, 보안 책임자, CS 매니저

## 참고 문서
- `docs/mgsb/OPERATOR_PORTAL_DEV_PLAN.md`
- `docs/mgsb/ARCHITECTURE_OVERVIEW.md` (섹션 2.4~2.7, 10~12)
- `docs/mgsb/OPERATOR_PORTAL_DEV_CHECKLIST.md`
