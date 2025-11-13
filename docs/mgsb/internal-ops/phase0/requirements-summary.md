# Internal Operator Portal – Phase 0 Requirements Summary

작성일: 2025-11-13

## 1. 프로젝트 범위 (Phase 0)
- 환경 준비(ENV-01~07) 실행 및 완료 확인
- 핵심 이해관계자 요구사항 수집 및 사용자 시나리오/권한 정의
- 운영 승인/배포 절차 정립, 변경 관리 정책 문서화
- Phase 1 개발을 위한 기능/데이터/테스트 요구사항 초안 확정

## 2. 기능 요구 초안 (Phase 1 대상)
| 영역 | 세부 요구사항 | 데이터 소스 | 주석 |
| --- | --- | --- | --- |
| 대시보드 | SLA·AI 토큰·결제 지표, 알림 피드, 온콜 위젯 | Metrics API, Notification Stream | 실시간 업데이트, 필터 제공 |
| 온보딩 | 체크리스트, 승인/거절, 사유 기록 | `tenant_onboarding_task`, `tenant_subscription` | 자동 알림, 재요청 지원 |
| 요금제 | Catalog CRUD, 애드온 승인, 인보이스 검토 | `pricing_*`, `tenant_ai_usage_daily` | 수수료/프로모션 관리, 미리보기 |

## 3. 비기능 요구사항
- **보안**: OIDC + MFA, RBAC/ABAC, 감사 로그 의무화
- **성능**: 주요 API 응답시간 < 500ms (평균), 배포/배치 제어는 2분 내 피드백
- **가용성**: 운영 포털 SLA 99.5%, 장애 시 운영팀 알림 < 1분
- **모니터링**: Grafana/Kibana 대시보드, Alerting 기반 온콜 체계

## 4. 제약조건 & 의존성
- 기존 MindGarden 데이터 모델/멀티테넌시 구조 유지 (데이터 중앙화)
- 결제/알림/Kakao·Naver 연동은 현행 시스템과 동일한 인증 체계 사용
- Workflow Engine, AI 자동화는 Phase 4 이후 단계적 도입

## 5. 승인/합의 사항 (To-do)
- 운영팀: 온보딩/요금제 승인 정책 리뷰
- SRE: 배포/배치 제어 기능 범위 확인
- 보안팀: RBAC/ABAC 매트릭스, 감사 요구사항 승인
- CS팀: 티켓/FAQ 통합 시나리오 정의

## 6. 다음 단계
1. UX 와이어프레임 및 접근성 보고서 작성 (`ux/accessibility-report.md`)
2. Phase 1 기능 명세/테스트 계획 문서 초안 (`functional-spec.md`, `test-plan.md`)
3. 환경 준비 티켓 상태 업데이트 및 완료 보고 (`phase0-readiness-checklist.md`)
