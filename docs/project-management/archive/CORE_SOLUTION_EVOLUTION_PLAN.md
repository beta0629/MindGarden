# MindGarden → Core-Solution 고도화 실행 계획

> **작성일:** 2025-01-XX  
> **목적:** 현재 MindGarden 시스템을 Core-Solution으로 고도화하는 단계별 실행 계획  
> **기준 문서:** `ARCHITECTURE_OVERVIEW.md`, `DATA_CORE_AND_PL_SQL.md`, `SYSTEM_EXPANSION_PLAN.md`

## 1. 현재 상태 분석

### 1.1 기존 MindGarden 시스템
- ✅ 데이터베이스: `core_solution` (이미 명명됨)
- ✅ Branch 기반 구조 (지점 단위 관리)
- ✅ ERP 모듈 (결제, 정산, 통계)
- ✅ 상담 센터 프랜차이즈 모델
- ✅ 디자인 시스템 v2.0
- ✅ 인증/세션 관리 (Kakao/Naver OAuth2)

### 1.2 Core-Solution으로 전환 필요 사항
- ⚠️ Branch → Tenant 구조 확장
- ⚠️ 멀티테넌시 완전 구현 (`tenant_id` 기반 파티셔닝)
- ⚠️ 컴포넌트 카탈로그 시스템 구축
- ⚠️ 요금제/애드온 시스템 도입
- ⚠️ 내부 운영 포털 구축
- ⚠️ Zero-Touch Onboarding 구현

## 2. 고도화 전략 (비파괴적 전환)

### 2.1 핵심 원칙
1. **기존 시스템 유지**: 현재 운영 중인 MindGarden 기능은 그대로 유지
2. **점진적 확장**: 신규 기능을 추가하여 점진적으로 전환
3. **Feature Flag 기반**: 신구 시스템 병행 운영 후 전환
4. **데이터 중앙화**: 모든 데이터는 `core_solution` DB에 저장

### 2.2 전환 전략
```
현재 MindGarden (Branch 기반)
    ↓
Phase 1: Tenant 레이어 추가 (Branch 유지)
    ↓
Phase 2: 멀티테넌시 완전 구현
    ↓
Phase 3: 컴포넌트 모듈화
    ↓
Phase 4: 운영 포털 구축
    ↓
Core-Solution 완성
```

## 3. 단계별 실행 계획

### Phase 0: 기반 정비 (2주)

#### 3.1 데이터베이스 스키마 확장
- [ ] `tenant` 테이블 생성 (기존 Branch와 연계)
- [ ] 모든 주요 테이블에 `tenant_id` 컬럼 추가 (기존 `branch_id` 유지)
- [ ] `auth_user` 통합 계정 테이블 구조 확인/보완
- [ ] 공통 코드 테이블에 `name_ko`, `name_en` 필드 확인/보완

**마이그레이션 전략:**
```sql
-- 1. tenant 테이블 생성 (기존 branch와 연계)
CREATE TABLE tenant (
    tenant_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. 기존 branch를 tenant로 마이그레이션
INSERT INTO tenant (tenant_id, name, business_type, status)
SELECT branch_id, branch_name, 'CONSULTATION', 'ACTIVE'
FROM branch;

-- 3. 주요 테이블에 tenant_id 추가 (기존 branch_id 유지)
ALTER TABLE staff_account ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE client ADD COLUMN tenant_id VARCHAR(36);
-- ... (다른 주요 테이블들)
```

#### 3.2 코드베이스 구조 정비
- [ ] `TenantContext` 클래스 생성
- [ ] `TenantIdentifierResolver` 구현 (Hibernate MultiTenancy)
- [ ] 기존 `Branch` 엔티티에 `Tenant` 관계 추가
- [ ] 공통 코드 관리 서비스 확인/보완

**파일 구조:**
```
src/main/java/com/mindgarden/
├── core/
│   ├── domain/
│   │   ├── Tenant.java
│   │   ├── Branch.java (기존 유지)
│   │   └── AuthUser.java
│   ├── context/
│   │   ├── TenantContext.java
│   │   └── TenantContextHolder.java
│   └── multitenancy/
│       └── TenantIdentifierResolver.java
```

### Phase 1: Tenant 레이어 추가 (4주)

#### 3.3 Tenant 관리 API
- [ ] `POST /api/admin/tenants` - 테넌트 생성
- [ ] `GET /api/admin/tenants` - 테넌트 목록 조회
- [ ] `PUT /api/admin/tenants/{id}` - 테넌트 정보 수정
- [ ] `GET /api/admin/tenants/{id}/branches` - 테넌트별 지점 목록

#### 3.4 멀티테넌시 필터링 구현
- [ ] Repository 레벨에서 `tenant_id` 자동 필터링
- [ ] API Gateway/Filter에서 `TenantContext` 주입
- [ ] 기존 Branch 기반 쿼리에 Tenant 필터 추가

**구현 예시:**
```java
@Repository
public class StaffAccountRepository {
    @Query("SELECT s FROM StaffAccount s WHERE s.tenantId = :tenantId")
    List<StaffAccount> findByTenantId(@Param("tenantId") String tenantId);
    
    // TenantContext 자동 주입
    default List<StaffAccount> findAll() {
        String tenantId = TenantContextHolder.getTenantId();
        return findByTenantId(tenantId);
    }
}
```

#### 3.5 기존 기능 Tenant 연동
- [ ] 상담 관리: `tenant_id` 필터 추가
- [ ] 결제/정산: `tenant_id` 기반 집계
- [ ] 통계 대시보드: 테넌트별 데이터 분리
- [ ] 알림 시스템: 테넌트별 템플릿 관리

### Phase 2: 컴포넌트 카탈로그 시스템 (6주)

#### 3.6 컴포넌트 카탈로그 테이블 생성
- [ ] `component_catalog` 테이블
- [ ] `component_feature` 테이블
- [ ] `component_pricing` 테이블
- [ ] `component_dependency` 테이블
- [ ] `tenant_component` 테이블
- [ ] `component_usage_daily` 테이블

**마이그레이션 스크립트:**
```sql
-- Flyway: V2__add_component_catalog_tables.sql
CREATE TABLE component_catalog (
    component_id VARCHAR(36) PRIMARY KEY,
    component_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    is_core BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(20),
    display_order INT,
    icon_url VARCHAR(500),
    documentation_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 기본 컴포넌트 데이터 삽입
INSERT INTO component_catalog (component_id, component_code, name, category, is_core, display_order)
VALUES
    (UUID(), 'CONSULTATION', '상담 관리', 'CORE', TRUE, 1),
    (UUID(), 'SCHEDULING', '예약 관리', 'CORE', TRUE, 2),
    (UUID(), 'PAYMENT', '결제 관리', 'CORE', TRUE, 3),
    (UUID(), 'SETTLEMENT', '정산 관리', 'CORE', TRUE, 4),
    (UUID(), 'NOTIFICATION', '알림 관리', 'CORE', TRUE, 5),
    (UUID(), 'CRM', '고객 관리', 'ADDON', FALSE, 6),
    (UUID(), 'ATTENDANCE', '출결 관리', 'ADDON', FALSE, 7),
    (UUID(), 'STATISTICS', '통계 분석', 'ADDON', FALSE, 8);
```

#### 3.7 컴포넌트 관리 API
- [ ] `GET /api/components` - 컴포넌트 카탈로그 조회
- [ ] `GET /api/components/{id}` - 컴포넌트 상세 조회
- [ ] `POST /api/admin/components` - 컴포넌트 등록 (HQ 전용)
- [ ] `POST /api/tenant/components/{id}/activate` - 컴포넌트 활성화
- [ ] `POST /api/tenant/components/{id}/deactivate` - 컴포넌트 비활성화
- [ ] `GET /api/tenant/components` - 활성화된 컴포넌트 목록

#### 3.8 Feature Flag 연동
- [ ] 컴포넌트 활성화 시 자동 Flag 생성
- [ ] `component_{component_code}_enabled` Flag 패턴
- [ ] 테넌트별 Flag 관리

### Phase 3: 요금제/애드온 시스템 (4주)

#### 3.9 요금제 테이블 생성
- [ ] `pricing_plan` 테이블
- [ ] `pricing_plan_feature` 테이블
- [ ] `pricing_addon` 테이블
- [ ] `tenant_subscription` 테이블
- [ ] `subscription_addon` 테이블

#### 3.10 요금제 관리 API
- [ ] `GET /api/pricing/plans` - 요금제 목록
- [ ] `POST /api/tenant/subscription` - 구독 신청
- [ ] `GET /api/tenant/subscription` - 현재 구독 정보
- [ ] `POST /api/tenant/subscription/addons` - 애드온 추가

### Phase 4: 내부 운영 포털 (6주)

#### 3.11 운영 포털 기본 구조
- [ ] 별도 프론트엔드 프로젝트 또는 라우팅 분리
- [ ] HQ 전용 메뉴 구조
- [ ] 권한 매트릭스 (HQ_ADMIN, HQ_MASTER)

#### 3.12 핵심 기능 구현
- [ ] 테넌트 온보딩 워크플로우
- [ ] 요금제/애드온 승인 관리
- [ ] 컴포넌트 카탈로그 관리
- [ ] 관제 대시보드 (SLA, 오류율, AI 사용량)

### Phase 5: Zero-Touch Onboarding (4주)

#### 3.13 자동화 온보딩
- [ ] 가입 → 테넌트 생성 자동화
- [ ] 결제 → 청구 활성화 자동화
- [ ] 서비스 프로비저닝 자동화
- [ ] 샘플 데이터 자동 삽입

## 4. 우선순위 및 일정

### 4.1 MVP 범위 (Phase 0 + Phase 1)
**기간: 6주**

1. **즉시 시작 가능** (Phase 0)
   - DB 스키마 확장 (tenant 테이블, tenant_id 컬럼 추가)
   - TenantContext 구현
   - 기존 Branch와 Tenant 연계

2. **핵심 기능** (Phase 1)
   - Tenant 관리 API
   - 멀티테넌시 필터링
   - 기존 기능 Tenant 연동

### 4.2 확장 기능 (Phase 2~5)
**기간: 14주 (병렬 작업 시 10주)**

- Phase 2: 컴포넌트 카탈로그 (6주)
- Phase 3: 요금제 시스템 (4주)
- Phase 4: 운영 포털 (6주)
- Phase 5: Zero-Touch Onboarding (4주)

### 4.3 전체 일정
- **MVP 완료:** 6주
- **전체 완료:** 20주 (병렬 작업 시 16주)

## 5. 리스크 관리

### 5.1 기술적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 기존 데이터 마이그레이션 실패 | 높음 | 단계적 마이그레이션, 롤백 계획 수립 |
| 멀티테넌시 데이터 격리 오류 | 높음 | 철저한 테스트, 권한 검증 강화 |
| 기존 기능 영향 | 중간 | Feature Flag 기반 점진적 전환 |
| 성능 저하 | 중간 | 인덱스 최적화, 쿼리 튜닝 |

### 5.2 운영 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 서비스 중단 | 높음 | Blue/Green 배포, 단계적 롤아웃 |
| 데이터 손실 | 높음 | 백업 필수, 마이그레이션 전 검증 |
| 사용자 혼란 | 중간 | 명확한 안내, 교육 자료 제공 |

## 6. 성공 지표 (KPI)

### 6.1 개발 완료 지표
- [ ] tenant 테이블 생성 및 데이터 마이그레이션 완료
- [ ] 모든 주요 테이블에 tenant_id 추가 완료
- [ ] Tenant 관리 API 구현 완료
- [ ] 멀티테넌시 필터링 동작 검증 완료
- [ ] 기존 기능 Tenant 연동 완료

### 6.2 품질 지표
- 멀티테넌시 격리 검증: 100% 통과
- API 응답 시간: <500ms (95 percentile)
- 데이터 마이그레이션 오류: 0건

### 6.3 운영 지표
- 테넌트 온보딩 성공률: >95%
- 서비스 가용성: >99.5%
- 데이터 일관성: 100%

## 7. 다음 단계

### 7.1 즉시 시작 가능 항목
1. **DB 스키마 설계 확정**
   - [ ] tenant 테이블 스키마 최종 검토
   - [ ] tenant_id 추가 대상 테이블 목록 확정
   - [ ] 마이그레이션 스크립트 작성

2. **코드베이스 구조 설계**
   - [ ] Tenant 엔티티 클래스 작성
   - [ ] TenantContext 구현
   - [ ] TenantIdentifierResolver 구현

3. **테스트 계획 수립**
   - [ ] 마이그레이션 테스트 시나리오
   - [ ] 멀티테넌시 격리 테스트
   - [ ] 기존 기능 회귀 테스트

### 7.2 협의 필요 항목
- [ ] MVP 범위 확정 (Phase 0 + Phase 1 vs 전체)
- [ ] 개발 일정 확정
- [ ] 리소스 배정 (개발자, QA)
- [ ] 테스트 환경 구성

## 8. 참고 문서

- `ARCHITECTURE_OVERVIEW.md`: 전체 아키텍처 개요
- `DATA_CORE_AND_PL_SQL.md`: 데이터 모델 설계
- `SYSTEM_EXPANSION_PLAN.md`: 시스템 확장 계획
- `COMPONENT_MODULARIZATION_IMPLEMENTATION_GUIDE.md`: 컴포넌트 모듈화 가이드
- `IDENTITY_AND_SSO.md`: 인증 아키텍처

---

**결론:** 현재 MindGarden 시스템을 Core-Solution으로 고도화하는 것은 **비파괴적 점진적 전환**으로 가능하며, **Phase 0 + Phase 1 (MVP)는 6주 내 완료 가능**합니다. 기존 시스템을 유지하면서 신규 기능을 추가하여 안전하게 전환할 수 있습니다.

