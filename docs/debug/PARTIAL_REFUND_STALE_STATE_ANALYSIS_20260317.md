# 부분 환불 StaleStateException 원인 분석

**작성일**: 2026-03-17  
**분석자**: core-debugger  
**관련**: 개발 서버(beta0629.cafe24.com) error.log, 매칭 부분 환불 처리

---

## 1. 증상 요약

| 항목 | 내용 |
|------|------|
| **발생 위치** | `AdminController.partialRefundMapping` → `AdminServiceImpl.partialRefundMapping` |
| **예외** | `org.hibernate.StaleStateException: Batch update returned unexpected row count from update [0]; actual row count: 0; expected: 1` |
| **SQL** | `update consultant_client_mappings set ... where id=? and version=?` |
| **의미** | 동일 트랜잭션에서 조회한 엔티티의 `version`과 DB 행의 `version`이 달라, UPDATE 시 0건 반영됨 → **낙관적 락(Optimistic Lock) version 불일치** |

---

## 2. 원인 분석

### 2.1 추적 경로

- **Controller**: `AdminController.partialRefundMapping(Long id, Map body)`  
  - `adminService.partialRefundMapping(id, refundSessions, reason)` 호출
- **Service**: `AdminServiceImpl.partialRefundMapping(Long id, int refundSessions, String reason)`  
  - `@Transactional(rollbackFor = Exception.class)` 단일 트랜잭션(T1) 내에서:
    1. `mapping = mappingRepository.findById(id)` 로 매핑 조회 (이 시점 version = V0)
    2. `runInNewTransaction(..., sendRefundToErp(...))` → **별도 트랜잭션 T2**
    3. `runInNewTransaction(..., createPartialConsultationRefundTransaction(...))` → **별도 트랜잭션 T3**
    4. T1에서 `mapping` 필드 수정 후 `mappingRepository.save(mapping)` 호출

### 2.2 근본 원인 (version 불일치)

- **BaseEntity** (`BaseEntity.java`)에 `@Version` 필드가 있어 `consultant_client_mappings` UPDATE 시 `WHERE id=? AND version=?` 조건이 사용됨.
- **T3** 안에서 `createPartialConsultationRefundTransaction`이 다음을 수행함:
  - `amountManagementService.checkAmountConsistency(mapping.getId())` → 매핑 조회만 (저장 없음)
  - `financialTransactionService.createTransaction(...)` → 거래만 생성
  - **`amountManagementService.recordAmountChange(mapping.getId(), ...)`** 호출
- **`AmountManagementServiceImpl.recordAmountChange`** (라인 172~195):
  - `mappingRepository.findById(mappingId)` 로 **동일 매핑을 T3에서 새로 조회**
  - `mapping.setNotes(updatedNotes)`, `mapping.setUpdatedAt(...)` 후 **`mappingRepository.save(mapping)`** 실행
  - T3 커밋 시 DB의 해당 행이 갱신되며 **version이 V0 → V1로 증가**
- T1으로 복귀 후:
  - T1이 갖고 있는 `mapping` 인스턴스는 **여전히 version = V0** (한 번도 재조회하지 않음)
  - `mappingRepository.save(mapping)` 시 `UPDATE ... WHERE id=? AND version=V0` 실행
  - DB에는 이미 `version=V1`이므로 **0건 업데이트** → `StaleStateException` 발생

즉, **같은 매핑 행을 부모 트랜잭션(T1)과 자식 트랜잭션(T3) 양쪽에서 수정**하고, T3에서 먼저 저장해 version이 올라간 뒤, T1에서 예전 version으로 저장을 시도하는 것이 근본 원인이다.

### 2.3 정리

| 구분 | 설명 |
|------|------|
| **직접 원인** | `partialRefundMapping` 내부의 `createPartialConsultationRefundTransaction`이 **REQUIRES_NEW** 트랜잭션에서 `recordAmountChange`를 호출하고, 여기서 동일 매핑을 load 후 notes/updatedAt 수정하여 **save**함. |
| **결과** | DB의 해당 행 version만 증가하고, 부모 트랜잭션의 `mapping` 엔티티는 구 version을 유지한 채 save → 낙관적 락 위반. |
| **가설** | 부분 환불 시에만 `createPartialConsultationRefundTransaction` → `recordAmountChange` 경로가 실행되므로, **부분 환불 테스트**에서만 재현됨. |

---

## 3. 재현 절차

1. 개발/스테이징에서 관리자로 로그인한다.
2. 매칭 관리(매핑 관리) 화면에서 **결제·승인 완료된 매칭** 하나를 선택한다.
3. 해당 매칭에 대해 **부분 환불**을 요청한다.  
   - 예: 환불 회기 수 1~N, 사유 입력 후 부분 환불 실행.
4. API: `POST /api/v1/admin/mappings/{id}/partial-refund`  
   - Body: `{ "refundSessions": 1, "reason": "테스트" }`
5. 서버에서 `StaleStateException` 발생 시 error.log에 위와 같은 메시지가 남는다.
6. **동일 매핑에 대해 동시에 부분 환불을 두 번 호출**하거나, **다른 프로세스가 같은 매핑을 수정**하는 경우에도 동일 원리로 재현 가능하다.

---

## 4. 수정 제안 (core-coder용)

코드 직접 수정은 하지 않고, 적용할 파일·메서드·변경 방향만 기술한다.

### 4.1 방안 A: 부분 환불 시 매핑 저장을 한 곳으로 모음 (권장)

- **목표**: T3에서 **동일 매핑 행을 수정·저장하지 않도록** 하여, version 갱신을 T1 한 번만 하게 한다.
- **파일**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`
  - **메서드**: `partialRefundMapping`
  - **변경 방향**:
    - `createPartialConsultationRefundTransaction` 호출 시, **매핑의 notes 갱신(금액 변경 이력)을 하지 않도록** 하거나,
    - `createPartialConsultationRefundTransaction` 내부/하위에서 **`recordAmountChange(mappingId, ...)` 호출을 제거**하고,  
      금액 변경 이력은 **T1에서** `mapping.setNotes(updatedNotes)` 등으로 이미 붙이는 부분에 통합한다.  
      즉, 부분 환불에 대한 “금액 변경 이력” 문구를 T1의 `refundNote`에 포함시키거나, T1에서만 notes를 한 번만 갱신하도록 한다.
- **파일**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`
  - **메서드**: `createPartialConsultationRefundTransaction` (private)
  - **변경 방향**:
    - `amountManagementService.recordAmountChange(mapping.getId(), ...)` 호출을 **제거**하거나,
    - 부분 환불 전용 오버로드/플래그를 두어 **notes 저장(save mapping)을 하지 않는** 경로만 사용하도록 한다.

### 4.2 방안 B: T3 이후 부모에서 매핑 재조회 후 저장

- **목표**: T3에서 version이 올라가도, T1에서 **최신 매핑을 다시 조회**한 뒤 변경분을 반영하고 save한다.
- **파일**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`
  - **메서드**: `partialRefundMapping`
  - **변경 방향**:
    - `runInNewTransaction(..., createPartialConsultationRefundTransaction(...))` 실행 **이후**에,
    - `mapping = mappingRepository.findById(id).orElseThrow(...)` 로 **다시 조회**하고,
    - 이 재조회된 엔티티에 `setRemainingSessions`, `setTotalSessions`, `setNotes`, `setStatus`, `setEndDate` 등을 적용한 뒤
    - `mappingRepository.save(mapping)` 한 번만 호출한다.  
    - (기존에 T1에서 갖고 있던 `mapping`으로는 save하지 않음.)

### 4.3 방안 C: recordAmountChange에서 매핑 save 제거 또는 분리

- **목표**: `recordAmountChange`가 **같은 트랜잭션/다른 트랜잭션에서** 매핑 행을 갱신해 version을 올리지 않도록 한다.
- **파일**: `src/main/java/com/coresolution/consultation/service/impl/AmountManagementServiceImpl.java`
  - **메서드**: `recordAmountChange(Long mappingId, ...)`
  - **변경 방향 (선택 1)**:  
    - “금액 변경 이력”을 **매핑 notes가 아닌** 별도 테이블/엔티티(이력 전용)에만 기록하고, **ConsultantClientMapping 엔티티는 save하지 않는다.**
  - **변경 방향 (선택 2)**:  
    - 부분 환불처럼 **이미 부모에서 매핑을 저장할 예정인** 호출 경로에서는 `recordAmountChange`를 호출하지 않거나,  
      “notes만 추가하고 save는 호출하지 않는” 메서드(예: `appendAmountChangeNote(mappingId, ...)`)로 분리해,  
      부분 환불에서는 그 메서드만 쓰고 부모 트랜잭션에서 한 번만 save하도록 한다.

---

## 5. 체크리스트 (수정 후 확인)

- [ ] 부분 환불 API `POST /api/v1/admin/mappings/{id}/partial-refund` 호출 시 200 응답으로 완료되는지 확인.
- [ ] 해당 매핑의 `remaining_sessions`, `total_sessions`, `notes`, `status` 등이 기대대로 변경되었는지 DB 또는 조회 API로 확인.
- [ ] 부분 환불 후 `consultant_client_mappings.version`이 한 번만 증가하는지(중복 증가 없음) 확인.
- [ ] 부분 환불 완료 알림/ERP 전송/거래 생성 등 부가 로직이 기존과 같이 동작하는지 확인.
- [ ] `recordAmountChange`를 제거/변경한 경우, 다른 호출 경로(전체 환불·강제 종료 등)에서 금액 변경 이력이 여전히 필요하다면 해당 경로는 별도로 이력 기록 방식이 유지되는지 확인.

---

## 6. 참조

- **엔티티**: `ConsultantClientMapping` extends `BaseEntity` → `BaseEntity`에 `@Version` 필드 존재 (`src/main/java/com/coresolution/consultation/entity/BaseEntity.java`).
- **서비스 흐름**: `AdminServiceImpl.partialRefundMapping` (라인 2967~3111), `createPartialConsultationRefundTransaction` (라인 918~986), `runInNewTransaction` (라인 1040~1055).
- **매핑 저장 원인**: `AmountManagementServiceImpl.recordAmountChange` (라인 172~195)에서 `mappingRepository.save(mapping)` 호출.
- **스킬**: `.cursor/skills/core-solution-debug/SKILL.md`, `docs/standards/ERROR_HANDLING_STANDARD.md`.

---

**산출물**: 원인 분석·재현 절차·수정 제안·체크리스트를 담은 디버그 문서. 실제 코드 수정은 **core-coder** 서브에이전트에 위임.
