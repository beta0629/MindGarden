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

## 2. 완료한 배치 요약 (서비스·레포·컨트롤러 중심)

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
| 14 | 음성·가용성·레코드: `ConsultationAudioFileRepository`/`SpeechToTextServiceImpl`/`RiskDetectionServiceImpl`, `ConsultantAvailabilityRepository`·`ConsultantAvailabilityServiceImpl`, `ConsultationRecordServiceImpl` 등 |
| 15 | ERP 보조: `RecurringExpenseRepository`·`RecurringExpenseServiceImpl`, `ReserveFundRepository`·`ReserveFundServiceImpl`, `VirtualClientSessionRepository`·`CounselorTrainingServiceImpl` 등 |
| 16 | `SecurityAlertServiceImpl`, `AccountIntegrationServiceImpl`, `StatisticsTestDataServiceImpl` 등 |
| 17 | 통계·ERP: `RealTimeStatisticsServiceImpl`, `StatisticsServiceImpl`, `ErpServiceImpl`; `ConsultantPerformanceRepository.findByTenantIdAndConsultantIdAndPerformanceDate`, `PerformanceAlertRepository.findByTenantIdAndId` |
| 18 | `CommonCodeServiceImpl`(+ `CommonCodeRepository.findActiveCoreCodeById`), `AbstractOAuth2Service`(테넌트 우선·소셜 추론·최후 폴백), `CommonCodeServiceImplTest` |
| 19 | `consultation` 컨트롤러 다수(`Admin`·`Auth`·`Schedule`·`OAuth2`·`Consultation*`·`Discount`·`Amount`·`Erp`·`TestData`·`ClientSocial`·`Wellness` 등), `SessionBasedAuthenticationFilter`, `TenantContextFilter`, `TenantDashboardController`, `core` 온보딩·대시보드·출결·이상탐지·기능플래그·메뉴·역할·위협·지점 배정 등 |
| 20 | **backend-ops**: `OnboardingRequestRepository.findByTenantIdAndId`, `OnboardingService`/`OnboardingController`에 선택 쿼리 `tenantId`(스코프 조회); `FeatureFlagRepository`·`PricingPlanRepository`·`PricingAddonRepository`의 `findOneById` + 서비스에서 `findById` 직접 호출 제거. **메인**: `AbstractOAuth2Service`·`TenantContextFilter`·`SessionBasedAuthenticationFilter` 테넌트 힌트 순서·폴백 정리(WARN); `ConsultationService`·`ScheduleService`·`CommonCodeService` 인터페이스 JavaDoc(조회가 테넌트·코어 정책과 일치함을 명시) |
| 21 | **낙관적 락·OPS 강화**: `BaseRepository.findByTenantIdAndIdAndVersion` 추가, `findByIdAndVersion`는 Deprecated 안내; `BaseServiceImpl`·`Consultation`/`Alert`/`Branch`/`Client`/`ConsultationMessage`/`Consultant` 서비스가 테넌트+버전 조회로 통일; `UserRepository` 중복 시그니처 제거(상속). **backend-ops 온보딩**: `tenantId` 쿼리 **필수**, `repository.findById` 경로 제거(브레이킹 — OPS 클라이언트는 항상 `?tenantId=` 필요) |

**브랜치·커밋**: 배치 17~19는 커밋 `548ef8a44` 전후. 배치 20은 `faf436a8f` 전후. 배치 21은 이후 커밋·문서 갱신과 함께 푸시.  
**참고**: `application.yml` / `application-dev.yml` / `backend-ops` 내 로컬 전용 설정은 **필요 시만** 커밋하고, 로컬 diff는 별도 검토.

---

## 3. 알려진 동작 변화 (회귀 시 확인)

- `findByTenantIdAndId`는 **삭제되지 않은(`isDeleted = false`)** 행만 반환하는 경우가 많다. 예전 `findById`로 삭제 행까지 보던 API는 **404/없음**에 가까워질 수 있음.
- `tenant_id`가 비어 있는 레거시 행(예: 일부 회기 연장 요청)은 테넌트 조회에 안 잡힐 수 있음 → **데이터 백필·마이그레이션** 검토.
- `CommonCodeServiceImpl`: 코어(`tenantId == null`)와 테넌트 코드 **분기·폴백**이 강화됨. 컨텍스트 없이 테넌트 전용 ID만으로는 조회 실패할 수 있음.
- OAuth·필터(배치 20): 테넌트 힌트 수집 순서를 정리했으나, 힌트를 **전혀** 얻지 못하면 여전히 **`userRepository.findById` 폴백**이 남는다(WARN 로그).
- 배치 21: OPS 온보딩 단건·결정 API는 **`tenantId` 미전달 시 400** — 기존 콘솔/스크립트는 쿼리 파라미터 추가 필요.

---

## 4. 남은 대상 (배치 21 이후 스캔)

### 4.1 `src/main/java` — `\.findById\(` 잔여

grep 기준 **6파일**. 컨트롤러 3건은 **서비스 메서드 이름**이 `findById`인 호출이며, 인터페이스 JavaDoc으로 테넌트·코어 정책이 문서화됨(배치 20).

| 파일 | 내용 | 비고 |
|------|------|------|
| `ConsultationController.java` | `consultationService.findById(id)` | `ConsultationServiceImpl`은 컨텍스트에 `tenantId` 있을 때만 `findByTenantIdAndId` |
| `ScheduleController.java` | `scheduleService.findById(id)` | `ScheduleServiceImpl`은 `getRequiredTenantId()` + `findByTenantIdAndId` |
| `CommonCodeController.java` | `commonCodeService.findById(id)` | 테넌트·코어 분기 (`CommonCodeServiceImpl`) |
| `AbstractOAuth2Service.java` | `userRepository.findById` | **`loadUserByIdWhenTenantUnknown` 등 최후 폴백 한 경로** — 소셜·컨텍스트로 테넌트 특정 실패 시만 |
| `TenantContextFilter.java` | `userRepository.findById` | 세션/헤더/User에서 테넌트 힌트를 **모두** 얻지 못할 때만 폴백 |
| `SessionBasedAuthenticationFilter.java` | `userRepository.findById` | `TenantContextHolder`·힌트 User로도 테넌트를 못 잡을 때만 폴백 |

**`consultation/service/impl`**: 레포 **`userRepository.findById`**는 위 OAuth 폴백 외에는 grep 상 없음.

**낙관적 락(배치 21)**: 공개 서비스 메서드명은 여전히 `findByIdAndVersion`일 수 있으나, 구현은 **`findByTenantIdAndIdAndVersion`**(또는 `BaseServiceImpl`의 `ensureTenantId()` + 동일 레포 메서드)로 통일됨. 레포의 **`BaseRepository.findByIdAndVersion`**는 하위 호환·Deprecated 안내만 유지.

### 4.2 `backend-ops` 모듈

- **기능플래그·요금제·애드온**: 배치 20과 동일(`findOneById`).
- **온보딩(배치 21)**: 단건 조회·결정 API에서 **`tenantId` 필수**; 서비스는 **`findByTenantIdAndId`만** 사용(`repository.findById` 제거).

### 4.3 구조적 잔여

- 메인 앱 `BaseRepository.findByIdAndVersion` — **Deprecated**, 신규 코드는 `findByTenantIdAndIdAndVersion` 사용.
- 재스캔:

```bash
rg '\.findById\(' src/main/java --glob '*.java'
rg '\.findById\(' backend-ops/src/main/java --glob '*.java'
```

`backend-ops` 빌드는 Gradle: `cd backend-ops && ./gradlew compileJava`

---

## 5. 제안: 이후 배치

1. **폴백 관측**: OAuth·필터의 `findById` 폴백 빈도를 메트릭/알람으로 모니터링 후 제거 여부 검토.
2. **레거시 정리**: `BaseRepository.findByIdAndVersion` 호출이 외부 라이브러리·스크립트에 남아 있는지 주기적 grep.
3. **OPS 클라이언트**: 온보딩 API에 `tenantId` 쿼리를 붙이지 않은 호출부가 있으면 수정.

`AbstractOAuth2Service`는 **컨텍스트 부재** 이슈가 있어 단독 설계·리뷰 권장.

---

## 6. 검증 체크리스트 (재개 시)

- [x] `mvn -q -DskipTests compile test-compile` (메인 모듈)
- [x] `backend-ops`: `./gradlew compileJava` (배치 20 기준)
- [ ] 변경 서비스 단위 테스트·통합 테스트(환경 허용 시)
- [ ] `core-tester` 또는 CI에서 회귀
- [ ] §4.1·4.2 grep으로 잔여 확인(주기적)

---

## 7. 문서 이력

| 일자 | 내용 |
|------|------|
| 2026-03-30 | 배치 1~13 완료 요약 및 잔여 인벤토리 초안 작성 |
| 2026-03-28 | 배치 14~19 및 `develop` 푸시 반영; §4 잔여를 실제 grep 기준으로 갱신, `backend-ops` 잔여 추가 |
| 2026-03-28 | 배치 20 반영: `backend-ops` 온보딩·플래그·요금제, 메인 OAuth/필터·서비스 JavaDoc; §4·§5 재정리 |
| 2026-03-28 | 배치 21: `findByTenantIdAndIdAndVersion`·온보딩 `tenantId` 필수·`findById` 제거; §4~§7 갱신 |

이후 배치 완료 시 **본 문서의 §4·§5를 갱신**하거나 동계열 문서를 분리해 두어도 된다.
