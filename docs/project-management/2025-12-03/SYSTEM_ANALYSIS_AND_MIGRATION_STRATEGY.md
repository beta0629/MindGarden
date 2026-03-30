# MindGarden 시스템 분석 및 마이그레이션 전략

**작성일**: 2025-12-03  
**분석자**: AI Assistant  
**목적**: 현재 시스템 상태 분석 및 역할/권한 마이그레이션 최적 전략 수립

---

## 📊 1. 현재 시스템 상태 분석

### 1.1 데이터베이스 구조

#### ✅ common_codes 테이블
```sql
- tenant_id VARCHAR(36) NULL  ✅ (V10 마이그레이션 완료)
- UNIQUE KEY: uk_tenant_code_group_value (tenant_id, code_group, code_value)
- 총 레코드: ~1000개
```

#### ✅ tenant_roles 테이블 (존재함!)
```sql
- tenant_id VARCHAR(36)
- tenant_role_id VARCHAR(36) (UUID)
- name_ko, name_en
- is_active
```

**중요 발견**: `tenant_roles` 테이블이 **이미 존재**하고 데이터도 있음!
- 테스트 테넌트들에 이미 역할 생성됨
- 기본 역할: 원장(Director), 상담사(Counselor), 내담자(Client), 사무원(Staff)

#### ⚠️ role_permissions 테이블
```sql
- role_name VARCHAR(50)  ⚠️ (문자열 기반, 레거시)
- tenant_role_id VARCHAR(36) NULL  ✅ (신규 컬럼 존재)
- tenant_id VARCHAR(100) NULL
```

### 1.2 현재 역할 분포

#### users 테이블 (실제 사용자)
| 역할 | 사용자 수 | 상태 |
|------|----------|------|
| ADMIN | 74 | ✅ 유지 |
| CONSULTANT | 39 | ✅ 유지 |
| CLIENT | 28 | ✅ 유지 |
| BRANCH_SUPER_ADMIN | 15 | ⚠️ 제거 대상 |
| HQ_ADMIN | 1 | ⚠️ 제거 대상 |
| HQ_MASTER | 1 | ⚠️ 제거 대상 |
| SUPER_HQ_ADMIN | 1 | ⚠️ 제거 대상 |

**총 사용자**: 160명

#### role_permissions 테이블 (권한 매핑)
| 역할 | 권한 수 | 상태 |
|------|---------|------|
| BRANCH_SUPER_ADMIN | 80 | ⚠️ 제거 대상 |
| SUPER_HQ_ADMIN | 50 | ⚠️ 제거 대상 |
| HQ_ADMIN | 47 | ⚠️ 제거 대상 |
| HQ_MASTER | 46 | ⚠️ 제거 대상 |
| CONSULTANT | 30 | ✅ 유지 |
| HQ_SUPER_ADMIN | 24 | ⚠️ 제거 대상 |
| BRANCH_MANAGER | 22 | ⚠️ 제거 대상 |
| CLIENT | 21 | ✅ 유지 |
| BRANCH_ADMIN | 17 | ⚠️ 제거 대상 |
| ADMIN | 15 | ✅ 유지 |

**총 권한 매핑**: ~10,000개

### 1.3 테넌트 현황
- **활성 테넌트**: 5개 (본점, 본사, 강남점, 홍대점, 잠실점)
- **테스트 테넌트**: 다수 (test-tenant-*)

### 1.4 공통코드 현황

#### ⚠️ USER_ROLE 공통코드
- **현재 상태**: 데이터 없음 (!)
- **code_group_metadata**: `code_type = NULL` (미설정)
- **문제**: 역할이 공통코드에 없고, Enum과 users 테이블에만 존재

#### ✅ USER_GRADE 공통코드
- **tenant_id = NULL** (시스템 공통코드)
- 브론즈, 실버, 골드, 플래티넘, 다이아몬드 등

---

## 🎯 2. 핵심 문제점

### 2.1 역할 시스템 이중화
```
현재 상태:
1. UserRole Enum (Java 코드)
2. users.role 컬럼 (VARCHAR)
3. role_permissions.role_name (VARCHAR)
4. tenant_roles 테이블 (UUID 기반) ✅
5. common_codes.USER_ROLE (데이터 없음) ⚠️
```

**문제**: 5개 시스템이 동시에 존재하며, 일관성 없음

### 2.2 레거시 역할의 영향 범위
```
영향받는 데이터:
- users 테이블: 18명 (BRANCH_SUPER_ADMIN 등)
- role_permissions: ~300개 권한 매핑
- Java Enum: UserRole.java
- 프론트엔드: 메뉴 권한 체크
```

### 2.3 브랜치/본사 개념 제거 필요
- 사용자 요구사항: "어제 브랜치 관련해서 사용 안하기로 했어"
- 제거 대상: BRANCH_*, HQ_*, SUPER_HQ_ADMIN 등

---

## 🚀 3. 최적 마이그레이션 전략

### 전략 A: 점진적 마이그레이션 (권장 ⭐)

#### 장점
- ✅ 운영 중단 없음
- ✅ 롤백 가능
- ✅ 단계별 검증 가능
- ✅ 기존 사용자 영향 최소화

#### 단점
- ⚠️ 마이그레이션 기간 길어짐 (1-2주)
- ⚠️ 이중 시스템 일시적 유지

#### 실행 단계
```
Phase 1: 준비 (1일)
  - 권한 백업
  - 마이그레이션 스크립트 작성
  - 테스트 환경 검증

Phase 2: tenant_roles 확장 (1일)
  - 기본 4개 역할을 모든 테넌트에 생성
  - ADMIN, CONSULTANT, CLIENT, STAFF

Phase 3: 권한 마이그레이션 (2일)
  - role_permissions.tenant_role_id 매핑
  - 레거시 역할 → ADMIN 통합
  - 권한 복사 및 검증

Phase 4: users 테이블 마이그레이션 (1일)
  - users.role 컬럼 업데이트
  - 레거시 역할 → ADMIN 변환
  - 사용자별 tenant_role_id 매핑

Phase 5: Java 코드 정리 (1일)
  - UserRole Enum 정리
  - AdminRoleUtils 업데이트
  - 프론트엔드 권한 체크 수정

Phase 6: 레거시 데이터 정리 (1일)
  - common_codes 레거시 역할 제거
  - role_permissions 레거시 권한 제거
  - 문서화
```

### 전략 B: 일괄 마이그레이션 (빠름 ⚡)

#### 장점
- ✅ 빠른 완료 (1일)
- ✅ 깔끔한 전환
- ✅ 복잡도 낮음

#### 단점
- ⚠️ 운영 중단 필요 (1-2시간)
- ⚠️ 롤백 어려움
- ⚠️ 위험도 높음

---

## 💡 4. 권장 사항

### 4.1 최종 권장: **전략 A (점진적 마이그레이션)**

**이유**:
1. ✅ 운영 중 시스템 (사용자 160명)
2. ✅ 권한 데이터 복잡 (~10,000개 매핑)
3. ✅ 롤백 가능성 필수
4. ✅ 단계별 검증으로 안정성 확보

### 4.2 역할 체계 최종안

#### 시스템 역할 (코어)
```sql
USER_ROLE_TEMPLATE (시스템 공통코드, tenant_id = NULL)
├─ ADMIN (관리자)
├─ CONSULTANT (상담사)
├─ CLIENT (내담자)
└─ STAFF (사무원)
```

#### 테넌트 역할 (tenant_roles 테이블)
```sql
tenant_roles (tenant_id = UUID)
├─ 원장 (Director) → ADMIN 기반
├─ 상담사 (Counselor) → CONSULTANT 기반
├─ 내담자 (Client) → CLIENT 기반
└─ 사무원 (Staff) → STAFF 기반
```

#### 등급 시스템 (성과/경력 기반)
```sql
USER_GRADE (시스템 공통코드, tenant_id = NULL)
├─ CLIENT_BRONZE, CLIENT_SILVER, CLIENT_GOLD
├─ CONSULTANT_JUNIOR, CONSULTANT_SENIOR, CONSULTANT_EXPERT
└─ ADMIN_MANAGER, ADMIN_DIRECTOR
```

### 4.3 레거시 역할 매핑 전략

| 레거시 역할 | 신규 역할 | 권한 처리 |
|------------|----------|----------|
| BRANCH_SUPER_ADMIN | ADMIN | 모든 권한 유지 |
| HQ_ADMIN | ADMIN | 모든 권한 유지 |
| SUPER_HQ_ADMIN | ADMIN | 모든 권한 유지 |
| HQ_MASTER | ADMIN | 모든 권한 유지 |
| BRANCH_MANAGER | ADMIN | 모든 권한 유지 |
| BRANCH_ADMIN | ADMIN | 모든 권한 유지 |
| ADMIN | ADMIN | 그대로 유지 |
| CONSULTANT | CONSULTANT | 그대로 유지 |
| CLIENT | CLIENT | 그대로 유지 |

**핵심**: 모든 관리자 역할을 `ADMIN`으로 통합

---

## 📋 5. 실행 계획

### 5.1 Phase 1: 준비 및 백업 (즉시 실행 가능)

```sql
-- 1. 권한 백업
CREATE TABLE role_permissions_backup_20251203 AS
SELECT * FROM role_permissions WHERE is_active = true;

-- 2. 사용자 역할 백업
CREATE TABLE users_role_backup_20251203 AS
SELECT id, tenant_id, username, role FROM users;

-- 3. 현재 상태 스냅샷
CREATE TABLE migration_snapshot_20251203 (
    snapshot_type VARCHAR(50),
    data_count INT,
    snapshot_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO migration_snapshot_20251203 (snapshot_type, data_count, snapshot_data)
VALUES
('users_by_role', 160, (SELECT JSON_OBJECT('data', JSON_ARRAYAGG(JSON_OBJECT('role', role, 'count', cnt))) FROM (SELECT role, COUNT(*) as cnt FROM users GROUP BY role) t)),
('permissions_by_role', 10000, (SELECT JSON_OBJECT('data', JSON_ARRAYAGG(JSON_OBJECT('role', role_name, 'count', cnt))) FROM (SELECT role_name, COUNT(*) as cnt FROM role_permissions WHERE is_active = true GROUP BY role_name) t));
```

### 5.2 Phase 2: tenant_roles 확장 (1일 소요)

```sql
-- 모든 활성 테넌트에 기본 역할 생성
-- (이미 일부 테넌트에는 존재하므로, 없는 테넌트만 생성)
```

### 5.3 Phase 3-6: 순차 실행

**예상 소요 시간**: 5-7일  
**운영 중단**: 없음  
**롤백 가능**: 각 Phase별 롤백 스크립트 제공

---

## ⚠️ 6. 리스크 및 대응

### 6.1 주요 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 권한 손실 | 높음 | 백업 테이블 + 롤백 스크립트 |
| 사용자 로그인 실패 | 높음 | 단계별 검증 + 즉시 롤백 |
| 프론트엔드 권한 체크 오류 | 중간 | 점진적 배포 + A/B 테스트 |
| 데이터 정합성 깨짐 | 높음 | 트랜잭션 처리 + 검증 쿼리 |

### 6.2 롤백 계획

각 Phase별 롤백 스크립트 사전 작성:
```sql
-- Phase 3 롤백 예시
DELETE FROM role_permissions WHERE created_at > '2025-12-03 00:00:00';
INSERT INTO role_permissions SELECT * FROM role_permissions_backup_20251203;
```

---

## 🎯 7. 다음 단계

### 즉시 실행 가능한 작업

1. **Phase 1 백업 실행** (5분 소요)
   ```bash
   mysql -h 114.202.247.246 -u mindgarden_dev -p < backup_script.sql
   ```

2. **마이그레이션 스크립트 작성** (1시간 소요)
   - Phase 2-6 SQL 스크립트
   - 롤백 스크립트
   - 검증 쿼리

3. **테스트 환경 검증** (2시간 소요)
   - 로컬 DB 복사
   - 마이그레이션 실행
   - 결과 검증

### 사용자 승인 필요 사항

- [ ] 마이그레이션 전략 승인 (전략 A vs B)
- [ ] 역할 체계 최종안 승인
- [ ] 실행 일정 확정
- [ ] 롤백 계획 검토

---

## 📝 8. 결론

### 현재 시스템 상태
- ✅ `tenant_id` 컬럼 존재 (V10 완료)
- ✅ `tenant_roles` 테이블 존재 및 일부 데이터 있음
- ⚠️ 레거시 역할이 여전히 사용 중 (18명 사용자)
- ⚠️ 권한 시스템 이중화 (문자열 기반 + UUID 기반)

### 권장 사항
1. **전략 A (점진적 마이그레이션)** 채택
2. **Phase 1 백업 즉시 실행**
3. **Phase 2-6 순차 실행** (5-7일)
4. **단계별 검증 및 롤백 준비**

### 예상 효과
- ✅ 역할 시스템 단일화
- ✅ 테넌트별 역할 관리 가능
- ✅ 브랜치/본사 개념 제거
- ✅ 확장 가능한 권한 시스템 구축

---

**작성 완료**: 2025-12-03  
**다음 작업**: 사용자 승인 대기 → Phase 1 백업 실행

