# ERP 프로시저 호출 누락 디버그 분석 및 수정 태스크

**작성일**: 2025-03-14  
**담당**: core-debugger  
**수정 적용**: core-coder  
**관련 스킬**: `core-solution-erp`, `ERP_TROUBLESHOOTING.md`

---

## 1. 증상 요약

- 결제 완료 및 관리자 승인까지 정상 진행됨
- **ERP DB 프로시저(`UpdateMappingInfo`)가 호출되지 않음**
- 서버 500·예외 여부는 미확인 (로그 확인 필요)

---

## 2. API·서비스 흐름 정리

### 2.1 매핑 관련 API 3종

| API | 컨트롤러 메서드 | 서비스 메서드 | ERP 프로시저 호출 |
|-----|----------------|---------------|-------------------|
| `POST /mappings/{id}/confirm-payment` | AdminController.confirmPayment | AdminServiceImpl.confirmPayment(4arg) | ❌ **없음** |
| `POST /mappings/{id}/confirm-deposit` | AdminController.confirmDeposit | AdminServiceImpl.confirmDeposit | ✅ **있음** |
| `POST /mappings/{id}/approve` | AdminController.approveMapping | AdminServiceImpl.approveMapping | ❌ **없음** |

### 2.2 confirm-payment (4인자) 흐름

```
AdminController.confirmPayment (L1361)
  → adminService.confirmPayment(mappingId, paymentMethod, paymentReference, paymentAmount)
  → AdminServiceImpl.confirmPayment 4인자 (L546)
     - createConsultationIncomeTransaction / createAdditionalSessionIncomeTransaction ✓
     - storedProcedureService.updateMappingInfo 호출 없음 ✗
```

**파일**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`  
**라인**: 546~583

### 2.3 confirm-deposit 흐름 (정상 경로)

```
AdminController.confirmDeposit (L2097)
  → adminService.confirmDeposit(mappingId, depositReference)
  → AdminServiceImpl.confirmDeposit (L1037)
     - createConsultationIncomeTransaction / createAdditionalSessionIncomeTransaction ✓
     - storedProcedureService.updateMappingInfo 호출 있음 ✓ (L1088~1104)
```

### 2.4 approveMapping 흐름

```
AdminController.approveMapping (L1427)
  → adminService.approveMapping(mappingId, adminName)
  → AdminServiceImpl.approveMapping (L1116)
     - approveByAdmin, save
     - storedProcedureService.updateMappingInfo 호출 없음 ✗
```

### 2.5 프론트엔드 사용 경로

| UI | 사용 API | 프로시저 호출 |
|----|----------|---------------|
| `MappingPaymentModal` (결제 확인) | confirm-payment | ❌ 없음 |
| `MappingDepositModal` (입금 확인) | confirm-deposit | ✅ 있음 |

- `IntegratedMatchingSchedule`, `MappingCard`, `MappingListRow` 등에서 **둘 다** 제공
- “결제 확인” 모달로 처리 시 → `confirm-payment` 호출 → **프로시저 미호출**

---

## 3. 근본 원인

### 3.1 확인된 원인

1. **confirm-payment 4인자에 프로시저 호출 누락**  
   - 입금 확인용 confirm-payment 경로에서 `storedProcedureService.updateMappingInfo`가 호출되지 않음.
2. **approveMapping에 프로시저 호출 없음**  
   - 관리자 승인 시에도 ERP 동기화를 기대한다면, 현재 코드는 프로시저를 호출하지 않음.

### 3.2 추가 확인 필요 (서버 로그)

- `UpdateMappingInfo` 시그니처 불일치:  
  - Java: 8개 파라미터 (mappingId, packageName, price, sessions, **tenantId**, updatedBy, success, message)
  - `mapping_update_procedures_mysql_no_delimiter.sql`: 5 IN + 2 OUT (tenant_id 없음)
- 이 경우 `call` 시 `Wrong number of arguments` 또는 `Parameter count mismatch` 등으로 예외 가능.
- 확인 방법: shell로 서버 로그 조회  
  ```bash
  tail -n 300 build/logs/application.log | grep -E "UpdateMappingInfo|매핑 정보 수정|ERP 매핑"
  ```

---

## 4. 수정 제안 (core-coder용)

### 4.1 필수 수정: confirm-payment 4인자에 프로시저 호출 추가

**파일**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`  
**위치**: `confirmPayment(Long mappingId, String paymentMethod, String paymentReference, Long paymentAmount)` 메서드 (L546~583)

**변경 내용**  
`confirm-deposit`(L1083~1105)과 같은 방식으로, ERP 거래 생성 후 `storedProcedureService.updateMappingInfo` 호출 블록 추가.

```java
// 기존: L579~582 (Hibernate.initialize 전)
// 추가할 블록: confirm-deposit의 L1083~1105와 동일한 패턴

// 입금 확인 후 ERP 매핑 정보 동기화 프로시저 호출 (별도 트랜잭션)
String tenantIdForProc = getTenantIdFromMapping(savedMapping);
if (tenantIdForProc == null) tenantIdForProc = getTenantIdOrNull();
runInNewTransaction(tenantIdForProc, () -> {
    try {
        log.info("🔄 입금 확인(confirm-payment) 완료, ERP 매핑 정보 동기화 프로시저 호출: mappingId={}", mappingId);
        Map<String, Object> procedureResult = storedProcedureService.updateMappingInfo(
            mappingId,
            savedMapping.getPackageName(),
            savedMapping.getPackagePrice() != null ? savedMapping.getPackagePrice().doubleValue() : 0.0,
            savedMapping.getTotalSessions() != null ? savedMapping.getTotalSessions() : 0,
            "입금확인"
        );
        if (Boolean.TRUE.equals(procedureResult.get("success"))) {
            log.info("✅ ERP 매핑 정보 동기화 완료: mappingId={}, message={}", mappingId, procedureResult.get("message"));
        } else {
            log.warn("⚠️ ERP 매핑 정보 동기화 실패: mappingId={}, message={}", mappingId, procedureResult.get("message"));
        }
    } catch (Exception e) {
        log.error("❌ 입금 확인(confirm-payment) 후 ERP 매핑 정보 동기화 프로시저 호출 실패: mappingId={}", mappingId, e);
    }
});
```

### 4.2 선택 수정: approveMapping에 프로시저 호출

**비즈니스 요구**  
- 승인 시점에 ERP와 매핑 정보 동기화가 필요하다면  
- `approveMapping` 성공 후 `confirm-deposit`과 동일한 방식으로 `updateMappingInfo` 호출 추가

**주의**  
- `confirm-payment` 또는 `confirm-deposit` 단계에서 이미 프로시저를 호출한다면 중복 호출 가능
- ERP/DB가 멱등(idempotent)인지 확인 후 적용 권장

### 4.3 프로시저 시그니처 검증

**파일**: `StoredProcedureServiceImpl.updateMappingInfo` (L251)  
**DB 프로시저**: `UpdateMappingInfo`

- Java 8개 파라미터 vs DB 7개 파라미터(tenant_id 미포함) 불일치 시 예외 가능.
- 운영 DB에 배포된 `UpdateMappingInfo` 시그니처 확인:
  ```sql
  SHOW CREATE PROCEDURE UpdateMappingInfo;
  ```
- 불일치 시 DB 프로시저를 Java 시그니처에 맞게 수정하거나, Java 호출부에서 `tenant_id` 전달 여부를 통일 필요.

---

## 5. 체크리스트 (수정 후 검증)

- [ ] confirm-payment 4인자 실행 시  
  - 로그에 `🔄 입금 확인(confirm-payment) 완료, ERP 매핑 정보 동기화 프로시저 호출` 출력
  - `UpdateMappingInfo` 예외 없이 호출됨
- [ ] confirm-deposit 실행 시 기존과 동일하게 프로시저 호출
- [ ] MappingPaymentModal → confirm-payment → 프로시저 호출 확인
- [ ] 서버 로그에 `✅ ERP 매핑 정보 동기화 완료` 출력
- [ ] DB `mapping_change_history` 또는 `mapping_update_logs`에 기록 생성 확인(프로시저 설계에 따라)

---

## 6. 참조

- `docs/standards/ERP_TROUBLESHOOTING.md` — ERP 트러블슈팅 절차
- `.cursor/skills/core-solution-erp/SKILL.md` — confirm-payment vs confirm-deposit
- `AdminServiceImpl.confirmDeposit` (L1037~1111) — 프로시저 호출 참조 구현
