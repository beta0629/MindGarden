# 관리자 대시보드 tenantId 기반 조회 확인 보고서

**작성일**: 2025-12-08  
**확인 범위**: 관리자 대시보드에서 사용하는 모든 API 엔드포인트  
**상태**: 문제 발견 및 수정 필요

---

## 📋 개요

관리자 대시보드에서 표시하는 데이터들이 올바르게 tenantId별로 필터링되는지 확인한 결과입니다.

### 확인 대상 API
관리자 대시보드(`AdminDashboard.js`)에서 호출하는 API들:
1. `/api/v1/admin/consultants/with-vacation` - 상담사 목록 (휴무 정보 포함)
2. `/api/v1/admin/clients/with-mapping-info` - 내담자 목록 (매칭 정보 포함)
3. `/api/v1/admin/mappings` - 매칭 목록
4. `/api/v1/admin/consultant-rating-stats` - 상담사 평가 통계
5. `/api/v1/admin/vacation-statistics` - 휴가 통계
6. `/api/v1/admin/statistics/consultation-completion` - 상담 완료 통계

---

## ✅ tenantId 기반 조회 정상 동작하는 API

### 1. `/api/v1/admin/consultants/with-stats` ✅
- **Controller**: `getAllConsultantsWithStats()` (라인 102)
- **상태**: ✅ 정상
- **확인 사항**:
  - `SessionUtils.getTenantId(session)` 사용 (라인 116)
  - `TenantContextHolder.setTenantId(tenantId)` 설정 (라인 124)
  - Service: `getAllConsultantsWithStatsByTenant(tenantId)` 호출

### 2. `/api/v1/admin/clients/with-stats` ✅
- **Controller**: `getAllClientsWithStats()` (라인 156)
- **상태**: ✅ 정상
- **확인 사항**:
  - `SessionUtils.getTenantId(session)` 사용 (라인 171)
  - `TenantContextHolder.setTenantId(tenantId)` 설정 (라인 179)
  - Service: `getAllClientsWithStatsByTenant(tenantId)` 호출

### 3. `/api/v1/admin/clients/with-mapping-info` ✅
- **Controller**: `getAllClientsWithMappingInfo()` (라인 342)
- **상태**: ✅ Service 레이어에서 tenantId 필터링됨
- **확인 사항**:
  - Controller: `TenantContextHolder.getTenantId()` 사용 (라인 348) - ⚠️ 설정이 아님
  - Service: `getAllClientsWithMappingInfo()` (라인 1398)
    - `getTenantId()` 사용 (라인 1403)
    - `userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CLIENT)` - tenantId 필터링됨
    - `mappingRepository.findAllWithDetailsByTenantId(tenantId)` - tenantId 필터링됨

---

## ⚠️ 문제가 발견된 API

### 1. `/api/v1/admin/mappings` ❌
- **Controller**: `getAllMappings()` (라인 806)
- **문제점**:
  - ❌ Controller에서 `TenantContextHolder.setTenantId()` 설정이 없음
  - Service는 `getTenantId()`를 사용하지만, Controller에서 tenantId를 설정하지 않으면 null 반환 가능
- **Service 확인**:
  - `getAllMappings()` (라인 1498)
  - `getTenantId()` 사용 (라인 1501) ✅
  - `mappingRepository.findAllWithDetailsByTenantId(tenantId)` - tenantId 필터링됨 ✅
- **수정 필요**:
  ```java
  // Controller에서 tenantId 설정 추가 필요
  String tenantId = SessionUtils.getTenantId(session);
  TenantContextHolder.setTenantId(tenantId);
  ```

### 2. `/api/v1/admin/consultants/with-vacation` ⚠️
- **Controller**: `getAllConsultantsWithVacationInfo()` (라인 268)
- **문제점**:
  - ⚠️ Controller에서 `SessionUtils.getTenantId()`는 가져오지만 `TenantContextHolder.setTenantId()` 설정이 없음
  - Service는 `getTenantId()`를 사용하므로 TenantContextHolder에 설정되어 있어야 함
- **Service 확인**:
  - `getAllConsultantsWithVacationInfo()` (라인 1079)
  - `getTenantId()` 사용 (라인 1083) ✅
  - `consultantRepository.findActiveConsultantsByTenantId(tenantId)` - tenantId 필터링됨 ✅
- **수정 필요**:
  ```java
  // Controller에서 tenantId 설정 추가 필요
  String tenantId = SessionUtils.getTenantId(session);
  TenantContextHolder.setTenantId(tenantId);
  ```

### 3. `/api/v1/admin/vacation-statistics` ⚠️
- **Controller**: `getConsultantVacationStats()` (라인 292)
- **문제점**:
  - ❌ Controller에서 `TenantContextHolder.setTenantId()` 설정이 없음
- **Service 확인**:
  - `getConsultantVacationStats()` (라인 4416)
  - `getTenantIdOrNull()` 사용 (라인 4427) ✅
  - `userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CONSULTANT)` - tenantId 필터링됨 ✅
- **수정 필요**:
  ```java
  // Controller에서 tenantId 설정 추가 필요
  String tenantId = SessionUtils.getTenantId(session);
  TenantContextHolder.setTenantId(tenantId);
  ```

### 4. `/api/v1/admin/consultant-rating-stats` ❌
- **Controller**: `getConsultantRatingStatistics()` (라인 2723)
- **문제점**:
  - ❌ 여전히 `branchCode` 사용 중 (라인 2737)
  - ❌ 레거시 메서드 `getAdminRatingStatisticsByBranch()` 호출 (라인 2741)
  - tenantId 기반으로 전환 필요
- **Service 확인**:
  - `getAdminRatingStatistics()` (라인 484)
    - `TenantContextHolder.getRequiredTenantId()` 사용 (라인 493) ✅
    - `ratingRepository.findByTenantId(tenantId)` - tenantId 필터링됨 ✅
  - `getAdminRatingStatisticsByBranch()` (라인 538)
    - `TenantContextHolder.getTenantId()` 사용 (라인 541) ✅
    - 하지만 branchCode 파라미터는 사용하지 않고 tenantId만 사용함 ✅
- **수정 필요**:
  ```java
  // branchCode 제거하고 tenantId만 사용하도록 수정
  String tenantId = SessionUtils.getTenantId(session);
  TenantContextHolder.setTenantId(tenantId);
  Map<String, Object> statistics = consultantRatingService.getAdminRatingStatistics();
  ```

### 5. `/api/v1/admin/statistics/consultation-completion` ✅
- **Controller**: `getConsultationCompletionStatistics()` (라인 찾기 필요)
- **상태**: ✅ Service 레이어에서 tenantId 필터링됨
- **Service 확인**:
  - `getConsultationCompletionStatistics()` (라인 3653)
  - `getTenantId()` 사용 (라인 3657) ✅
  - `consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId)` - tenantId 필터링됨 ✅
- **주의사항**:
  - Controller에서 `TenantContextHolder.setTenantId()` 설정 여부 확인 필요

---

## 📊 종합 평가

### 정상 동작 (3개)
- ✅ `/api/v1/admin/consultants/with-stats`
- ✅ `/api/v1/admin/clients/with-stats`
- ✅ `/api/v1/admin/statistics/consultation-completion` (Service 레이어 확인)

### 수정 필요 (4개)
- ❌ `/api/v1/admin/mappings` - TenantContextHolder 설정 필요
- ⚠️ `/api/v1/admin/consultants/with-vacation` - TenantContextHolder 설정 필요
- ⚠️ `/api/v1/admin/vacation-statistics` - TenantContextHolder 설정 필요
- ❌ `/api/v1/admin/consultant-rating-stats` - branchCode 제거 및 tenantId 기반으로 전환 필요

### Service 레이어 평가
- ✅ 대부분의 Service 메서드가 `getTenantId()` 또는 `TenantContextHolder.getTenantId()` 사용
- ✅ Repository 메서드들이 tenantId 기반 필터링 구현됨
- ⚠️ Controller 레이어에서 TenantContextHolder 설정이 누락된 경우가 많음

---

## 🔧 수정 권장 사항

### 1. 모든 API Controller에 TenantContextHolder 설정 추가

**표준 패턴**:
```java
@GetMapping("/api-endpoint")
public ResponseEntity<ApiResponse<?>> someEndpoint(HttpSession session) {
    User currentUser = SessionUtils.getCurrentUser(session);
    if (currentUser == null) {
        throw new AccessDeniedException("로그인이 필요합니다.");
    }
    
    // 표준화 원칙: SessionUtils.getTenantId() 사용
    String tenantId = SessionUtils.getTenantId(session);
    if (tenantId == null || tenantId.isEmpty()) {
        log.error("❌ tenantId가 필수입니다.");
        throw new IllegalArgumentException("테넌트 정보가 없습니다.");
    }
    
    // TenantContextHolder에 tenantId 설정 (Service에서 getTenantId() 사용을 위해)
    TenantContextHolder.setTenantId(tenantId);
    
    // Service 호출
    return success(service.someMethod());
}
```

### 2. 우선순위별 수정 계획

#### Priority 1: 즉시 수정 필요
1. **`getAllMappings()`** - 대시보드 핵심 데이터
2. **`getConsultantRatingStatistics()`** - branchCode 제거 필수

#### Priority 2: 단기 수정 필요
3. **`getAllConsultantsWithVacationInfo()`** - 대시보드에서 사용
4. **`getConsultantVacationStats()`** - 대시보드에서 사용

---

## ✅ 수정 완료 내역 (2025-12-08)

### Priority 1: 즉시 수정 완료

1. **`getAllMappings()`** ✅ 완료
   - Controller에서 `SessionUtils.getTenantId()` 사용 추가
   - `TenantContextHolder.setTenantId()` 설정 추가
   - tenantId 검증 및 에러 메시지 추가

2. **`getConsultantRatingStatistics()`** ✅ 완료
   - `branchCode` 제거 완료
   - 레거시 메서드 `getAdminRatingStatisticsByBranch()` 호출 제거
   - `tenantId` 기반으로 통일, `getAdminRatingStatistics()`만 사용

### Priority 2: 단기 수정 완료

3. **`getAllConsultantsWithVacationInfo()`** ✅ 완료
   - `TenantContextHolder.setTenantId()` 설정 추가
   - tenantId 검증 및 에러 메시지 추가

4. **`getConsultantVacationStats()`** ✅ 완료
   - `TenantContextHolder.setTenantId()` 설정 추가
   - tenantId 검증 및 에러 메시지 추가

### 추가 수정 완료

5. **`getAllClientsWithMappingInfo()`** ✅ 완료
   - `TenantContextHolder.getTenantId()` → `SessionUtils.getTenantId()` 전환
   - `TenantContextHolder.setTenantId()` 설정 추가
   - tenantId 검증 및 에러 메시지 추가

6. **`getConsultationCompletionStatistics()`** ✅ 완료
   - `branchCode` 제거 완료
   - 레거시 메서드 `getConsultationCompletionStatisticsByBranch()` 호출 제거
   - `tenantId` 기반으로 통일, `getConsultationCompletionStatistics()`만 사용

---

## 📝 다음 단계

1. ✅ **완료**: 모든 대시보드 API 수정 완료
2. **검증**: 수정 후 각 API 테스트하여 tenantId별 필터링 확인
3. **문서 업데이트**: 표준화 검증 보고서 업데이트

---

## 📊 최종 상태

### 모든 API tenantId 기반 조회 완료 ✅
- ✅ `/api/v1/admin/consultants/with-stats`
- ✅ `/api/v1/admin/clients/with-stats`
- ✅ `/api/v1/admin/clients/with-mapping-info`
- ✅ `/api/v1/admin/mappings`
- ✅ `/api/v1/admin/consultants/with-vacation`
- ✅ `/api/v1/admin/consultant-rating-stats`
- ✅ `/api/v1/admin/vacation-statistics`
- ✅ `/api/v1/admin/statistics/consultation-completion`

**모든 API가 표준화 원칙에 따라 tenantId 기반으로 조회하도록 수정 완료**

---

**작성자**: AI Assistant  
**검토자**: -  
**승인자**: -  
**작성일**: 2025-12-08  
**수정 완료일**: 2025-12-08

