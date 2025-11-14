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

### 2.4 도메인/서브도메인 전략

| 구분 | 목적 | 도메인 예시 | 비고 |
| --- | --- | --- | --- |
| 마케팅/랜딩 | 브랜드 소개, 세일즈 랜딩, 문서 링크 | `https://m-garden.co.kr` | 기존 도메인 유지, SEO/콘텐츠 중심 |
| 테넌트/소비자 웹앱 | 실제 서비스 이용(예약, 정산, 대시보드) | `https://app.m-garden.co.kr` (테넌트 공용) 또는 `https://{tenant}.m-garden.co.kr` (선택적 커스텀) | 커스텀 도메인은 `CNAME`/TLS 자동 발급(Let's Encrypt) 지원 |
| 운영 포털(내부) | HQ 운영, 승인/관제/배포 제어 | `https://ops.e-trinity.co.kr` | VPN 또는 IP ACL + MFA 필수, 내부 DNS 등록 |
| API Gateway | 외부 공개 API/웹훅 | `https://api.m-garden.co.kr` | Rate Limiting, WAF, 인증(SaaS 토큰) 적용 |
| 모바일 백엔드 | 앱 전용 엔드포인트(버전 관리) | `https://mobile-api.m-garden.co.kr` | 앱 스토어 심사 대비 안정적 버전 유지 |
| 스테이징/Dev | QA/개발 테스트 | `https://staging.m-garden.co.kr`, `https://dev.m-garden.co.kr` | 테스트 데이터, 샌드박스 연동, VPN 접근 |

- **TLS/보안 정책**: 모든 서브도메인은 TLS 1.2 이상, HSTS, WAF 적용. 내부 도메인(`ops`, `dev`)은 사설 CA + VPN 조합 또는 Public TLS + 인증 게이트웨이.
- **DNS/IaC 관리**: Route53/Cloud DNS 등 IaC(Terraform)로 레코드 일괄 관리, 새 테넌트 커스텀 도메인은 Self-Service + 검증(CNAME) 방식 제공.
- **리디렉션 규칙**: `m-garden.co.kr` → 랜딩, `www.m-garden.co.kr` → 동일, 로그인/로그아웃 후 `app` 도메인으로 이동.
- **쿠키/세션**: 소비자/테넌트 앱은 `app.m-garden.co.kr` 도메인 기준으로 쿠키 설정(SameSite=None, Secure). 운영 포털은 별도 도메인으로 격리해 세션 혼선을 방지.

### 2.4 대내·대외 애플리케이션 분리 전략

- **외부(대외) 관리자 포털**
  - 대상: 입점사(테넌트) 관리자/직원, 소비자
  - 목적: 매출/정산, 상담·예약, 출결, 알림 등 비즈니스 운영
  - 접근: 공개 인터넷, 멀티테넌시 기반 RBAC/ABAC, 표준 릴리스 주기(안정성 우선)
  - 배포: `app.mindgarden.com`, `tenant.mindgarden.com` 등 테넌트 전용 서브도메인
- **내부(대내) 운영 포털**
  - 대상: MindGarden HQ 운영팀, SRE/플랫폼 엔지니어, 보안/CS
  - 목적: 테넌트 온보딩 승인, 요금제/애드온/플래그 관리, 관제, 감사, 배포 제어
  - 접근: 별도 서브도메인(예: `ops.mindgarden.internal`), VPN/VPC 또는 IP 제한, HQ 전용 RBAC
  - 배포: 독립 CI/CD 파이프라인, 빠른 기능 추가 가능(Feature Flag 기반 실험)
- **내부 운영 모바일 앱 (필수 메뉴)**
  - 대상: 현장 관리자, 온콜 엔지니어, HQ 임원 등 모바일로 필수 지표를 확인해야 하는 사용자
  - 스택: React Native + MindGarden Design System v2.0 모바일 토큰, 기존 Auth/Notification 모듈 재사용
  - 제공 기능(1단계): 실시간 알림 승인/처리, 배포 상태 확인, 주요 KPI 대시보드(매출/정산/오류 알림), 테넌트 온보딩 승인
  - 보안: MDM 등록 기기만 접근, 앱 내 2차 인증(OTP/PUSH), 오프라인 로그 저장 금지
  - 릴리스: 내부 기업 앱스토어 혹은 TestFlight/Managed Google Play Private Channel 사용
- **공통 규칙**
  - 인증: 동일 Identity Hub를 사용하되, 내부 포털은 추가 MFA·기기 등록 정책 강화
  - 디자인 시스템: MindGarden Design System v2.0을 공유하되, 내부 포털은 Admin 전용 컴포넌트 세트 확장
  - 통신: 운영 포털 API는 내부 전용 게이트웨이로 분리(`internal-api`), 외부 포털에서는 접근 불가
  - 로그/감사: 운영 포털의 모든 행위는 `operator_audit_log`, `feature_flag_audit` 등에 기록, 외부 포털과 분리 보관
  - **다국어 정책:** 외부 시스템(테넌트/소비자 대상) 역시 영문 기본, 한글 필수 컬럼을 유지하고 추가 언어가 필요할 때는 다국어 테이블 확장으로 대응한다. 프런트엔드는 locale > 한글 > 영문 순으로 fallback.

### 2.5 내부 운영 포털 메뉴 구조 (초안)

1. **대시보드**
   - 서비스 헬스 지표(SLA, 오류율, 응답시간)
   - AI 사용량 경보, 결제/정산 이상 탐지, 배포 현황
   - 최근 알림/공지, 테넌트 요청 현황, 온콜 스케줄
2. **테넌트 온보딩 & 계약**
   - 온보딩 체크리스트 진행 상태(계약, 결제, 권한, 데이터 이관)
   - 승인/거절 워크플로우, 담당자 배정, 자동 템플릿 발송
   - 테넌트 정보 편집(브랜딩, 비즈니스 유형, 지점 구성)
3. **요금제 & 애드온 관리**
   - 요금제 카탈로그, 수수료율, 프로모션 코드 관리
   - 애드온 활성화 요청 승인, 단가 변경 히스토리
   - AI 사용량 청구 내역 검토, 인보이스 발행 일정
4. **권한 & 보안**
   - 역할 템플릿 배포, 테넌트 역할 커스터마이징 승인
   - Feature Flag/Policy 관리, 민감 권한 잠금
   - 보안 이벤트, 감사 보고서, MFA 실패/비정상 접근 모니터링
5. **배포 & 운영**
   - 릴리스 파이프라인 상태(Dev → Staging → Prod)
   - Blue/Green/Canary 배포 제어, 롤백 트리거
   - 배치 작업 모니터링(정산, 통계, AI 요약), 재시작 요청
6. **알림 & 커뮤니케이션**
   - 시스템 알림/공지 작성, 템플릿 관리
   - 온콜/CS 연계, Slack/PagerDuty/Webhook 설정
   - 운영 Runbook 링크, 작업 이력
7. **Incident & Compliance**
   - 사고 보고/조사/해결 상태 추적, RCA 기록
   - 규제 감사 요구사항, 증적 관리, 감사 일정
   - 보안 교육/훈련 내역, 문서 승인 히스토리
8. **고객(테넌트) 지원**
   - 티켓/문의/FAQ 관리, 응답 SLA 추적
   - 지원 히스토리, 만족도/리뷰 관리
   - 진단 보고서 생성(정산/AI/운영 개선 제안)

> *메뉴 구조는 MVP 기준으로 정의하며, Workflow/Automation 모듈 도입 시 일부 메뉴는 통합(예: 승인 플로우 전용 페이지)될 수 있다.*

### 2.6 내부 운영 포털 개발 우선순위 계획 (초안)

1. **Phase 0 – 준비 (1~2주)**
   - 요구사항 정제: 메뉴별 사용자 시나리오, 권한 매트릭스, 데이터 소스 정의
   - 디자인 시스템 확정: Admin 컴포넌트, 접근성/반응형 가이드, 모바일 연계 범위
   - 기술 환경 세팅: 별도 프런트엔드/백엔드 레포지토리, CI/CD, Feature Flag, 테스트 프레임워크 준비

2. **Phase 1 – 핵심 운영 기능 MVP (4~6주)**
   - 대상 메뉴: 대시보드, 테넌트 온보딩 & 계약, 요금제 & 애드온 관리
   - 주요 개발 항목:
     - 온보딩 체크리스트 UI/Workflow, 승인 API, `tenant_onboarding_task` 연동
     - 요금제/애드온 Catalog CRUD, 승인/거절 플로우, 인보이스 검토 화면
     - 대시보드: 실시간 지표 카드(SLA, AI 사용량, 결제 성공률), 알림/공지 피드
   - 테스트: 역할별 접근 제어 테스트, 회귀 스모크, 핵심 실패 시나리오(결제 오류, 온보딩 실패)

3. **Phase 2 – 권한 · 보안 · 알림 강화 (4~5주)**
   - 대상 메뉴: 권한 & 보안, 알림 & 커뮤니케이션, 운영 Runbook 연계
   - 주요 개발 항목:
     - 역할 템플릿 배포/승인 UI, Feature Flag 관리, 보안 이벤트 모니터링
     - 알림 템플릿/공지 작성, 온콜/Slack/PagerDuty 설정, Runbook 링크 관리
     - 감사 로그 뷰어, 변경 이력 필터링, 검색/내보내기 기능
   - 테스트: ABAC 정책 검증, 로그/감사 데이터 일치 확인, 알림 채널 통합 테스트

4. **Phase 3 – 배포 · Incident · 자동화 (5~6주)**
   - 대상 메뉴: 배포 & 운영, Incident & Compliance, 고객(테넌트) 지원
   - 주요 개발 항목:
     - 배포 파이프라인 상태 화면, Blue/Green/Canary 제어 UI, 배치 모니터링/재시작
     - Incident 보고/조사 워크플로우, RCA 기록, 감사 일정/증적 관리
     - 티켓/FAQ 통합, SLA 대시보드, 진단 리포트 생성(정산/AI/운영)
   - 테스트: 배포 제어 권한 이중 확인, Incident 시뮬레이션, 외부 시스템(Zendesk 등) 연동 테스트

5. **Phase 4 – 모바일 연계 & 자동화 확장 (4주)**
   - 내부 모바일 앱과의 기능 교차: 알림 승인, KPI 조회, 배포/Incident 알림 처리
   - Workflow Engine(BPMN/Temporal) 연동: 승인/롤백 자동화, 이벤트 기반 트리거
   - AI 기반 운영 챗봇 PoC(문의/설정 안내), 사용자 행동 분석 대시보드 추가

6. **공통 고려 사항**
   - 무엇이든 중앙 API→DB 경로로 데이터 저장, 캐싱/임시 저장 최소화
   - QA 프로세스: 메뉴별 테스트 케이스, 자동화 테스트(Playwright/Cypress), 보안 테스트(OWASP 체크)
   - 문서화: 각 Phase 완료 후 운영 매뉴얼, Runbook, 변경 관리 문서 업데이트

> 위 우선순위를 기준으로 먼저 내부 운영 포털을 완성하면, Zero-Touch 온보딩/중앙화/자동화 전략을 안전하게 실행할 수 있다.

### 2.7 내부 운영 포털 개발 리스크 및 대응 계획

| 리스크 | 영향 | 징후/모니터링 | 대응 전략 |
| --- | --- | --- | --- |
| 요건 범위 확장 (Scope Creep) | 일정 지연, 품질 저하 | 백로그 증가, 승인 없는 기능 추가 요청 | Phase별 승인 게이트 도입, 변경 관리 위원회, MVP 우선순위 재확인 |
| 멀티테넌시 데이터 훼손 | 운영 데이터 손실, 서비스 중단 | QA에서 데이터 불일치, 테넌트 간 데이터 노출 | 전용 QA 데이터셋, DB 스냅샷 복구 연습, 배포 전 다중 테넌트 회귀 테스트 |
| 권한/보안 취약점 | 내부 정보 유출, 인증 실패 | 보안 스캐너 알림, 권한 승격 이슈 | 정기 보안 리뷰(OWASP), Red Team 시나리오, ABAC 정책 테스트 자동화 |
| 배포/배치 제어 오류 | 운영 장애, 배치 중단 | 배포 실패율 상승, 배치 재시작 빈도 증가 | 배포 시뮬레이션 환경, 롤백 자동화, 배치 헬스체크 및 Alerting 강화 |
| 외부 연동(결제/알림) 실패 | 결제 중단, 알림 미전달 | Webhook 실패, API 에러 비율 상승 | Sandbox 모니터링, 재시도 큐, 연동 상태 대시보드 + 온콜 알림 |
| 운영팀 Adoption 부족 | 도입 지연, 기존 프로세스 유지 | 포털 사용률 저조, 수동 티켓 증가 | 초기 베타 프로그램, 교육/Runbook, 피드백 회의 및 기능 개선 사이클 |
| 자동화 규칙 오작동 | 잘못된 제한/요금 부과 | 알림/제한 반복 발생, 고객 불만 증가 | Feature Flag로 단계적 적용, Shadow Mode 모니터링, 시뮬레이션 로그 검증 |
| AI/챗봇 품질 저하 | 잘못된 가이드, 사용자 혼란 | 오류/오답 비율 증가, CS 문의 폭주 | AI 모델 품질 평가 지표, 휴먼 인 더 루프 검수, 데이터 정제 파이프라인 |

- **리스크 리뷰 주기**: 스프린트 말 회고(Mini Postmortem)에서 업데이트, 주요 리스크는 월간 Steering Committee 공유
- **비상 대응 Runbook**: Incident 메뉴와 연계해 팀별 대응 절차(연락망, 복구 단계, 책임자) 문서화 및 연습
- **지표 기반 관리**: 일정/품질 KPI (버그 밀도, 배포 실패율, 온보딩 성공률 등)를 운영 대시보드에 반영해 선제 대응

### 2.5 백엔드 컴포넌트 세부 구조

- Spring Boot 기반 멀티 모듈 프로젝트 구성:
  - `core-domain`: 엔터티, 도메인 서비스, 공통 유틸
  - `api-gateway`: REST API, GraphQL, 인증 필터, 테넌트 컨텍스트 주입
  - `module-academy`, `module-food`: 업종별 서비스/컨트롤러
  - `integration-erp`, `integration-payment`, `integration-notification`: 외부 연동 어댑터
  - `scheduler`: 배치/PL-SQL 호출, 정산/집계, 데이터 동기화
- 메시징: 주문 이벤트 등은 Kafka/Event Bridge를 활용한 비동기 처리 고려
- 파일 스토리지: 테넌트별 S3/Blob 구조, 썸네일/서명/계약서 저장
- **ORM/데이터 접근 스택**
  - Hibernate/JPA + QueryDSL: 타입 안전한 쿼리, 동적 필터, `Specification` 지원
  - MultiTenancy 전략: `TenantIdentifierResolver` + Hibernate Filter로 `tenant_id`/`branch_id` 자동 주입
  - Connection Pool: HikariCP (기본 `maximumPoolSize=40`, 환경별 조정)
  - 캐시: 2차 캐시(Ehcache/Redis), Batch Fetch, EntityGraph로 N+1 최소화
  - 감사: `Envers` 또는 커스텀 Audit 테이블로 변경 이력 기록
  - PL/SQL과의 연계: 정산/통계 등 대용량 처리는 Stored Procedure 호출로 분리

### 2.6 인증·세션·SSO 아키텍처

- **통합 Identity Hub**
  - `auth_user` 테이블에 모든 사용자 계정(직원/소비자)을 중앙화 저장
  - 소셜 로그인(Kakao/Naver) 매핑은 `auth_user_social` 테이블로 관리
  - MFA, 기기 등록, 접근 정책을 단일 Auth 서비스에서 제어
- **Single Sign-On 흐름**

  ```
  [Client] ── 로그인 요청 → Auth Server(Spring Security + OAuth2)
              ├─ 카카오/네이버 OAuth2 Redirect
              └─ 자체 ID/PW (bcrypt + MFA)
            ← AccessToken(JWT) + RefreshToken + (필요 시) Session Cookie
  ```

  - AccessToken/RefreshToken payload에 `tenantId`, `branchId`, `role`, `permissions` 포함
  - 웹은 HttpOnly/SameSite Cookie, 모바일/파트너 API는 Bearer Token으로 동일한 Auth 서버 사용
  - Refresh Token/세션 정보는 Redis/DB에 저장하여 세션 파기, 기기 관리, 동시 로그인 제어
- **RBAC + 정책 엔진**
  - `role_permissions` 테이블로 기본 권한 관리 (HQ_ADMIN, BRANCH_MANAGER, STAFF 등)
  - 업종별·지점별 세부 정책은 `policy_rules`(조건부 접근)로 확장하여 20% 커스터마이징 대응
  - API Gateway/Backend에서 JWT 검증 후 `TenantContext`에 주입, 서비스 계층에서 정책 평가
  - `role_template` → `tenant_role` 구조로 업종별(학원: 학생/강사/사무원/원장, 미용: 고객/디자이너/관리자 등) 역할 세트를 제공하고, 테넌트는 필요한 역할만 활성화·커스터마이징
  - 다중 역할 지원: 사용자가 복수 역할을 가질 수 있으며, 세션에는 `active_role` 클레임을 포함해 권한 범위를 명시. 정책 엔진은 ABAC 조건(`branchId`, `roleLevel`, `businessType`)을 평가
  - 민감 권한(로그 열람, AI 요금제 변경 등)은 HQ가 "필수 권한" 플래그로 잠그고, 테넌트는 하위 권한 범위만 조정 가능
- **보안·감사 로깅**
  - `SecurityAlertService`로 로그인 실패, 비정상 접속, 다중 로그인 시도, MFA 실패 등 이벤트 알림
  - `AuditLoggingFilter`가 로그인/로그아웃/토큰 재발급을 중앙 감사 로그에 기록 (SIEM 연동)
  - 로그 포맷에 `tenantId`, `branchId`, `userId`, `requestId`를 필수 필드로 포함하고, Logback MDC로 자동 주입
  - 로그 저장소(ELK/OpenSearch/S3)는 테넌트 단위 인덱스/버킷으로 분리하여 HQ/HQ-Master만 전체 조회 가능하도록 권한 제어
  - 민감 데이터(PII/결제)는 마스킹/해시 처리 후 기록하며, PersonalDataEncryption 키 없이 복호화가 불가능하도록 설계
- **테넌트 vs 공통 운영 책임**
  - 테넌트 전용: 선택한 AI 상품/요금제, 테넌트 API 키 관리, 월간 사용량 한도/알림 설정, 내부 회계 시스템 연동
  - MindGarden 공통: AI/로그 정책 수립, 가격표 및 수수료율 운영, 정산 배치/세금계산서 발행, 보안 감사 및 침해 대응 표준화
  - 체크리스트 기반 온보딩으로 테넌트별 필수 항목 완료 여부를 추적하고, 공통 정책 변경 시 테넌트 재동의 흐름을 제공
  - 권한 계층: `HQ_MASTER`(정책/수수료 결정) → `HQ_ADMIN`(운영 승인) → `TENANT_OWNER`(테넌트 요금제 선택) → `TENANT_MANAGER`(지점별 모니터링) → `SECURITY_OFFICER`(로그 감사, 역할 독립)
- **확장성**
  - 향후 파트너/HQ 시스템 연계를 위해 Auth 서버를 OIDC Provider 모드로 구성 (SAML/OIDC 지원)
  - 서드파티 앱에 OAuth Client 발급, Scope/Rate Limit 정책을 운영 포털에서 관리 예정

### 2.8 보안 우선 기술 스택 가이드 (내부 운영 포털)

- **프런트엔드**: Next.js + TypeScript (MIT License) – 기존 MindGarden 웹과 동일 구조, 서버사이드 렌더링/보안 헤더 제어 용이
- **상태 관리/유틸**: React Query, Zustand, Emotion 등 MIT/Apache 라이선스 패키지만 사용
- **UI 컴포넌트**: MindGarden Design System v2.0 확장(Storybook), 필요 시 Chakra UI(ISC) 등 무라이선스 의존성
- **백엔드**: Spring Boot (Apache 2.0) + Gradle, 멀티 모듈 구조로 API/Auth/Integration 분리
- **데이터베이스**: PostgreSQL (PostgreSQL License), Flyway 기반 스키마 관리
- **메시징/이벤트**: Apache Kafka (Apache 2.0), MQTT 등 추가 시에도 오픈소스 우선
- **인프라**: Kubernetes + ArgoCD + GitHub Actions + Terraform (모두 오픈소스), Prometheus/Grafana/ELK 스택으로 모니터링
- **테스트/QA**: Playwright, Cypress, JUnit5, MockMvc, Testcontainers, Postman/Newman (오픈소스)
- **Feature Flag**: OpenFeature 또는 Flagsmith(오픈소스 버전) 우선, LaunchDarkly 고려 시 계약 검토 필수
- **보안 도구**: Trivy(컨테이너 스캔), OWASP ZAP(SAST/DAST), Open Policy Agent(OPA) 기반 정책 검증

> 모든 신규 의존성은 라이선스 검토 후 `LICENSE.md`에 기록하고, 상용·유료 도구는 별도 승인 절차를 거친다.

## 3. 배포 및 운영 아키텍처

### 3.1 환경 구성 상세

- **운영 환경:**
  - Kubernetes(EKS/GKE/AKS) + Service Mesh(Istio) 고려
  - Managed DB(Oracle/PostgreSQL) + Redis(세션/캐시)
  - Object Storage(S3) + CDN(CloudFront)
- **스테이징/QA:**
  - 운영 대비 축소 인스턴스, 동일 구조 유지
  - 테스트 자동화: 유닛, 통합, E2E, 시각적, 부하 테스트 병행
- **개발(Dev) 환경:**
  - 운영/스테이징과 분리된 장기 실행 서버, 최신 기능 검증 및 개발자 통합 테스트 목적
  - 실시간 리로딩 대신 배포 파이프라인을 통해 반영 (GitHub `develop` 브랜치 → Dev 배포)
  - 운영 데이터와 분리된 샘플/마스킹 데이터 세트 사용, 외부 연동은 샌드박스 엔드포인트로 교체
  - Feature Flag 기본 Off, QA 승인 후 스테이징으로 승격
- **로컬 개발:**
  - Docker Compose 기반 서비스 구성(DB, Redis, Mock 서버)
  - Storybook, Design System, API 동기 문서화(OpenAPI, GraphQL Docs)

### 3.2 CI/CD 파이프라인 상세

- GitHub Actions + ArgoCD(또는 GitOps) 기반 배포 자동화
- 파이프라인 단계:
  1. 개발자 브랜치(feature) → Pull Request → 자동 Lint/Test → 품질 게이트(SonarQube)
  2. `develop` 병합 시 Dev 환경에 배포, 통합 테스트/QA 실행
  3. QA 승인 후 `release` 브랜치 생성 → 스테이징 배포 → 자동 회귀/시각적/부하 테스트
  4. 스테이징 승인 시 `main` 병합 → 운영 환경 Blue/Green 또는 Canary 배포 → 모니터링 검증 후 트래픽 전환
  5. Hotfix는 `hotfix/*` 브랜치에서 스테이징→운영 순으로 빠른 경로를 제공하되, Dev 환경에도 역동기화

### 3.3 보안·규정·운영

- **보안:**
  - OAuth2/OIDC, MFA, 비밀번호 정책, 세션 타임아웃, 웹 방화벽(WAF)
  - PII/결제 정보 암호화(전송/저장), 키 관리(KMS/Secrets Manager)
  - 로그/모니터링 시스템에서도 PII 최소 수집 원칙 적용, 테넌트 분리 저장, 규정 기반 보존 기간 관리
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

## 5. 확장 대비 아키텍처 체크리스트

- **Observability & Ops**
  - 테넌트/서비스 단위 메트릭·로그·트레이싱을 통합 관제(Grafana/Kibana/Tempo 등)로 집계
  - 배치 작업 SLA, AI 사용량 한도, 쿼터 초과 이벤트에 대한 자동 알림·이상 탐지
  - 운영 보고서에 테넌트별 KPI와 장애/알림 히스토리 포함
- **API 거버넌스**
  - API Gateway에서 테넌트·사용자·서드파티 키별 Rate Limit/Quota 정책 적용
  - OpenAPI/GraphQL 문서 자동 배포 및 버전 관리, API 사용량 대시보드화
  - 서드파티 연동 등록·승인 워크플로우, 토큰 회수·만료 정책 확립
- **데이터 레이크/BI**
  - 운영 DB와 분리된 DW/데이터마트(BigQuery/Redshift 등) 구성, CDC 또는 배치 동기화
  - 테넌트/HQ용 BI 리포트와 AI 분석 파이프라인을 데이터 레이크 기반으로 설계
- **메시징 & 이벤트 스트림**
  - Kafka/EventBridge로 주문·정산·알림 이벤트를 비동기 처리, DLQ/재처리 정책 정의
  - 실시간 알림/AI 분석/외부 파트너 연계를 위한 Pub/Sub 채널 표준화
- **Resilience & DR**
  - 인증/결제/정산 등 핵심 서비스의 DR 리전 구성, RPO/RTO 목표 수립 및 주기적 DR Drills
  - 주기적 백업·복구 시나리오 문서화, 인프라/DB 재해 대응 Runbook 작성
- **보안/컴플라이언스**
  - 외부 SSO(OIDC/SAML) 연동 대비, Zero Trust 네트워크 정책(Identity Aware Proxy 등)
  - Secrets/KMS, 키 회전, 감사·침해 대응 플레이북, 규제(정보보호/전자금융) 대응 가이드
- **자동화 & DevOps**
  - IaC(Terraform/Helm)로 인프라 형상 통제, GitOps 파이프라인(ArgoCD) 고도화
  - 배포 후 자동 검증(E2E/회귀/시각적 테스트) 및 SLA 기반 온콜 체계 운영
- **글로벌/멀티로케일 준비**
  - 다국어(i18n), 통화/세금/환율 처리, 현지 결제 PG 추상화
  - GDPR 등 해외 규제 검토, 지역별 데이터 보관 정책 문서화

## 6. 향후 확장 로드맵 요약

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

## 7. 운영 영향 최소화를 위한 단계별 전환 전략 (초안)

1. **문서화 및 개발 표준 정비**
   - 기존 운영 기능을 유지한 채 설계 문서, 폴더 구조, 코드 컨벤션, CI 규칙을 명확화
   - 신규 기능 여부와 관계없이 적용 가능, 운영 영향 없음
2. **운영 안전망 강화**
   - Observability/알림 체계, GitOps, Feature Flag, Blue/Green 배포 기준 마련
   - 기존 서비스와 병행 적용 가능, 이상 탐지 범위 확장
3. **데이터 모델 확장 (비파괴적)**
   - `pricing_*`, `tenant_role` 등 신규 테이블을 추가하고, 기존 테이블은 그대로 유지
   - PL/SQL 배치 및 API에서 신규 테이블을 읽도록 병행 처리 후, 검증 단계에서 전환
4. **권한·요금제 모듈 병행 도입**
   - 기존 RBAC 위에 템플릿/커스텀 구조를 얹고, 테넌트별 Feature Flag로 신규 체계 사용 여부 제어
   - AI 과금은 데이터 수집 → 계산 → 인보이스 발행 순으로 단계 롤아웃
5. **기능별 베타 리 release**
   - Beta 메뉴나 특정 테넌트에만 신규 화면/기능 제공, 문제 없을 때 범위 확대
6. **전환 및 레거시 정리**
   - 신구 구조 모두 안정화되면 레거시 코드를 단계적으로 제거하고, 데이터 마이그레이션 완료
7. **상시 모니터링 및 회고**
   - 매 단계에서 SLA/SLO, 테넌트별 로그, 에러율 모니터링
   - 회고를 통해 다음 단계 전환 시 체크리스트 업데이트

> **운영 원칙:** 모든 단계는 Feature Flag/Toggle을 기반으로 "옵트인" 방식으로 전환하며, 운영 서비스에 영향을 주지 않는 선에서 구조 개편을 우선시한다.

## 8. 대규모 개편 시 필수 실행 항목

### 8.1 데이터 마이그레이션 & 롤백 계획
- `migration_plan.md` 작성: 스키마 확장 → 데이터 백필 → 검증 → 롤백 절차 → 승인자 명시
- 신규 테이블(`pricing_*`, `tenant_role` 등)은 추가 후, 기존 데이터에서 참조 값을 채우는 단계적 마이그레이션 수행
- 롤백 전략: 새 테이블/칼럼은 `is_active`, `effective_from` 등으로 비활성화 가능하도록 설계
- 배포 전/후 데이터 검증: 샘플 테넌트 기준 SQL/Audit 로그 비교, PL/SQL 배치 사전 리허설

### 8.2 Feature Flag 운영 정책
- 플래그 관리: `feature_flag` 테이블 또는 LaunchDarkly 등 외부 서비스 도입 고려
  - 필드 예시: `flag_key`, `description`, `default_state`, `target_scope(tenant/role)`, `expiry_date`, `created_by`
- 라이프사이클: 정의 → QA/테스트 → 운영 → 기간 만료 → 제거(Dead Flag Clean-up)
- 권한: HQ Admin 이상만 생성/수정, 변경 시 Audit Log와 Slack/이메일 알림 발송
- 문서: 각 기능별 플래그 목록과 적용 테넌트/환경을 위키에 유지

### 8.3 QA · 회귀 테스트 매트릭스
- Dev 환경: 단위/통합 테스트, API 계약 테스트, 기본 스모크(E2E) 자동화
- Staging 환경: 풀 E2E, 회귀, 시각적 회귀(Percy/Chromatic), 성능(부하) 테스트
- 테스트 매핑 문서: 기능/모듈 × 테스트 유형 × 환경 × 자동/수동 여부를 표로 정리
- 릴리스 전 체크리스트: 실패 테스트 없고, 주요 테넌트 시나리오 수동 검증 완료 시에만 승격

### 8.4 외부 서비스 연동 환경 분리
- 소셜 로그인(Kakao/Naver), PG, SMS, 이메일, 웰니스 API 등 모든 외부 서비스에 대한 환경별 엔드포인트/자격 증명 관리 표 작성
- Dev/Staging에서는 샌드박스 키 사용, 운영은 Secrets Manager/KMS로 관리
- 계정/콜백 URL/웹훅 분리: 오동작 예방을 위해 환경마다 고유 URL 사용
- 외부 서비스별 장애 대응 연락망 및 SLA 문서화

### 8.5 배포 후 모니터링 & 롤백 기준
- KPI 정의: 오류율, 응답시간, 배치 성공률, AI 사용량, 결제 성공률 등
- 알림 임계값 설정: KPI가 기준치 초과 시 자동 알림 → 즉시 점검 → 롤백 여부 판단
- 롤백 정책: Canary 실패, KPI 3회 이상 경고, 핵심 기능 장애 발생 시 자동 롤백 스크립트 실행
- 배포 후 회고: 주요 지표, 장애/경고, 개선 과제를 회고 문서로 정리

### 8.6 보안/규정 감사 증적 관리
- `SECURITY_POLICY.md`에 증적 목록/보관 위치/책임자/점검 주기 추가
- 로그 보존: 운영(6개월), Staging/Dev(1개월) 등 보존 기간 정책 명시
- 정책 문서/승인 기록: Git 저장소 또는 문서 관리 시스템(Confluence 등)에 버전 관리
- 정기 감사 준비: ISMS-P 체크 항목과 연계해 로그·접근 기록·교육 이수 내역을 정의된 위치에 보관

## 9. 운영 거버넌스 & 입점사 관리 포털 (초안)

- **운영 포털 개요**
  - 대상 사용자: MindGarden HQ 운영팀, SRE/플랫폼 엔지니어, 보안 담당, Customer Success
  - 목적: 테넌트 온보딩/요금제/권한/알림/배포 상태를 중앙에서 관제·승인·기록
- **핵심 기능**
  1. **테넌트 온보딩 워크플로우**
     - 단계별 체크리스트(계약, 결제 정보, 권한 템플릿, AI 플랜 선택)
     - 승인 플로우: 영업 → 보안 → 기술 승인 → 최종 활성화
     - 자동화: 성공 시 기본 데이터/샘플 템플릿/알림 채널 자동 세팅
  2. **요금제 & 애드온 관리**
     - 테넌트 요청 승인/거절, 가격표 업데이트 히스토리, AI 사용량/청구 내역 대시보드
     - 수수료율 변경, 프로모션 코드, 업셀링 제안 관리
  3. **권한/보안 감사**
     - 역할 템플릿 배포, 민감 권한 허용/회수, 비정상 접근 탐지
     - 감사 로그 조회 및 감사 리포트 자동 생성
  4. **관제 대시보드**
     - 서비스 상태(에러율, 응답시간), 배포/배치 현황, 알림 이벤트, KPI 모니터링
     - 테넌트별 SLA 준수 현황, 장애/경고 이력 관리
  5. **운영 Runbook & 알림**
     - 장애 대응 Runbook 링크, 알림 채널(Slack/PagerDuty) 연계, 온콜 스케줄 관리
- **기술 구성**
  - 프런트엔드: 내부용 React/Admin 포털 (RBAC로 접근 제한)
  - 백엔드: 운영 전용 API(테넌트/요금제/권한/로그) + Workflow Engine(BPMN, Temporal 등) 검토
  - 데이터: `tenant_onboarding_task`, `pricing_change_request`, `feature_flag_audit`, `incident_report` 등 운영 전용 테이블
- **프로세스 연계**
  - CI/CD와 연동하여 배포 상태·Feature Flag 상태를 실시간 표시
  - 고객 지원 시스템(Zendesk 등)과 연동해 요청→승인→실행→회신 흐름 자동화
  - 감사/규정 문서와 연결해 변경 이력과 증적을 동일 포털에서 열람
- **로드맵 제안**
  1. MVP: 온보딩 체크리스트 + 요금제 승인 + 기본 관제
  2. V2: 권한/보안 감사, 알림/Runbook, AI 비용/사용량 통합 리포트
  3. V3: Workflow Engine 도입, 외부 시스템 커넥터(ERP, 고객지원, 문서 관리) 확장

## 10. 결제 즉시 활성화(Zero-Touch Onboarding) 아키텍처

1. **가입 → 테넌트 생성**
   - 가입폼에서 업종/규모/요금제 선택 → `tenant`, 기본 지점, 역할 템플릿, 브랜딩 자산을 자동 프로비저닝
   - 초기 데이터(샘플 상품/수강/알림 템플릿) 삽입, API Key·Webhook 시크릿 발급
2. **결제 → 청구 활성화**
   - PG Webhook 성공 시 `tenant_subscription` 상태를 `ACTIVE`로 전환, `subscription_invoice` 생성 및 영수증 이메일 전송
   - 실패 시 자동 재시도/알림, 일정 기간 초과 시 `SUSPENDED` 처리와 서비스 제한
3. **서비스 프로비저닝 & 플래그 설정**
   - `tenant_ai_service`, Feature Flag, 알림 채널, 배치 스케줄을 자동 세팅
   - 권한 템플릿 복제 후 테넌트 역할을 활성화, MFA/보안 정책 초기화
4. **알림 & 체크리스트 자동화**
   - 테넌트 관리자에게 온보딩 체크리스트/가이드 자동 발송, 운영 포털 `tenant_onboarding_task` 업데이트
   - 운영팀은 승인 없이도 실시간 상태를 모니터링, 이상 시 티켓 자동 생성
5. **정산/회계 연동**
   - MindGarden 수수료 및 벤더 비용을 정산 배치와 연동, 다음 정산 주기에 반영
   - 세금계산서 발행, 회계 시스템 API 연동까지 자동화(추가 승인 불필요)
6. **모니터링 & 롤백**
   - 이벤트 스트림(Kafka/EventBridge)에 가입/결제/플래그 상태를 기록, 관제 대시보드와 연동
   - 결제 미납·AI 초과 사용 등 이상 상황에서 자동 제한/롤백 규칙 실행, 운영 포털 알림

> 위 구조를 통해 "웹/앱에서 결제하면 즉시 사용 가능한" 완전 자동화 SaaS 경험을 제공한다.

## 11. 최소 입력(로그인 제외) 자동화 전략

1. **업종 템플릿 자동 적용**
   - 가입 시 업종·규모 선택만으로 `role_template`, `pricing_plan`, `feature_flag`가 자동 매핑되도록 구성
   - 테넌트별 기본 메뉴/권한/요금제가 즉시 반영되어 추가 입력 없이 대시보드 접근 가능
2. **결제 정보 일원화**
   - 최초 결제 시 정기 과금·세금/청구 정보를 한 번에 수집하고, 이후 결제는 저장된 토큰으로 자동 처리
   - PG 연동 시 재입력 방지를 위해 카드/계좌 토큰화, 자동 영수증 발행, 세금계산서 발행까지 일괄 자동화
3. **샘플 데이터 & 가이드 부팅**
   - 테넌트 생성과 동시에 샘플 상담/수강/상품/알림 템플릿을 삽입하고, 초기 화면에 체크리스트를 표시
   - 사용자는 데이터를 입력하는 대신 샘플을 검토·수정만 하면 실제 운영이 가능하도록 구성
4. **AI 기반 보조 입력**
   - 텍스트/이미지/알림 작성 시 AI가 도메인 템플릿을 바탕으로 초안을 제시하고, 사용자는 승인/수정만 진행
   - FAQ/챗봇 연동으로 설정 질문에 즉시 답변, RAG 기반 문서 추천으로 설명서 탐색 최소화
5. **자동 연동 설정**
   - 기본 API Key·Webhook·알림 채널을 자동 발급/활성화하고, 필요한 경우 토글만으로 ON/OFF 가능하게 구현
   - 외부 서비스 샌드박스/프로덕션 자격 증명은 관리 포털에서 한 번에 주입
6. **운영팀 원클릭 승인**
   - 운영 포털은 승인 버튼 하나로 온보딩/요금제/권한/AI 설정이 일괄 적용되도록 Workflow 자동화
   - 승인 과정에서도 수동 입력 없이 모니터링/알림만 확인하면 되도록 설계

> 핵심 목표: "로그인만 하면 즉시 사용할 수 있는" SaaS 경험을 제공하기 위해, 모든 초기 설정과 데이터 입력을 자동화 또는 템플릿 기반 검토 단계로 축소한다.

## 12. 전사 데이터 중앙화 원칙

1. **단일 데이터 코어 유지**
   - 모든 운영/결제/정산/AI/로그 데이터는 공통 DB 클러스터(테넌트 파티셔닝)에서 관리
   - 외부 서비스(RAG, BI, Data Lake)는 CDC 또는 API를 통해 읽기 전용으로 연계하고, 원본은 항상 중앙 DB에 존재하도록 강제
2. **데이터 생성 지점 통합**
   - 웹/앱/운영 포털/모바일 앱에서 발생하는 모든 트랜잭션은 API Gateway → 중앙 서비스 → DB 순으로 흐르도록 설계
   - 오프라인 수집 데이터(예: 현장 등록)는 모바일 앱에서 즉시 동기화되어 로컬 캐시를 남기지 않음
3. **메타데이터·코드 관리 일원화**
   - 공통 코드, 요금제, 템플릿, Feature Flag, 권한 정책 등은 `core-domain` 레이어 하위 central registry 테이블로 유지
   - 테넌트별 커스텀 설정도 중앙 저장소에 버전 관리 (`tenant_config`, `tenant_feature_override` 등)
4. **로그/감사 데이터 중앙 저장**
   - 운영 포털, 외부 포털, 모바일 앱 로그를 모두 ELK/OpenSearch/S3 중앙 인덱스에 수집
   - 규제·감사 목적 자료는 `operator_audit_log`, `security_event`, `feature_flag_audit` 등 중앙 테이블에만 기록
5. **데이터 접근 거버넌스**
   - HQ/HQ-Master만 전체 데이터 접근, 테넌트/지점/역할 단위로 뷰(View) 또는 API 레벨 필터 적용
   - BI/AI 분석용 데이터셋도 중앙 파이프라인에서 파생, 복제본 생성 시 암호화 및 접근 권한 로그 기록
6. **백업·DR 일원화**
   - 모든 서비스 데이터와 메타데이터를 동일 백업 정책/DR 시나리오로 관리 (스냅샷 + PITR)
   - 중앙화된 백업/복구 스크립트를 운영 포털에서 트리거 가능하도록 준비

> 데이터 중앙화를 절대 원칙으로 두어야만, 자동화 온보딩·정산·AI 분석·감사 대응이 한 번에 이루어질 수 있다.
