# 🚨 긴급 보안 수정 계획

**발견일**: 2025-11-29  
**심각도**: 🔥 **Critical** (데이터 보안 취약점)  
**예상 작업 시간**: 2-3시간

---

## 📋 발견된 보안 문제

### **테넌트 ID 필터링 누락으로 인한 데이터 노출 위험**
- **영향 범위**: ConsultantRepository, ConsultantClientMappingRepository
- **위험도**: 다른 테넌트의 민감한 데이터 접근 가능
- **긴급 수정 필요**: 즉시

---

## 🔧 수정 계획

### **Phase 1: ConsultantRepository 수정**

#### **수정 전 (위험)**
```java
// ❌ 모든 테넌트 데이터 노출
@Query("SELECT c FROM Consultant c WHERE c.isDeleted = false")
List<Consultant> findByIsDeletedFalse();

@Query("SELECT c FROM Consultant c WHERE c.isDeleted = false AND c.isActive = true")
List<Consultant> findActiveConsultants();

@Query("SELECT c FROM Consultant c WHERE c.specialty LIKE %:specialty% AND c.isDeleted = false")
List<Consultant> findBySpecialtyContainingIgnoreCaseAndIsDeletedFalse(@Param("specialty") String specialty);
```

#### **수정 후 (안전)**
```java
// ✅ 테넌트별 데이터 분리
@Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false")
List<Consultant> findByTenantIdAndIsDeletedFalse(@Param("tenantId") String tenantId);

@Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND c.isActive = true")
List<Consultant> findActiveConsultantsByTenantId(@Param("tenantId") String tenantId);

@Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.specialty LIKE %:specialty% AND c.isDeleted = false")
List<Consultant> findByTenantIdAndSpecialtyContainingIgnoreCaseAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("specialty") String specialty);
```

### **Phase 2: ConsultantClientMappingRepository 수정**

#### **수정 전 (극도로 위험)**
```java
// ❌ 모든 테넌트 매칭 정보 노출!
@Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client ORDER BY m.updatedAt DESC")
List<ConsultantClientMapping> findAllWithDetails();

@Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.status = 'ACTIVE'")
List<ConsultantClientMapping> findActiveMappingsWithDetails();
```

#### **수정 후 (안전)**
```java
// ✅ 테넌트별 매칭 정보 분리
@Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId ORDER BY m.updatedAt DESC")
List<ConsultantClientMapping> findAllWithDetailsByTenantId(@Param("tenantId") String tenantId);

@Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.tenantId = :tenantId AND m.status = 'ACTIVE'")
List<ConsultantClientMapping> findActiveMappingsWithDetailsByTenantId(@Param("tenantId") String tenantId);
```

### **Phase 3: Service Layer 수정**

#### **모든 Service에서 TenantContextHolder 사용**
```java
@Service
public class ConsultantStatsServiceImpl {
    
    public List<Consultant> getAllConsultants() {
        // ✅ 현재 테넌트 ID 자동 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        // ✅ 테넌트별 데이터만 조회
        return consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId);
    }
}
```

---

## ⏰ 실행 계획

### **즉시 실행 (30분)**
1. ✅ ConsultantRepository 테넌트 필터링 추가
2. ✅ ConsultantClientMappingRepository 테넌트 필터링 추가  
3. ✅ 기존 메서드 deprecated 처리

### **Service 연동 (1시간)**  
4. ✅ 모든 Service에서 TenantContextHolder 사용
5. ✅ 기존 호출 부분 수정

### **테스트 및 검증 (1시간)**
6. ✅ 테넌트별 데이터 분리 검증
7. ✅ 크로스 테넌트 접근 차단 확인
8. ✅ 기존 기능 정상 동작 확인

---

## 🎯 성공 기준

- ✅ **모든 데이터 조회에 테넌트 ID 필터링 적용**
- ✅ **크로스 테넌트 데이터 접근 완전 차단**  
- ✅ **기존 기능 정상 동작 유지**
- ✅ **성능 저하 없음**

---

## 🚨 긴급 조치 사항

### **임시 보안 조치**
```java
// BaseRepository에 기본 테넌트 필터링 추가
@Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId AND e.isDeleted = false")
List<T> findAllByTenantId(@Param("tenantId") String tenantId);
```

### **모니터링 강화**
- 모든 DB 쿼리에 테넌트 ID 포함 여부 실시간 모니터링
- 크로스 테넌트 접근 시도 로깅 및 알림

---

**🔥 이 보안 문제는 즉시 수정되어야 합니다!**
