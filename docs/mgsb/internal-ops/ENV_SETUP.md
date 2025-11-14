# Internal Operator Portal – Environment Setup Guide

작성일: 2025-11-13

---

## 1. Repository & CI/CD (ENV-01)
1. **레포지토리 생성**
   - `frontend-ops`: React + TypeScript (Vite 또는 CRA 금지, 기존 프론트 구조와 동일하게 Next.js/React 구성 여부 결정)
   - `backend-ops`: Spring Boot (Gradle), 멀티 모듈 구조(`api`, `core`, `integration`) 검토
   - Naming 규칙, 브랜치 전략(`main`, `develop`, `feature/*`, `hotfix/*`) 문서화
2. **CI 파이프라인 템플릿**
   - GitHub Actions 워크플로우 (`.github/workflows/ops-frontend.yml`, `ops-backend.yml`)
   - 단계: checkout → dependency install → lint/test → build → docker/buildx → registry push
3. **CD 파이프라인**
   - ArgoCD Application 정의 (`manifests/ops-frontend.yaml`, `ops-backend.yaml`)
   - 환경별 Helm values (`values-dev.yaml`, `values-staging.yaml`, `values-prod.yaml`)
4. **산출물**
   - `docs/mgsb/internal-ops/ci-cd/README.md`
   - 워크플로우 YAML, Helm 차트 초기 버전

---

## 2. Environment Segregation & Domain (ENV-02)
1. **Namespace 구조**
   - `mg-ops-dev`, `mg-ops-staging`, `mg-ops-prod`
   - RBAC: Dev는 개발자 접근, Staging/Prod는 운영팀 승인 필요
2. **DNS/Terraform**
   - Route53/Cloud DNS에 `ops.e-trinity.co.kr` 생성, ACM/TLS 인증서 발급
   - Terraform 모듈: `infrastructure/dns/ops-domain.tf`
3. **접근 제어**
   - VPN 게이트웨이 설정(혹은 Zero Trust Proxy), IP 화이트리스트 정의
   - Bastion 호스트 또는 SSO 연동 고려
4. **산출물**
   - Terraform 스크립트 + 실행 가이드 (`docs/mgsb/internal-ops/env/terraform.md`)
   - 네트워크 다이어그램 (`docs/mgsb/internal-ops/env/network-diagram.png`)

---

## 3. Authentication & Authorization (ENV-03)
1. **Identity Hub 설정**
   - 새 OIDC 클라이언트: `mindgarden-ops-portal`
   - Redirect URI: `https://ops.e-trinity.co.kr/auth/callback`
   - 스코프: `openid profile email tenant.admin` 등 운영 전용
2. **RBAC/ABAC 정책**
   - 역할: `HQ_MASTER`, `HQ_ADMIN`, `SRE`, `SECURITY`, `CS`
   - ABAC 조건: `branchId`, `roleLevel`, `department`
3. **MFA/기기 등록**
   - TOTP + FIDO2 우선, 상위 권한은 기기 등록 필수
4. **산출물**
   - `docs/mgsb/internal-ops/security/oidc-config.md`
   - 정책 매핑 표(`docs/mgsb/internal-ops/security/rbac-abac-matrix.xlsx`)
5. **임시 로컬 인증 (Phase 1)**
   - 백엔드 환경 변수: `OPS_ADMIN_USERNAME`, `OPS_ADMIN_PASSWORD`, `OPS_ADMIN_ROLE`
   - JWT 설정: `SECURITY_JWT_SECRET`, `SECURITY_JWT_ISSUER`, `SECURITY_JWT_EXPIRES`
   - 프런트엔드: `/api/auth/login` 라우트에서 JWT → 쿠키(`ops_token`, `ops_actor_id`, `ops_actor_role`) 저장
   - 운영 전환 시 Identity Hub SSO로 교체, HttpOnly/Secure 쿠키로 강화

---

## 4. Data Source & Internal API (ENV-04)
1. **DB 권한**
   - 운영 전용 DB 사용자(`ops_portal`), 읽기/쓰기 범위 제한
   - Flyway/Schema 관리 계획 수립
2. **API Gateway**
   - `internal-api.m-garden.co.kr` 라우팅, JWT 검증, Rate Limiting 설정
   - gRPC/REST 여부 결정 (기존 REST 유지 권장)
3. **모니터링 연동**
   - Redis/ELK 연결 정보(k8s Secret), 대시보드 템플릿 준비
4. **산출물**
   - `docs/mgsb/internal-ops/backend/data-access.md`
   - API Gateway 구성 문서(`docs/mgsb/internal-ops/backend/internal-api.md`)

---

## 5. Design System Extension (ENV-05)
1. **컴포넌트 인벤토리**
   - Admin 전용: DataGrid, Approval Timeline, KPI Card, Alert Toast, Workflow Stepper 등
   - 모바일 앱 공유 가능 요소 식별
2. **토큰/스타일 가이드**
   - 색상(Level, Severity), 타이포그래피(Admin 전용), 레이아웃(Grid, Breakpoint)
3. **Storybook 확장**
   - Ops 카탈로그 카테고리 추가, Docs 탭에 사용 사례/접근성 표기
4. **산출물**
   - `design-system/admin/README.md`
   - Storybook 빌드 파이프라인 (`ops-storybook.yml`)

---

## 6. Feature Flag & Configuration (ENV-06)
1. **테이블 스키마** (`tenant_id`, `flag_key`, `state`, `scope`, `expires_at`, `created_by`)
2. **관리 도구**
   - LaunchDarkly 사용 시 SDK + governance 설계
   - 자체 UI 구축 시 운영 포털 메뉴 Phase 2와 연동
3. **초기 플래그 제안**
   - `ops-dashboard` (대시보드 노출)
   - `ops-onboarding` (온보딩 워크플로우)
   - `ops-billing` (요금제/애드온)
4. **산출물**
   - `docs/mgsb/internal-ops/config/feature-flag-policy.md`
   - 플래그 초기값 JSON/SQL 스크립트

---

## 7. Test Framework & QA Assets (ENV-07)
1. **프런트엔드**
   - Playwright/Cypress 프로젝트 생성, 공통 Util, Auth Mock 준비
   - CI 통합, Allure/ReportPortal 연동 고려
2. **백엔드**
   - JUnit5 + MockMvc/Spring RestDocs, 통합 테스트용 Testcontainers
   - Mutation Testing(PITest) 도입 검토
3. **계약 테스트**
   - Postman/Newman 컬렉션 또는 Pact 기반 계약 테스트 구조
4. **산출물**
   - `docs/mgsb/internal-ops/testing/strategy.md`
   - 테스트 데이터/Mock 서버 구성 가이드

---

## 8. 진행 상태 관리
- 실행 티켓은 Linear/Jira에 `OPS-ENV-XX` 키로 등록하여 추적
- 체크리스트 상태는 `OPERATOR_PORTAL_DEV_CHECKLIST.md`와 동기화
- 완료 보고 시 산출물 링크를 첨부하고 리뷰/승인 기록 유지

---

## 9. 보안 우선 기술 스택 요약
- 프런트엔드: Next.js + TypeScript (MIT), Storybook 기반 MindGarden DS v2 확장
- 백엔드: Spring Boot (Apache 2.0) + Gradle, PostgreSQL + Flyway, Apache Kafka 이벤트 스트림
- 인프라: Kubernetes + ArgoCD + GitHub Actions + Terraform, Prometheus/Grafana/ELK
- 테스트: Playwright, Cypress, JUnit5, Testcontainers, Postman/Newman
- 보안 도구: Trivy, OWASP ZAP, Open Policy Agent (OPA)
- Feature Flag: OpenFeature/Flagsmith 오픈소스 버전 우선 적용

> 모든 라이브러리/도구는 무라이선스(오픈소스) 기준으로 채택하며, 신규 의존성 추가 시 라이선스 검토 및 문서화가 필수이다.
> 설정 값(요금제, 권한, 플래그, 외부 연동 키 등)은 코드 하드코딩을 금지하고 중앙 DB 또는 환경 변수(Flyway, Secret Manager)를 통해 주입한다.
