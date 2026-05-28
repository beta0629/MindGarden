# P0 디버그 보고서 — 신규 매칭 `paymentTiming` NULL 저장 (옵션 B SAME_DAY_CARD 분기 깨짐)

- **일시**: 2026-05-28 11:21~11:28 KST
- **환경**: dev (mindgarden.dev.core-solution.co.kr)
- **보고자**: core-debugger 서브에이전트 (병렬 가설 검증, 분석 시간 약 5분)
- **HEAD 비교**: working tree (`66f8165a8`, `fix/dev-deploy-fallback-env-export-p0-recovery`) ↔ `origin/develop` (`fc6698d2b`, PR #50 머지)
- **재현**: `MappingCreationModal` 4단계에서 "사후 카드 결제 (당일 방문)" 라디오 + 카드 + 100,000원 + "매칭 생성" → DB `consultant_client_mappings.payment_timing = NULL`, 사이드바에 "결제 확인"(ADVANCE) 버튼만 표시, CheckoutSameDayModal 자동 오픈 (콜백은 `paymentTiming = SAME_DAY_CARD` 로 전달되기 때문)

---

## 1. 결론 (TL;DR)

- **단독 진성 원인 = H1 (프론트 누락).**
- `frontend/src/components/admin/MappingCreationModal.js` 의 `handleCreateMapping` 이 **POST `/api/v1/admin/mappings` 페이로드 (`mappingData`) 에 `paymentTiming` 필드를 포함하지 않는다.** 라디오로 set 된 `paymentInfo.paymentTiming` 은 로컬 분기와 부모 콜백에만 사용되고 백엔드에는 전달되지 않는다.
- 백엔드(Entity·DTO·Service·Controller) 와 Flyway 마이그레이션은 **모두 정상 적용**되어 있다. (PR #50 = `fc6698d2b` 의 백엔드 변경 6종 모두 origin/develop 에 반영됨.)
- DB 컬럼 `payment_timing VARCHAR(32) NULL` 도 dev 서버에 정상 존재 (사용자 SSH 확인 일치).
- 따라서 **JAR 캐시·빌드 누락도 기각**한다. JAR 가 옛 버전이었다면 컬럼 미존재로 `unknown column` INSERT 에러가 발생했어야 하지만 NULL 로 정상 저장되었으므로 백엔드 매핑 라인은 새 코드.

---

## 2. 가설 매트릭스 (5종 — 결과 포함)

| # | 가설 | 결과 | 근거 |
|---|---|---|---|
| H1 | **프론트 누락** — `MappingCreationModal.handleCreateMapping` 이 POST body 에 `paymentTiming` 미포함 | ✅ **확정 (단독 원인)** | `git show fc6698d2b:.../MappingCreationModal.js` 의 `mappingData` 객체(L300-319)에 `paymentTiming` 키 부재. 라디오 state 는 정상 set, 부모 콜백(`onMappingCreated`, L342)에는 전달되지만 페이로드 누락. |
| H2 | **백엔드 누락** — `AdminServiceImpl.createMapping` 이 dto.paymentTiming → entity 매핑 누락 | ❌ 기각 | `AdminServiceImpl.java` L749-752 (PR #50 추가)에 `mapping.setPaymentTiming(dto.getPaymentTiming());` 정상 존재. DTO Request/Response/Entity/Controller 4종 모두 paymentTiming 필드 추가됨. |
| H3 | **JAR 캐시** — dev 서버 JAR 가 옛 빌드 (paymentTiming 매핑 누락 버전) | ❌ 기각 | (a) DB 컬럼 존재 + (b) 매핑 95번이 NULL 로 정상 INSERT 됨 → JAR 가 옛 버전이면 `Unknown column 'payment_timing'` 또는 Hibernate `field not found` 로 500 났을 것. 실제 200 + 행 생성 = 새 JAR. |
| H4 | **워크플로 빌드 누락** — develop 머지 후 빌드 시 컴파일은 됐지만 매핑 라인이 옛 코드로 남음 (git pull 캐시) | ❌ 기각 | H3 와 동일 근거. 또한 paymentTiming 매핑은 `setPaymentTiming(dto.getPaymentTiming())` 단일 라인이라 부분 반영 케이스가 발생할 수 없는 구조. |
| H5 | **사이드 — Hibernate `@DynamicUpdate`/`updatable=false`** 등으로 컬럼 무시 | ❌ 기각 | `ConsultantClientMapping.java` L98-104 의 `@Column(name = "payment_timing", length = 32)` 에는 `updatable`/`insertable` 제한 없음. JPA 기본값 = INSERT 시 포함. |

---

## 3. 정확 라인 번호 + 코드 인용

### 3.1 프론트 — 진성 원인 (origin/develop `fc6698d2b`)

```283:319:frontend/src/components/admin/MappingCreationModal.js
  const handleCreateMapping = async() => {
    // P0 핫픽스 2026-05-28: 신규 매칭 생성 진입 가드 강화.
    // 누락된 필드는 후속 CheckoutSameDayModal/결제 흐름에서 NPE를 유발한다.
    if (!selectedConsultant?.id || !selectedClient?.id) {
      notificationManager.warning(t('admin:mappingCreation.warn.selectBoth'));
      return;
    }
    if (!paymentInfo.packageName
        || !((paymentInfo.totalSessions || 0) > 0)
        || !((paymentInfo.packagePrice || 0) > 0)) {
      notificationManager.error(t('admin:mappingCreation.warn.missingPackage', '패키지·회기수·가격을 모두 선택해 주세요.'));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const isSameDayCard = paymentInfo.paymentTiming === 'SAME_DAY_CARD';
      const mappingData = {
        consultantId: selectedConsultant.id,
        clientId: selectedClient.id,
        startDate: new Date().toISOString().split('T')[0],
        status: 'PENDING_PAYMENT',
        notes: paymentInfo.notes,
        responsibility: paymentInfo.responsibility,
        specialConsiderations: paymentInfo.specialConsiderations,
        paymentStatus: 'PENDING',
        totalSessions: paymentInfo.totalSessions,
        // 옵션 B 사후 카드 결제: 신규 매칭에 회기를 즉시 부여하지 않고 PENDING_PAYMENT 유지.
        // confirmDeposit (checkoutSameDayCard 내부) 단계에서 totalSessions를 채운다.
        remainingSessions: isSameDayCard ? 0 : paymentInfo.totalSessions,
        packageName: paymentInfo.packageName,
        packagePrice: paymentInfo.packagePrice,
        paymentAmount: paymentInfo.packagePrice,
        paymentMethod: paymentInfo.paymentMethod,
        paymentReference: paymentInfo.paymentReference,
        mappingType: 'NEW'
      };
      const response = await apiPost(API_ENDPOINTS.ADMIN.MAPPINGS.LIST, mappingData);
```

- **L299**: `isSameDayCard = paymentInfo.paymentTiming === 'SAME_DAY_CARD'` — state 는 정상 인지.
- **L300-319 `mappingData`**: 17개 필드 중 **`paymentTiming` 없음**. → 백엔드 DTO 의 `private String paymentTiming;` 가 Jackson 역직렬화에서 `null` 로 바인딩 → `mapping.setPaymentTiming(null)` → DB NULL.
- **L342**: `onMappingCreated?.({ paymentTiming: paymentInfo.paymentTiming, ... })` — 부모 콜백에는 전달되어 `IntegratedMatchingSchedule.js` 가 CheckoutSameDayModal 자동 오픈하지만, **DB 와 사이드바 카드 데이터는 NULL** 이라 분기 깨짐.

### 3.2 백엔드 — 정상 적용 확인 (PR #50 `fc6698d2b`, `git diff 8e4b84a55..fc6698d2b`)

#### Entity `ConsultantClientMapping.java`

```98:104:src/main/java/com/coresolution/consultation/entity/ConsultantClientMapping.java
    /**
     * 옵션 B 결제 방식 의도. 매핑 생성 시점에 어떤 결제 흐름을 따를지 보존한다.
     * - ADVANCE: 선납 입금 (현행 기본 흐름)
     * - SAME_DAY_CARD: 당일 방문 시 카드 결제 + 활성화 (옵션 B)
     * - NULL: 레거시 매핑 (마이그레이션 V20260606_006 이전 생성). 코드에서는 ADVANCE 와 동등하게 취급.
     */
    @Column(name = "payment_timing", length = 32)
    private String paymentTiming;
```

#### DTO `ConsultantClientMappingCreateRequest.java`

```81:91:src/main/java/com/coresolution/consultation/dto/ConsultantClientMappingCreateRequest.java
    /**
     * 옵션 B 결제 방식 의도 (선택값).
     * <ul>
     *   <li>ADVANCE — 선납 입금 (기본/현행)</li>
     *   <li>SAME_DAY_CARD — 당일 방문 시 카드 결제 + 활성화 (옵션 B)</li>
     *   <li>null — 레거시/명시되지 않음 (서비스에서 ADVANCE 와 동등 취급)</li>
     * </ul>
     */
    private String paymentTiming;
```

#### Service `AdminServiceImpl.java`

```749:752:src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java
        // 옵션 B 결제 방식 의도(ADVANCE / SAME_DAY_CARD)를 매핑에 보존.
        // 사이드바 카드 액션 분기와 드래그 허용 여부 결정에 사용된다.
        // null 은 레거시(ADVANCE 동등) 로 취급하므로 별도 디폴트를 강제하지 않는다.
        mapping.setPaymentTiming(dto.getPaymentTiming());
```

#### Controller `AdminController.java`

```1055:1058:src/main/java/com/coresolution/consultation/controller/AdminController.java
                data.put("createdAt", mapping.getCreatedAt());
                data.put("startDate", mapping.getStartDate());
                data.put("endDate", mapping.getEndDate());
                // 옵션 B: 사이드바 카드 액션 분기/드래그 허용 결정에 사용 (ADVANCE / SAME_DAY_CARD / null=레거시).
                data.put("paymentTiming", mapping.getPaymentTiming());
```

#### Flyway `V20260606_006`

```1:19:src/main/resources/db/migration/V20260606_006__add_payment_timing_to_consultant_client_mappings.sql
-- OPTION_B_RESERVATION_FIRST_PLAN — 사이드바 카드 SAME_DAY_CARD 분기 + 드래그 허용
-- (...)
ALTER TABLE consultant_client_mappings
    ADD COLUMN payment_timing VARCHAR(32) NULL
        COMMENT '옵션 B 결제 방식 의도: ADVANCE(선납 입금) / SAME_DAY_CARD(당일 카드 결제). NULL=레거시(ADVANCE 동등)';
```

> 비고: working tree git status 에서는 본 SQL 이 `D` (deleted) 로 표시되지만 `origin/develop` 에는 정상 존재. 현재 체크아웃 브랜치 `fix/dev-deploy-fallback-env-export-p0-recovery` 가 PR #50 머지 이전에서 분기되어 그 이후 develop 에서 추가된 파일이 working tree 기준으로 "삭제" 처럼 보이는 정상 현상이다 (체크아웃·rebase 시 develop 머지하면 자연 해소).

---

## 4. 데이터 흐름 추적

```
[라디오 클릭]
  └ MappingCreationModal L709 → setPaymentInfo({ paymentTiming: 'SAME_DAY_CARD' })   ← 정상

[매칭 생성 클릭]
  └ handleCreateMapping (L283)
      ├ isSameDayCard 로컬 변수만 사용 (L299)
      ├ mappingData payload 구성 (L300-319) ─── ★ paymentTiming 누락 ★
      └ apiPost('/api/v1/admin/mappings', mappingData) ──→ 백엔드

[백엔드 - Spring]
  └ AdminController.createMapping
      └ @RequestBody ConsultantClientMappingCreateRequest dto
         ├ Jackson 역직렬화 → dto.paymentTiming = null  (필드 누락 = null 바인딩)
         └ AdminServiceImpl.createMapping(dto)
             └ mapping.setPaymentTiming(dto.getPaymentTiming())  // = null
                └ JPA INSERT → consultant_client_mappings.payment_timing = NULL

[부모 콜백 - 별개 경로]
  └ onMappingCreated({ paymentTiming: paymentInfo.paymentTiming })  ← 'SAME_DAY_CARD'
      └ IntegratedMatchingSchedule
          ├ CheckoutSameDayModal 자동 오픈 (메모리 state 기준)
          └ 사이드바 카드 재로딩 → API 응답의 paymentTiming = null → "결제 확인"(ADVANCE) 분기
```

핵심: **메모리(콜백) 와 DB 가 어긋난다** — 콜백은 SAME_DAY_CARD 인데 DB 는 NULL. 사이드바는 API 재조회를 쓰므로 NULL 분기를 따르고, CheckoutSameDayModal 자동 오픈은 메모리 state 를 따르므로 동시에 발생.

---

## 5. dev 서버 추가 검증 (선택, 메인이 SSH 로 실행)

쉘 서브에이전트 또는 메인이 dev 서버에서 직접 확인할 수 있는 명령. **읽기 전용**.

### 5.1 API 응답 단건 확인 (paymentTiming 필드 존재 + 값)

```bash
# 어드민 세션 쿠키 또는 Bearer 가 필요. dev 어드민 로그인 후:
curl -sS \
  -H "Authorization: Bearer ${ADMIN_DEV_TOKEN}" \
  https://mindgarden.dev.core-solution.co.kr/api/v1/admin/mappings/95 \
  | jq '{ id, status, paymentTiming, paymentMethod, packageName }'
```

기대 결과:
- `paymentTiming` 키가 응답 JSON 에 **존재**해야 함 (백엔드 변경 적용 증거).
- 값은 **`null`** 일 것 (프론트 페이로드 미전송 결과).
- 만약 키 자체가 없다 → JAR 가 PR #50 이전 = H3 재검토 필요.

### 5.2 DB 컬럼·값 직접 확인

```bash
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "
  SELECT id, payment_timing, status, package_name, created_at
  FROM consultant_client_mappings
  WHERE id IN (93, 94, 95)
  ORDER BY id DESC;
  SHOW COLUMNS FROM consultant_client_mappings LIKE 'payment_timing';
"
```

기대:
- 3행 모두 `payment_timing = NULL` (이미 사용자 확인됨).
- `SHOW COLUMNS` 가 `payment_timing varchar(32) YES NULL` 반환 (Flyway 적용 증거).

### 5.3 dev JAR 디컴파일 (정밀 검증, 선택)

```bash
cd /opt/mindgarden  # dev 서버 배포 경로 — 실제 경로는 systemd unit 확인
JAR=$(ls -t *.jar | head -1)
unzip -p "$JAR" \
  com/coresolution/consultation/service/impl/AdminServiceImpl.class \
  | javap -p -c | grep -A2 setPaymentTiming
```

기대: `invokevirtual ConsultantClientMapping.setPaymentTiming` 호출 한 줄 + `dto.getPaymentTiming()` 호출 표시.

> 이 단계는 H3/H4 가 의심될 때만. 코드 분석상 이미 기각이라 우선순위 낮음.

---

## 6. 후속 core-coder 위임용 fix 초안

### 6.1 수정 대상 (단일 파일, 단일 라인)

- **파일**: `frontend/src/components/admin/MappingCreationModal.js`
- **함수**: `handleCreateMapping` (L283)
- **위치**: `mappingData` 객체 정의 (L300-319) 안에 `paymentTiming` 키 추가
- **변경 양**: **1 라인 추가**

### 6.2 Before/After

#### Before (origin/develop `fc6698d2b`, L300-319)

```javascript
const mappingData = {
  consultantId: selectedConsultant.id,
  clientId: selectedClient.id,
  startDate: new Date().toISOString().split('T')[0],
  status: 'PENDING_PAYMENT',
  notes: paymentInfo.notes,
  responsibility: paymentInfo.responsibility,
  specialConsiderations: paymentInfo.specialConsiderations,
  paymentStatus: 'PENDING',
  totalSessions: paymentInfo.totalSessions,
  remainingSessions: isSameDayCard ? 0 : paymentInfo.totalSessions,
  packageName: paymentInfo.packageName,
  packagePrice: paymentInfo.packagePrice,
  paymentAmount: paymentInfo.packagePrice,
  paymentMethod: paymentInfo.paymentMethod,
  paymentReference: paymentInfo.paymentReference,
  mappingType: 'NEW'
};
```

#### After (paymentTiming 추가)

```javascript
const mappingData = {
  consultantId: selectedConsultant.id,
  clientId: selectedClient.id,
  startDate: new Date().toISOString().split('T')[0],
  status: 'PENDING_PAYMENT',
  notes: paymentInfo.notes,
  responsibility: paymentInfo.responsibility,
  specialConsiderations: paymentInfo.specialConsiderations,
  paymentStatus: 'PENDING',
  totalSessions: paymentInfo.totalSessions,
  remainingSessions: isSameDayCard ? 0 : paymentInfo.totalSessions,
  packageName: paymentInfo.packageName,
  packagePrice: paymentInfo.packagePrice,
  paymentAmount: paymentInfo.packagePrice,
  paymentMethod: paymentInfo.paymentMethod,
  paymentReference: paymentInfo.paymentReference,
  mappingType: 'NEW',
  // 옵션 B 사후 카드 결제 분기를 백엔드에 전달.
  // 백엔드 ConsultantClientMappingCreateRequest.paymentTiming 으로 바인딩되어
  // consultant_client_mappings.payment_timing 컬럼에 저장된다.
  paymentTiming: paymentInfo.paymentTiming
};
```

### 6.3 core-coder 위임 프롬프트 초안

> **제목**: P0 핫픽스 — 신규 매칭 `paymentTiming` 페이로드 누락 수정 (옵션 B SAME_DAY_CARD 분기 복구)
>
> **배경**: dev 서버에서 신규 매칭 생성 시 SAME_DAY_CARD 라디오를 선택해도 DB `consultant_client_mappings.payment_timing` 이 NULL 로 저장되어 사이드바 카드 분기·드래그 허용 결정이 ADVANCE 로 잘못 적용됨. 원인 분석은 `docs/project-management/2026-05-28/PAYMENT_TIMING_NULL_DEBUG.md` 참조.
>
> **수정 범위 (단일 파일, 단일 라인)**:
> - 파일: `frontend/src/components/admin/MappingCreationModal.js`
> - 함수: `handleCreateMapping`
> - 위치: `mappingData` 객체 (현행 L300-319) 안에 `paymentTiming: paymentInfo.paymentTiming` 추가.
> - 코멘트: 옵션 B 결제 의도 백엔드 전달 목적을 한국어 2~3 줄로 명시.
> - 다른 라인·파일 변경 금지. lint/format 외 무수정.
>
> **완료 조건 / 체크리스트**:
> 1. POST `/api/v1/admin/mappings` 페이로드에 `paymentTiming` 키가 항상 포함된다 (`'ADVANCE'` 또는 `'SAME_DAY_CARD'`, default `'ADVANCE'`).
> 2. `frontend/src/components/admin/__tests__/MappingCreationModal.test.js` 회귀 테스트:
>    - SAME_DAY_CARD 라디오 선택 + 매칭 생성 시 `apiPost` 호출 인자에 `paymentTiming: 'SAME_DAY_CARD'` 가 포함되는지 검증.
>    - ADVANCE (default) 시 `paymentTiming: 'ADVANCE'` 가 포함되는지 검증.
>    - (working tree git status 에 이미 신규 테스트 파일 `??` 로 표시 — 기존 테스트 보강 권장).
> 3. **dev 서버 검증** (수정·배포 후, core-coder 가 메인에 보고할 항목):
>    - SAME_DAY_CARD 로 신규 매칭 생성 → `mysql ... SELECT payment_timing FROM consultant_client_mappings WHERE id = ?` 결과 = `'SAME_DAY_CARD'`.
>    - 사이드바 카드에 "당일 결제 + 활성화" 액션 표시.
>    - ADVANCE 로 신규 매칭 생성 → `payment_timing = 'ADVANCE'` 또는 `null`(허용), 사이드바 "결제 확인" 표시.
> 4. `core-tester` 게이트: 위 단위 테스트 + 회귀 테스트(`MappingCreationModal.test.js`, `MappingMatchActions.test.js`) 모두 그린.
>
> **참고 문서**:
> - 합의서: `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md`
> - 표준: `docs/standards/API_CALL_STANDARD.md`, `frontend/src/utils/standardizedApi.js` (단, 이 모달은 이미 `apiPost` 사용 중이라 호출 방식은 변경 없음)

### 6.4 사이드 이슈 (별도 티켓 권장, 본 P0 범위 외)

- **CheckoutSameDayModal 자동 오픈 UX 불만** ("생성 버튼 누르면 종료가 되어야"): 현재 `IntegratedMatchingSchedule` 이 `onMappingCreated` 콜백의 `paymentTiming === 'SAME_DAY_CARD'` 일 때 모달을 자동 오픈하도록 합의됨 (PR #50). 사용자 보고는 **합의된 옵션 B UX 인지 차이** 일 가능성. 합의서 §0 Q4 검토 후 별도 결정 필요. 본 P0 fix 와 무관하게 동작.
- **레거시 데이터(95/94/93)**: payment_timing NULL 로 남아있음. `OPTION_B_RESERVATION_FIRST_PLAN` 의 NULL = ADVANCE 동등 취급 정책에 따라 그대로 두거나, 운영 정책상 SAME_DAY_CARD 로 백필 필요 시 별도 마이그레이션. **데이터 수정은 본 디버그 보고 범위 외 (사용자 제약 "데이터 수정 금지" 준수).**

---

## 7. 체크리스트 (메인 → core-coder 전달 시 함께 첨부)

- [ ] `MappingCreationModal.js` `mappingData` 객체에 `paymentTiming: paymentInfo.paymentTiming` 1라인 추가
- [ ] 한국어 코멘트(옵션 B 백엔드 전달 목적) 2~3 줄 추가
- [ ] 단위 테스트 보강 (SAME_DAY_CARD / ADVANCE 페이로드 검증)
- [ ] dev 배포 후 신규 매칭 1건씩 양 분기로 생성, DB 컬럼 값 확인
- [ ] 사이드바 카드 분기 (SAME_DAY_CARD → "당일 결제 + 활성화", ADVANCE → "결제 확인") 시각 검증
- [ ] CheckoutSameDayModal 자동 오픈 UX 는 본 P0 와 분리 (별도 티켓)
- [ ] 회귀: `MappingMatchActions.test.js`, `CheckoutSameDayModal.test.js`, `sameDayCardCheckoutUtils.test.js`, `sameDayPendingEventDecorator.test.js` 그린

---

## 8. 부록 — 가설별 검증 명령 한 줄 요약

| 가설 | 검증 명령 | 기대 결과 (확정/기각 판정 기준) |
|---|---|---|
| H1 | `git show fc6698d2b:frontend/src/components/admin/MappingCreationModal.js | sed -n '300,319p'` | `paymentTiming` 키 부재 = ✅ 확정 |
| H2 | `git diff 8e4b84a55..fc6698d2b -- src/main/java/.../AdminServiceImpl.java` | `mapping.setPaymentTiming(dto.getPaymentTiming())` 추가 = ❌ 기각 |
| H3 | dev 서버 `curl /api/v1/admin/mappings/95` → `paymentTiming` 키 존재 여부 | 키 존재 = ❌ 기각 (옛 JAR 이면 키 자체 부재) |
| H4 | 동일 (H3 와 동일 근거) | 동일 |
| H5 | `grep -E "updatable|insertable" .../ConsultantClientMapping.java` | 없음 = ❌ 기각 |

---

**작성**: core-debugger (서브에이전트)
**소요**: 분석·보고 약 6분 (사용자 30분 SLA 내)
**다음 단계**: 메인 → core-coder 위임 (§6.3 프롬프트 사용) → core-tester 게이트 → 메인이 dev 배포·검증 (§5)
