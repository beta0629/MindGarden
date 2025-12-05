# 테스트 데이터 요구사항

**작성일**: 2025-12-05  
**상태**: 대기 중 ⏳

---

## 📋 개요

표준화된 프로시저의 통합 테스트는 현재 프로시저 호출 구조와 파라미터 전달이 올바른지 확인하는 수준입니다. 실제 비즈니스 로직을 검증하려면 테스트 데이터가 필요합니다.

---

## ✅ 현재 테스트 상태

- **테스트 결과**: 12개 테스트 모두 통과 (100% 성공)
- **테스트 범위**: 프로시저 호출 구조 및 파라미터 전달 검증
- **제한사항**: 테스트 데이터 부족으로 인해 실제 비즈니스 로직 검증은 제한적

---

## 🔄 재테스트가 필요한 테스트

다음 테스트들은 테스트 데이터 생성 후 재실행이 필요합니다:

### 1. `testGetRefundableSessionsWithTenantId`
- **필요 데이터**:
  - `consultant_client_mappings` 테이블에 매핑 데이터
  - 매핑 상태가 `ACTIVE`이고 `payment_status`가 `CONFIRMED`인 데이터
  - `tenant_id`가 테스트 테넌트 ID와 일치하는 데이터
- **검증 내용**:
  - 환불 가능 회기 수 계산
  - 최대 환불 금액 계산
  - 매핑 상태 검증

### 2. `testValidateIntegratedAmountWithTenantId`
- **필요 데이터**:
  - `consultant_client_mappings` 테이블에 매핑 데이터
  - `financial_transactions` 테이블에 거래 데이터
  - 매핑의 `package_price`, `payment_amount` 값
  - `tenant_id`가 테스트 테넌트 ID와 일치하는 데이터
- **검증 내용**:
  - 금액 일관성 검증
  - 일관성 점수 계산
  - 금액 불일치 감지

### 3. 기타 데이터 의존적인 테스트들
- `testGetRefundStatisticsWithTenantId`: 환불 통계 데이터 필요
- `testGetConsolidatedFinancialDataWithTenantId`: 재무 거래 데이터 필요
- 기타 통계 및 리포트 관련 테스트들

---

## 📝 테스트 데이터 생성 방법

### 옵션 1: 개발 DB에 직접 생성
```sql
-- 테스트 테넌트 생성
INSERT INTO tenants (id, name, is_active, created_at) 
VALUES ('test-tenant-1', '테스트 테넌트 1', TRUE, NOW());

-- 테스트 매핑 생성
INSERT INTO consultant_client_mappings (
    consultant_id, client_id, tenant_id, 
    package_name, package_price, total_sessions, 
    remaining_sessions, status, payment_status, 
    is_deleted, created_at
) VALUES (
    1, 1, 'test-tenant-1',
    '테스트 패키지', 100000, 10,
    5, 'ACTIVE', 'CONFIRMED',
    FALSE, NOW()
);

-- 기타 필요한 테스트 데이터...
```

### 옵션 2: 테스트용 데이터 시드 스크립트 작성
- `src/test/resources/db/seed/test-data.sql` 파일 생성
- 테스트 실행 전 자동으로 데이터 로드
- `@Sql` 어노테이션 사용하여 테스트 전 데이터 삽입

### 옵션 3: 테스트용 데이터 빌더 클래스 작성
- Java 코드로 테스트 데이터 생성
- `@BeforeEach`에서 테스트 데이터 준비
- 테스트 후 `@AfterEach`에서 데이터 정리

---

## 🎯 재테스트 체크리스트

테스트 데이터 생성 후 다음 항목들을 확인해야 합니다:

- [ ] 테스트 데이터 생성 스크립트/코드 작성
- [ ] 테스트 데이터가 올바르게 생성되었는지 확인
- [ ] 모든 통합 테스트 재실행
- [ ] 테스트 결과 검증 (비즈니스 로직 검증 포함)
- [ ] 실패한 테스트가 있다면 원인 분석 및 수정
- [ ] 최종 테스트 결과 문서화

---

## 📌 참고 사항

- 테스트 데이터는 테스트 전용 테넌트를 사용하여 실제 데이터와 격리
- 테스트 후 데이터 정리 필요 (트랜잭션 롤백 또는 명시적 삭제)
- 테스트 데이터는 프로덕션 환경에 영향을 주지 않도록 주의

---

**업데이트**: 2025-12-05

