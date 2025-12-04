# INSERT/UPDATE 검증 보고서

**작성일**: 2025-12-04  
**상태**: 검증 중  
**우선순위**: Priority 1.2 Day 2

---

## 📌 개요

모든 INSERT/UPDATE 작업에 테넌트 격리가 적용되는지 검증하는 작업입니다.

---

## 🔍 발견된 사항

### 1. INSERT 시 tenant_id 자동 설정

#### ✅ TenantEntityListener 존재
- 위치: `src/main/java/com/coresolution/core/listener/TenantEntityListener.java`
- 기능: `@PrePersist`, `@PreUpdate`로 자동 tenant_id 설정
- 상태: 구현 완료

#### ⚠️ BaseEntity에 등록 필요
- 현재: `@EntityListeners(AuditingEntityListener.class)`만 등록
- 필요: `TenantEntityListener` 추가 등록

#### ✅ BaseTenantEntityServiceImpl.create()
- 위치: `src/main/java/com/coresolution/core/service/impl/BaseTenantEntityServiceImpl.java:97-132`
- 기능: tenantId를 파라미터로 받아 엔티티에 설정
- 상태: 구현 완료

---

### 2. UPDATE 쿼리 검증

#### ⚠️ BaseRepository UPDATE 쿼리 - tenant_id 조건 없음

**발견된 쿼리**:
1. `softDeleteById()` - Line 362
   ```java
   @Query("UPDATE #{#entityName} e SET e.isDeleted = true, e.deletedAt = ?2, e.version = e.version + 1 WHERE e.id = ?1")
   ```
   - 문제: tenant_id 조건 없음
   - 위험: 모든 테넌트의 데이터 삭제 가능

2. `restoreById()` - Line 365
   ```java
   @Query("UPDATE #{#entityName} e SET e.isDeleted = false, e.deletedAt = null, e.version = e.version + 1 WHERE e.id = ?1")
   ```
   - 문제: tenant_id 조건 없음
   - 위험: 모든 테넌트의 데이터 복구 가능

3. `cleanupOldDeleted()` - Line 208
   ```java
   @Query("DELETE FROM #{#entityName} e WHERE e.isDeleted = true AND e.deletedAt < ?1")
   ```
   - 문제: tenant_id 조건 없음
   - 위험: 모든 테넌트의 데이터 영구 삭제 가능

---

### 3. BaseTenantEntityServiceImpl.update() 검증

#### ✅ 테넌트 검증 로직 존재
- 위치: `src/main/java/com/coresolution/core/service/impl/BaseTenantEntityServiceImpl.java:135-171`
- 기능: 
  - 기존 엔티티의 tenantId와 비교
  - 다른 테넌트 데이터 수정 시 예외 발생
- 상태: 구현 완료

---

## 📋 수정 계획

### 1. BaseEntity에 TenantEntityListener 등록
- [x] `@EntityListeners`에 `TenantEntityListener` 추가

### 2. BaseRepository UPDATE 쿼리 수정
- [ ] `softDeleteById()` - tenant_id 조건 추가
- [ ] `restoreById()` - tenant_id 조건 추가  
- [ ] `cleanupOldDeleted()` - tenant_id 조건 추가

---

## ⚠️ 주의사항

### Service 레이어에서 이미 보호됨
- `BaseTenantEntityServiceImpl.update()`에서 tenantId 검증 수행
- `BaseTenantEntityServiceImpl.delete()`에서 tenantId 검증 수행

### Repository 레벨 추가 보호 필요
- Repository 메서드를 직접 호출하는 경우를 대비
- SQL Injection 방지 차원에서 WHERE 절에 tenant_id 조건 필수

---

**최종 업데이트**: 2025-12-04

