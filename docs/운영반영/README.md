# 운영 반영(배포 준비) 문서

**목적**: 운영 서버 반영 준비 회의 산출물 및 의견서를 한곳에서 참조.

## 운영 반영 전 필수(종합 체크리스트)

- **[PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](./PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)** — 도메인·서브도메인·TLS·CORS·OAuth·보안·DB·인프라·스모크·전 에이전트 회의 합의 ( **Go-Live 시 최우선** )
- **[GO_LIVE_ORCHESTRATION_PLAN.md](./GO_LIVE_ORCHESTRATION_PLAN.md)** — Go-Live Phase·서브에이전트 분배실행·전달 태스크 ( **기획 오케스트레이션** )

## 배포 후속 운영 가이드 (배포일별)

- **[POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md](./POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md)** — 2026-06-11 PR #213·#214·#215·#216·#217·#218·#219 배포 후 자정 모니터링·P1 데이터 보정·Secrets 등록·Prometheus 알람 통합 가이드
- **[MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md](./MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md)** — mind_garden 스키마 잔존 객체 DROP/RENAME 절차 (운영 DBA 수동)

## 회의·의견서 목록

- [PRODUCTION_DEPLOYMENT_READINESS_MEETING.md](./PRODUCTION_DEPLOYMENT_READINESS_MEETING.md)
- [GO_LIVE_ORCHESTRATION_MEETING_20260330.md](./GO_LIVE_ORCHESTRATION_MEETING_20260330.md)
- [OPERATION_DEPLOYMENT_TESTER_OPINION.md](./OPERATION_DEPLOYMENT_TESTER_OPINION.md)
- [PRODUCTION_DEPLOYMENT_DEBUGGER_OPINION.md](./PRODUCTION_DEPLOYMENT_DEBUGGER_OPINION.md)
- [SHELL_DEPLOYMENT_MEETING_NOTE.md](./SHELL_DEPLOYMENT_MEETING_NOTE.md)

## 배포 실행 시 참조

- [DEPLOYMENT_STANDARD.md](../standards/DEPLOYMENT_STANDARD.md)
- [DEPLOYMENT_CHECKLIST.md](../guides/deployment/DEPLOYMENT_CHECKLIST.md) (기능 단위·레거시 예시)
- [DEV_DEPLOYMENT_STABILITY_CHECKLIST.md](../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md)
- 레거시 서버 수동 단계 요약: [pre-deployment-checklist.md](../../deployment/pre-deployment-checklist.md)
