# 테넌트 PK 격리 작업 핸드오프 (2026-03-30)

## 1. 목적

HTTP 요청·배치 등에서 **PK(`findById`)만으로 엔티티를 로드**하면, 다른 테넌트의 유효한 ID로 데이터가 노출되거나 수정될 수 있다.  
본 작업은 **`tenantId`와 PK를 함께 쓰는 조회**(`findByTenantIdAndId` 등)로 치환하고, 레포지터리·서비스 계층을 정리한 것이다.

### 공통 원칙

- `BaseRepository` 상속 레포: `findByTenantIdAndId(tenantId, id)` (JPQL에 `isDeleted = false` 포함되는 경우가 많음).
- `BaseEntity`가 아닌 엔티티: 해당 `*Repository`에 `@Query`로 `findByTenantIdAndId` 추가.
- 테넌트 컨텍스트: `TenantContextHolder.getRequiredTenantId()` 또는 메서드 인자로 이미 검증된 `tenantId`.
- 복구·삭제된 행 조회: `findByTenantIdAndId`만으로 부족하면 **`EntityManager` JPQL** 또는 `findByTenantIdAndIdIgnoringDeleted` 패턴(이미 `UserRepository` 등에 존재).

### 참고 스킬·문서

- `.cursor/skills/core-solution-multi-tenant/SKILL.md`
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` (검증 시 `core-tester` 게이트)
- 구현은 원칙상 **`core-coder`** 위임.

---

## 2. 완료한 배치 요약 (서비스·레포 중심)

| 배치 | 주요 변경 |
|------|-----------|
| 1 | `AdminServiceImpl`, `ConsultantClientMappingRepository` → `BaseRepository`, `FinancialTransactionRepository.findByTenantIdAndId`, 관련 테스트 |
| 2 | `UserServiceImpl`, `UserRepository`(tenant+버전·삭제무시 조회), `BaseRepository` 소프트삭제 `@Modifying` |
| 3 | `FinancialTransactionServiceImpl`, `SalaryCalculationRepository`·`PurchaseRequestRepository` → `BaseRepository` |
| 4 | `ScheduleServiceImpl`(스케줄·사용자·지점·매핑) |
| 5 | `UserProfileServiceImpl`, `MultiTenantUserServiceImpl` |
| 6 | `DiscountAccountingServiceImpl`, `ConsultantRatingServiceImpl`, `BranchStatisticsServiceImpl`, `ConsultantRatingRepository` → `BaseRepository` |
| 7 | `ConsultantServiceImpl`, `ClientServiceImpl`, `ConsultationMessageServiceImpl` |
| 8 | `ConsultationServiceImpl`, `BranchServiceImpl`, `SessionExtensionServiceImpl`, `NoteRepository`, `SessionExtensionRequestRepository` |
| 9 | `AmountManagementServiceImpl`, `SessionSyncServiceImpl`, `MyPageServiceImpl` |
| 10 | `SystemNotificationServiceImpl`, `AlertServiceImpl`, `UserAddressRepository` → `BaseRepository`, `UserAddressServiceImpl` |
| 11 | `CommonCodeRepository` → `BaseRepository`, `TenantCommonCodeServiceImpl`, `PersonalDataRequestServiceImpl`, `SalaryManagementServiceImpl`, `ConsultantSalaryProfileRepository` |
| 12 | `AccountRepository.findByTenantIdAndId`, `AccountServiceImpl`, `LedgerServiceImpl`, `AccountingServiceImpl`, `UserPasskeyRepository`, `PasskeyServiceImpl` |
| 13 | `PaymentServiceImpl`, `SettlementRepository`·`SettlementServiceImpl`, `ConsultantStatsServiceImpl`, `ConsultantDashboardServiceImpl`, `PredictionServiceImpl` |

**브랜치**: 작업 시점 기준 `develop`에 위 순서로 커밋·푸시됨.

---

## 3. 알려진 동작 변화 (회귀 시 확인)

- `findByTenantIdAndId`는 **삭제되지 않은(`isDeleted = false`)** 행만 반환하는 경우가 많다. 예전 `findById`로 삭제 행까지 보던 API는 **404/없음**에 가까워질 수 있음.
- `tenant_id`가 비어 있는 레거시 행(예: 일부 회기 연장 요청)은 테넌트 조회에 안 잡힐 수 있음 → **데이터 백필·마이그레이션** 검토.
- `TenantCommonCodeServiceImpl`: 코어 공통코드(`tenantId == null`)와의 관계는 `findByTenantIdAndId` 도입 후 **분기·에러 메시지가 달라질 수 있음**.

---

## 4. 남은 대상 (다음날 진행용)

### 4.1 `consultation/service/impl` (grep 기준, 2026-03-30)

아래는 **`\.findById\(`** 패턴이 **아직 남은 파일**이다. (줄 번호는 리팩터링으로 변동 가능)

| 파일 | 비고 |
|------|------|
| `CommonCodeServiceImpl.java` | `commonCodeRepository.findById`, `userRepository.findById` — 글로벌/테넌트 코드 경로 구분 주의 |
| `ErpServiceImpl.java` | `userService.findById` — 이미 `UserService`는 테넌트 필수; 호출 맥락·테스트 확인 |
| `ConsultationRecordServiceImpl.java` | `consultationRepository.findById` |
| `CounselorTrainingServiceImpl.java` | `sessionRepository.findById` — `VirtualClientSession` 레포·tenant 컬럼 확인 후 `@Query` 또는 서비스 분기 |
| `AbstractOAuth2Service.java` | `userRepository.findById` — OAuth 콜백 시 **테넌트 컨텍스트 없음** 가능 → 설계 검토 필수 |
| `SpeechToTextServiceImpl.java` | `audioFileRepository.findById` — `ConsultationAudioFileRepository`가 `JpaRepository` |
| `RiskDetectionServiceImpl.java` | `audioFileRepository.findById` |
| `StatisticsServiceImpl.java` | `ConsultantPerformanceRepository.findById`(복합키), `userRepository`, `performanceAlertRepository`, 스케줄 관련 사용자 로드 |
| `ConsultantAvailabilityServiceImpl.java` | `availabilityRepository`, `userRepository` |
| `RealTimeStatisticsServiceImpl.java` | `userRepository`, `consultantPerformanceRepository.findById` |
| `AccountIntegrationServiceImpl.java` | `userRepository.findById` |
| `SecurityAlertServiceImpl.java` | `userRepository.findById` |
| `StatisticsTestDataServiceImpl.java` | `userRepository`, `scheduleRepository` — 테스트 데이터 전용이어도 격리 정책 통일 여부 결정 |
| `RecurringExpenseServiceImpl.java` | `recurringExpenseRepository` — `JpaRepository` |
| `ReserveFundServiceImpl.java` | `reserveFundRepository` — `JpaRepository` |

### 4.2 `consultation/controller`

`findById` 사용이 **다수 파일**에 남아 있음. 서비스로 위임된 조회인지, 컨트롤러에서 직접 레포를 호출하는지 인벤토리 후 제거 또는 서비스 API로 통일.

### 4.3 `core` 패키지 (예시)

`OnboardingServiceImpl`, `TenantDashboardController`, `DashboardIntegrationServiceImpl`, `AttendanceServiceImpl` 등 **`com.coresolution.core` 하위**에도 `findById` 잔존. 멀티테넌트 경계와 맞춰 별도 배치로 다루는 것이 좋다.

### 4.4 구조적 잔여

- `BaseRepository.findByIdAndVersion` 등 **tenant 조건 없는** 베이스 메서드 — 엔티티별로 `findByTenantIdAndIdAndVersion` 또는 로드 후 `tenantId` 검증.
- 전역 `src/main/java` 기준 **`\.findById\(`** 재스캔 권장:

```bash
rg '\.findById\(' src/main/java --glob '*.java' -c
```

---

## 5. 제안: 배치 14 (병렬 3갈래 예시)

충돌을 피하려면 **파일 단위로 겹치지 않게** 나눈다.

1. **스프링 AI/음성**: `SpeechToTextServiceImpl` + `RiskDetectionServiceImpl` + `ConsultationAudioFileRepository`(쿼리 추가) — 레포는 한 에이전트에서만 수정.
2. **가용성·통계 일부**: `ConsultantAvailabilityServiceImpl` + `ConsultantAvailabilityRepository` 확인.
3. **ERP·레코드**: `ConsultationRecordServiceImpl` + (필요 시) 소규모 레포.

`AbstractOAuth2Service`는 **컨텍스트 부재** 이슈가 있어 단독 설계·리뷰 권장.

---

## 6. 검증 체크리스트 (재개 시)

- [ ] `mvn -q -DskipTests compile test-compile`
- [ ] 변경 서비스 단위 테스트·통합 테스트(환경 허용 시)
- [ ] `core-tester` 또는 CI에서 회귀
- [ ] 남은 `findById` grep으로 감소 확인

---

## 7. 문서 이력

| 일자 | 내용 |
|------|------|
| 2026-03-30 | 배치 1~13 완료 요약 및 잔여 인벤토리 초안 작성 |

이후 배치 완료 시 **본 문서의 §4·§5를 갱신**하거나 동계열 문서를 분리해 두어도 된다.
