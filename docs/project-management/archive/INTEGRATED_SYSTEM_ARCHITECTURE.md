# 통합 시스템 아키텍처 계획

## 1. 개요

ERP를 독립 시스템으로 분리하는 대신, **학원 시스템 고도화 → 공통화 → 마인드가든 통합** 방식으로 진행합니다.

**핵심 전략:**
- 학원 시스템을 고도화하면서 공통화 패턴 적용
- BaseTenantService를 활용하여 마인드가든과 학원 시스템 통합
- ERP 기능은 공통 레이어에 통합 (프로시저 유지)
- 단일 코드베이스에서 모든 업종 관리

## 2. 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│              공통 코어 레이어 (Common Core)                  │
│  - 인증/인가 (Authentication/Authorization)                  │
│  - 테넌트/지점 관리 (Tenant/Branch Management)              │
│  - BaseTenantService (공통 CRUD)                            │
│  - 프로시저 호출 서비스 (StoredProcedureService)            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  마인드가든     │  │  학원 시스템    │  │  ERP 공통 기능  │
│  (상담소)      │  │  (Academy)     │  │  (Common ERP)  │
│                │  │                │  │                │
│  - 상담 예약   │  │  - 강좌 관리    │  │  - 재무 거래    │
│  - 세션 관리   │  │  - 반 관리      │  │  - 회계 분개    │
│  - 상담 이력   │  │  - 수강 등록    │  │  - 급여 계산    │
│  - 결제 연동   │  │  - 출결 관리    │  │  - 정산 계산    │
│                │  │                │  │  - 리포트 생성  │
│  BaseTenant   │  │  BaseTenant    │  │  (프로시저 기반)│
│  Service 사용  │  │  Service 사용  │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌───────────────────────────▼───────────────────────────┐
│              공통 ERP 레이어 (통합)                      │
│  - 재무 거래 (FinancialTransaction) - 공통              │
│  - 회계 분개 (AccountingEntry) - 공통                    │
│  - 급여 계산 (SalaryCalculation) - 공통                 │
│  - 정산 관리 (Settlement) - 업종별 확장                 │
│  - 프로시저 호출 (PL/SQL)                               │
└───────────────────────────────────────────────────────┘
```

## 3. 통합 전략

### 3.1 단계별 통합 계획

#### Phase 1: 학원 시스템 고도화 및 공통화 (2주)

**Week 1: 학원 시스템 완성**
- [ ] CourseServiceImpl → BaseTenantServiceImpl 상속으로 리팩토링
- [ ] ClassServiceImpl → BaseTenantServiceImpl 상속으로 리팩토링
- [ ] ClassEnrollmentServiceImpl 구현
- [ ] AttendanceServiceImpl 구현
- [ ] 학원 시스템 API 컨트롤러 구현

**Week 2: 공통화 패턴 적용**
- [ ] 모든 학원 서비스를 BaseTenantService 패턴으로 통일
- [ ] 공통 DTO 변환 로직 추출
- [ ] 공통 검증 로직 추출
- [ ] 테스트 코드 작성

#### Phase 2: 마인드가든 시스템 공통화 (2주)

**Week 1: 마인드가든 서비스 리팩토링**
- [ ] ConsultationService → BaseTenantServiceImpl 상속
- [ ] ScheduleService → BaseTenantServiceImpl 상속
- [ ] PaymentService → BaseTenantServiceImpl 상속
- [ ] 기존 서비스들을 공통 패턴으로 통일

**Week 2: 통합 검증**
- [ ] 마인드가든과 학원 시스템 통합 테스트
- [ ] 공통 기능 재사용 검증
- [ ] 성능 테스트

#### Phase 3: ERP 기능 통합 (2주)

**Week 1: ERP 공통 레이어 구축**
- [ ] FinancialTransactionService → BaseTenantService 패턴 적용
- [ ] AccountingEntryService → BaseTenantService 패턴 적용
- [ ] 프로시저 호출 서비스 표준화
- [ ] ERP 공통 API 구현

**Week 2: 업종별 ERP 확장**
- [ ] 학원 정산 프로시저 작성
- [ ] 상담소 정산 프로시저 확장
- [ ] 정산 자동화 배치 작업
- [ ] ERP 리포트 통합

### 3.2 공통화 원칙

**공통화 대상:**
- ✅ CRUD 기본 로직
- ✅ 접근 제어 (tenant_id 검증)
- ✅ DTO 변환
- ✅ 승인 프로세스
- ✅ 이력 관리

**업종별 특화:**
- ❌ 비즈니스 로직 (정원 확인, 출석률 계산 등)
- ❌ 검증 로직 (업종별 규칙)
- ❌ 상태 전이 (업종별 상태 관리)

## 4. 패키지 구조 통합

### 4.1 통합 후 구조

```
src/main/java/com/coresolution/
├── core/
│   ├── domain/
│   │   ├── Tenant, Branch (공통)
│   │   ├── academy/ (학원)
│   │   │   ├── Course, Class, ClassEnrollment, Attendance
│   │   ├── consultation/ (상담소 - 마인드가든)
│   │   │   ├── Consultation, Schedule, Payment
│   │   └── erp/ (ERP 공통)
│   │       ├── FinancialTransaction
│   │       ├── AccountingEntry
│   │       ├── SalaryCalculation
│   │       └── Settlement
│   ├── service/
│   │   ├── BaseTenantService (공통)
│   │   ├── academy/ (학원 서비스)
│   │   ├── consultation/ (상담소 서비스)
│   │   └── erp/ (ERP 서비스)
│   ├── repository/
│   │   ├── academy/
│   │   ├── consultation/
│   │   └── erp/
│   └── controller/
│       ├── academy/
│       ├── consultation/
│       └── erp/
└── mindgarden/
    └── consultation/ (기존 마인드가든 코드 - 점진적 마이그레이션)
```

### 4.2 마이그레이션 전략

**점진적 마이그레이션:**
1. **Phase 1**: 학원 시스템을 `com.coresolution.core.domain.academy`에 구현
2. **Phase 2**: 마인드가든 서비스를 `BaseTenantService` 패턴으로 리팩토링
3. **Phase 3**: 마인드가든 엔티티를 `com.coresolution.core.domain.consultation`으로 이동
4. **Phase 4**: 기존 `com.mindgarden.consultation` 코드는 레거시로 유지 (하위 호환성)

## 5. ERP 통합 전략

### 5.1 ERP를 공통 레이어로 통합

**이유:**
- 재무/회계는 모든 업종에서 공통으로 사용
- 프로시저는 유지하되, Java 서비스 레이어로 통합
- 업종별 정산 로직만 확장

**구조:**
```
공통 ERP 레이어
├── FinancialTransactionService (공통)
│   ├── createTransaction() - 모든 업종 공통
│   ├── approveTransaction() - 모든 업종 공통
│   └── getTransactions() - 모든 업종 공통
├── AccountingService (공통)
│   ├── createJournalEntry() - 프로시저 호출
│   ├── postJournalEntry() - 프로시저 호출
│   └── generateFinancialStatement() - 프로시저 호출
└── SettlementService (공통 + 업종별 확장)
    ├── calculateSettlement() - 프로시저 호출 (업종별)
    ├── approveSettlement() - 공통
    └── getSettlementReport() - 공통
```

### 5.2 업종별 정산 프로시저

**공통 프로시저 인터페이스:**
```sql
CREATE PROCEDURE CalculateSettlement(
    IN p_tenant_id VARCHAR(36),
    IN p_branch_id BIGINT,
    IN p_settlement_period VARCHAR(10),
    IN p_business_type VARCHAR(20), -- ACADEMY, CONSULTATION
    OUT p_settlement_id BIGINT,
    OUT p_total_revenue DECIMAL(15,2),
    OUT p_net_settlement DECIMAL(15,2),
    OUT p_success BOOLEAN
)
```

**업종별 내부 로직:**
- `p_business_type = 'ACADEMY'` → 학원 정산 로직
- `p_business_type = 'CONSULTATION'` → 상담소 정산 로직

## 6. 데이터베이스 통합

### 6.1 테이블 구조

**공통 테이블:**
- `tenants`, `branches` (이미 공통)
- `financial_transactions` (공통)
- `accounting_entries` (공통)
- `salary_calculations` (공통)
- `settlements` (공통)

**업종별 테이블:**
- `courses`, `classes`, `class_enrollments`, `attendances` (학원)
- `consultations`, `schedules`, `payments` (상담소)

**ERP 테이블:**
- `erp_journal_entry_lines` (분개 상세)
- `erp_ledgers` (원장)
- `erp_settlement_rules` (정산 규칙)
- `erp_vat_returns` (부가세 신고)

### 6.2 tenant_id 기반 통합

모든 테이블에 `tenant_id`가 있어서:
- 멀티테넌트 지원
- 업종 구분 없이 통합 관리 가능
- ERP 리포트도 tenant_id로 필터링

## 7. API 통합

### 7.1 통합 API 구조

```
/api/core/
├── /auth (인증/인가 - 공통)
├── /tenants (테넌트 관리 - 공통)
├── /branches (지점 관리 - 공통)
│
├── /academy (학원 시스템)
│   ├── /courses
│   ├── /classes
│   ├── /enrollments
│   └── /attendances
│
├── /consultation (상담소 시스템)
│   ├── /consultations
│   ├── /schedules
│   └── /payments
│
└── /erp (ERP 공통)
    ├── /financial-transactions
    ├── /journal-entries
    ├── /settlements
    └── /reports
```

### 7.2 업종별 확장 API

```
/api/academy/settlements (학원 정산)
/api/consultation/settlements (상담소 정산)
```

## 8. 장점

### 8.1 통합의 장점

1. **단일 코드베이스**
   - 모든 업종이 같은 코드베이스에서 관리
   - 공통 기능 재사용
   - 유지보수 용이

2. **공통화로 인한 효율성**
   - BaseTenantService로 CRUD 로직 공통화
   - 코드 중복 제거
   - 일관된 API 패턴

3. **ERP 통합**
   - 재무/회계 기능을 모든 업종에서 공통 사용
   - 프로시저는 유지하되 Java 레이어로 통합
   - 업종별 정산만 확장

4. **확장성**
   - 새로운 업종 추가 시 BaseTenantService 상속만 하면 됨
   - ERP 기능은 자동으로 사용 가능

5. **마인드가든 통합**
   - 기존 마인드가든 시스템과 자연스럽게 통합
   - 점진적 마이그레이션 가능
   - 하위 호환성 유지

### 8.2 프로시저 유지의 장점

1. **성능**
   - 복잡한 계산을 데이터베이스 레벨에서 처리
   - 네트워크 왕복 최소화

2. **일관성**
   - 트랜잭션 일관성 보장
   - 데이터 무결성 보장

3. **보안**
   - 데이터베이스 레벨에서 접근 제어
   - 비즈니스 로직 보호

## 9. 구현 로드맵

### Phase 1: 학원 시스템 완성 및 공통화 (2주)
- [ ] 학원 서비스 BaseTenantService 패턴 적용
- [ ] 학원 API 컨트롤러 구현
- [ ] 학원 시스템 테스트

### Phase 2: 마인드가든 공통화 (2주)
- [ ] 마인드가든 서비스 BaseTenantService 패턴 적용
- [ ] 통합 테스트
- [ ] 성능 검증

### Phase 3: ERP 통합 (2주)
- [ ] ERP 서비스 BaseTenantService 패턴 적용
- [ ] 정산 프로시저 확장 (학원/상담소)
- [ ] ERP 리포트 통합

### Phase 4: 통합 검증 (1주)
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 벤치마크
- [ ] 문서화

## 10. 주의사항

1. **점진적 마이그레이션**
   - 한 번에 모든 것을 바꾸지 말 것
   - 기존 마인드가든 코드는 레거시로 유지
   - 단계적으로 통합

2. **하위 호환성**
   - 기존 API는 유지
   - 새로운 API는 `/api/core/` 경로 사용
   - 점진적 전환

3. **테스트**
   - 각 단계마다 충분한 테스트
   - 통합 테스트 필수
   - 성능 테스트

4. **문서화**
   - 통합 아키텍처 문서
   - 마이그레이션 가이드
   - API 문서

## 11. 결론

**ERP 독립 시스템 대신 통합 접근:**
- ✅ 학원 시스템 고도화 → 공통화 → 마인드가든 통합
- ✅ ERP는 공통 레이어로 통합 (프로시저 유지)
- ✅ BaseTenantService로 모든 업종 통일
- ✅ 단일 코드베이스에서 모든 업종 관리
- ✅ 점진적 마이그레이션으로 리스크 최소화

이 방식이 더 효율적이고 유지보수하기 쉬운 구조입니다.

