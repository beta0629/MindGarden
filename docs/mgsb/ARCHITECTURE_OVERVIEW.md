# MindGarden Small Business Platform: Architecture Overview

## 1. 시스템 개요 및 목표

- **목표:** MindGarden의 상담 센터 프랜차이즈 역량을 기반으로 소상공인을 위한 통합 회원·주문·결제 플랫폼 구축
- **전략:** 기존 MindGarden 서비스를 유지하면서, 동일한 코어 인프라 위에 다중 테넌트 기반의 신규 플랫폼을 병행 운영
- **핵심 지향점:** 확장성, 보안, 운영 효율, 소비자/관리자 양측의 일관된 UX 제공
- **주요 이해관계자:**
  - 플랫폼 운영사 (MindGarden HQ)
  - 소상공인(테넌트) 사업주 및 직원
  - 소비자(테넌트 고객)

## 2. 논리 아키텍처

### 2.1 서비스 레이어 구성

- **Core Services:**
  - `Auth & Identity`: 테넌트/직원/소비자 인증, 소셜 로그인, SSO 확장
  - `Tenant Management`: 테넌트 등록, 구독 플랜, 결제 정책, 브랜딩 설정
  - `Billing & Settlement`: ERP 기반 결제 정산, 매출 리포트, 세금 계산서
  - `Notification`: 웹/모바일 알림, 메일, 문자, 마케팅 캠페인 연동
  - `Compliance & Audit`: 로그 수집, 접근 제어, 규제 준수 모듈
- **Business Modules:**
  - `Academy Module`: 회원 등록, 출결, 수강권 관리, 수강료 청구/납부, 학부모 알림
  - `Food Service Module`: 메뉴·옵션 관리, 주문/배달/픽업 흐름, 주방/배달 파트너 대시보드
  - `Retail/Service Module`(미래): 재고 관리, 예약 스케줄링, POS 연동
  - `Cross-Business Toolkit`: 통계/분석 대시보드, 마케팅/프로모션 툴, 공통 UI 컴포넌트

### 2.2 주요 사용자 플로우

1. **테넌트 온보딩**
   1. MindGarden 운영자가 테넌트 계정 생성
   2. 테넌트가 포털에 로그인하여 기본 정보/브랜딩/결제 수단 등록
   3. 테넌트별 기본 데이터(임직원, 메뉴/강좌, 지점) 등록 완료 시 운영 상태 전환
2. **소비자 예약/주문**
   1. 소비자가 포털/앱에서 테넌트 선택 후 상품/서비스 탐색
   2. 예약/주문 후 결제 완료 → ERP 및 알림 시스템 연동
   3. 이후 히스토리, 재구매, 리뷰, 쿠폰 관리
3. **결제·정산**
   1. 주문/수강 완료 건에 대해 ERP가 정산 주기별로 배치 처리
   2. PL/SQL 패키지가 매출·수수료·정산 금액 계산 후 결과 저장
   3. 테넌트는 관리자 포털에서 정산 리포트 다운로드 및 회계 처리
4. **운영 모니터링**
   1. MindGarden HQ가 멀티테넌트 대시보드에서 전체 지표 모니터링
   2. SLA 모니터링, 장애 알림, 규제 준수 보고서 발행

### 2.3 프런트엔드 포털 구성

- **소비자 포털:**
  - 메인 화면 (테넌트 랭킹/카테고리)
  - 테넌트 상세 페이지 (상품/강좌 목록, 후기, 지도)
  - 예약/주문 플로우 (옵션 선택, 일정 선택, 결제)
  - 마이 페이지 (결제 내역, 회원권, 쿠폰, 알림)
- **관리자 포털:**
  - 대시보드 (실적, 알림, 주요 지표)
  - 테넌트 설정 (프로필, 브랜딩, 문구, 알림 채널)
  - 직원/권한 관리 (RBAC, 역할별 권한 매트릭스)
  - 고객/회원 관리 (CRM)
  - 주문/예약/수강 관리 (상태 업데이트, 환불 처리)
  - 결제·정산 리포트 (다운로드, 회계 시스템 연동)
  - 캠페인/마케팅 툴 (쿠폰, 프로모션, 메시지 발송)
- **공통 UI Layer:** MindGarden Design System v2.0, Storybook 기반 문서화,
  CSS 변수·토큰 체계, 반응형 그리드, 접근성 표준(ARIA)

### 2.4 백엔드 컴포넌트 세부 구조

- Spring Boot 기반 멀티 모듈 프로젝트 구성:
  - `core-domain`: 엔터티, 도메인 서비스, 공통 유틸
  - `api-gateway`: REST API, GraphQL, 인증 필터, 테넌트 컨텍스트 주입
  - `module-academy`, `module-food`: 업종별 서비스/컨트롤러
  - `integration-erp`, `integration-payment`, `integration-notification`: 외부 연동 어댑터
  - `scheduler`: 배치/PL-SQL 호출, 정산/집계, 데이터 동기화
- 메시징: 주문 이벤트 등은 Kafka/Event Bridge를 활용한 비동기 처리 고려
- 파일 스토리지: 테넌트별 S3/Blob 구조, 썸네일/서명/계약서 저장

## 3. 배포 및 운영 아키텍처

### 3.1 환경 구성 상세

- **운영 환경:**
  - Kubernetes(EKS/GKE/AKS) + Service Mesh(Istio) 고려
  - Managed DB(Oracle/PostgreSQL) + Redis(세션/캐시)
  - Object Storage(S3) + CDN(CloudFront)
- **스테이징/QA:**
  - 운영 대비 축소 인스턴스, 동일 구조 유지
  - 테스트 자동화: 유닛, 통합, E2E, 시각적, 부하 테스트 병행
- **로컬 개발:**
  - Docker Compose 기반 서비스 구성(DB, Redis, Mock 서버)
  - Storybook, Design System, API 동기 문서화(OpenAPI, GraphQL Docs)

### 3.2 CI/CD 파이프라인 상세

- GitHub Actions + ArgoCD(또는 GitOps) 기반 배포 자동화
- 파이프라인 단계:
  1. Lint/Test → 품질 게이트(SonarQube)
  2. 빌드/아티팩트 생성 → Docker Registry 푸시
  3. IaC(Terraform/Helm) 적용 → 스테이징 배포 → 자동 테스트
  4. 운영 환경 Blue/Green 또는 Canary 배포 → 모니터링 검증 후 트래픽 전환

### 3.3 보안·규정·운영

- **보안:**
  - OAuth2/OIDC, MFA, 비밀번호 정책, 세션 타임아웃, 웹 방화벽(WAF)
  - PII/결제 정보 암호화(전송/저장), 키 관리(KMS/Secrets Manager)
- **규정 준수:**
  - 개인정보보호법, 전자금융거래법, 전자상거래법 준수
  - 로그 및 접근 감사, 사고 대응 시나리오 문서화
- **운영:**
  - 모니터링(Metrics/Tracing/Logging), SLA/SLO 정의, 장애 대응 플레이북
  - 알림: PagerDuty/Slack/Teams 연동, 근무시간 외 온콜 체계

## 4. 멀티테넌시 설계 상세

### 4.1 데이터 분리 및 마이그레이션

- **전략:** Shared Database + Tenant Partitioning 기본, 고급 고객용 Schema 분리 옵션
- **테이블 설계:** 모든 주요 테이블에 `tenant_id`, `branch_id`, `locale`,
  `created_by`, `deleted_at` 등 메타 필드를 포함
- **인덱싱:** `tenant_id` + 주요 키 복합 인덱스, 파티션 전략(시간/테넌트 기반)
- **마이그레이션:** 기존 MindGarden Branch → Tenant 확장 스크립트, 데이터 백필, 테스트 시나리오
- **ORM 설정:** Hibernate MultiTenancy, `TenantIdentifierResolver` 구현 고려

### 4.2 애플리케이션 레이어 멀티테넌시

- **TenantContext 흐름:**
  1. 요청 헤더/도메인/토큰에서 `tenant_key` 추출
  2. 필터/인터셉터에서 `TenantContextHolder`에 저장
  3. Repository/Service 계층에서 `TenantContext`를 통해 필터링
  4. 응답 시 컨텍스트 정리(ThreadLocal 청소)
- **권한 모델:**
  - 테넌트 관리자, 지점 관리자, 스태프, 소비자, MindGarden HQ
  - 역할별 메뉴/기능 매트릭스 문서화 및 정책 엔진(예: ABAC) 고려

### 4.3 캐시·세션·스토리지 전략

- **세션 관리:**
  - Redis + Sticky Session, 토큰 기반 세션 파기 로직
  - 소비자/관리자/서드파티 앱별 세션 정책 분리
- **캐시:**
  - 테넌트 단위 캐시 격리, TTL 정책, 캐시 무효화 전략
- **파일 저장소:**
  - S3 경로: `/tenant/{tenantId}/...`
  - 브랜딩 자산, 인보이스, 증빙 문서 버저닝 유지

## 5. 향후 확장 로드맵 요약

1. **Phase 1 (학원 중심 MVP):**
   - 테넌트 온보딩, 학원 CRM, 소비자/관리자 기본 플로우, ERP 결제 연동
   - PL/SQL 정산 배치, 알림 템플릿, 학부모용 알림 채널
2. **Phase 2 (요식업 확장):**
   - 주문·배달, 주방 대시보드, 라이더/파트너 연동, 리뷰/포인트 시스템
   - 모바일 소비자 앱(하이브리드/React Native) 베타 출시 검토
3. **Phase 3 (플랫폼 고도화):**
   - 분석/BI, 마케팅 자동화, 추천 시스템, 서드파티 연동 확대
   - API 마켓플레이스, 운영 도구 자동화, SLA/SLO 기반 운영 체계
4. **장기 비전:**
   - MindGarden HQ와 소상공인 생태계를 연결하는 허브, 데이터 기반 인사이트 제공
   - 글로벌 확장 대비 지역화 전략, 파트너십/에코시스템 구축
