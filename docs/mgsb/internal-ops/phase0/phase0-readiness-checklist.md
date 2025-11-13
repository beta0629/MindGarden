# Phase 0 Readiness Checklist – Internal Operator Portal

작성일: 2025-11-13

## 1. 환경 준비 (ENV-01~07)
| ID | 항목 | 담당 | 목표일 | 상태 | 비고 |
| --- | --- | --- | --- | --- | --- |
| ENV-01 | 레포지토리 & CI/CD | mind | 2025-11-13 | ☑ | `frontend-ops`, `backend-ops`, GitHub Actions, ArgoCD |
| ENV-02 | 환경 분리/도메인 |  |  | ☐ | Namespace, Terraform, VPN/IP ACL |
| ENV-03 | 인증/권한 |  |  | ☐ | OIDC 클라이언트, RBAC/ABAC 문서 |
| ENV-04 | 데이터 소스/API |  |  | ☐ | DB 계정, `internal-api` 게이트웨이 |
| ENV-05 | Design System 확장 |  |  | ☐ | Admin 컴포넌트/토큰, Storybook |
| ENV-06 | Feature Flag |  |  | ☐ | 스키마/도구, 초기 플래그 정의 |
| ENV-07 | 테스트 프레임워크 | mind | 2025-11-13 | ☑ | Playwright/Cypress, JUnit/MockMvc, 계약 테스트 |

## 2. 산출물 진척
| 문서 | 파일 | 담당 | 목표일 | 상태 |
| --- | --- | --- | --- | --- |
| 사용자 시나리오 & 권한 매트릭스 | `user-flows.md` |  |  | ☑ |
| 승인/변경 프로세스 | `approval-process.md` |  |  | ☑ |
| 요구사항 요약 | `requirements-summary.md` |  |  | ☑ |
| UX 와이어프레임 & 접근성 | `ux/accessibility-report.md` |  |  | ☐ |
| Phase 1 기능 명세 | `../phase1/functional-spec.md` (예정) |  |  | ☐ |
| Phase 1 테스트 계획 | `../phase1/test-plan.md` (예정) |  |  | ☐ |

## 3. 이해관계자 승인 현황
- [ ] 운영팀 온보딩/요금제 정책 리뷰 완료
- [ ] SRE 배포/배치 제어 범위 승인
- [ ] 보안팀 RBAC/ABAC 정책 승인
- [ ] CS팀 티켓/FAQ 시나리오 합의

## 4. 회의 & 일정
- Weekly Phase 0 Sync: 매주 수요일 15:00 (메모: )
- UX 리뷰 워크숍: (일정 입력)
- Steering Committee 보고: (일정 입력)

## 5. 메모 / 리스크
- 모든 소스 수정 후 `config/shell-scripts/check-syntax.sh` 실행하여 backend `./gradlew check`, frontend `npm run lint` 통과 여부 확인. 실패 시 수정 후 재실행.
- 코드 품질(하드코딩/매직 넘버) 점검을 위해 `config/shell-scripts/check-hardcode.sh`를 추가로 실행하고 보고서를 확인할 것. 
