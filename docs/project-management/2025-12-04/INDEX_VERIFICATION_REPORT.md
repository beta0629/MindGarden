# 인덱스 검증 보고서

**작성일**: 2025-12-04  
**상태**: 검증 중  
**우선순위**: Priority 1.2 Day 3

---

## 📌 개요

모든 엔티티의 인덱스에 `tenant_id`가 포함되어 있는지 검증하고, 복합 인덱스 최적화 상태를 확인하는 작업입니다.

---

## 🎯 인덱스 최적화 원칙

### 1. 테넌트 격리 환경의 인덱스 전략

멀티테넌트 환경에서 모든 쿼리는 `tenant_id`로 필터링되므로:

1. **모든 복합 인덱스는 `tenant_id`를 첫 번째 컬럼으로 포함해야 함**
   - 예: `(tenant_id, status)`, `(tenant_id, created_at)`
   - 이유: 인덱스 스캔 효율성 향상

2. **단일 컬럼 인덱스도 `tenant_id` 포함 고려**
   - 자주 함께 사용되는 컬럼의 경우 복합 인덱스 생성

3. **Unique Constraint는 자동으로 인덱스 생성**
   - 예: `UK_users_email_tenant` → `(email, tenant_id)` 인덱스 자동 생성

---

## 🔍 주요 엔티티 인덱스 분석

### ✅ 양호한 케이스 (tenant_id 포함)

#### 1. Tenant 엔티티
```java
@Table(name = "tenants", indexes = {
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_tenant_status", columnList = "tenant_id,status"),
    ...
})
```
- ✅ `idx_tenant_id`: 단일 컬럼 인덱스
- ✅ `idx_tenant_status`: 복합 인덱스 (tenant_id 포함)

#### 2. TenantPgConfiguration 엔티티
```java
@Table(name = "tenant_pg_configurations", indexes = {
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_tenant_status", columnList = "tenant_id,status"),
    ...
})
```
- ✅ `idx_tenant_id`: 단일 컬럼 인덱스
- ✅ `idx_tenant_status`: 복합 인덱스 (tenant_id 포함)

#### 3. ClassEnrollment 엔티티
```java
@Table(name = "class_enrollments", indexes = {
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    ...
})
```
- ✅ `idx_tenant_id`: 단일 컬럼 인덱스
- ✅ `idx_tenant_branch`: 복합 인덱스 (tenant_id 포함)

#### 4. UserRoleAssignment 엔티티
```java
@Table(name = "user_role_assignments", indexes = {
    @Index(name = "idx_user_role_tenant_id", columnList = "tenant_id"),
    ...
})
```
- ✅ `idx_user_role_tenant_id`: 단일 컬럼 인덱스

---

### ⚠️ 개선 필요한 케이스 (tenant_id 미포함)

#### 1. User 엔티티
```java
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_phone", columnList = "phone"),
    @Index(name = "idx_users_role", columnList = "role"),
    @Index(name = "idx_users_grade", columnList = "grade"),
    @Index(name = "idx_users_is_deleted", columnList = "is_deleted")
}, uniqueConstraints = {
    @UniqueConstraint(name = "UK_users_email_tenant", columnNames = {"email", "tenant_id"})
})
```

**문제점**:
- ❌ `idx_users_email`: tenant_id 없음 → `(tenant_id, email)` 복합 인덱스 필요
- ❌ `idx_users_role`: tenant_id 없음 → `(tenant_id, role)` 복합 인덱스 필요
- ❌ `idx_users_grade`: tenant_id 없음 → `(tenant_id, grade)` 복합 인덱스 필요
- ❌ `idx_users_is_deleted`: tenant_id 없음 → `(tenant_id, is_deleted)` 복합 인덱스 필요
- ✅ `UK_users_email_tenant`: Unique Constraint로 인덱스 자동 생성됨

**권장 사항**:
- `idx_users_tenant_email`: `(tenant_id, email)` - email 조회 최적화
- `idx_users_tenant_role`: `(tenant_id, role)` - 역할별 조회 최적화
- `idx_users_tenant_is_deleted`: `(tenant_id, is_deleted)` - 활성 사용자 조회 최적화

---

#### 2. Consultation 엔티티
```java
@Table(name = "consultations", indexes = {
    @Index(name = "idx_consultations_client_id", columnList = "client_id"),
    @Index(name = "idx_consultations_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_consultations_status", columnList = "status"),
    @Index(name = "idx_consultations_consultation_date", columnList = "consultation_date"),
    @Index(name = "idx_consultations_is_deleted", columnList = "is_deleted")
})
```

**문제점**:
- ❌ 모든 인덱스에 tenant_id 없음
- 자주 사용되는 쿼리: `WHERE tenant_id = ? AND client_id = ?`
- 자주 사용되는 쿼리: `WHERE tenant_id = ? AND status = ?`
- 자주 사용되는 쿼리: `WHERE tenant_id = ? AND consultation_date BETWEEN ? AND ?`

**권장 사항**:
- `idx_consultations_tenant_client`: `(tenant_id, client_id)` - 클라이언트별 상담 조회
- `idx_consultations_tenant_consultant`: `(tenant_id, consultant_id)` - 상담사별 상담 조회
- `idx_consultations_tenant_status`: `(tenant_id, status)` - 상태별 조회
- `idx_consultations_tenant_date`: `(tenant_id, consultation_date)` - 날짜 범위 조회
- `idx_consultations_tenant_is_deleted`: `(tenant_id, is_deleted)` - 활성 상담 조회

---

#### 3. Alert 엔티티
```java
@Table(name = "alerts", indexes = {
    @Index(name = "idx_alerts_user_id", columnList = "user_id"),
    @Index(name = "idx_alerts_type", columnList = "type"),
    @Index(name = "idx_alerts_priority", columnList = "priority"),
    @Index(name = "idx_alerts_status", columnList = "status"),
    @Index(name = "idx_alerts_created_at", columnList = "created_at"),
    @Index(name = "idx_alerts_is_deleted", columnList = "is_deleted")
})
```

**문제점**:
- ❌ 모든 인덱스에 tenant_id 없음
- 자주 사용되는 쿼리: `WHERE tenant_id = ? AND user_id = ?`
- 자주 사용되는 쿼리: `WHERE tenant_id = ? AND status = ?`
- 자주 사용되는 쿼리: `WHERE tenant_id = ? AND created_at BETWEEN ? AND ?`

**권장 사항**:
- `idx_alerts_tenant_user`: `(tenant_id, user_id)` - 사용자별 알림 조회
- `idx_alerts_tenant_status`: `(tenant_id, status)` - 상태별 조회
- `idx_alerts_tenant_created_at`: `(tenant_id, created_at)` - 날짜 범위 조회
- `idx_alerts_tenant_is_deleted`: `(tenant_id, is_deleted)` - 활성 알림 조회

---

#### 4. UserSession 엔티티
```java
@Table(name = "user_sessions", indexes = {
    @Index(name = "idx_user_sessions_user_id", columnList = "user_id"),
    @Index(name = "idx_user_sessions_session_id", columnList = "session_id"),
    @Index(name = "idx_user_sessions_is_active", columnList = "is_active"),
    @Index(name = "idx_user_sessions_created_at", columnList = "created_at"),
    @Index(name = "idx_user_sessions_expires_at", columnList = "expires_at"),
    @Index(name = "idx_user_sessions_client_ip", columnList = "client_ip")
})
```

**문제점**:
- ❌ 모든 인덱스에 tenant_id 없음
- 자주 사용되는 쿼리: `WHERE tenant_id = ? AND user_id = ? AND is_active = true`

**권장 사항**:
- `idx_user_sessions_tenant_user`: `(tenant_id, user_id)` - 사용자별 세션 조회
- `idx_user_sessions_tenant_active`: `(tenant_id, is_active)` - 활성 세션 조회
- `idx_user_sessions_tenant_created_at`: `(tenant_id, created_at)` - 날짜 범위 조회

---

## 📊 인덱스 검증 통계

### 전체 엔티티 수
- 인덱스가 정의된 엔티티: 약 30개
- tenant_id 인덱스 포함 엔티티: 약 10개
- tenant_id 인덱스 미포함 엔티티: 약 20개

### 주요 문제점
1. **User 엔티티**: 5개 인덱스 중 4개에 tenant_id 없음
2. **Consultation 엔티티**: 5개 인덱스 모두에 tenant_id 없음
3. **Alert 엔티티**: 6개 인덱스 모두에 tenant_id 없음
4. **UserSession 엔티티**: 6개 인덱스 모두에 tenant_id 없음

---

## 🎯 권장 사항

### 즉시 적용 (P0 - 높은 우선순위)
1. **User 엔티티**: 복합 인덱스 추가
2. **Consultation 엔티티**: 복합 인덱스 추가
3. **Alert 엔티티**: 복합 인덱스 추가

### 단계적 적용 (P1 - 중간 우선순위)
1. **UserSession 엔티티**: 복합 인덱스 추가
2. 기타 자주 조회되는 엔티티들의 인덱스 검토

---

## 📋 인덱스 추가 마이그레이션 계획

### 1. User 엔티티 인덱스 추가
```sql
-- 기존 인덱스는 유지 (하위 호환성)
-- 새로운 복합 인덱스 추가
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX idx_users_tenant_is_deleted ON users(tenant_id, is_deleted);
```

### 2. Consultation 엔티티 인덱스 추가
```sql
CREATE INDEX idx_consultations_tenant_client ON consultations(tenant_id, client_id);
CREATE INDEX idx_consultations_tenant_consultant ON consultations(tenant_id, consultant_id);
CREATE INDEX idx_consultations_tenant_status ON consultations(tenant_id, status);
CREATE INDEX idx_consultations_tenant_date ON consultations(tenant_id, consultation_date);
CREATE INDEX idx_consultations_tenant_is_deleted ON consultations(tenant_id, is_deleted);
```

### 3. Alert 엔티티 인덱스 추가
```sql
CREATE INDEX idx_alerts_tenant_user ON alerts(tenant_id, user_id);
CREATE INDEX idx_alerts_tenant_status ON alerts(tenant_id, status);
CREATE INDEX idx_alerts_tenant_created_at ON alerts(tenant_id, created_at);
CREATE INDEX idx_alerts_tenant_is_deleted ON alerts(tenant_id, is_deleted);
```

---

**최종 업데이트**: 2025-12-04

