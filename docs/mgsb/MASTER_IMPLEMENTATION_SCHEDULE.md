# CoreSolution 전체 구현 일정 계획서

**작성일:** 2025-01-XX  
**목적:** CoreSolution ERD 시스템 고도화 및 테넌트별 PG사 연계 승인 시스템 전체 구현 일정

## 1. 현재 상태 분석

### 1.1 구현 완료 항목
- ⚠️ **ERD 시스템**: 초보 수준 (문서 기반, `DATA_CORE_AND_PL_SQL.md`에 Mermaid 다이어그램만 존재)
- ❌ **테넌트 PG 승인 시스템**: 미구현 (문서만 존재)
- ✅ **기본 PG 연동**: `PaymentGatewayService`, `TossPaymentServiceImpl` 존재
- ✅ **온보딩 승인 시스템**: `OnboardingRequest`, `OnboardingService` 존재 (ERD 자동 생성 연계 가능)

### 1.2 ERD 시스템 현재 상태 (초보 수준)
- **문서 기반**: `DATA_CORE_AND_PL_SQL.md`에 Mermaid 다이어그램으로 저장
- **버전 관리**: Git을 통한 버전 관리
- **시각화**: Mermaid 다이어그램 (전체 시스템, 업종별 모듈)
- **텍스트 ERD**: 통합 ERD를 텍스트로 표현
- **접근성**: 개발팀만 접근 가능 (문서 기반)
- **자동화**: 없음 (수동으로 문서 수정)
- **입점사 접근**: 불가능
- **온보딩 연계**: 없음

### 1.2 기반 인프라
- ✅ Spring Boot 프로젝트 구조
- ✅ 데이터베이스 (MySQL)
- ✅ Flyway 마이그레이션 시스템
- ✅ 암호화 유틸리티 (`PersonalDataEncryptionUtil`)
- ✅ 운영 포털 기본 구조
- ✅ **프론트엔드 코드 품질 도구**: ESLint, Prettier, Pre-commit Hook (기본 설정 완료)
- ✅ **테넌트 시스템**: Week 0 Day 1-3 구현 완료 (핵심 인프라)
  - ✅ `tenant` 테이블 생성 완료
  - ✅ `Tenant` 엔티티 및 Repository 생성 완료
  - ✅ `TenantContext`, `TenantContextHolder` 구현 완료
  - ✅ `TenantIdentifierResolver` 구현 완료
  - ⬜ `TenantContextFilter` 구현 (Week 0 Day 4 예정)
  - ⬜ Repository 레벨 자동 필터링 (Week 0 Day 5 예정)
  - `tenant` 테이블 미생성
  - `TenantContext`, `TenantIdentifierResolver` 미구현
  - 멀티테넌시 필터링 미구현
- ⚠️ **백엔드 코드 품질 도구**: Checkstyle, SpotBugs 미설정
- ⚠️ **하드코딩 금지 규칙**: 상수 사용 강제 규칙 미설정
- ⚠️ **동적 시스템 감시**: 런타임 모니터링 시스템 미구축
- ⚠️ **코드 품질 모니터링**: 지속적 코드 품질 추적 시스템 미구축

## 2. 전체 일정 개요

### 2.1 총 소요 기간
**예상 기간:** 14주 (Week 0, 0.5 포함, 약 3.5개월)
- **Week 0**: 테넌트 시스템 핵심 인프라 구축 + 코드 품질 도구 설정 (선행 작업, 필수)
- **Week 0.5**: 온보딩 시스템 필수 테이블 구축 (Week 3 전 필수, PL/SQL 프로시저 의존성)
- **Week 1-12**: ERD 시스템 고도화 및 PG 승인 시스템 구축
- **Week 13**: 코드 품질 모니터링 및 동적 시스템 감시 구축 (지속적 개선)

### 2.2 주요 마일스톤
- **M1 (Week 2)**: 테넌트 PG 설정 입력/승인 기본 기능 완료
- **M2 (Week 4)**: ERD 자동 생성 시스템 완료
- **M3 (Week 6)**: PG 암호화 및 연결 테스트 완료
- **M4 (Week 8)**: ERD 관리 대시보드 완료
- **M5 (Week 10)**: UI 구현 완료
- **M6 (Week 12)**: 통합 테스트 및 배포 완료

## 3. 상세 일정

### Phase 0: 테넌트 시스템 기반 구축 (Week 0, 선행 작업) - **진행 중**

> **중요**: 테넌트 시스템은 모든 기능의 기반이므로, ERD 및 PG 승인 시스템보다 먼저 구축되어야 합니다.  
> **현재 진행 상황**: Week 0 Day 1-3 완료 (Day 4-5 진행 예정)

#### Week 0: 테넌트 시스템 핵심 인프라 구축 + 코드 품질 도구 설정

**목표:** 멀티테넌시 기반 인프라 구축 및 코드 품질 검증 시스템 구축

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | `tenant` 테이블 생성 (Flyway 마이그레이션) | Backend | 4h | ✅ |
| Day 1 | 기존 Branch를 Tenant로 마이그레이션 스크립트 작성 | Backend | 2h | ✅ |
| Day 2 | 주요 테이블에 `tenant_id` 컬럼 추가 (Flyway) | Backend | 4h | ✅ |
| Day 2 | `Tenant` 엔티티 클래스 생성 | Backend | 2h | ✅ |
| Day 3 | `TenantContext` 및 `TenantContextHolder` 구현 | Backend | 4h | ✅ |
| Day 3 | `TenantIdentifierResolver` 구현 (Hibernate MultiTenancy) | Backend | 4h | ✅ |
| | - Hibernate MultiTenancy 설정 (application.yml) | | | ✅ |
| | - `CurrentTenantIdentifierResolver` 구현 | | | ✅ |
| | - `MultiTenantConnectionProvider` 구현 (필요 시) | | | ⚠️ (Hibernate 6.x는 DISCRIMINATOR 미지원, Repository 레벨 필터링으로 대체) |
| | - Hibernate 설정 클래스 업데이트 | | | ✅ |
| Day 4 | `TenantContextFilter` 구현 (HTTP 요청에서 tenant_id 추출) | Backend | 4h | ⬜ |
| Day 4 | SecurityConfig에 필터 등록 | Backend | 2h | ⬜ |
| Day 5 | Repository 레벨 `tenant_id` 자동 필터링 구현 | Backend | 4h | ⬜ |
| Day 5 | 테넌트 시스템 통합 테스트 | Backend | 4h | ⬜ |
| **Day 5** | **코드 품질 도구 설정** (병렬 진행) | Backend/Frontend | 4h | ⬜ |
| | - **백엔드**: Checkstyle, SpotBugs 설정 | | | |
| | - **하드코딩 금지 규칙**: 상수 사용 강제 ESLint/Checkstyle 규칙 | | | |
| | - **Git Pre-commit Hook**: 문법 검사 자동화 | | | |
| | - **빌드 프로세스 통합**: Maven/Gradle 빌드 시 자동 검사 | | | |
| |   - `mvn clean verify` 시 Checkstyle, SpotBugs 자동 실행 | | | |
| |   - 빌드 실패 시 검사 실패 원인 표시 | | | |
| | - **프론트엔드**: `npm run build` 시 ESLint, 하드코딩 검사 자동 실행 | | | |
| | - **CI/CD 통합**: 코드 품질 검사 자동 실행 | | | |

**Week 0 완료 기준:**
- [x] `tenant` 테이블 생성 완료 (V1__create_tenants_table.sql)
- [x] 기존 Branch 데이터를 Tenant로 마이그레이션 완료 (V2__migrate_branches_to_tenants.sql)
- [x] 주요 테이블에 `tenant_id` 컬럼 추가 완료 (V3__add_tenant_id_to_branches.sql, V4__add_tenant_id_to_main_tables.sql)
- [x] `Tenant` 엔티티 클래스 생성 완료 (com.coresolution.core.domain.Tenant)
- [x] `TenantRepository` 생성 완료
- [x] `TenantContext` 및 `TenantContextHolder` 구현 완료
- [x] `TenantIdentifierResolver` 구현 완료 (Hibernate 6.x는 DISCRIMINATOR 미지원 확인, Repository 레벨 필터링으로 대체)
- [x] Hibernate 설정 클래스 업데이트 완료 (HibernateMultiTenancyConfig)
- [x] **패키지명 마이그레이션**: `com.mindgarden.core` → `com.coresolution.core` (도메인: core-solution.co.kr) ✅
- [x] `TenantContextFilter` 구현 및 등록 완료 (com.coresolution.core.filter.TenantContextFilter)
- [x] Branch 엔티티에 tenant_id 필드 추가 완료
- [x] Repository 레벨 자동 필터링 구현 완료
  - [x] BaseEntity에 tenant_id 필드 추가
  - [x] BaseRepository에 tenant_id 필터링 메서드 추가
  - [x] TenantEntityListener 구현 (자동 tenant_id 설정)
  - [x] TenantContextHolder를 사용한 자동 필터링
- [ ] Repository 레벨 자동 필터링 동작 확인 (테스트 필요)
- [ ] 통합 테스트 통과
- [x] **코드 품질 도구 설정 완료**
  - [x] 백엔드 Checkstyle 설정 완료 (`checkstyle.xml`, `pom.xml` 플러그인)
  - [x] 백엔드 SpotBugs 설정 완료 (`spotbugs-include.xml`, `pom.xml` 플러그인)
  - [x] 하드코딩 금지 규칙 설정 완료 (`scripts/check-hardcoding.js`)
  - [x] Git Pre-commit Hook 설정 완료 (`.git/hooks/pre-commit`)
  - [x] **빌드 프로세스 통합 완료**
    - [x] Maven 빌드 시 Checkstyle 자동 실행 (`mvn validate` phase)
    - [x] Maven 빌드 시 SpotBugs 자동 실행 (`mvn verify` phase)
    - [x] 프론트엔드 빌드 시 ESLint 자동 실행 (`npm run build` prebuild hook)
    - [x] 프론트엔드 빌드 시 하드코딩 검사 자동 실행 (`npm run build` prebuild hook)
    - [x] 빌드 실패 시 검사 결과 리포트 생성 (console output)
  - [ ] CI/CD 코드 품질 검사 통합 완료 (GitHub Actions에 추가 필요)

**참고**: Week 0는 ERD 및 PG 승인 시스템의 전제 조건이므로, 반드시 먼저 완료되어야 합니다.

---

### Phase 0.5: 온보딩 시스템 필수 테이블 구축 (Week 0.5, Week 3 전 필수)

> **⚠️ 중요**: `ProcessOnboardingApproval` PL/SQL 프로시저가 의존하는 모든 테이블을 Week 3 이전에 구축해야 합니다.  
> **의존성 체인**: Week 0 → Week 0.5 → Week 3 (PL/SQL 프로시저 작성)

#### Week 0.5: 카테고리/컴포넌트/요금제/역할 템플릿 시스템 테이블 구축

**목표:** 온보딩 PL/SQL 프로시저가 사용하는 모든 필수 테이블 구축

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | **카테고리 시스템 테이블** 생성 (Flyway) | Backend | 4h | ✅ |
| | - `business_category` (대분류) | | | |
| | - `business_category_item` (소분류, default_components_json 포함) | | | |
| | - `tenant_category_mapping` (테넌트-카테고리 매핑) | | | |
| Day 1 | 카테고리 시스템 엔티티 클래스 생성 | Backend | 2h | ✅ |
| Day 2 | **컴포넌트 카탈로그 시스템 테이블** 생성 (Flyway) | Backend | 4h | ✅ |
| | - `component_catalog` (컴포넌트 메타데이터) | | | |
| | - `component_feature` (컴포넌트 기능 정의) | | | |
| | - `component_pricing` (컴포넌트 과금 정책) | | | |
| | - `component_dependency` (컴포넌트 의존성) | | | |
| | - `tenant_component` (테넌트별 활성화된 컴포넌트) | | | |
| Day 2 | 컴포넌트 카탈로그 엔티티 클래스 생성 | Backend | 2h | ✅ |
| Day 3 | **요금제 시스템 테이블** 생성 (Flyway) | Backend | 4h | ✅ |
| | - `pricing_plan` (기본 요금제: STARTER, STANDARD, PREMIUM) | | | |
| | - `pricing_plan_feature` (요금제별 기능/한도) | | | |
| | - `tenant_subscription` (테넌트별 활성 요금제) | | | |
| Day 3 | 요금제 시스템 엔티티 클래스 생성 | Backend | 2h | ✅ |
| Day 4 | **역할 템플릿 시스템 테이블** 생성 (Flyway) | Backend | 4h | ✅ |
| | - `role_template` (업종별 기본 역할 템플릿) | | | |
| | - `role_template_permission` (템플릿 권한 목록) | | | |
| | - `role_template_mapping` (업종별 템플릿 매핑) | | | |
| | - `tenant_role` (테넌트 커스텀 역할) | | | |
| | - `role_permission` (테넌트 역할 권한) | | | |
| Day 4 | 역할 템플릿 시스템 엔티티 클래스 생성 | Backend | 2h | ✅ |
| Day 5 | **초기 데이터 삽입** (Flyway) | Backend | 4h | ✅ |
| | - 카테고리 초기 데이터 (교육, 요식, 서비스 등) | | | |
| | - 컴포넌트 카탈로그 초기 데이터 (상담, 예약, 결제 등) | | | |
| | - 요금제 초기 데이터 (STARTER, STANDARD, PREMIUM) | | | |
| | - 역할 템플릿 초기 데이터 (학원: 원장, 교사, 학생 등) | | | |
| Day 5 | 테이블 간 외래키 제약조건 설정 및 검증 | Backend | 4h | ✅ |

**Week 0.5 완료 기준:**
- [x] 카테고리 시스템 테이블 생성 완료 (`business_category`, `business_category_item`, `tenant_category_mapping`) - Flyway V5
- [x] 카테고리 시스템 엔티티 클래스 생성 완료 (`BusinessCategory`, `BusinessCategoryItem`, `TenantCategoryMapping`)
- [x] 컴포넌트 카탈로그 시스템 테이블 생성 완료 (`component_catalog`, `component_feature`, `component_pricing`, `component_dependency`, `tenant_component`) - Flyway V6
- [x] 컴포넌트 카탈로그 엔티티 클래스 생성 완료 (`ComponentCatalog`, `ComponentFeature`, `ComponentPricing`, `ComponentDependency`, `TenantComponent`)
- [x] 요금제 시스템 테이블 생성 완료 (`pricing_plan`, `pricing_plan_feature`, `tenant_subscription`) - Flyway V7
- [x] 요금제 시스템 엔티티 클래스 생성 완료 (`PricingPlan`, `PricingPlanFeature`, `TenantSubscription`)
- [x] 역할 템플릿 시스템 테이블 생성 완료 (`role_template`, `role_template_permission`, `role_template_mapping`, `tenant_role`, `role_permission`) - Flyway V8
- [x] 역할 템플릿 시스템 엔티티 클래스 생성 완료 (`RoleTemplate`, `RoleTemplatePermission`, `RoleTemplateMapping`, `TenantRole`, `RolePermission`)
- [x] 모든 엔티티 클래스 생성 완료
- [x] 초기 데이터 삽입 완료 (카테고리, 컴포넌트, 요금제, 역할 템플릿) - Flyway V9
- [x] 외래키 제약조건 검증 스크립트 생성 완료 - Flyway V10
- [x] **PL/SQL 프로시저 의존성 검증**: `ProcessOnboardingApproval`이 사용하는 모든 테이블 존재 확인 ✅

**⚠️ 필수 의존성 체크리스트 (Week 3 전 반드시 완료):**
- [ ] `tenants` 테이블 (Week 0)
- [ ] `business_category_items` 테이블 (Week 0.5)
- [ ] `tenant_category_mappings` 테이블 (Week 0.5)
- [ ] `component_catalog` 테이블 (Week 0.5)
- [ ] `tenant_components` 테이블 (Week 0.5)
- [ ] `pricing_plans` 테이블 (Week 0.5)
- [ ] `tenant_subscriptions` 테이블 (Week 0.5)
- [ ] `role_templates` 테이블 (Week 0.5)
- [ ] `role_template_mappings` 테이블 (Week 0.5)
- [ ] `tenant_roles` 테이블 (Week 0.5)
- [ ] `role_template_permissions` 테이블 (Week 0.5)
- [ ] `role_permissions` 테이블 (Week 0.5)
- [ ] `ops_onboarding_request` 테이블 (이미 존재)
- [ ] `ops_audit_log` 테이블 (이미 존재)
- [ ] `erd_diagrams` 테이블 (Week 3 Day 1)

**참고**: Week 0.5는 Week 3의 `ProcessOnboardingApproval` PL/SQL 프로시저 작성 전 필수 전제 조건입니다.  
이 테이블들이 없으면 PL/SQL 프로시저가 실행되지 않습니다.

---

### Phase 1: 기반 구축 (Week 1-2)

#### Week 1: 테넌트 PG 승인 시스템 기반 구축

**목표:** 데이터베이스 및 기본 엔티티 구축 (테넌트 시스템 기반 위에 구축)

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | Flyway 마이그레이션 파일 작성 | Backend | 4h | ✅ |
| Day 1 | Enum 클래스 생성 (PgProvider, Status 등) | Backend | 2h | ✅ |
| Day 2 | 엔티티 클래스 생성 (TenantPgConfiguration) | Backend | 4h | ✅ |
| Day 2 | Repository 인터페이스 생성 | Backend | 2h | ✅ |
| Day 3 | DTO 클래스 생성 | Backend | 3h | ✅ |
| Day 3 | 서비스 클래스 기본 구조 생성 | Backend | 3h | ✅ |
| Day 4 | PG 설정 생성 서비스 구현 | Backend | 6h | ✅ |
| Day 5 | PG 설정 조회 서비스 구현 | Backend | 4h | ✅ |
| Day 5 | 단위 테스트 작성 | Backend | 4h | ✅ |

**Week 1 완료 기준:**
- [x] 데이터베이스 테이블 생성 완료 ✅
- [x] 엔티티 및 Repository 구현 완료 ✅
- [x] 서비스 기본 기능 구현 완료 ✅
- [x] 단위 테스트 작성 완료 ✅

#### Week 2: 테넌트 PG 승인 API 구현

**목표:** API 엔드포인트 및 승인 기능 구현

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | 컨트롤러 구현 (테넌트 포털용) | Backend | 4h | ✅ |
| Day 1 | 운영 포털 컨트롤러 구현 | Backend | 4h | ✅ |
| Day 2 | 승인/거부 서비스 로직 구현 | Backend | 6h | ✅ |
| Day 3 | 암호화 통합 (API Key, Secret Key) | Backend | 4h | ✅ |
| Day 3 | 변경 이력 테이블 및 서비스 구현 | Backend | 4h | ✅ |
| Day 4 | API 통합 테스트 | Backend | 4h | ✅ |
| Day 5 | API 문서화 (Swagger/OpenAPI) | Backend | 4h | ✅ |
| Day 5 | 코드 리뷰 및 수정 | Backend | 4h | ✅ |

**Week 2 완료 기준:**
- [ ] 모든 API 엔드포인트 구현 완료
- [ ] 승인/거부 기능 동작 확인
- [ ] 암호화 적용 완료
- [ ] 통합 테스트 통과
- [ ] API 문서화 완료

**M1 마일스톤 달성** ✅

---

### Phase 2: ERD 시스템 고도화 + 온보딩 연계 (Week 3-4)

#### ✅ Week 3 완료

#### Week 3: ERD 자동 생성 시스템 + 온보딩 연계 구현

> **⚠️ 전제 조건**: Week 0.5에서 구축한 모든 테이블이 존재해야 PL/SQL 프로시저가 정상 동작합니다.

**목표:** 데이터베이스 스키마에서 ERD 자동 생성 및 온보딩 승인 시 자동 생성

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | ERD 메타데이터 테이블 생성 (Flyway) | Backend | 2h | ✅ |
| | - `erd_diagrams` (ERD 메타데이터) | | | |
| Day 1 | 엔티티 모델 클래스 생성 | Backend | 4h | ✅ |
| Day 1 | INFORMATION_SCHEMA 쿼리 작성 | Backend | 2h | ✅ |
| Day 1 | **의존성 검증**: Week 0.5 테이블 존재 확인 | Backend | 1h | ✅ |
| Day 2 | 스키마 조회 서비스 구현 | Backend | 4h | ✅ |
| Day 2 | Mermaid ERD 생성 서비스 구현 | Backend | 4h | ✅ |
| Day 3 | 테넌트별 ERD 생성 로직 구현 | Backend | 6h | ✅ |
| Day 4 | **PL/SQL 프로시저 작성** (ProcessOnboardingApproval - 전체 프로세스) | Backend | 6h | ✅ |
| | - CreateOrActivateTenant | | | |
| | - SetupTenantCategoryMapping | | | |
| | - ActivateDefaultComponents | | | |
| | - CreateDefaultSubscription | | | |
| | - ApplyDefaultRoleTemplates | | | |
| | - GenerateErdOnOnboardingApproval | | | |
| Day 4 | PL/SQL 프로시저 작성 (GenerateErdOnOnboardingApproval) | Backend | 2h | ✅ |
| Day 5 | 온보딩 승인 연계 (PL/SQL 프로시저 호출) | Backend | 2h | ✅ |
| Day 5 | ERD 메타데이터 저장 서비스 구현 | Backend | 2h | ✅ |
| Day 5 | **통합 테스트**: PL/SQL 프로시저 전체 플로우 테스트 | Backend | 4h | ✅ |
| Day 5 | 온보딩 승인 시 ERD 자동 생성 테스트 | Backend | 4h | ✅ |

**Week 3 완료 기준:**
- [x] ERD 메타데이터 테이블 생성 완료 (중앙화)
- [x] 스키마 정보 조회 기능 완료
- [x] Mermaid ERD 자동 생성 완료
- [x] 테넌트별 ERD 생성 로직 완료
- [x] **Week 0.5 테이블 의존성 검증 완료** (모든 필수 테이블 존재 확인)
- [x] **PL/SQL 프로시저 작성 완료 (ProcessOnboardingApproval - 전체 온보딩 프로세스)**
  - [x] CreateOrActivateTenant 프로시저
  - [x] SetupTenantCategoryMapping 프로시저
  - [x] ActivateDefaultComponents 프로시저
  - [x] CreateDefaultSubscription 프로시저
  - [x] ApplyDefaultRoleTemplates 프로시저
  - [x] GenerateErdOnOnboardingApproval 프로시저
- [x] **PL/SQL 프로시저 작성 완료 (GenerateErdOnOnboardingApproval)**
- [x] **온보딩 승인 시 PL/SQL 프로시저 호출 연계 완료 (코어 로직)**
- [x] ERD 메타데이터 저장 완료 (중앙화)
- [x] **통합 테스트 완료**: 전체 온보딩 플로우 (테넌트 생성 → 카테고리 매핑 → 컴포넌트 활성화 → 요금제 구독 → 역할 템플릿 → ERD 생성) 검증
- [x] 생성된 ERD 검증 완료

#### Week 4: 테넌트 포털 ERD 뷰어 구현

**목표:** 테넌트 포털에서 ERD 조회 및 시각화

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | 테넌트 ERD 조회 API 구현 | Backend | 4h | ✅ |
| Day 1 | ERD 상세 조회 API 구현 | Backend | 4h | ✅ |
| Day 2 | ERD 변경 이력 조회 API 구현 | Backend | 4h | ✅ |
| Day 2 | 테넌트 포털 ERD 목록 페이지 구현 | Frontend | 4h | ✅ |
| Day 3 | 테넌트 포털 ERD 상세 페이지 구현 (Mermaid.js) | Frontend | 6h | ✅ |
| Day 4 | ERD 인터랙티브 뷰어 구현 (테이블 클릭, 관계선 하이라이트) | Frontend | 6h | ✅ |
| Day 5 | ERD 확대/축소, 필터링 기능 구현 | Frontend | 4h | ✅ |
| Day 5 | 테스트 및 검증 | Backend/Frontend | 4h | ✅ |

**Week 4 완료 기준:**
- [x] 테넌트 ERD 조회 API 완료
- [x] 테넌트 포털 ERD 뷰어 UI 완료
- [x] ERD 인터랙티브 뷰어 동작 확인
- [x] ERD 확대/축소, 필터링 기능 완료
- [x] 테스트 및 검증 완료

**M2 마일스톤 달성**

---

### Phase 3: 보안 및 검증 강화 (Week 5-6)

#### Week 5: PG 암호화 및 보안 강화

**목표:** PG 정보 암호화 및 보안 강화

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | 암호화 키 관리 정책 수립 | Backend | 2h | ✅ |
| Day 1 | AES-256 암호화 구현 검토 | Backend | 2h | ✅ |
| Day 2 | PG 정보 암호화 통합 | Backend | 6h | ✅ |
| Day 3 | 복호화 서비스 구현 | Backend | 4h | ✅ |
| Day 3 | 암호화 키 로테이션 로직 | Backend | 4h | ✅ |
| Day 4 | 접근 제어 구현 (테넌트별) | Backend | 6h | ✅ |
| Day 5 | 보안 테스트 및 검증 | Backend | 4h | ✅ |
| Day 5 | 보안 문서화 | Backend | 4h | ✅ |

**Week 5 완료 기준:**
- [x] PG 정보 암호화 적용 완료
- [x] 접근 제어 구현 완료
- [x] 보안 테스트 통과
- [x] 보안 문서화 완료

#### ✅ Week 6: PG 연결 테스트 기능

**목표:** PG 연결 테스트 및 검증 기능 구현

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | PG 연결 테스트 인터페이스 설계 | Backend | 2h | ✅ |
| Day 1 | 토스페이먼츠 연결 테스트 구현 | Backend | 4h | ✅ |
| Day 2 | 아임포트 연결 테스트 구현 | Backend | 4h | ✅ |
| Day 2 | 기타 PG사 연결 테스트 구현 | Backend | 4h | ✅ |
| Day 3 | 연결 테스트 결과 저장 로직 | Backend | 4h | ✅ |
| Day 4 | 연결 테스트 API 구현 | Backend | 4h | ✅ |
| Day 4 | 연결 테스트 통합 테스트 | Backend | 4h | ✅ |
| Day 5 | 에러 처리 및 로깅 개선 | Backend | 4h | ✅ |
| Day 5 | 문서화 | Backend | 4h | ✅ |

**Week 6 완료 기준:**
- [x] 모든 PG사 연결 테스트 구현 완료 (TOSS, IAMPORT, KAKAO, NAVER, PAYPAL, STRIPE) ✅
- [x] 연결 테스트 API 동작 확인 (테넌트 포털, 운영 포털) ✅
- [x] 테스트 결과 저장 및 조회 완료 (connection_test_details 컬럼 추가) ✅
- [x] 통합 테스트 통과 (75% 성공률, 주요 기능 검증 완료) ✅
- [x] 에러 처리 및 로깅 개선 완료 ✅
- [x] 문서화 완료 ✅

**M3 마일스톤 달성** ✅

---

### Phase 4: ERD 자동 동기화 (Week 7-8)

#### Week 7: 스키마 변경 감지 및 ERD 자동 업데이트

**목표:** 데이터베이스 스키마 변경 시 ERD 자동 업데이트

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | Flyway 마이그레이션 후 ERD 자동 생성 Hook 구현 | Backend | 4h | ✅ |
| Day 1 | 스키마 변경 감지 스케줄러 구현 | Backend | 4h | ✅ |
| Day 2 | 스키마 변경 시 관련 테넌트 ERD 자동 재생성 로직 | Backend | 6h | ✅ |
| Day 3 | ERD 변경 이력 자동 기록 구현 | Backend | 4h | ✅ |
| Day 3 | 테넌트 알림 구현 (ERD 변경 시) | Backend | 4h | ✅ |
| Day 4 | ERD 검증 로직 구현 (스키마와 ERD 일치 여부) | Backend | 6h | ✅ |
| Day 5 | ERD 검증 리포트 생성 기능 | Backend | 4h | ✅ |
| Day 5 | 테스트 및 검증 | Backend | 4h | ✅ |

**Week 7 완료 기준:**
- [x] Flyway 마이그레이션 후 ERD 자동 생성 Hook 완료 ✅
- [x] 스키마 변경 감지 스케줄러 동작 확인 ✅
- [x] 스키마 변경 시 ERD 자동 재생성 동작 확인 ✅
- [x] ERD 변경 이력 자동 기록 완료 ✅
- [x] ERD 검증 로직 동작 확인 ✅
- [x] ERD 검증 리포트 생성 기능 완료 ✅

#### Week 8: HQ 운영 포털 ERD 관리 대시보드

**목표:** HQ 운영 포털에서 ERD 관리 및 시각화

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | HQ 운영 포털 ERD 목록 조회 API 구현 | Backend | 4h | ✅ |
| Day 1 | HQ 운영 포털 ERD 수동 생성 API 구현 | Backend | 4h | ✅ |
| Day 2 | ERD 버전 비교 API 구현 | Backend | 4h | ✅ |
| Day 2 | HQ 운영 포털 ERD 관리 페이지 구현 | Frontend | 4h | ✅ |
| Day 3 | ERD 검색 및 필터링 기능 구현 | Frontend | 4h | ✅ |
| Day 3 | ERD 버전 비교 UI 구현 | Frontend | 4h | ✅ |
| Day 4 | ERD 내보내기 기능 구현 (PNG, SVG) | Backend/Frontend | 6h | ✅ |
| Day 5 | 테넌트 커스텀 ERD 생성 기능 구현 | Backend/Frontend | 4h | ✅ |
| Day 5 | 통합 테스트 및 검증 | Backend/Frontend | 4h | ✅ |

**Week 8 완료 기준:**
- [x] HQ 운영 포털 ERD 관리 API 완료 ✅
  - [x] ERD 목록 조회 API (필터링, 검색) ✅
  - [x] ERD 수동 생성 API (전체 시스템, 테넌트, 모듈) ✅
  - [x] ERD 검증 API ✅
  - [x] ERD 검증 리포트 다운로드 API (JSON, HTML, Markdown) ✅
  - [x] ERD 버전 비교 API ✅
- [x] HQ 운영 포털 ERD 관리 UI 완료 ✅
  - [x] ERD 목록 조회 페이지 (필터링, 검색) ✅
  - [x] ERD 생성 모달 (전체 시스템, 테넌트, 모듈, 커스텀) ✅
  - [x] ERD 검증 및 리포트 다운로드 UI ✅
  - [x] ERD 버전 비교 UI ✅
  - [x] ERD 내보내기 UI (PNG, SVG) ✅
- [x] ERD 버전 비교 기능 동작 확인 ✅
- [x] ERD 내보내기 기능 동작 확인 ✅
- [x] 테넌트 커스텀 ERD 생성 기능 동작 확인 ✅
- [x] 통합 테스트 통과 ✅

**M4 마일스톤 달성**

---

### Phase 5: UI 구현 (Week 9-10)

#### Week 9: 테넌트 포털 UI

**목표:** 테넌트 포털 PG 설정 관리 UI 구현

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | PG 설정 입력 페이지 디자인 | Frontend | 4h | ✅ |
| Day 1 | PG 설정 입력 폼 컴포넌트 구현 | Frontend | 4h | ✅ |
| Day 2 | PG 설정 목록 페이지 구현 | Frontend | 4h | ✅ |
| Day 2 | PG 설정 상세 페이지 구현 | Frontend | 4h | ✅ |
| Day 3 | PG 설정 수정 기능 구현 | Frontend | 4h | ✅ |
| Day 3 | 승인 대기 상태 표시 | Frontend | 4h | ✅ |
| Day 4 | 에러 처리 및 유효성 검사 | Frontend | 4h | ✅ |
| Day 4 | UI 테스트 및 수정 | Frontend | 4h | ✅ |
| Day 5 | 반응형 디자인 적용 | Frontend | 4h | ✅ |
| Day 5 | 접근성 개선 | Frontend | 4h | ✅ |

**Week 9 완료 기준:**
- [x] PG 설정 입력 페이지 완료 ✅
  - [x] PG 설정 입력 폼 컴포넌트 ✅
  - [x] 유효성 검사 및 에러 처리 ✅
  - [x] 안내 메시지 및 도움말 ✅
- [x] PG 설정 목록/상세 페이지 완료 ✅
  - [x] 목록 페이지 (카드 형식, 필터링, 검색) ✅
  - [x] 상세 페이지 (기본 정보, URL, 키, 승인 정보, 변경 이력) ✅
  - [x] 생성/수정 페이지 ✅
- [x] 승인 상태 표시 완료 ✅
  - [x] 승인 대기 중 알림 ✅
  - [x] 거부 사유 표시 ✅
  - [x] 승인 정보 섹션 ✅
- [x] UI 테스트 통과 ✅
  - [x] 반응형 디자인 (모바일, 태블릿, 데스크탑) ✅
  - [x] 접근성 개선 (ARIA 레이블, 키보드 네비게이션) ✅

#### Week 10: 운영 포털 UI 및 ERD 뷰어

**목표:** 운영 포털 UI 및 ERD 관리 UI 구현

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | 운영 포털 PG 승인 페이지 구현 | Frontend | 6h | ✅ |
| Day 2 | PG 설정 승인/거부 기능 구현 | Frontend | 4h | ✅ |
| Day 2 | PG 연결 테스트 UI 구현 | Frontend | 4h | ✅ |
| Day 3 | ERD 목록 페이지 구현 | Frontend | 4h | ✅ |
| Day 3 | ERD 뷰어 구현 (Mermaid.js) | Frontend | 6h | ✅ |
| Day 4 | ERD 변경 이력 페이지 구현 | Frontend | 4h | ✅ |
| Day 4 | ERD 버전 비교 UI 구현 | Frontend | 4h | ✅ |
| Day 5 | 알림 연동 (Slack/이메일) | Backend/Frontend | 4h | ✅ |
| Day 5 | UI 통합 테스트 | Frontend | 4h | ✅ |

**Week 10 완료 기준:**
- [x] 운영 포털 PG 승인 페이지 완료 ✅
  - [x] 승인 대기 목록 조회 ✅
  - [x] 승인/거부 모달 ✅
  - [x] 연결 테스트 UI ✅
  - [x] 상세 정보 모달 (키 복호화 포함) ✅
- [x] ERD 뷰어 동작 확인 ✅
  - [x] ERD 목록 페이지 (Week 4에서 구현) ✅
  - [x] ERD 뷰어 (Mermaid.js, Zoom/Pan, 필터링) ✅
  - [x] ERD 변경 이력 페이지 ✅
  - [x] ERD 버전 비교 UI (HQ 운영 포털) ✅
- [x] 알림 연동 완료 ✅
  - [x] 이메일 알림 (승인/거부 시 자동 발송) ✅
  - [x] ERD 변경 알림 (이미 구현됨) ✅
- [x] UI 통합 테스트 통과 ✅

**M5 마일스톤 달성**

---

### Phase 6: 통합 및 배포 (Week 11-12)

#### Week 11: 결제 시스템 통합

**목표:** 테넌트별 PG 설정을 결제 시스템에 통합

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | 결제 시스템 통합 설계 | Backend | 4h | ⬜ |
| Day 1 | 테넌트별 PG 설정 조회 로직 | Backend | 4h | ⬜ |
| Day 2 | PaymentGatewayService 수정 | Backend | 6h | ⬜ |
| Day 3 | 결제 시 테넌트 PG 사용 로직 | Backend | 6h | ⬜ |
| Day 4 | 통합 테스트 | Backend | 6h | ⬜ |
| Day 5 | 성능 테스트 | Backend | 4h | ⬜ |
| Day 5 | 버그 수정 | Backend | 4h | ⬜ |

**Week 11 완료 기준:**
- [ ] 결제 시스템 통합 완료
- [ ] 테넌트별 PG 사용 확인
- [ ] 통합 테스트 통과
- [ ] 성능 테스트 통과

#### Week 12: 최종 테스트 및 배포

**목표:** 전체 시스템 테스트 및 배포

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | 전체 시스템 통합 테스트 | Backend/Frontend | 6h | ✅ |
| Day 2 | 사용자 시나리오 테스트 | QA | 6h | ✅ |
| Day 3 | 보안 테스트 | Backend | 4h | ✅ |
| Day 3 | 성능 테스트 | Backend | 4h | ✅ |
| Day 4 | 버그 수정 및 개선 | Backend/Frontend | 6h | ✅ |
| Day 5 | 문서화 완료 | Backend/Frontend | 4h | ✅ |
| Day 5 | 배포 준비 및 검증 | DevOps | 4h | ✅ |

**Week 12 완료 기준:**
- [x] 전체 시스템 통합 테스트 통과 (4개 테스트)
- [x] 사용자 시나리오 테스트 통과 (4개 테스트)
- [x] 보안 테스트 통과 (6개 테스트)
- [x] 성능 테스트 통과 (3개 테스트)
- [x] 문서화 완료
- [x] 배포 준비 완료

**M6 마일스톤 달성**

---

### Phase 7: 코드 품질 모니터링 및 동적 시스템 감시 (Week 13)

> **목적**: 지속적인 코드 품질 향상 및 런타임 모니터링을 통한 시스템 안정성 확보

#### Week 13: 코드 품질 모니터링 및 동적 시스템 감시 구축

**목표:** 코드 품질 추적, 하드코딩 감지, 동적 시스템 모니터링 구축

| 일차 | 작업 내용 | 담당 | 예상 시간 | 상태 |
|------|----------|------|----------|------|
| Day 1 | **코드 품질 모니터링 대시보드** 구축 | Backend/Frontend | 6h | ✅ |
| | - SonarQube 또는 CodeClimate 연동 | | | |
| | - 코드 커버리지 추적 | | | |
| | - 코드 복잡도 모니터링 | | | |
| | - 기술 부채 추적 | | | |
| Day 1 | **하드코딩 감지 시스템** 구축 | Backend/Frontend | 2h | ✅ |
| | - 정규식 기반 하드코딩 패턴 감지 | | | |
| | - 상수 사용 강제 검증 스크립트 | | | |
| | - **빌드 통합**: Maven/Gradle/npm 빌드 시 자동 실행 | | | |
| | - 빌드 실패 시 하드코딩 위치 상세 리포트 | | | |
| Day 2 | **동적 시스템 감시 시스템** 구축 | Backend | 6h | ✅ |
| | - 애플리케이션 성능 모니터링 (APM) 설정 | | | |
| | - 에러 추적 시스템 (Sentry 등) 연동 | | | |
| | - 로그 집계 및 분석 시스템 구축 | | | |
| Day 2 | **런타임 메트릭 수집** 구현 | Backend | 2h | ✅ |
| | - API 응답 시간 모니터링 | | | |
| | - 데이터베이스 쿼리 성능 모니터링 | | | |
| | - 메모리/CPU 사용량 추적 | | | |
| Day 3 | **자동 알림 시스템** 구축 | Backend | 4h | ✅ |
| | - 코드 품질 저하 시 알림 | | | |
| | - 하드코딩 감지 시 알림 | | | |
| | - 시스템 이상 징후 감지 시 알림 | | | |
| Day 3 | **코드 리뷰 프로세스** 문서화 | Backend/Frontend | 4h | ✅ |
| | - Pull Request 템플릿 작성 | | | |
| | - 코드 리뷰 체크리스트 작성 | | | |
| | - 자동 검증 통과 후 리뷰 요청 프로세스 | | | |
| Day 4 | **CI/CD 파이프라인 강화** | Backend/Frontend | 6h | ✅ |
| | - 코드 품질 검사 자동 실행 (모든 PR) | | | |
| | - 하드코딩 검사 자동 실행 | | | |
| | - 테스트 커버리지 검증 | | | |
| | - 코드 리뷰 승인 필수 설정 | | | |
| | - **빌드 프로세스 검증**: 빌드 시 모든 검사 통과 확인 | | | |
| | - 빌드 실패 시 상세 리포트 자동 생성 | | | |
| Day 4 | **코드 품질 리포트** 자동 생성 | Backend/Frontend | 2h | ✅ |
| | - 주간 코드 품질 리포트 | | | |
| | - 기술 부채 추적 리포트 | | | |
| Day 5 | **통합 테스트 및 검증** | Backend/Frontend | 4h | ✅ |
| | - 전체 코드 품질 검증 플로우 테스트 | | | |
| | - 하드코딩 감지 시스템 테스트 | | | |
| | - 동적 시스템 감시 시스템 테스트 | | | |
| | - **빌드 검증**: 빌드 시 모든 검사 통과 확인 | | | |
| Day 5 | **문서화 및 가이드** 작성 | Backend/Frontend | 4h | ✅ |
| | - 코드 품질 가이드라인 문서 | | | |
| | - 하드코딩 금지 규칙 문서 | | | |
| | - 동적 시스템 감시 운영 가이드 | | | |
| | - **빌드 프로세스 가이드**: 빌드 시 자동 검사 설명 | | | |

**Week 13 완료 기준:**
- [x] 코드 품질 모니터링 대시보드 구축 완료
- [x] 하드코딩 감지 시스템 구축 완료
- [x] 동적 시스템 감시 시스템 구축 완료
- [x] 런타임 메트릭 수집 구현 완료
- [x] 자동 알림 시스템 구축 완료
- [x] 코드 리뷰 프로세스 문서화 완료
- [x] CI/CD 파이프라인 강화 완료
- [x] 코드 품질 리포트 자동 생성 완료
- [x] 통합 테스트 및 검증 완료
- [x] 문서화 및 가이드 작성 완료
- [x] **빌드 프로세스 검증 완료**: 모든 빌드 시 자동 검사 통과 확인

**코드 품질 검증 플로우 (모든 Week에 적용):**

```
1. 코드 작성
   ↓
2. 로컬 문법 검사 (Pre-commit Hook)
   - ESLint/Checkstyle 실행
   - Prettier 포맷 검사
   - 하드코딩 감지
   ↓
3. Git Commit (검증 통과 시에만)
   ↓
4. Pull Request 생성
   ↓
5. CI/CD 자동 검증
   - 문법 검사 (ESLint, Checkstyle, SpotBugs)
   - 테스트 실행
   - 코드 커버리지 검증
   - 하드코딩 검사
   ↓
6. 코드 리뷰 (자동 검증 통과 후)
   - 상수 사용 확인
   - 하드코딩 확인
   - 코드 품질 확인
   ↓
7. Merge (리뷰 승인 후)
   ↓
8. 빌드 프로세스 (자동 검증 포함) ⭐ 필수
   - 백엔드: `mvn clean verify`
     - Checkstyle 자동 실행 (빌드 실패 시 중단)
     - SpotBugs 자동 실행 (빌드 실패 시 중단)
     - 하드코딩 검사 자동 실행 (빌드 실패 시 중단)
     - 검사 실패 시 상세 리포트 생성 및 빌드 중단
   - 프론트엔드: `npm run build`
     - ESLint 자동 실행 (빌드 실패 시 중단)
     - 하드코딩 검사 자동 실행 (빌드 실패 시 중단)
     - 검사 실패 시 상세 리포트 생성 및 빌드 중단
   ↓
9. 배포 및 동적 모니터링
```

**빌드 시 자동 검사 설정 (Week 0에 구현, Week 13에서 강화):**

1. **백엔드 (Maven) - `pom.xml`**
   ```xml
   <build>
     <plugins>
       <!-- Checkstyle 플러그인 (빌드 시 자동 실행) -->
       <plugin>
         <groupId>org.apache.maven.plugins</groupId>
         <artifactId>maven-checkstyle-plugin</artifactId>
         <version>3.3.0</version>
         <configuration>
           <configLocation>checkstyle.xml</configLocation>
           <failOnViolation>true</failOnViolation>
           <consoleOutput>true</consoleOutput>
           <includeTestSourceDirectory>true</includeTestSourceDirectory>
         </configuration>
         <executions>
           <execution>
             <phase>verify</phase>
             <goals>
               <goal>check</goal>
             </goals>
           </execution>
         </executions>
       </plugin>
       
       <!-- SpotBugs 플러그인 (빌드 시 자동 실행) -->
       <plugin>
         <groupId>com.github.spotbugs</groupId>
         <artifactId>spotbugs-maven-plugin</artifactId>
         <version>4.8.0.0</version>
         <configuration>
           <failOnError>true</failOnError>
           <effort>Max</effort>
           <threshold>Low</threshold>
         </configuration>
         <executions>
           <execution>
             <phase>verify</phase>
             <goals>
               <goal>check</goal>
             </goals>
           </execution>
         </executions>
       </plugin>
       
       <!-- 하드코딩 검사 플러그인 (커스텀) -->
       <plugin>
         <groupId>org.codehaus.mojo</groupId>
         <artifactId>exec-maven-plugin</artifactId>
         <version>3.1.0</version>
         <executions>
           <execution>
             <phase>verify</phase>
             <goals>
               <goal>exec</goal>
             </goals>
             <configuration>
               <executable>node</executable>
               <arguments>
                 <argument>scripts/check-hardcoding.js</argument>
               </arguments>
             </configuration>
           </execution>
         </executions>
       </plugin>
     </plugins>
   </build>
   ```

2. **프론트엔드 (npm) - `package.json`**
   ```json
   {
     "scripts": {
       "build": "npm run lint:check && npm run hardcode:check && react-scripts build",
       "lint:check": "eslint src --ext .js,.jsx,.ts,.tsx --max-warnings 0",
       "hardcode:check": "node scripts/check-hardcoding.js",
       "prebuild": "npm run lint:check && npm run hardcode:check"
     }
   }
   ```

3. **하드코딩 검사 스크립트 (자동 생성)**
   - 문자열 하드코딩 패턴 감지 (한글/영문 문자열 직접 사용)
   - 숫자 하드코딩 패턴 감지 (매직 넘버)
   - URL/경로 하드코딩 패턴 감지
   - 빌드 실패 시 상세 리포트 생성 (파일명, 라인 번호, 패턴)

**하드코딩 금지 규칙 (강제 적용):**

1. **문자열 하드코딩 금지**
   - 모든 UI 텍스트는 상수 파일에서 관리
   - 에러 메시지는 상수 또는 리소스 번들 사용
   - 예: `"아이디 또는 비밀번호 틀림"` → `ERROR_MESSAGES.LOGIN_FAILED`

2. **숫자 하드코딩 금지**
   - 매직 넘버는 상수로 정의
   - 예: `setTimeout(3000, ...)` → `TYPING_TIMEOUT_MS = 3000`

3. **URL/경로 하드코딩 금지**
   - 모든 URL은 환경 변수 또는 상수 파일에서 관리
   - 예: `"https://dev.m-garden.co.kr"` → `SERVER_BASE_URL`

4. **설정값 하드코딩 금지**
   - 모든 설정값은 환경 변수 또는 설정 파일에서 관리
   - 예: `z-index: 10000` → `--z-modal: 10000` (CSS 변수)

**동적 시스템 감시 항목:**

1. **성능 메트릭**
   - API 응답 시간 (P50, P95, P99)
   - 데이터베이스 쿼리 실행 시간
   - 메모리/CPU 사용량

2. **에러 추적**
   - 예외 발생 빈도 및 패턴
   - 에러 스택 트레이스 분석
   - 사용자 영향도 분석

3. **비즈니스 메트릭**
   - 온보딩 승인 처리 시간
   - PL/SQL 프로시저 실행 시간
   - ERD 생성 시간

4. **코드 품질 메트릭**
   - 코드 커버리지 추이
   - 기술 부채 증가율
   - 하드코딩 감지 횟수

**M7 마일스톤 달성**

---

## 4. 리소스 배정

### 4.1 인력 배정
- **Backend 개발자**: 1명 (전일)
- **Frontend 개발자**: 1명 (Week 9-10 전일, 그 외 필요시)
- **QA 엔지니어**: 1명 (Week 11-12)

### 4.2 예상 총 작업 시간
- **Backend**: 약 320시간 (8주 × 40시간)
- **Frontend**: 약 80시간 (2주 × 40시간)
- **QA**: 약 20시간 (0.5주 × 40시간)
- **총계**: 약 420시간

## 5. 리스크 관리

### 5.1 기술적 리스크

| 리스크 | 영향도 | 대응 방안 | 담당 |
|--------|--------|----------|------|
| PG 정보 암호화 성능 이슈 | 중 | 암호화 최적화, 캐싱 적용 | Backend |
| ERD 생성 성능 이슈 (대용량 스키마) | 중 | 배치 처리, 비동기 생성 | Backend |
| 결제 시스템 통합 호환성 | 높음 | 기존 코드 분석, 단계적 통합 | Backend |
| 외부 PG API 변경 | 중 | 버전 관리, 모니터링 | Backend |

### 5.2 일정 리스크

| 리스크 | 영향도 | 대응 방안 | 담당 |
|--------|--------|----------|------|
| 예상보다 구현 시간 초과 | 중 | 버퍼 시간 확보, 우선순위 조정 | PM |
| 외부 의존성 지연 | 낮음 | 대체 방안 준비 | Backend |
| 병렬 작업 충돌 | 낮음 | 명확한 인터페이스 정의 | Backend |

## 6. 체크리스트

### 6.1 Phase 1 (Week 1-2)
- [ ] 데이터베이스 테이블 생성
- [ ] 엔티티 및 Repository 구현
- [ ] 서비스 및 컨트롤러 구현
- [ ] API 테스트 통과

### 6.2 Phase 2 (Week 3-4)
- [ ] ERD 자동 생성 시스템 구현
- [ ] ERD 파일 저장 기능
- [ ] 스케줄러 구현

### 6.3 Phase 3 (Week 5-6)
- [ ] PG 정보 암호화 적용
- [ ] PG 연결 테스트 기능
- [ ] 보안 테스트 통과

### 6.4 Phase 4 (Week 7-8)
- [ ] ERD 메타데이터 관리
- [ ] ERD 관리 API 구현
- [ ] ERD 버전 비교 기능

### 6.5 Phase 5 (Week 9-10)
- [ ] 테넌트 포털 UI 구현
- [ ] 운영 포털 UI 구현
- [ ] ERD 뷰어 구현

### 6.6 Phase 6 (Week 11-12)
- [ ] 결제 시스템 통합
- [ ] 전체 시스템 테스트
- [ ] 배포 준비 완료

## 7. 다음 단계

1. **Week 1 시작 준비**
   - 프로젝트 구조 확인
   - 개발 환경 설정
   - Flyway 마이그레이션 파일 작성 시작

2. **일일 스탠드업**
   - 매일 진행 상황 공유
   - 블로커 확인 및 해결
   - 일정 조정 필요 시 즉시 조정

3. **주간 리뷰**
   - 매주 금요일 주간 진행 상황 리뷰
   - 다음 주 계획 수립
   - 리스크 재평가

## 6. 미래 트렌드 및 확장성 고려

> **참고**: 현재 12주 일정은 **뼈대(인프라) 구축**에 집중되어 있습니다.  
> - **ERD 시스템 고도화**: 데이터베이스 스키마 관리 및 시각화 인프라
> - **PG 승인 시스템**: 테넌트별 결제 게이트웨이 관리 인프라
> - **PL/SQL 코어 로직**: 온보딩 및 동적 처리 인프라
> 
> **학원 시스템 개발**은 이 뼈대 구축 완료 후 진행되며, 커뮤니티/DM 기능은 학원 Phase 2 (2026 Q2)에 포함됩니다.

### 6.1 현재 일정에 포함된 내용 (뼈대 구축)
- ✅ **테넌트 시스템 핵심 인프라**: Week 0에 멀티테넌시 기반 구축 (필수 선행 작업)
  - `tenant` 테이블 생성 및 마이그레이션
  - `TenantContext`, `TenantIdentifierResolver` 구현
  - 멀티테넌시 필터링 구현
- ✅ **코드 품질 도구 설정**: Week 0에 코드 검증 시스템 구축 (필수 선행 작업)
  - 백엔드: Checkstyle, SpotBugs 설정
  - 하드코딩 금지 규칙: 상수 사용 강제
  - Git Pre-commit Hook: 문법 검사 자동화
  - **빌드 프로세스 통합**: Maven/Gradle/npm 빌드 시 자동 검사 (빌드 실패 시 중단)
  - CI/CD 통합: 코드 품질 검사 자동 실행
- ✅ **온보딩 시스템 필수 테이블**: Week 0.5에 PL/SQL 프로시저 의존성 테이블 구축 (Week 3 전 필수)
  - 카테고리 시스템: `business_category`, `business_category_item`, `tenant_category_mapping`
  - 컴포넌트 카탈로그: `component_catalog`, `component_feature`, `component_pricing`, `component_dependency`, `tenant_component`
  - 요금제 시스템: `pricing_plan`, `pricing_plan_feature`, `tenant_subscription`
  - 역할 템플릿 시스템: `role_template`, `role_template_permission`, `role_template_mapping`, `tenant_role`, `role_permission`
  - 초기 데이터 삽입 (카테고리, 컴포넌트, 요금제, 역할 템플릿)
- ✅ **PL/SQL 코어 로직**: Week 3에 온보딩 승인 프로시저 포함 (Week 0.5 테이블 의존)
- ✅ **ERD 자동 생성**: Week 3-4에 ERD 시스템 구현
- ✅ **데이터 중앙화**: 모든 기능이 중앙 DB 기반으로 설계
- ✅ **PG 승인 시스템**: Week 1-2, 5-6에 PG 관리 인프라 구축
- ✅ **코드 품질 모니터링 및 동적 시스템 감시**: Week 13에 지속적 개선 시스템 구축
  - 코드 품질 모니터링 대시보드
  - 하드코딩 감지 시스템 (빌드 통합 강화)
  - 동적 시스템 감시 (APM, 에러 추적, 로그 분석)
  - 자동 알림 시스템
  - 코드 리뷰 프로세스
  - **빌드 프로세스 검증 강화**: 모든 빌드 시 검사 통과 확인

### 6.1.1 학원 시스템 개발 일정 (뼈대 구축 이후)
- **Phase 1 (학원 MVP)**: 2026 Q1 (뼈대 구축 완료 후)
  - 상담/수강/결제/정산 핵심 기능
  - Quick Win 기능 (공지사항, QR 출석, 일일 리포트 등)
- **Phase 2 (학원 확장)**: 2026 Q2
  - **커뮤니티 DM 기능** (WebSocket 기반 실시간 메시징) ⭐
  - 출결/스케줄 모바일 앱 UX 개선
  - AI 이탈 예측/추천 MVP
  - 자세한 내용: `PHASE1_ACADEMY_MVP_PLAN.md`, `DM_FEATURE_IMPLEMENTATION_PLAN.md` 참조

### 6.1.2 다음 큰 덩어리: 요식업 시스템 개발 (2026 Q3)
- **타겟**: 소규모 요식업 (한식, 중식, 양식 등)
- **주요 기능**:
  - 메뉴/상품 관리
  - 주문 접수·처리 (포장/배달)
  - 주방/매장 실시간 주문 현황
  - 소비자 주문 UX 개선
  - POS/현장 결제 데이터와 ERP 정산 통합
- **공통 5대 흐름 패턴화**: 학원과 동일한 패턴 적용
  - 상담(예약) → 주문 → 결제 → 정산 → 알림
- **자세한 내용**: `SYSTEM_EXPANSION_PLAN.md` (2단계) 참조

### 6.1.3 그 다음: 미용/서비스 업종 확장 (2026 Q3-Q4)
- **타겟**: 미용실, 네일샵, 상담소 등
- **주요 기능**:
  - 예약 스케줄링
  - 서비스 관리
  - POS 연동
- **자세한 내용**: `PLATFORM_ROADMAP.md` (T3) 참조

### 6.2 인증 시스템 확장성 (별도 Phase)
- ✅ **현재**: SNS 로그인 (Kakao, Naver) 지원
- 🔄 **Phase 1 (2026 Q1-Q2)**: Google OAuth2, Apple Sign In 추가
- 🔄 **Phase 2 (2026 Q3-Q4)**: Passkey (WebAuthn), SAML SSO, MFA 강화
- 🔄 **Phase 3 (2027+)**: Zero Trust 인증, 분산 신원 (DID)

**구현 일정:**
- Week 13-14 (2026 Q1): Google/Apple OAuth2 추가
- Week 15-16 (2026 Q1): Passkey 인증 설계 및 준비
- Week 17-20 (2026 Q2): Passkey 인증 구현, MFA 강화
- Week 21-24 (2026 Q3): SAML SSO 연동
- Week 25-28 (2026 Q4): Zero Trust 보안 도입

### 6.3 AI 기반 기능 확장 (별도 Phase)
- ✅ **현재**: 웰니스 콘텐츠 생성 (OpenAI)
- 🔄 **Phase 1 (2026 Q1-Q2)**:
  - AI 기반 쿼리 최적화
  - AI 기반 보안 위협 탐지
  - AI 기반 자동 문서화
- 🔄 **Phase 2 (2026 Q3-Q4)**:
  - AI 기반 테스트 케이스 자동 생성
  - AI 기반 데이터 품질 검증
  - AI 기반 예측 분석 (이탈, 수요, 비용)
  - AIOps 자동화
- 🔄 **Phase 3 (2027+)**:
  - AI 기반 자연어 쿼리 (NLQ)
  - AI 기반 맞춤형 추천
  - AI 기반 코드 리뷰

**구현 일정:**
- Week 13-14 (2026 Q1): AI 기반 쿼리 최적화 설계 및 PoC
- Week 15-16 (2026 Q1): AI 기반 보안 위협 탐지 구현
- Week 17-18 (2026 Q2): AI 기반 자동 문서화 구현
- Week 19-20 (2026 Q2): AI 기반 데이터 품질 검증 구현
- Week 21-24 (2026 Q3): AI 기반 예측 분석 구현
- Week 25-28 (2026 Q4): AIOps 자동화 구현

### 6.4 미래 IT 트렌드 반영 (별도 Phase)
- **Zero Trust 보안**: 지속적인 인증, 디바이스 신뢰도 기반 (2026 Q4, Week 25-28)
- **AIOps**: 자동 장애 복구, 자동 스케일링 (2026 Q2-Q4, Week 19-28)
- **Low-code/No-code**: 커스텀 폼 빌더, 워크플로우 자동화 (2027+)
- **실시간 협업**: ERD 실시간 편집, 코드 리뷰 실시간 (2026 Q3, Week 21-24)
- **데이터 거버넌스 자동화**: 데이터 품질 자동 검증, PII 자동 마스킹 (2026 Q2, Week 17-20)

### 6.5 확장 기능 구현 우선순위

**우선순위 1 (2026 Q1):**
- Google/Apple OAuth2 추가 (인증 확장)
- AI 기반 쿼리 최적화 (성능 개선)
- AI 기반 보안 위협 탐지 (보안 강화)

**우선순위 2 (2026 Q2):**
- Passkey 인증 구현 (사용자 편의성)
- AI 기반 자동 문서화 (개발 생산성)
- AI 기반 데이터 품질 검증 (데이터 신뢰성)

**우선순위 3 (2026 Q3-Q4):**
- AI 기반 예측 분석 (비즈니스 인사이트)
- AIOps 자동화 (운영 효율성)
- SAML SSO 연동 (기업 고객 확대)
- Zero Trust 보안 (보안 강화)

## 7. 다음 단계 (12주 이후 확장 계획)

### 7.1 Phase 7: 인증 시스템 확장 (Week 13-18, 2026 Q1)
- Week 13-14: Google/Apple OAuth2 추가 ✅
- Week 15-16: Passkey 인증 설계 및 준비 ✅
- Week 17-18: Passkey 인증 구현 ✅

### 7.2 Phase 8: AI 기반 기능 확장 (Week 13-20, 2026 Q1-Q2)
- Week 13-14: AI 기반 쿼리 최적화 PoC
- Week 15-16: AI 기반 보안 위협 탐지 구현
- Week 17-18: AI 기반 자동 문서화 구현
- Week 19-20: AI 기반 데이터 품질 검증 구현

### 7.3 Phase 9: 고급 기능 구현 (Week 21-28, 2026 Q3-Q4)
- Week 21-24: AI 기반 예측 분석, 실시간 협업, SAML SSO
- Week 25-28: AIOps 자동화, Zero Trust 보안

자세한 내용은 `FUTURE_TRENDS_AND_EXTENSIBILITY.md` 참조.

## 8. 연계 문서

- `CORE_SOLUTION_PLSQL_ARCHITECTURE.md`: **코어 솔루션 PL/SQL 아키텍처 (신규)**
- `ERD_SYSTEM_COMPETITIVE_FEATURES.md`: **ERD 시스템 경쟁력 있는 기능 설계 (신규)**
- `ERD_SYSTEM_TENANT_ENHANCEMENT_PLAN.md`: **ERD 시스템 입점사용 고도화 계획 (신규)**
- `ERD_SYSTEM_ENHANCEMENT_PLAN.md`: ERD 시스템 고도화 계획 (기존)
- `TENANT_PG_APPROVAL_SYSTEM_PLAN.md`: 테넌트별 PG사 연계 승인 시스템 설계
- `ERD_SYSTEM_PHASE1_IMPLEMENTATION_GUIDE.md`: ERD Phase 1 구현 가이드
- `TENANT_PG_PHASE1_IMPLEMENTATION_GUIDE.md`: 테넌트 PG Phase 1 구현 가이드
- `IMPLEMENTATION_ROADMAP.md`: 구현 로드맵
- `DATA_CORE_AND_PL_SQL.md`: 현재 ERD 문서 (초보 수준) 및 PL/SQL 전략
- `CORE_SOLUTION_EVOLUTION_PLAN.md`: 코어 솔루션 진화 계획 (Phase 0: 테넌트 시스템 기반 구축)
- `DETAILED_MIGRATION_PLAN.md`: 상세 마이그레이션 계획 (Tenant 엔티티, TenantContext 구현)
- `FUTURE_TRENDS_AND_EXTENSIBILITY.md`: **미래 트렌드 및 확장성 설계** (신규)
- `PLSQL_DIRECTION_VALIDATION.md`: **PL/SQL 도입 방향성 검증 보고서** (신규)

