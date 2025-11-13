# MindGarden Internal Operator Portal – Development Plan

작성일: 2025-11-13

---

## 1. 환경 준비 현황 및 실행 티켓
| 번호 | 항목 | 작업 내용 | 담당 | 일정 | 비고 |
| --- | --- | --- | --- | --- | --- |
| ENV-01 | 레포지토리/CI | `frontend-ops`, `backend-ops` 레포 생성, GitHub Actions + ArgoCD 파이프라인 초기화 |  |  | 파이프라인 템플릿: build → test → docker → deploy |
| ENV-02 | 환경 분리/도메인 | Dev/Staging/Prod Namespace 정의, `ops.m-garden.co.kr` DNS/Terraform, VPN/IP ACL 설정 |  |  | Terraform 스크립트 및 VPN 정책 문서 필요 |
| ENV-03 | 인증/권한 | Identity Hub 운영 클라이언트 등록, RBAC/ABAC 스코프 문서화, MFA/기기 등록 정책 반영 |  |  | OIDC Redirect URI: `https://ops.m-garden.co.kr/auth/callback` |
| ENV-04 | 데이터 소스 | 중앙 DB/Redis/ELK 접근 권한 승인, `internal-api` Gateway 엔드포인트 설계 |  |  | DB 계정/Secret, API Gateway Rate Limit 설정 포함 |
| ENV-05 | Design System | Admin 컴포넌트/토큰 목록 정의, Storybook 확장, 접근성 가이드 업데이트 |  |  | `design-system` 브랜치 파생, 토큰 명세 공유 |
| ENV-06 | Feature Flag | `feature_flag` 테이블 스키마 확정, 관리 도구(LaunchDarkly/자체) 도입 결정 |  |  | 초기 플래그: `ops-dashboard`, `ops-approval`, `ops-automation` |
| ENV-07 | 테스트 프레임워크 | Playwright/Cypress 프로젝트 초기화, JUnit/MockMvc 템플릿, 계약 테스트(Postman/Newman) 세트 구성 |  |  | CI 통합, 테스트 데이터/Mock 서버 준비 |

> 각 항목별로 티켓 생성 후 담당자/마감일을 기입하여 추적한다.

---

## 2. Phase 0 – 요구사항 정제 (1~2주)
| Task ID | 작업 | 상세 내용 | 산출물 |
| --- | --- | --- | --- |
| P0-01 | 사용자 시나리오 | 운영팀/SRE/CS/보안 등 역할별 사용자 여정, 권한 매트릭스, 데이터 인터페이스 정의 | `docs/mgsb/internal-ops/phase0/user-flows.md` |
| P0-02 | UX 시안 | 핵심 화면(대시보드, 온보딩, 요금제) 와이어프레임, 접근성 체크리스트 | Figma 링크 + `ux/accessibility-report.md` |
| P0-03 | 승인 프로세스 합의 | 온보딩/요금제 승인 흐름, SLA, 변경 관리 정책 문서화 | `docs/mgsb/internal-ops/phase0/approval-process.md` |
| P0-04 | 환경 세팅 실행 | 환경 준비 티켓(ENV-01~07) 실행 여부 확인 및 완료 보고 | 티켓 업데이트 + `phase0-readiness-checklist.md` |

> Phase 0 종료 기준: 위 4개 산출물이 리뷰/승인되고, ENV-01~07 항목이 완료되거나 WIP 상태가 명확히 기록되어야 한다.

---

## 3. Phase 1 – 핵심 운영 기능 MVP (4~6주)
### 3.1 기능 요구사항
1. **대시보드**
   - KPI 카드: SLA(가동률), AI 토큰 사용량, 결제 성공률, 주요 알림 카운트
   - 알림 피드: 최신 승인/배포/Incident 알림, 필터(우선순위/카테고리)
   - 온콜 위젯: 현재 온콜자, 연락처, 핸드오버 일정
   - 데이터 소스: 중앙 DB 뷰 + Metrics API, 알림 Event Stream(Kafka)

2. **테넌트 온보딩 & 계약**
   - 체크리스트 단계: 계약 확인 → 결제 검증 → 권한 템플릿 적용 → 데이터 이관 확인
   - 승인/거절 플로우: 사유 입력, 자동 알림, 재요청 지원
   - API 연동: `tenant_onboarding_task`, `tenant_subscription`, `tenant_ai_service`

3. **요금제 & 애드온 관리**
   - Catalog 관리: 요금제 생성/수정, 수수료율, 프로모션 코드, 유효기간
   - 애드온 승인: 요청 목록, 히스토리, 인보이스 미리보기
   - 청구 검토: 월별 AI 사용량, 추가 과금 라인, 세금계산서 발행 상태

### 3.2 테스트 요구사항
- 역할별 접근 통제(권한 상승 방지, 경로 접근 제한)
- 실패 시나리오: 온보딩 결제 실패, 승인 거절, 청구 계산 오류
- 회귀 스모크: 핵심 플로우(온보딩 → 승인 → 요금제 활성화) 자동화
- 데이터 검증: 다중 테넌트 시나리오, 감사 로그 기록 일치 확인

### 3.3 산출물
- 기능 명세: `docs/mgsb/internal-ops/phase1/functional-spec.md`
- 데이터 모델: `docs/mgsb/internal-ops/phase1/data-model.md`
- API 계약서: `docs/mgsb/internal-ops/phase1/api-contract.yaml`
- 테스트 계획: `docs/mgsb/internal-ops/phase1/test-plan.md`

---

## 4. 리스크 모니터링 & 대응 플랜
| 카테고리 | 모니터링 항목 | 대응책 |
| --- | --- | --- |
| 스코프 관리 | 백로그/Sprint Scope, 변경 요청 내역 | 변경 관리 위원회, MVP 우선순위 재확인, 문서화된 승인 절차 |
| 데이터 무결성 | 다중 테넌트 회귀 테스트, 배포 전 DB 스냅샷 | QA 스크립트 자동화, 장애 시 복구 Runbook |
| 보안/권한 | OWASP 테스트, ABAC 검증 로그 | 정기 보안 리뷰, Red Team 시나리오, 정책 자동화 |
| 배포/배치 | 배포 실패율, 배치 지연 알림 | 배포 시뮬레이션, 롤백 자동화, 헬스체크 강화 |
| 외부 연동 | Webhook 실패율, 재시도 큐 상태 | 재시도 로직, SLA 알림, 연동 상태 대시보드 |
| 운영팀 Adoption | 포털 사용률, 수동 티켓 건수 | 베타 피드백 회의, 교육/Runbook, 개선 우선순위 조정 |
| 자동화 규칙 | 제한/요금 자동화 발생 로그 | Feature Flag 단계적 적용, Shadow Mode 검증 |
| AI 품질 | 챗봇/추천 오답률, CS 문의 급증 | 품질 지표 모니터링, 휴먼 검수, 데이터 정제 |

- 리스크 리뷰: 스프린트 말 mini-postmortem + 월간 Steering Committee 공유
- 비상 대응 Runbook: Incident 메뉴에 팀별 연락망 및 복구 절차 업데이트
- KPI 관제: 온보딩 성공률, 승인 처리 속도, 배포 실패율을 운영 대시보드에 반영

---

## 5. 다음 단계 요약
1. ENV-01~07 실행 티켓 발행 및 담당자 배정
2. Phase 0 산출물 작성(요구사항, UX, 승인 프로세스, 준비 체크리스트)
3. Phase 1 기능 명세/테스트 계획 초안 작성 착수
4. 리스크 모니터링 루틴 및 회의 일정 확정

위 계획을 기준으로 즉시 Phase 0 실행에 돌입할 수 있다.
