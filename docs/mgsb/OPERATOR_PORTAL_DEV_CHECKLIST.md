# MindGarden Internal Operator Portal – Development Checklist & Setup Guide

## 1. 환경 준비
- [ ] **Repository 구성**: `frontend-ops`(React/TypeScript), `backend-ops`(Spring Boot) 레포지토리 생성 및 CI/CD 파이프라인 연동 (GitHub Actions + ArgoCD)
- [ ] **환경 분리**: Dev → Staging → Prod Namespace/IaC 정의, 내부 전용 도메인(`ops.e-trinity.co.kr`) 및 VPN/Access 설정
- [ ] **인증/권한 연동**: 공용 Identity Hub(OIDC) 클라이언트 등록, 운영 전용 RBAC/ABAC 스코프 정의, MFA/기기 등록 정책 적용
- [ ] **데이터 소스 연결**: 중앙 DB/Redis/ELK 접근 권한 설정, 운영 전용 API Gateway(`internal-api`) 엔드포인트 구성
- [ ] **Design System 확장**: MindGarden Design System v2.0 Admin용 컴포넌트/토큰 추가, Storybook 문서화
- [ ] **Feature Flag/Config**: `feature_flag` 테이블 및 관리 도구(또는 LaunchDarkly) 세팅, 초기 플래그 목록 정의
- [ ] **테스트 프레임워크**: Playwright/Cypress(프런트), JUnit/MockMvc(백엔드), API 계약 테스트(Postman/Newman) 템플릿 준비

## 2. Phase별 체크리스트
### Phase 0 – 요구사항 정제 (1~2주)
- [ ] 메뉴별 사용자 시나리오, 권한 매트릭스, 데이터 계약서(Interface) 정리
- [ ] 와이어프레임/UX 시안 확정, 접근성 표준 검토
- [ ] 운영팀/CS/보안 담당자와 승인 프로세스 합의

### Phase 1 – 핵심 운영 기능 MVP (4~6주)
- [ ] 대시보드: SLA/AI/결제 지표 카드, 알림/공지 피드, 온콜 스케줄 위젯 구현
- [ ] 테넌트 온보딩 & 계약: 체크리스트 UI, 승인/거절 워크플로우, `tenant_onboarding_task` API 연동
- [ ] 요금제 & 애드온: Catalog CRUD, 승인가능/거절 사유 입력, 인보이스 미리보기, `pricing_*`, `tenant_subscription` 연동
- [ ] 테스트: 역할별 접근 통제(권한), 온보딩 실패/결제 오류 시나리오, 회귀 스모크 완료

### Phase 2 – 권한 · 보안 · 알림 강화 (4~5주)
- [ ] 권한 템플릿 배포/승인 화면, Feature Flag 관리 UI, 보안 이벤트 대시보드
- [ ] 알림 템플릿/공지 작성, Slack/PagerDuty/Webhook 설정 UI, 온콜 캘린더 연동
- [ ] 감사 로그 뷰어(`operator_audit_log`), 필터·검색·CSV 내보내기, 보관 기간 표시
- [ ] 테스트: ABAC 정책/플래그 적용 검증, 알림 채널 E2E, 감사 데이터 무결성 체크

### Phase 3 – 배포 · Incident · 고객 지원 (5~6주)
- [ ] 배포/배치 모니터링 화면, Blue/Green/Canary 제어 버튼, 롤백 요청 Flow
- [ ] Incident & Compliance: 사고 보고서 작성, RCA 흐름, 규제 감사 일정/증적 관리
- [ ] 고객(테넌트) 지원: 티켓/FAQ 통합, SLA 현황, 진단 리포트 생성(정산/AI/운영)
- [ ] 테스트: 배포 제어 권한 이중 확인, Incident 워크플로우 시뮬레이션, Zendesk/외부 연동 검증

### Phase 4 – 모바일 & 자동화 확장 (4주)
- [ ] 내부 모바일 앱과 핵심 기능 동기화(알림 승인, KPI, 배포/Incident 알림)
- [ ] Workflow Engine(BPMN/Temporal) 연동으로 승인/롤백 자동화, 이벤트 기반 트리거 설정
- [ ] AI 기반 운영 챗봇 PoC(문의/설정 안내), 사용자 행동 분석 대시보드 추가
- [ ] 테스트: 모바일 기기 MDM 검증, Workflow 실패/재시도 시나리오, AI 응답 품질 점검

## 3. 품질 보증 & 보안 체크
- [ ] **테스트 커버리지 목표**: 프런트/백엔드 단위 테스트 80% 이상, 핵심 시나리오 E2E 자동화
- [ ] **보안 점검**: OWASP Top 10, 권한 상승 시도, 세션 고정, 데이터 마스킹 확인
- [ ] **성능/부하 테스트**: 온보딩/결제/배포 제어 API에 대한 RPS 목표 설정 및 측정
- [ ] **로그/모니터링**: Grafana/Kibana 대시보드, 알림 임계값 설정, SLA/SLO 문서화
- [ ] **문서화**: 각 Phase 완료 시 운영 매뉴얼, Runbook, 데이터 사전, 변경 관리 문서 업데이트

## 4. 운영 전환 준비
- [ ] 베타 테넌트 대상 시범 운영, 운영팀 교육/트레이닝 세션 진행
- [ ] 피드백 반영 및 백로그 정리, 운영팀과 SLA/SOP 확정
- [ ] 공식 런칭: 도메인 전환, 보안 점검 리포트 제출, 커뮤니케이션 플랜 실행

> 이 체크리스트를 기준으로 내부 운영 포털 개발을 준비하면, 대내 시스템이 안정적으로 구축되고 이후 자동화 목표(Zero-Touch 온보딩, 최소 입력, 중앙화 데이터 관리)를 빠르게 달성할 수 있다.

## 5. 리스크 모니터링 체크리스트
- [ ] 스코프 변경 요청은 변경 관리 프로세스(승인·기록)로 관리되고 있는가?
- [ ] 멀티테넌시 데이터 검증 스크립트/회귀 테스트가 매 배포 전 수행되는가?
- [ ] 권한/보안 점검(OWASP, ABAC 테스트)이 스프린트마다 실행/기록되는가?
- [ ] 배포/배치 제어 기능이 스테이징에서 시뮬레이션 테스트를 통과했는가?
- [ ] 외부 연동(결제/알림)의 재시도 큐, 모니터링, SLA 알림이 정상 작동하는가?
- [ ] 운영 포털 사용률 및 운영팀 피드백을 주기적으로 수집/반영하고 있는가?
- [ ] 자동화 제한/요금 규칙이 Feature Flag 또는 Shadow Mode로 검증되었는가?
- [ ] AI/챗봇 기능 품질 지표 및 휴먼 검수가 운영되고 있는가?
- [ ] 비상 Runbook/연락망이 최신 상태이며 최근 모의 훈련 결과가 반영되었는가?
