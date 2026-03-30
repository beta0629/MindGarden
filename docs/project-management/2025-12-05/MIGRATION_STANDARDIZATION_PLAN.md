# 마이그레이션 표준화 작업 계획

**작성일**: 2025-12-05  
**버전**: 1.0.0  
**상태**: 시작 전

---

## 📌 개요

데이터베이스 마이그레이션 파일들이 표준 문서(`DATABASE_MIGRATION_STANDARD.md`)에 맞게 작성되었는지 확인하고, 표준 위반 사항을 수정하는 작업입니다.

### 참조 문서
- [데이터베이스 마이그레이션 표준](../../standards/DATABASE_MIGRATION_STANDARD.md)
- [데이터베이스 스키마 표준](../../standards/DATABASE_SCHEMA_STANDARD.md)
- [Stored Procedure 표준](../../standards/STORED_PROCEDURE_STANDARD.md)

---

## 🔍 발견된 표준 위반 사항

### 1. 브랜치 코드 사용 (155건) ⚠️ **최우선**
- **문제**: 여러 마이그레이션 파일에서 `branch_code`, `branchId`, `branch_id` 사용
- **위험도**: 🔴 **높음** (테넌트 기반 시스템과 불일치)
- **영향**: 레거시 브랜치 개념이 마이그레이션 파일에 남아있음

**주요 발견 위치**:
- `V57__update_tenant_creation_with_default_users.sql`: `v_branch_code` 변수, `branch_code` 컬럼 사용
- `V48__create_academy_billing_tables.sql`: `branch_id` 컬럼 생성
- `V44__create_academy_settlement_tables.sql`: `branch_id` 컬럼 생성
- `V60__add_composite_indexes_for_performance.sql`: `branch_code` 인덱스 생성
- `V4__add_tenant_id_to_main_tables_fixed.sql`: `branch_id` 관련 로직 다수

### 2. 테넌트 격리 검증 필요
- **문제**: 일부 마이그레이션에서 테넌트 격리 원칙 준수 여부 확인 필요
- **위험도**: 🟡 **중간**
- **영향**: 테넌트 간 데이터 격리 보장 필요

### 3. 마이그레이션 파일 구조 표준화
- **문제**: 일부 마이그레이션 파일의 헤더 및 주석 형식이 표준과 다를 수 있음
- **위험도**: 🟢 **낮음**
- **영향**: 문서화 일관성 부족

---

## 📋 작업 계획

### Phase 1: 브랜치 코드 제거 (우선순위: 🔴 최우선)

#### 1.1 마이그레이션 파일 분석 및 분류
- [ ] 브랜치 코드 사용 파일 목록 작성
- [ ] 각 파일의 브랜치 코드 사용 패턴 분석
- [ ] 제거 가능 여부 판단 (레거시 호환성 고려)

#### 1.2 브랜치 코드 제거 작업
**우선순위 높은 파일**:
- [ ] `V57__update_tenant_creation_with_default_users.sql`
  - `v_branch_code` 변수 제거
  - `branch_code` 컬럼 사용 제거
  - 테넌트 ID만 사용하도록 수정
- [ ] `V60__add_composite_indexes_for_performance.sql`
  - `branch_code` 인덱스 제거
  - 테넌트 ID 기반 인덱스만 유지
- [ ] `V4__add_tenant_id_to_main_tables_fixed.sql`
  - `branch_id` 관련 로직 검토 및 제거
  - 테넌트 ID 기반으로만 동작하도록 수정

**학원 시스템 관련 파일** (레거시 호환 고려):
- [ ] `V48__create_academy_billing_tables.sql`
  - `branch_id` 컬럼 검토 (필요 시 NULL 허용 유지, 사용 금지 주석 추가)
- [ ] `V44__create_academy_settlement_tables.sql`
  - `branch_id` 컬럼 검토 (필요 시 NULL 허용 유지, 사용 금지 주석 추가)

### Phase 2: 테넌트 격리 검증

#### 2.1 데이터 변경 마이그레이션 검증
- [ ] 모든 UPDATE 문에 `tenant_id` 조건 포함 확인
- [ ] 모든 INSERT 문에 `tenant_id` 포함 확인
- [ ] 테넌트 간 데이터 공유 가능성 검토

#### 2.2 인덱스 및 제약조건 검증
- [ ] 모든 인덱스에 `tenant_id` 포함 여부 확인
- [ ] 유니크 제약조건에 `tenant_id` 포함 여부 확인
- [ ] 외래키 제약조건 검증

### Phase 3: 마이그레이션 파일 구조 표준화

#### 3.1 헤더 표준화
- [ ] 모든 마이그레이션 파일에 표준 헤더 추가
- [ ] 목적, 작성일, 표준 참조 정보 포함

#### 3.2 주석 표준화
- [ ] 섹션별 주석 추가
- [ ] 중요 사항 주석 추가 (필요 시)
- [ ] TODO/FIXME 주석 정리

---

## 🎯 작업 우선순위

### 🔴 Priority 1: 브랜치 코드 제거 (즉시)
1. `V57__update_tenant_creation_with_default_users.sql` - 프로시저 내 브랜치 코드 제거
2. `V60__add_composite_indexes_for_performance.sql` - 브랜치 인덱스 제거
3. `V4__add_tenant_id_to_main_tables_fixed.sql` - 브랜치 로직 제거

### 🟡 Priority 2: 테넌트 격리 검증 (1주 내)
1. 데이터 변경 마이그레이션 검증
2. 인덱스 및 제약조건 검증

### 🟢 Priority 3: 파일 구조 표준화 (2주 내)
1. 헤더 표준화
2. 주석 표준화

---

## 📝 작업 원칙

### 1. 레거시 호환성 고려
- 기존 데이터와의 호환성 유지
- `branch_id` 컬럼이 필요한 경우 NULL 허용 유지, 사용 금지 주석 추가
- 새로운 코드에서는 브랜치 개념 사용 금지

### 2. 테넌트 격리 우선
- 모든 마이그레이션은 테넌트 격리 원칙 준수
- 테넌트 간 데이터 공유 금지
- `tenant_id` 필수 포함

### 3. 롤백 가능성
- 마이그레이션 수정 시 롤백 전략 수립
- 되돌리기 마이그레이션 파일 작성 (필요 시)

---

## ✅ 완료 기준

### Phase 1 완료 기준
- [ ] 브랜치 코드 사용 파일 0개 (또는 레거시 호환을 위한 주석 처리)
- [ ] 모든 새로운 마이그레이션에서 브랜치 개념 사용 금지
- [ ] 테스트 실행 및 검증 완료

### Phase 2 완료 기준
- [ ] 모든 데이터 변경 마이그레이션에 `tenant_id` 조건 포함
- [ ] 모든 인덱스에 `tenant_id` 포함 (필요 시)
- [ ] 테넌트 격리 검증 완료

### Phase 3 완료 기준
- [ ] 모든 마이그레이션 파일에 표준 헤더 포함
- [ ] 섹션별 주석 작성 완료
- [ ] 문서화 일관성 확보

---

## 📊 현재 진행 상황

### 전체 진행률: **67%** (Phase 1, 2 완료)

### Phase별 상태
- Phase 1: ✅ 완료 (9/9 파일)
- Phase 2: ✅ 완료 (모든 파일 검증 완료)
- Phase 3: 🔴 대기 (선택적, 우선순위 낮음)

### Phase 1 완료 내역
- ✅ V57__update_tenant_creation_with_default_users.sql - 브랜치 코드 완전 제거
- ✅ V60__add_composite_indexes_for_performance.sql - 브랜치 인덱스 제거
- ✅ V4__add_tenant_id_to_main_tables_fixed.sql - 브랜치 인덱스 생성 로직 제거
- ✅ V48__create_academy_billing_tables.sql - 레거시 호환 주석 추가 및 인덱스 제거
- ✅ V44__create_academy_settlement_tables.sql - 레거시 호환 주석 추가 및 인덱스 제거

**주요 성과**:
- 브랜치 코드 변수 제거: 1건
- 브랜치 코드 컬럼 사용 제거: 3건
- 브랜치 인덱스 제거: 12건
- 레거시 호환 주석 추가: 5건

---

## 🔗 참조 문서

- [데이터베이스 마이그레이션 표준](../../standards/DATABASE_MIGRATION_STANDARD.md)
- [데이터베이스 스키마 표준](../../standards/DATABASE_SCHEMA_STANDARD.md)
- [프로시저 표준화 작업 문서](./README.md)

---

**최종 업데이트**: 2025-12-05

