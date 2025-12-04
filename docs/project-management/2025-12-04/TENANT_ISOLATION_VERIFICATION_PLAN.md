# 테넌트 격리 검증 계획

**작성일**: 2025-12-04  
**상태**: 진행 중  
**우선순위**: Priority 1.2

---

## 📌 개요

모든 데이터가 테넌트별로 완전히 격리되도록 보장하는 검증 작업입니다.

---

## 🎯 목표

- 모든 SELECT 쿼리에 `tenant_id` 조건 필수 확인
- 모든 INSERT/UPDATE에 `tenant_id` 포함 확인
- 인덱스에 `tenant_id` 포함 확인
- 테넌트 간 데이터 접근 차단 확인

---

## 📋 작업 계획

### Day 1: 모든 SELECT 쿼리 검증

#### 1. Repository 쿼리 분석
- [ ] BaseRepository에서 Deprecated 메서드 사용 확인
- [ ] 각 Repository의 @Query 어노테이션 확인
- [ ] tenant_id 조건이 없는 쿼리 식별

#### 2. 문제 쿼리 수정
- [ ] tenant_id 조건 추가
- [ ] 테넌트 컨텍스트 자동 적용 확인
- [ ] Deprecated 메서드 사용 제거

#### 3. 검증 체크리스트
- [ ] 모든 SELECT 쿼리에 `WHERE tenant_id = ?` 조건 확인
- [ ] 테넌트 구분 없이 조회하는 쿼리 0개 확인

---

### Day 2: 모든 INSERT/UPDATE 검증

#### 1. INSERT 검증
- [ ] 모든 INSERT에 `tenant_id` 포함 확인
- [ ] 테넌트 컨텍스트에서 자동 주입 확인
- [ ] BaseEntity의 tenantId 자동 설정 확인

#### 2. UPDATE 검증
- [ ] 모든 UPDATE에 `tenant_id` 조건 확인
- [ ] 테넌트 간 데이터 수정 차단 확인

---

### Day 3: 인덱스 및 성능 검증

#### 1. 인덱스 검증
- [ ] 인덱스에 `tenant_id` 포함 확인
- [ ] 복합 인덱스 최적화 확인

#### 2. 성능 테스트
- [ ] 테넌트별 쿼리 성능 확인
- [ ] 인덱스 활용도 확인

---

## ✅ 완료 기준

- ✅ 모든 SELECT 쿼리에 `tenant_id` 조건 포함
- ✅ 모든 INSERT에 `tenant_id` 포함
- ✅ 모든 UPDATE에 `tenant_id` 조건 포함
- ✅ 인덱스에 `tenant_id` 포함 (복합 인덱스)
- ✅ 테넌트 간 데이터 접근 차단 확인

---

**최종 업데이트**: 2025-12-04

