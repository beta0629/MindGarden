# P0 매칭 흐름 핫픽스 — PR #47 회귀 검수 보고서

- **대상 PR**: #47 — `hotfix(p0): 신규 매칭 흐름 가드 강화 + CheckoutSameDayModal 진입 가드 (옵션 B 버그)`
- **핫픽스 commit**: `e6a4c5fc6` (브랜치 `hotfix/p0-mapping-flow-guards-2026-05-28`)
- **develop merge commit**: `39d226505` (PR #47 머지 후 `c84244075` mg-warning 토큰 swap 추가됨)
- **검수자**: core-tester (read-only)
- **검수 일시**: 2026-05-28 (Asia/Seoul)
- **합의서**: `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md`
- **디버거 진단**: Agent `62ea6373` (H1~H4 CONFIRMED)
- **코더 핸드오프**: Agent `3f8bcae5`

---

## 0. 결론 — **FAIL** (HIGH × 3, 운영 반영 보류 권고)

| 항목 | 결과 |
|------|------|
| **최종 판정** | **FAIL** |
| **운영 반영 권고** | **즉시 배포 금지** — HIGH 3건 후속 핫픽스 후 단독 dry-run 권장 |
| **STOP 조건 충족** | 게이트 1건 FAIL · T 시나리오 1건 FAIL · R 시나리오 1건 FAIL · STEP swap 라벨 회귀 |

PR #47 의 의도(가드 5종 추가 + STEP swap)와 합의서·디버거 진단 항목은 대부분 코드에 반영되어 있으나, **두 개의 P0 가드와 한 개의 STEP swap 후속 정렬이 부분적으로 누락**되어 운영 반영 시 보고된 P0 UX 버그가 재발할 수 있습니다.

PR #47 은 이미 develop(`39d226505`)에 머지된 상태이므로, **본 보고서를 근거로 추가 보강 패치를 즉시 발주**해야 합니다 (위임 대상은 §6 참조).

---

## 1. T1~T6 P0 시나리오

| # | 시나리오 | 기대 동작 | 검증 결과 | 근거 |
|---|---------|----------|-----------|------|
| **T1** | step 1 상담사 미선택 → "다음" disabled | `canProceed()` step===1 → `!!selectedConsultant?.id` | **PASS** | `MappingCreationModal.js:386` + Jest `step 1 에서 상담사 미선택 시 "다음" 버튼 disabled` PASS |
| **T2** | step 2 내담자 미선택 (swap 후) → "다음" disabled | `canProceed()` step===2 → `!!selectedClient?.id` | **PASS** | `MappingCreationModal.js:387` + Jest `step 2 에서 내담자 미선택 시 "다음" 버튼 disabled (swap 후)` PASS |
| **T3** | step 3 패키지 미선택 → "다음" disabled + default "기본 10회기 패키지" 자동 적용 안 됨 | `canProceed()` step===3 가드 + `paymentInfo.packageName=null` 초기 state | **FAIL** | `MappingCreationModal.js:70~81` 초기 `useState`가 `DEFAULT_MAPPING_CONFIG.{PACKAGE_NAME,TOTAL_SESSIONS,PACKAGE_PRICE}` (`'기본 10회기 패키지'`, `10`, `500000`) 그대로 적용. step 3 가드가 첫 모달 진입 시 무력화. Jest `step 3 에서 패키지 미선택 시 "다음" 버튼 disabled (default 패키지 제거)` **FAIL** (`expect(nextButton).toBeDisabled()` 실패) |
| **T4** | step 4 timing 선택 가드 (ADVANCE / SAME_DAY_CARD) | `canProceed()` step===4 가드 | **PASS** | `MappingCreationModal.js:393-394` + radio default `'ADVANCE'` |
| **T5** | SAME_DAY_CARD 선택 시 매칭 생성 후 CheckoutSameDayModal 진입 + subtitle 정상 표시 | `handleMappingCreated` 페이로드(`consultantId/clientId/packageName/totalSessions/packagePrice/mappingId`) 보강 | **PASS** | `MappingCreationModal.js:341-351` 콜백 payload + `IntegratedMatchingSchedule.js:265-274` `setCheckoutSameDayMapping` 매핑 풀-필드 전달 + Jest `정상 흐름 → onMappingCreated 콜백에 …` PASS |
| **T6** | 매핑 누락(consultantId/packageName null) 시 CheckoutSameDayModal 진입 차단 + alert | `CheckoutSameDayModal.js` 진입 가드(`!mapping?.id || !mapping?.consultantId || !mapping?.packageName`) | **PASS** | `CheckoutSameDayModal.js:113-132` 가드 + Jest `CheckoutSameDayModal` invalid-mapping 4종 PASS |

**합계**: T1·T2·T4·T5·T6 PASS / **T3 FAIL** → 시나리오 5/6 PASS.

---

## 2. R1~R8 회귀 매트릭스

| # | 회귀 영역 | 검증 결과 | 근거 |
|---|---------|-----------|------|
| **R1** | 옵션 B (PR #34) 호환 | **PASS** | `AdminServiceImplCheckoutSameDayTest` 11/0/0 · `AdminServiceImplCreateMappingPendingPaymentGuardTest` 4/0/0 |
| **R2** | TestDataController dev seed 경로 (`@Valid` 미적용) | **PASS** | `TestDataController.createMapping(line 224)`는 `@Valid` 미적용 + service 직접 호출 경로(`L151`, `L235`)는 컨트롤러 단계 bean validation 미트리거 → DTO 신규 제약(@NotBlank/@NotNull/@Min) 영향 없음 |
| **R3** | 다중 PENDING_PAYMENT 매핑 동시 처리 | **PASS** | `AdminServiceImplCreateMappingPendingPaymentGuardTest`에 `createMapping_terminatesActiveButProtectsPendingPaymentMixed` 등 다중 시나리오 포함, 4/0/0 |
| **R4** | 알림카드 "당일 카드 결제" 버튼 — 정보 누락 매핑 차단 | **PASS** | `IntegratedMatchingSchedule.js:388-396` `firstPending?.consultantId / packageName` 누락 시 `notificationManager.warning` 후 return |
| **R5** | 백엔드 `@Valid` 검증 — `consultantId/clientId/packageName/totalSessions/packagePrice` 누락/0 → 400 | **PASS** | `AdminController.java:1853-1854` `@Valid` 적용 + `ConsultantClientMappingCreateRequest` 5종 제약 + `AdminControllerCreateMappingValidationIntegrationTest` 5/0/0 (`missingConsultantId`, `blankPackageName`, `missingTotalSessions`, `zeroPackagePrice`, `validPayload`) |
| **R6** | `localStorage.lastUsedPackage` 자동 적용 제거 | **FAIL (PARTIAL)** | `MappingCreationModal.js:147-177` `useEffect`에서 `localStorage.getItem('lastUsedPackage')` → `packageOptions.find` → `setPaymentInfo` 로 **자동 적용 로직 잔존**. 핫픽스 커밋 메시지의 "localStorage 자동 적용 제거" 의도와 불일치. 사용자가 두 번째 모달 진입 시 이전 패키지가 자동 적용되어 T3 가드와 함께 P0 default 강제 적용이 재발 |
| **R7** | i18n 신규 키 (`warn.missingPackage` / `error.invalidMapping`) | **PASS** | `admin.json:1970-1973` `warn.missingPackage` · `admin.json:2575` `error.invalidMapping` · `check:i18n-seed` PASS (16 파일, 자기참조 0 / 빈값 0) |
| **R8** | 다른 진입점(`setCheckoutSameDayMapping` 호출부) 영향 | **PASS** | `git grep` 결과 `IntegratedMatchingSchedule.js` 단일 컴포넌트(`L98 선언, L265 set, L289 clear, L395 set, L649 clear`) — 다른 진입점 없음 |

**합계**: R1~R5·R7·R8 PASS / **R6 FAIL** → 회귀 7/8 PASS.

---

## 3. 게이트 5종 재실행

| # | 게이트 | 결과 | 요약 |
|---|--------|------|------|
| **1** | `mvn -q -DfailIfNoTests=false test -Dtest='AdminController*Test,AdminServiceImpl*Test,*MappingCreate*Test'` | **PASS** | 13 클래스 / Tests run: **62**, Failures: **0**, Errors: **0**, Skipped: **0** |
| **2** | `npm test -- --watchAll=false --testPathPattern='MappingCreationModal|CheckoutSameDayModal|IntegratedMatchingSchedule'` | **FAIL** | Tests: **1 failed, 12 passed, 13 total** — FAIL: `MappingCreationModal — P0 핫픽스 + STEP swap › step 3 에서 패키지 미선택 시 "다음" 버튼 disabled (default 패키지 제거)` (`expect(nextButton).toBeDisabled()` 실패) |
| **3** | `npm run check:i18n-seed` | **PASS** | `[validate-i18n-seed] PASS — 16 파일 시드 정상 (자기참조 0 / 빈값 0)` |
| **4** | `npm run lint:codemod-mappings` | **PASS** | `✅ 결과: PASS (가드 1·2 모두 통과 — codemod 진입 안전)` |
| **5** | `bash config/shell-scripts/check-hardcode.sh` | **PASS (errors=0)** | `summary.errors=0, summary.warnings=5773` (운영 게이트 기준 errors=0 만족, 워닝 5773 은 기존 누적치) |

### Gate 1 (mvn) 세부

| 테스트 클래스 | tests | failures | errors |
|--------------|------:|---------:|-------:|
| `integration.AdminControllerConfirmDepositApproveIntegrationTest` | 5 | 0 | 0 |
| `integration.AdminControllerCreateMappingValidationIntegrationTest` *(신규)* | 5 | 0 | 0 |
| `integration.AdminControllerDuplicateCheckPhoneIntegrationTest` | 4 | 0 | 0 |
| `integration.AdminControllerRegisterClientVehiclePlateValidationIntegrationTest` | 2 | 0 | 0 |
| `service.impl.AdminServiceImplCheckoutSameDayTest` | 11 | 0 | 0 |
| `service.impl.AdminServiceImplConfirmDepositApproveTest` | 4 | 0 | 0 |
| `service.impl.AdminServiceImplCreateMappingPendingPaymentGuardTest` | 4 | 0 | 0 |
| `service.impl.AdminServiceImplCreateMappingSingleSessionGuardTest` | 4 | 0 | 0 |
| `service.impl.AdminServiceImplDeleteRedirectTest` | 4 | 0 | 0 |
| `service.impl.AdminServiceImplMappingSettlementNotificationBaselineTest` | 3 | 0 | 0 |
| `service.impl.AdminServiceImplPartialRefundExhaustedScheduleCancelTest` | 5 | 0 | 0 |
| `service.impl.AdminServiceImplRegisterClientContactTest` | 6 | 0 | 0 |
| `service.impl.AdminServiceImplUpdateClientTest` | 5 | 0 | 0 |
| **합계** | **62** | **0** | **0** |

### Gate 2 (Jest) 세부

```
PASS src/components/admin/mapping/__tests__/CheckoutSameDayModal.test.js  (12 PASS)
FAIL src/components/admin/__tests__/MappingCreationModal.test.js
  ● step 3 에서 패키지 미선택 시 "다음" 버튼 disabled (default 패키지 제거)
    expect(element).toBeDisabled()
    Received element is not disabled:
      <button class="mg-v2-button mg-v2-button-primary" type="button" />
Tests: 1 failed, 12 passed, 13 total
```

---

## 4. HIGH · MEDIUM · LOW

### HIGH (3) — 운영 반영 차단

1. **[T3 / Gate 2] 초기 `useState` 가 `DEFAULT_MAPPING_CONFIG` 그대로 적용 → step 3 가드 무력화**
   - **위치**: `frontend/src/components/admin/MappingCreationModal.js:70-81`
   - **현황**:
     ```
     const [paymentInfo, setPaymentInfo] = useState({
       totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,   // 10
       packageName : DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,      // '기본 10회기 패키지'
       packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,     // 500000
       ...
     });
     ```
   - **영향**: 사용자가 첫 모달 진입 시 패키지 카드를 한 번도 클릭하지 않아도 `canProceed()` step 3 가드가 truthy 반환 → "다음" 버튼이 활성화되어 step 4 진입, 그대로 매칭 생성 시 "기본 10회기 패키지(10회/500,000원)" 가 강제 적용됨 → **P0 보고서의 0-1번 버그(기본 10회기 패키지 default 강제 적용) 재발**
   - **권고**: `resetModal()` (L360-376) 과 동일하게 초기 `useState` 도 `{ totalSessions: 0, packageName: null, packagePrice: 0 }` 으로 초기화. `DEFAULT_MAPPING_CONFIG` import (`L23`) 제거 또는 다른 기본값 경로로 한정.

2. **[STEP swap 후속 누락] `STEPS_CONFIG` 라벨 swap 누락 → 스테퍼 라벨과 실제 콘텐츠 미스매치**
   - **위치**: `frontend/src/components/admin/MappingCreationModal.js:41-47`
   - **현황**:
     ```
     STEPS_CONFIG[1] = { key:2, labelFallback:'패키지', icon: Package }   // 실제 step===2 콘텐츠는 내담자
     STEPS_CONFIG[2] = { key:3, labelFallback:'내담자', icon: UserCircle } // 실제 step===3 콘텐츠는 패키지
     ```
   - 콘텐츠 섹션(`L600 step===2 내담자`, `L545 step===3 패키지`)·`canProceed()`(`L386-397`)는 swap 반영되었으나 **상단 스테퍼(`L464-487`)의 라벨/아이콘**은 swap 누락.
   - **영향**: 사용자는 스테퍼에서 "현재 단계: 패키지" 가 강조되지만 실제 화면은 "내담자 선택" 폼이 표시됨 → UX 모순, 신뢰도 하락 + 운영 클레임 가능.
   - **권고**: `STEPS_CONFIG` 의 `key=2/3` 순서를 `{ key:2, labelFallback:'내담자', icon:UserCircle }`, `{ key:3, labelFallback:'패키지', icon:Package }` 로 swap. i18n key(`admin:mappingCreation.step.client / .package`) 도 같이 swap.

3. **[R6] `localStorage.lastUsedPackage` 자동 적용 로직 제거 누락**
   - **위치**: `frontend/src/components/admin/MappingCreationModal.js:147-166`
   - **현황**: `useEffect`가 모달 오픈 시 `localStorage.getItem('lastUsedPackage')` → `packageOptions.find` 매칭 시 `setPaymentInfo` 로 패키지/회기/가격을 **자동 적용**. 핫픽스 commit 메시지는 "localStorage 자동 적용 제거"를 명시했으나 구현은 미반영.
   - **영향**: 두 번째 이후 진입 시 이전 패키지가 자동 적용되어, T3 가드 우회와 결합되면 사용자는 패키지를 다시 선택하지 않은 채 곧장 step 4·매칭 생성으로 넘어감. 합의서 "패키지 매번 명시 선택" UX 기대와 불일치.
   - **권고**: L147-166 의 `lastUsedPackage` 자동 적용 블록 제거 (또는 명시적 "이전 패키지 다시 적용" 버튼으로 분리). `handleCreateMapping` (L321-326) 의 `localStorage.setItem('lastUsedPackage', …)` 도 함께 정리.

### MEDIUM (1)

4. **[테스트 누락] 스테퍼 라벨 매핑 회귀 가드 부재**
   - 위 #2 항목을 미리 잡을 수 있는 Jest 단언이 없음. 추가 권고: `MappingCreationModal.test.js` 에 `step===2` 진입 시 스테퍼에서 `'내담자'` 라벨이 `current` 클래스를 갖는지, `step===3` 진입 시 `'패키지'` 가 `current` 인지 확인.

### LOW (2)

5. **[Hardcode 워닝 5773건]** Gate 5 errors=0 으로 운영 게이트는 만족하지만, 워닝 수가 직전과 동일 수준(누적치)으로 유지 — 향후 별도 클린업 트랙 필요. PR #47 자체가 추가한 신규 워닝은 없음.
6. **[Logging]** `MappingCreationModal.js:110, 119, 139, 164, 241, 252, 263, 279` 등 `console.warn/error` 다수 — 표준화 가능(우선순위 낮음).

---

## 5. 운영 반영 권고

- **즉시 배포 금지** — HIGH #1 + #2 + #3 은 모두 사용자 직접 노출 P0 UX 결함이며, HIGH #1·#3 은 P0 디버거(Agent `62ea6373`) 진단 H2/H4 (default 패키지 강제 적용) 의 **부분 미반영**.
- **권고 절차**:
  1. **core-coder** 에 HIGH 3건 후속 패치 위임 (브랜치 `hotfix/p0-mapping-flow-guards-v2-2026-05-28` 또는 PR #47 후속 commit). 변경 범위 한정 — `MappingCreationModal.js` L41-47 / L70-81 / L147-166 + `DEFAULT_MAPPING_CONFIG` import 정리.
  2. **core-tester** 가 동일 게이트 5종 재실행, Jest test `step 3 default 패키지 제거` 가 PASS 임을 재확인, 스테퍼 라벨 추가 단언 작성·통과 확인.
  3. **단독 dry-run** (development 환경) — 신규 매칭 모달 첫 진입 / 두 번째 진입 / 매칭 생성 직후 CheckoutSameDayModal subtitle 표시 시나리오를 수동 검증.
  4. dry-run PASS 후 운영 반영.
- **현 develop(`39d226505`) 상태**: HIGH 3건 그대로 머지됨. 백엔드 가드(@Valid)는 정상이므로 dev seed/자동 매칭 경로 회귀는 없음 — 운영 반영 차단의 사유는 **신규 매칭 UI** 한정.

---

## 6. 권고 위임 (참고)

| 항목 | 위임 대상 | 비고 |
|------|----------|------|
| HIGH #1 초기 state default 제거 + DEFAULT_MAPPING_CONFIG import 정리 | core-coder | `resetModal()` 와 정합 |
| HIGH #2 STEPS_CONFIG 라벨/아이콘 swap | core-coder | i18n key 변경 없음 — 단순 배열 순서 swap |
| HIGH #3 `lastUsedPackage` localStorage 자동 적용 로직 제거 | core-coder | `handleCreateMapping` setItem 호출도 함께 정리 |
| MEDIUM #4 스테퍼 라벨 회귀 Jest 가드 추가 | core-tester | HIGH 패치 후 동반 작성 |

---

## 7. 부록 — 사용 명령 및 출처

- 백엔드 게이트: `mvn -q -DfailIfNoTests=false test -Dtest='AdminController*Test,AdminServiceImpl*Test,*MappingCreate*Test'` (target/surefire-reports 기준)
- 프론트 Jest: `cd frontend && npm test -- --watchAll=false --testPathPattern='MappingCreationModal|CheckoutSameDayModal|IntegratedMatchingSchedule'`
- i18n: `cd frontend && npm run check:i18n-seed`
- codemod: `cd frontend && npm run lint:codemod-mappings`
- hardcode: `bash config/shell-scripts/check-hardcode.sh` (`test-reports/hardcoding/hardcoding-report-*.json` 의 `summary.errors`)
- 호출부 전수: `git grep "setCheckoutSameDayMapping" -- '*.js'`, `git grep "createMapping" -- '*.java'`

---

(끝)
