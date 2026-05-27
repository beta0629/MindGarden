# PHASE 5 PR #39 회귀 검수 보고서 — 비의료 3년 cutoff + 정규식 PII 1단계

> **검수일**: 2026-05-28
> **검수자**: core-tester subagent
> **PR**: [#39 feature/lifecycle-phase5-cutoff-pii-regex](https://github.com/beta0629/MindGarden/pull/39) (base = `develop`)
> **commit**: `d1e092313` · 17 files · +1499 / -151
> **planner**: v1.2 (planner agent `785d2439`) · **coder**: Phase 5 coder agent `f4376ab4`

---

## 1. 결론 — **PASS** (운영 반영 가능, 단 정책서 사전 머지 권고)

- **게이트 5/5 PASS** (mvn 88/88, i18n PASS, codemod PASS, hardcode errors=0, frontend Jest N/A)
- **T1~T8 8/8 PASS** (T5 만 단위 테스트로 cutoff 분기 검증 — H2 통합 테스트는 후속 Phase 권고: MEDIUM)
- **회귀 매트릭스 7/7 PASS** (R3 Phase 2-β 충돌 시뮬레이션 결과 — PR #39 변경 파일과 Phase 2-β 변경 파일 교집합 0건. 시뮬레이션 시 발견된 `User.java` 충돌은 PR #29 vs Phase 2-β 사이의 사전(pre-existing) 충돌이며 PR #39 책임 외)
- **HIGH 발견 0건**, MEDIUM 2건, LOW 5건 — 모두 운영 반영 가능 범위

---

## 2. 게이트 5종 결과

| # | 게이트 | 결과 | 상세 (raw) |
|---|------|------|------|
| 1 | `mvn test -Dtest='PersonalDataDestructionService*Test,*PiiScrubber*Test,*LifecycleCutoff*Test,*BusinessMode*Test,UserAnonymizationService*Test,*PersonalDataDestruction*IntegrationTest'` | ✅ PASS | `Tests run: 88, Failures: 0, Errors: 0, Skipped: 0` · `BUILD SUCCESS` · 7.6s |
| 2 | frontend Jest | ⚪ N/A | PR #39 frontend 변경 0건 |
| 3 | `npm run check:i18n-seed` | ✅ PASS | `PASS — 15 파일 시드 정상 (자기참조 0 / 빈값 0)` |
| 4 | `npm run lint:codemod-mappings` | ✅ PASS | `결과: PASS (가드 1·2 모두 통과 — codemod 진입 안전)` |
| 5 | `bash config/shell-scripts/check-hardcode.sh` | ✅ PASS (errors=0) | warnings=5657 (전 코드베이스 누적 한글 로그·DTO 메시지 — PR #39 신규 분 0 error 기여), errors=0 |

### 게이트 1 — 테스트 클래스별 분해

| 테스트 클래스 | 카운트 | 결과 |
|---|---|---|
| `RegexBasedPiiScrubberTest` (EmailPattern, FinancialPattern, MixedText, PhonePattern, ResidentRegistrationNumberPattern, StrategyContract, UrlPattern) | 25 | ✅ all PASS |
| `PiiScrubberTest` (legacy 4→7 확장) | 21 | ✅ all PASS |
| `LifecycleCutoffPropertiesTest` (EffectiveConsultationRecordsYears 포함) | 5 | ✅ all PASS |
| `PiiScrubberPropertiesTest` | 6 | ✅ all PASS |
| `UserAnonymizationServiceImplTest` (Phase 2-α 회귀) | 21 | ✅ all PASS |
| `PersonalDataDestructionServiceCutoffTest` (ConsultationRecordsCutoff 포함) | 8 | ✅ all PASS |
| `PersonalDataDestructionServiceTest` | 2 | ✅ all PASS |
| **합계** | **88** | **✅ 0 fail / 0 error / 0 skip** |

---

## 3. T1~T8 시나리오 매트릭스

| # | 시나리오 | 결과 | 근거 |
|---|---|---|---|
| T1 | `BusinessMode.NON_MEDICAL` 기본값 | ✅ PASS | `LifecycleCutoffProperties#businessMode = BusinessMode.NON_MEDICAL` (line 38) · `application.yml#mindgarden.lifecycle.cutoff.business-mode: NON_MEDICAL` (line 193) · `LifecycleCutoffPropertiesTest#defaultBusinessModeIsNonMedical` PASS · `ConsultationManagementApplication` `@EnableConfigurationProperties` 등록 (line 66) |
| T2 | cutoff 분기 (NON_MEDICAL 3년 / MEDICAL 10년) | ✅ PASS | `getEffectiveConsultationRecordsYears()` 분기 · `LifecycleCutoffPropertiesTest#EffectiveConsultationRecordsYears` (NON_MEDICAL→3, MEDICAL→10) PASS · `PersonalDataDestructionServiceCutoffTest#nonMedicalUses3YearCutoff` / `medicalUses10YearCutoff` (ArgumentCaptor 로 LocalDateTime cutoff 검증) PASS |
| T3 | payments 5년 고정 | ✅ PASS | `LifecycleCutoffProperties#paymentsYears = 5` · 비즈니스 모드와 독립 (분기 없음) · `PersonalDataDestructionServiceCutoffTest#paymentsUses5YearCutoff` PASS · 정책 근거: 전자상거래법 §6 + 국세기본법 §85의3 + 전금법 §22 |
| T4 | audit_logs / consent_logs (3년) | ✅ PASS (config layer) · ⚠️ MEDIUM (실행 핸들러 미구현) | `LifecycleCutoffProperties#auditLogsYears=3 / consentLogsYears=3` · `LifecycleDataCategory.AUDIT_LOGS / CONSENT_LOGS` enum 정의 · `getRetentionYears(LifecycleDataCategory)` 분기 매핑 · `LifecycleCutoffPropertiesTest#getRetentionYearsCoversAllCategories` PASS. **단**, `PersonalDataDestructionService.destroyExpiredPersonalData()` 가 AUDIT_LOGS / CONSENT_LOGS 카테고리에 대한 destruction 핸들러를 호출하지 않음 (config·enum 인프라만 준비). v1.2 §11 Phase 5+ 후속 작업 분리 — 의도된 scope split 으로 판단하나 MEDIUM 명시 |
| T5 | `PersonalDataDestructionService` cutoff 적용 (H2 통합 테스트) | ✅ PASS (cutoff 분기) · ⚠️ MEDIUM (H2 통합 부재) | `PersonalDataDestructionServiceCutoffTest` 가 모든 5종 destroy*() 메서드 (USER_DATA, CONSULTATION, PAYMENT, SALARY, ACCESS_LOGS) 에 대해 Mockito ArgumentCaptor 로 `LocalDateTime.now().minusYears(N)` 정합 검증. **단**, H2 `@SpringBootTest` 통합 테스트 부재. 현행 service 구현은 `destroyExpiredAccessLogs()` 만 실제 `deleteByTenantIdAndAccessTimeBefore()` 호출하며, 나머지는 destruction 로그 stamp + 카운트만 수행 (실제 row delete 미구현 — pre-existing). 통합 테스트 의미가 제한적 |
| T6 | `PiiScrubberStrategy` interface + DI | ✅ PASS | `PiiScrubberStrategy` 인터페이스 정의 (`scrub`, `getActivePatterns`, `getStrategyName`) · `RegexBasedPiiScrubber implements PiiScrubberStrategy` + `@Component` 등록 · 생성자 주입으로 `PiiScrubberProperties` DI · `RegexBasedPiiScrubberTest$StrategyContract` (`strategyNameIsRegex`, `defaultEnabledPatternsAreAllSeven` 등) PASS |
| T7 | 정규식 7종 + edge case | ✅ PASS | EMAIL / PHONE / RRN / ARN / CARD / BANK / URL 7종 모두 `[REDACTED_<TYPE>]` 라벨 치환. Edge case: 휴대폰 하이픈/하이픈없음/서울 02/지방 031 PASS · RRN 하이픈/하이픈없음 PASS · ARN(성별식별자 5~8) PASS · ISO date 미오탐 PASS · Card 16 digit 하이픈/공백 PASS · Bank 3-2-6 PASS · 13자리 RRN 우선 매칭 (Card 오탐 회피) PASS · URL https PASS · 혼합 텍스트 동시 마스킹 PASS |
| T8 | 기존 정적 `PiiScrubber` 4→7종 확장 호환 | ✅ PASS (vacuously) | 기존 4종 메서드 (`scrubPhone/Rrn/Email/Card/All`) 시그니처 보존. 신규 3종 (`scrubArn/Bank/Url`) 추가 (additive). `scrubAll()` 7종 호출로 확장 — 시그니처 동일. **호출부 회귀**: `src/main` 내 `com.coresolution.consultation.util.PiiScrubber` import 0건 (현 시점 prod 호출부 미존재) → breaking 없음. `PiiScrubberTest` 21건 PASS |

---

## 4. 회귀 매트릭스 (R1~R7)

| # | 영역 | 결과 | 근거 |
|---|---|---|---|
| R1 | 옵션 B (PR #34, develop 정착) 호환 | ✅ PASS | PR #39 변경 파일 17건 중 `ScheduleServiceImpl.java` / `AdminServiceImpl.java` 0건. 시그니처 변경 0. mvn 통합 빌드 SUCCESS (PR #29 + #34 컴포넌트 포함) |
| R2 | Phase 1+2-α (PR #29) 호환 | ✅ PASS | `UserLifecycleService` / `UserAnonymizationService` PR #39 변경 0. `UserAnonymizationServiceImplTest` 21건 PASS (회귀 0) |
| R3 | Phase 2-β (PR #35) 충돌 시뮬레이션 (`git merge --no-commit origin/feature/lifecycle-phase2-beta-admin-delete`) | ✅ PASS | **PR #39 변경 파일 17건 ∩ Phase 2-β 변경 파일 27건 = 0건** (집합 교차 검증). 시뮬레이션 시 `User.java` 충돌 발생했으나 PR #39 는 `User.java` 미변경 → 충돌은 PR #29 (Phase 1+2-α `1102012e5`) vs Phase 2-β 사이의 사전 충돌이며 PR #39 책임 외. PR #39 와 Phase 2-β 는 정합 머지 가능 |
| R4 | 자발 탈퇴 마이페이지 (PR #33) 호환 | ✅ PASS | `User.withdrawalOptionsJson` / `WithdrawalGracePeriodScheduler` / `UserWithdrawalController` PR #39 변경 0. 시그니처 보존 |
| R5 | tenantId 격리 | ✅ PASS | `PersonalDataDestructionService` 모든 destroy*() 메서드가 `resolveTenantIdForDestruction()` → `repository.find/delete*ByTenantId(tenantId.get(), cutoffDate)` 패턴. `destroyExpiredPersonalData()` 스케줄러 진입점은 `TenantService.getAllActiveTenantIds()` 순회 + `TenantContextHolder.setTenantId/clear()` finally 보장. 신규 cutoff 분기 (NON_MEDICAL/MEDICAL) 도 tenantId 격리 유지 |
| R6 | 운영 yml `application-prod.yml` 정합 | ✅ PASS | `application-prod.yml` 에 `mindgarden.lifecycle.cutoff.*` / `mindgarden.lifecycle.pii-scrubber.*` 오버라이드 0건. Spring relaxed-binding 으로 `application.yml` default (NON_MEDICAL / `v1.2-2026-05-28` / regex / 7 patterns) 가 prod 에도 적용. `LifecycleCutoffProperties#businessMode` Java 필드 default = `BusinessMode.NON_MEDICAL` 로 yml 미설정 시에도 안전 |
| R7 | NotificationService / AuditLog 기존 PiiScrubber 호출 호환 | ✅ PASS (vacuously) | `src/main` 전체에서 `com.coresolution.consultation.util.PiiScrubber` import 0건 (현 시점 prod 호출부 미존재). 4종 static 시그니처 보존 + 3종 additive 신규 + `scrubAll()` 4→7 확장 — breaking 0. 향후 신규 통합 시 `RegexBasedPiiScrubber` Strategy DI 권고 |

---

## 5. 정책서 §10 §11 매트릭스 정합

### 5-1. 정책서 v1.2 위치
- `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` v1.2 (commit `f79e974c6`) — **`docs/user-lifecycle-termination-policy` 브랜치에 격리** (develop 미머지). **LOW** — PR #39 머지 전 정책서 사전 머지 필요.

### 5-2. §10 사용자 결재 변수 default 정합

| 결재 항목 | 정책서 §0.1 v1.2 default | PR #39 구현 | 결과 |
|---|---|---|---|
| Q9 휴면 일수 | 1년 DORMANT + 4년 anonymize (총 5년) | `userDataYears=1` (탈퇴 1년) · Phase 1+2-α 의 `WithdrawalGracePeriodScheduler` 와 협업 (PR #39 외) | ✅ 정합 |
| Q10 consultation_records | NON_MEDICAL 3년 (default) / MEDICAL 10년 (의료법 §22) | `BusinessMode.NON_MEDICAL` default · `consultationRecordsYears=3` · `medicalConsultationRecordsYears=10` · `getEffectiveConsultationRecordsYears()` 분기 | ✅ 정합 |
| Q11 PII 스크러빙 1단계 | 정규식 (즉시 도입) — 7종 (email, phone, RRN, ARN, card, bank, URL) | `PiiPatternType` 7 enum (EMAIL/PHONE/RRN/ARN/CARD/BANK/URL) · `PiiScrubberProperties#enabledPatterns="email,phone,rrn,arn,card,bank,url"` default · `RegexBasedPiiScrubber` 7 정규식 컴파일 · `PiiScrubberStrategy` 후속 확장 (BERT/GPT) 인터페이스 정착 | ✅ 정합 |

### 5-3. §11 법령 매트릭스 정합

| 카테고리 | 정책서 §11 근거 | 정책서 default | PR #39 default | 결과 |
|---|---|---|---|---|
| `consultation_records` (NON_MEDICAL) | 학회 윤리강령 + 동의서 명시 | 3년 | 3년 (`consultationRecordsYears`) | ✅ |
| `consultation_records` (MEDICAL) | 의료법 §22 | 10년 | 10년 (`medicalConsultationRecordsYears`) | ✅ |
| `payments` | 전자상거래법 §6 + 국세기본법 §85의3 + 전금법 §22 | 5년 | 5년 (`paymentsYears`) | ✅ |
| `audit_logs` | 개인정보보호법 §29 + 정보보호 표준 | 3년 ~ 5년 | 3년 (`auditLogsYears`) | ✅ (하한) |
| `consent_logs` | 개인정보보호법 §22 (개인정보보호위 가이드) | 3년 | 3년 (`consentLogsYears`) | ✅ |
| `users` (탈퇴) | 사업자 자율 정책 + 동의서 명시 | 1년 | 1년 (`userDataYears`) | ✅ |
| `salary_calculations` | 세법 5년 권장 (지급 후) | 3년 ~ 5년 | 3년 (`salaryDataYears`) | ✅ (하한) |
| `personal_data_access_logs` | `SECURITY_POLICY.md:228` | 1년 | 1년 (`accessLogsYears`) | ✅ |

### 5-4. 정책 버전 stamp 추적성
- `LifecycleCutoffProperties#policyVersion = "v1.2-2026-05-28"` default
- `PersonalDataDestructionService.buildDestructionMetadata()` 가 destruction 로그 `metadata` JSON 에 `policyVersion`, `businessMode`, `category`, `retentionYears` 4종 stamp
- `PersonalDataDestructionServiceCutoffTest#destructionLogStampsMetadata` / `medicalDestructionLogStamps10Years` 검증 PASS
- ✅ 정책 변경 시 destruction 로그 시점별 추적 가능

---

## 6. HIGH · MEDIUM · LOW 발견 목록

### HIGH — 0건

### MEDIUM — 2건

**M1. H2 통합 테스트 부재 (T5 부분 충족)**
- 현황: `PersonalDataDestructionServiceCutoffTest` 는 Mockito 단위 테스트로 cutoff 분기와 metadata stamp 만 검증. `@SpringBootTest` + H2 in-memory DB 기반 실제 `deleteByTenantIdAndAccessTimeBefore` 행 삭제 검증 없음.
- 근거: 현 `PersonalDataDestructionService` 구현은 USER_DATA / CONSULTATION_RECORD / PAYMENT_DATA / SALARY_DATA 4종에 대해 **실제 row delete 가 미구현** (destruction 로그 stamp + 카운트만). 따라서 통합 테스트의 실효성은 ACCESS_LOGS 1종에 한정.
- 해소 가이드: Phase 5+ 후속 작업으로 `PersonalDataDestructionService` 4종 카테고리에 실제 `repository.deleteByIdAndTenantId()` 호출 추가 + H2 통합 테스트 동시 작성. PR #39 단독 머지에는 영향 없음 (cutoff 분기는 검증 완료).

**M2. AUDIT_LOGS / CONSENT_LOGS destruction 핸들러 미구현**
- 현황: `LifecycleCutoffProperties#auditLogsYears=3` / `consentLogsYears=3` + `LifecycleDataCategory.AUDIT_LOGS / CONSENT_LOGS` enum + `getRetentionYears()` 분기는 정착. 단 `destroyExpiredPersonalData()` 가 `destroyExpiredAuditLogs()` / `destroyExpiredConsentLogs()` 메서드를 호출하지 않음 (메서드 자체 미존재).
- 근거: PR #39 task 명세 0-2 ("audit_logs 3년, consent_logs 3년")는 정책 default 정의 요구이며, destruction 실행 로직은 v1.2 §11 Phase 5+ 로 분리됨. config / enum / 매트릭스 인프라만 PR #39 에서 정착 — 의도된 scope split 으로 판단.
- 해소 가이드: Phase 5.x 후속 PR 에서 `AuditLogRepository.deleteByTenantIdAndCreatedAtBefore()` + `ConsentLogRepository.deleteByTenantIdAndCreatedAtBefore()` 추가 + destroy 핸들러 2개 메서드 추가 + `destroyExpiredPersonalData()` 에 호출 등록. policy 추적성은 이미 metadata stamp 로 정착되어 있어 신규 핸들러도 정합 적용 가능.

### LOW — 5건

**L1. 정책서 v1.2 develop 미머지**
- `docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` v1.2 (commit `f79e974c6`, 886 lines) 가 `docs/user-lifecycle-termination-policy` 브랜치에 격리. PR #39 의 default 안 (NON_MEDICAL 3년 + 정규식 7종) 의 근거 문서.
- 권고: PR #39 머지 직전 또는 직후 `docs/user-lifecycle-termination-policy` 브랜치 develop 머지 (정책 SSOT 정착). 별도 PR 권장.

**L2. 정책서 §0.1 vs §10.1 결정 채택 표 내부 정합 GAP**
- 정책서 v1.2 §0.1 Q10 (line 35): "비의료 default 3년 / 의료기관 10년 / 사용자 결재 필수 변수"
- 정책서 v1.2 §10.1 결정 채택 표 (line 687): "**10년** (의료법 §22) — 현행 5년 cutoff 갱신 + 법무 stamp"
- 표면적 모순. PR #39 코드는 §0.1 (v1.2 갱신) 해석을 따르며 정합. 정책서 §10.1 표가 v1.2 변경 사항을 반영 못한 것으로 추정.
- 권고: 정책서 §10.1 Q10 행을 "NON_MEDICAL 3년 / MEDICAL 10년 (BusinessMode 분기)" 로 갱신. PR #39 검수 외 범위.

**L3. PHONE 정규식 — 국제번호 / 080 미커버**
- `RegexBasedPiiScrubber` PHONE 패턴: `(?<![0-9])(?:01[016789]|0(?:2|[3-6][1-5])|070|050\d?)-?\d{3,4}-?\d{4}(?![0-9])`
- 커버: 010/011/016/017/018/019 휴대폰, 02 서울, 031~065 지방, 070 인터넷전화, 050 통합번호
- 미커버: +82 국제번호 prefix, 080 무료수신
- task 명세 ("한국 휴대폰 010 / 011 구형") 는 충족. 향후 BERT tier (Phase 5.1) 또는 정규식 확장 권고

**L4. EMAIL 정규식 — 한글 IDN 미매칭**
- `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b` — 도메인 부분이 ASCII 만 매칭
- punycode 형태 (`xn--...`) 는 매칭. 원본 한글 도메인 (`user@한국.kr`) 은 미매칭 (false negative)
- task 명세 ("이메일 i18n 도메인 포함") 는 punycode 통한 커버로 부분 충족. 후속 BERT tier 권고

**L5. 정적 PiiScrubber 호출부 prod 미존재 (T8 vacuously PASS)**
- `src/main` 전체에서 `com.coresolution.consultation.util.PiiScrubber` import 0건 (테스트 클래스만 사용)
- 4종 → 7종 확장이 회귀 위험 0인 이유. 신규 호출부는 직접 `RegexBasedPiiScrubber` Strategy DI 권장
- 권고: legacy 정적 유틸 deprecation 표기 또는 추후 제거 검토

---

## 7. 운영 반영 권고

### 7-1. 릴리스 전략 — **Phase 3+4 묶음 머지 권고**

PR #39 단독 머지도 안전하나, 다음 이유로 Phase 3+4 와 묶음 릴리스 권고:

1. **정책서 사전 머지 필수 (L1)** — `docs/user-lifecycle-termination-policy` 브랜치 (`f79e974c6`) 의 v1.2 문서가 develop 에 없으므로, PR #39 머지만으로는 cutoff/PII 정책 변경의 SSOT 가 코드와 분리됨. 정책서 PR + Phase 3 (DORMANT/ANONYMIZE cron) + Phase 4 (community Q12) + Phase 5 (PR #39) 를 4PR 동시 머지로 묶어 추적성 확보.
2. **Phase 2-β (PR #35) 충돌 회피** — PR #39 와 Phase 2-β 는 정합 (R3 PASS) 이지만, develop 머지 순서를 Phase 2-β → Phase 5 (PR #39) 로 권장 (Phase 2-β 가 `User.java` 변경, PR #39 는 미변경 — Phase 2-β 가 먼저 들어가도 무차질).
3. **MEDIUM M2 (AUDIT/CONSENT destruction) 후속 PR 정착** — Phase 5+ 후속에서 destruction 핸들러 2개 추가 시 PR #39 의 cutoff/enum/매트릭스 인프라가 그대로 활용됨. PR #39 머지가 빠를수록 후속 작업 진행 원활.

### 7-2. 운영 사전 점검 (PR #39 머지 후 1일 내)
- [ ] `application-prod.yml` 에 `mindgarden.lifecycle.cutoff.business-mode` 명시 설정 검토 (default 의존 회피, 명시적 audit trail 확보)
- [ ] 운영 destruction 스케줄러 첫 실행 시 (`매일 03:00 cron`) destruction 로그 metadata `policyVersion=v1.2-2026-05-28` / `businessMode=NON_MEDICAL` stamp 확인
- [ ] 운영 환경에서 PiiScrubberProperties `enabled-patterns` 가 7종 모두 활성인지 확인 (운영 보안팀 결재 후 변경 가능 — 환경 변수 오버라이드 권고)

### 7-3. 후속 작업 큐
- **Phase 5.0+ (즉시)** — 정책서 v1.2 develop 머지 (L1 해소)
- **Phase 5.0+ (즉시)** — 정책서 §10.1 Q10 행 갱신 (L2 해소, 문서 정합)
- **Phase 5.1** — AUDIT_LOGS / CONSENT_LOGS destruction 핸들러 구현 + H2 통합 테스트 (M1 + M2 동시 해소)
- **Phase 5.2** — KcBERT (alphagyuu/Korean-PII-Masking-BERT) `PiiScrubberStrategy` 구현체 추가 (L3 + L4 해소, 인터페이스는 정착됨)
- **Phase 5.3** — KLUE NER 23 카테고리 (ehd0309/ko-pii-public-v1) 확장
- **Phase 5.4** — GPT-4o `PiiScrubberStrategy` 옵션 (PIPA §17 검토 후)

---

## 8. 검수 메타

| 항목 | 값 |
|---|---|
| 검수 시작 | 2026-05-28 03:53 KST |
| 검수 완료 | 2026-05-28 04:00 KST |
| 검수 모드 | 읽기 전용 (코드 수정 0) |
| mvn raw log | `/tmp/pr39_mvn_full.log` (345 lines, BUILD SUCCESS) |
| 검수 도구 | mvn surefire, ripgrep, git merge --no-commit (abort), check-hardcode.sh, check:i18n-seed, lint:codemod-mappings |
| 정책서 참조 | `f79e974c6:docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md` (886 lines, v1.2) |
| Phase 2-β 참조 | `origin/feature/lifecycle-phase2-beta-admin-delete` (6f3f2b4e3) |
| 검수자 | core-tester subagent (parent: lifecycle main orchestrator) |
