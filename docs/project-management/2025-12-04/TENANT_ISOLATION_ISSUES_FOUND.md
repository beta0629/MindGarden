# 테넌트 격리 검증 - 발견된 이슈

**작성일**: 2025-12-04  
**상태**: 검토 중  
**우선순위**: Priority 1.2 Day 1

---

## 📌 개요

Priority 1.2 Day 1 작업 중 발견된 테넌트 격리 관련 이슈 목록입니다.

---

## 🔍 발견된 이슈

### 1. UserServiceImpl.findByEmail() - Deprecated 메서드 사용 ⚠️

**위치**: `src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java:305`

```java
@Override
public Optional<User> findByEmail(String email) {
    return userRepository.findByEmail(email);  // ⚠️ Deprecated 메서드
}
```

**문제점**:
- `userRepository.findByEmail(email)`는 Deprecated 메서드
- 테넌트 필터링이 없어 모든 테넌트에서 사용자 검색 가능

**사용 위치**:
- `resetPassword()` 메서드에서 사용
- `authenticateUser()` 메서드에서 사용

**개선 방안**:
- `findByTenantIdAndEmail()` 메서드 사용으로 교체
- 또는 테넌트 컨텍스트를 고려한 로직으로 수정

---

### 2. ConsultationServiceImpl - Deprecated 메서드 사용 ⚠️

**위치**: `src/main/java/com/coresolution/consultation/service/impl/ConsultationServiceImpl.java:415-421`

```java
@Override
public List<Consultation> findByClientId(Long clientId) {
    return consultationRepository.findByClientId(clientId);  // ⚠️ Deprecated
}

@Override
public List<Consultation> findByConsultantId(Long consultantId) {
    return consultationRepository.findByConsultantId(consultantId);  // ⚠️ Deprecated 가능성
}
```

**문제점**:
- 테넌트 필터링 없이 조회 가능
- 모든 테넌트의 상담 기록 노출 위험

**개선 방안**:
- `findByTenantIdAndClientId()` 메서드 사용으로 교체
- `findByTenantIdAndConsultantId()` 메서드 사용으로 교체

---

### 3. BaseRepository - 기간별 조회 쿼리 ⚠️

**위치**: `src/main/java/com/coresolution/consultation/repository/BaseRepository.java:74-78`

```java
@Query("SELECT e FROM #{#entityName} e WHERE e.createdAt BETWEEN ?1 AND ?2 AND e.isDeleted = false")
List<T> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

@Query("SELECT e FROM #{#entityName} e WHERE e.updatedAt BETWEEN ?1 AND ?2 AND e.isDeleted = false")
List<T> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
```

**문제점**:
- `tenant_id` 조건이 없어 모든 테넌트 데이터 조회 가능
- BaseRepository의 공통 메서드이므로 영향 범위가 큼

**개선 방안**:
- 테넌트 컨텍스트 기반 메서드 추가
- 또는 default 메서드로 테넌트 필터링 적용

---

### 4. BaseRepository - 최근 데이터 조회 쿼리 ⚠️

**위치**: `src/main/java/com/coresolution/consultation/repository/BaseRepository.java:82-86`

```java
@Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false ORDER BY e.createdAt DESC")
List<T> findRecentActive(Pageable pageable);

@Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false ORDER BY e.updatedAt DESC")
List<T> findRecentlyUpdatedActive(Pageable pageable);
```

**문제점**:
- `tenant_id` 조건이 없어 모든 테넌트 데이터 조회 가능

**개선 방안**:
- 테넌트 필터링 추가 또는 default 메서드로 처리

---

## 📊 우선순위

### 높음 (P0)
1. **UserServiceImpl.findByEmail()** - 인증/비밀번호 재설정에서 사용
2. **ConsultationServiceImpl.findByClientId()** - 민감한 상담 기록 조회

### 중간 (P1)
3. **BaseRepository 기간별 조회** - 많은 Service에서 사용
4. **BaseRepository 최근 데이터 조회** - 많은 Service에서 사용

---

## ✅ 권장 조치

1. **즉시 수정 필요**:
   - `UserServiceImpl.findByEmail()` - 테넌트 필터링 추가
   - `ConsultationServiceImpl.findByClientId()` - 테넌트 필터링 추가

2. **점진적 개선**:
   - BaseRepository의 공통 메서드들은 default 메서드로 테넌트 필터링 적용
   - 또는 각 Repository에서 오버라이드하여 테넌트 필터링 추가

---

**최종 업데이트**: 2025-12-04

