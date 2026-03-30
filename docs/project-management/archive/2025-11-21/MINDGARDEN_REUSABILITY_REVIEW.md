# 마인드가든 소스 재사용 가능성 검토

**작성일**: 2025-11-21  
**목적**: 마인드가든(상담소) 소스가 다른 입점사들도 사용할 수 있는지 검토

---

## 📋 검토 결과 요약

### ✅ 다른 입점사 사용 가능한 부분

1. **멀티테넌트 인프라**
   - `BaseEntity`에 `tenant_id` 필드 존재 → 모든 엔티티가 멀티테넌트 지원
   - `TenantContextHolder`로 테넌트 컨텍스트 관리
   - `BaseTenantService`, `BaseTenantEntityService` 패턴으로 범용 CRUD 제공

2. **consultation 패키지의 엔티티/서비스**
   - `Consultation`, `Consultant`, `Client` 등 모든 엔티티가 `BaseEntity` 상속
   - `tenant_id` 필드로 테넌트별 데이터 분리
   - `BaseTenantEntityServiceImpl` 상속으로 테넌트 필터링 자동 적용
   - Repository에 `findAllByTenantId`, `findAllByTenantIdAndBranchId` 쿼리 존재

3. **범용 기능**
   - 일정 관리 (`Schedule`)
   - 결제 관리 (`Payment`)
   - 알림 시스템 (`Alert`)
   - 공통코드 관리 (`CommonCode`)
   - 사용자 관리 (`User`, `Branch`)

### ⚠️ 마인드가든(상담소) 특화 부분

1. **비즈니스 로직 특화**
   - `ConsultationType` enum: 상담소 특화 (개별상담, 가족상담, 부부상담 등)
   - 상담 예약/세션 관리 로직: 상담소 비즈니스 특화
   - 상담사-내담자 매핑: 상담소 특화

2. **하드코딩된 업종 분기**
   - `TenantDashboardServiceImpl.createDefaultDashboards()`: ACADEMY vs CONSULTATION 하드코딩
   - `DashboardConstants`: ACADEMY, CONSULTATION만 정의

### ❌ 다른 입점사 사용 불가능한 부분

1. **상담소 특화 enum**
   ```java
   // ConsultationType.java - 상담소 전용
   INDIVIDUAL, FAMILY, INITIAL, COUPLE, GROUP, EMERGENCY, FOLLOW_UP, ASSESSMENT
   ```
   - 다른 업종(학원, 요식업 등)에서는 사용 불가
   - 해결: 공통코드로 전환 또는 메타데이터로 관리

2. **하드코딩된 업종 분기**
   ```java
   // TenantDashboardServiceImpl.java
   if (BUSINESS_TYPE_ACADEMY.equalsIgnoreCase(businessType)) {
       // 학원 역할
   } else {
       // 상담소 역할 (기본값)
   }
   ```
   - 새로운 업종 추가 시 코드 수정 필요
   - 해결: RoleTemplate 기반 동적 생성으로 전환

---

## 🔍 상세 검토

### 1. 엔티티 레벨 검토

#### ✅ 멀티테넌트 지원 확인

**BaseEntity 구조:**
```java
@MappedSuperclass
public abstract class BaseEntity {
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    // ...
}
```

**모든 consultation 엔티티가 BaseEntity 상속:**
- `Consultation extends BaseEntity` → `tenant_id` 필드 자동 상속
- `Consultant extends BaseEntity` → `tenant_id` 필드 자동 상속
- `Client extends BaseEntity` → `tenant_id` 필드 자동 상속
- `Schedule extends BaseEntity` → `tenant_id` 필드 자동 상속
- `Payment extends BaseEntity` → `tenant_id` 필드 자동 상속

**결론**: 모든 엔티티가 `tenant_id`로 테넌트별 데이터 분리되므로 다른 입점사도 사용 가능

### 2. 서비스 레벨 검토

#### ✅ BaseTenantEntityService 패턴 적용

**ConsultationServiceImpl:**
```java
public class ConsultationServiceImpl extends BaseTenantEntityServiceImpl<Consultation, Long> {
    @Override
    protected List<Consultation> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return consultationRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return consultationRepository.findAllByTenantId(tenantId);
        }
    }
}
```

**다른 서비스들도 동일 패턴:**
- `ConsultantServiceImpl extends BaseTenantEntityServiceImpl`
- `ScheduleServiceImpl extends BaseTenantEntityServiceImpl`
- `PaymentServiceImpl extends BaseTenantEntityServiceImpl`

**결론**: `tenant_id` 기반 필터링이 자동 적용되므로 다른 입점사도 사용 가능

### 3. 컨트롤러 레벨 검토

#### ⚠️ 세션 기반 필터링 (개선 필요)

**ConsultationController:**
```java
@GetMapping
public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultations(
        HttpSession session) {
    User currentUser = (User) session.getAttribute("user");
    String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
    
    // 지점코드로 필터링
    List<Consultation> consultations = filterConsultationsByBranch(allConsultations, currentBranchCode);
}
```

**문제점:**
- 세션에서 사용자 정보를 가져와 필터링
- `TenantContextHolder`를 활용하지 않음
- 다른 입점사에서도 동작하지만, 테넌트 컨텍스트 활용이 미흡

**개선 방안:**
- `TenantContextHolder.getTenantId()` 활용
- `BaseTenantEntityService`의 `findAllByTenant()` 메서드 활용

### 4. 하드코딩된 부분 검토

#### ❌ TenantDashboardServiceImpl 하드코딩

**현재 코드:**
```java
// TenantDashboardServiceImpl.java (Line 209-242)
if (DashboardConstants.BUSINESS_TYPE_ACADEMY.equalsIgnoreCase(businessType)) {
    defaultRoleCodes = new String[]{
        DashboardConstants.ROLE_CODE_STUDENT,
        DashboardConstants.ROLE_CODE_TEACHER,
        DashboardConstants.ROLE_CODE_ADMIN
    };
} else {
    // 상담소(CONSULTATION) 등 다른 업종의 경우
    defaultRoleCodes = new String[]{
        DashboardConstants.ROLE_CODE_CLIENT,
        DashboardConstants.ROLE_CODE_CONSULTANT,
        DashboardConstants.ROLE_CODE_ADMIN
    };
}
```

**문제점:**
- ACADEMY와 CONSULTATION만 하드코딩
- 새로운 업종 추가 시 코드 수정 필요
- 메타 시스템 원칙 위반

**해결 방안:**
- `RoleTemplate` 기반으로 동적 생성
- `business_rule_mappings` 테이블 활용
- 메타데이터 JSON으로 역할 매핑 관리

---

## 📊 재사용 가능성 평가

### 범용 기능 (다른 입점사 사용 가능) ✅

| 기능 | 재사용 가능 | 이유 |
|------|------------|------|
| 멀티테넌트 인프라 | ✅ | `tenant_id` 기반 분리 |
| BaseTenantService 패턴 | ✅ | 범용 CRUD 패턴 |
| 일정 관리 (Schedule) | ✅ | 업종 무관 공통 기능 |
| 결제 관리 (Payment) | ✅ | 업종 무관 공통 기능 |
| 알림 시스템 (Alert) | ✅ | 업종 무관 공통 기능 |
| 공통코드 관리 | ✅ | 업종 무관 공통 기능 |
| 사용자/지점 관리 | ✅ | 업종 무관 공통 기능 |

### 상담소 특화 기능 (다른 입점사 사용 불가) ❌

| 기능 | 재사용 불가 | 이유 |
|------|------------|------|
| ConsultationType enum | ❌ | 상담소 전용 (개별상담, 가족상담 등) |
| 상담 예약/세션 관리 | ❌ | 상담소 비즈니스 로직 |
| 상담사-내담자 매핑 | ❌ | 상담소 특화 관계 |

### 하드코딩된 부분 (개선 필요) ⚠️

| 부분 | 문제점 | 개선 방안 |
|------|--------|----------|
| TenantDashboardServiceImpl | ACADEMY/CONSULTATION 하드코딩 | RoleTemplate 기반 동적 생성 |
| DashboardConstants | 업종별 상수만 정의 | 메타데이터로 전환 |
| ConsultationType enum | 상담소 전용 | 공통코드 또는 메타데이터로 전환 |

---

## 🎯 결론 및 권장사항

### 결론

**마인드가든 소스의 대부분은 다른 입점사도 사용 가능합니다.**

1. **멀티테넌트 인프라**: `tenant_id` 기반으로 완전히 분리되어 있음
2. **범용 기능**: 일정, 결제, 알림 등은 업종 무관하게 사용 가능
3. **상담소 특화 기능**: ConsultationType, 상담 예약 등은 상담소 전용
4. **하드코딩된 부분**: 메타 시스템으로 전환 필요

### 권장사항

#### 1. 즉시 개선 가능한 부분

**TenantDashboardServiceImpl 하드코딩 제거:**
```java
// 현재: 하드코딩
if (BUSINESS_TYPE_ACADEMY.equalsIgnoreCase(businessType)) {
    // ...
} else {
    // ...
}

// 개선: RoleTemplate 기반 동적 생성
List<RoleTemplate> templates = roleTemplateRepository
    .findByBusinessTypeAndActive(businessType);
// 템플릿 기반으로 역할/대시보드 자동 생성
```

#### 2. 중기 개선 방안

**ConsultationType enum → 공통코드 전환:**
- 현재: 하드코딩된 enum
- 개선: `CommonCode` 테이블에 저장, 동적 조회
- 파일: `ConsultationType.java` → `CommonCodeService` 활용

#### 3. 장기 개선 방안

**메타 시스템 도입:**
- 모든 업종 분기를 메타데이터로 관리
- `business_rule_mappings` 테이블 활용
- 설정 기반 자동 프로세스 실행

---

## 📝 검토 체크리스트

### 멀티테넌트 지원 ✅
- [x] BaseEntity에 tenant_id 필드 존재
- [x] 모든 엔티티가 BaseEntity 상속
- [x] Repository에 tenant_id 필터링 쿼리 존재
- [x] Service에서 tenant_id 기반 필터링 적용
- [x] Controller에서 테넌트 컨텍스트 활용 (부분적)

### 범용 기능 ✅
- [x] 일정 관리 (Schedule) - 업종 무관
- [x] 결제 관리 (Payment) - 업종 무관
- [x] 알림 시스템 (Alert) - 업종 무관
- [x] 공통코드 관리 - 업종 무관
- [x] 사용자/지점 관리 - 업종 무관

### 상담소 특화 기능 ❌
- [x] ConsultationType enum - 상담소 전용
- [x] 상담 예약/세션 관리 - 상담소 비즈니스 로직
- [x] 상담사-내담자 매핑 - 상담소 특화

### 하드코딩된 부분 ⚠️
- [x] TenantDashboardServiceImpl - ACADEMY/CONSULTATION 하드코딩
- [x] DashboardConstants - 업종별 상수만 정의
- [x] ConsultationType enum - 하드코딩

---

## 🔄 다음 단계

1. **TenantDashboardServiceImpl 하드코딩 제거** (우선순위: 높음)
   - RoleTemplate 기반 동적 생성으로 전환
   - 파일: `TenantDashboardServiceImpl.java`

2. **ConsultationType enum → 공통코드 전환** (우선순위: 중간)
   - CommonCode 테이블에 저장
   - 동적 조회로 변경
   - 파일: `ConsultationType.java`, 관련 서비스

3. **메타 시스템 도입** (우선순위: 높음)
   - business_rule_mappings 테이블 생성
   - 모든 업종 분기를 메타데이터로 관리
   - 설정 기반 자동 프로세스 실행

---

**마지막 업데이트**: 2025-11-21

