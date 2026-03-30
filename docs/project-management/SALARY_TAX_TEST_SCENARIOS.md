# 급여·세금 영역 테스트 시나리오 및 검증 기준

**목적**: core-coder가 단위·통합 테스트를 구현할 수 있도록 시나리오와 기대 결과만 정리. 테스트 코드는 작성하지 않음.  
**참조**: `SALARY_TAX_VERIFICATION_MEETING_RESULT.md` §4 Phase 5, `SALARY_TAX_LOGIC_VERIFICATION_REPORT.md` §4 체크리스트, `docs/standards/TESTING_STANDARD.md`, `.cursor/skills/core-solution-testing/SKILL.md`.

---

## 1. 단위 테스트

### 1.1 TaxCalculationUtil

**대상 클래스**: `com.coresolution.consultation.util.TaxCalculationUtil`  
**우선순위**: P0

| ID | 메서드 | 시나리오 | 입력 | 기대 결과 | 비고 |
|----|--------|----------|------|-----------|------|
| U-TAX-01 | `calculateVatFromAmountIncludingTax` | 부가세 포함 금액에서 부가세 계산 | `amountIncludingTax = 110000` | `9091` (반올림 HALF_UP) | 10% 기준: 110000×0.1/1.1 |
| U-TAX-02 | `calculateVatFromAmountIncludingTax` | null 입력 | `null` | `BigDecimal.ZERO` | NPE 방지 |
| U-TAX-03 | `calculateVatFromAmountIncludingTax` | 0 이하 | `0`, `-1000` | `BigDecimal.ZERO` | |
| U-TAX-04 | `calculateAmountExcludingTax` | 부가세 포함 → 제외 금액 | `110000` | `100909` (110000 - 9091) | 포함금액 - 부가세 |
| U-TAX-05 | `calculateAmountExcludingTax` | null/0 이하 | `null`, `0` | `BigDecimal.ZERO` | |
| U-TAX-06 | `calculateVatFromAmountExcludingTax` | 부가세 제외 금액에서 부가세 | `100000` | `10000` (반올림 HALF_UP) | 10% |
| U-TAX-07 | `calculateVatFromAmountExcludingTax` | null/0 이하 | `null`, `0` | `BigDecimal.ZERO` | |
| U-TAX-08 | `calculateAmountIncludingTax` | 부가세 제외 → 포함 금액 | `100000` | `110000` | 제외 + 부가세 |
| U-TAX-09 | `calculateAmountIncludingTax` | null/0 이하 | `null`, `0` | `BigDecimal.ZERO` | |
| U-TAX-10 | `calculateTaxFromPayment` | 결제 금액에서 부가세 분리 | `110000` | `TaxCalculationResult(110000, 100909, 9091)` | amountIncludingTax, amountExcludingTax, vatAmount |
| U-TAX-11 | `calculateTaxFromPayment` | null/0 이하 | `null`, `0` | `TaxCalculationResult(ZERO, ZERO, ZERO)` | |
| U-TAX-12 | `calculateTaxForExpense` | 지출 금액에 부가세 추가 | `100000` | `TaxCalculationResult(110000, 100000, 10000)` | |
| U-TAX-13 | `calculateTaxForExpense` | null/0 이하 | `null`, `0` | `TaxCalculationResult(ZERO, ZERO, ZERO)` | |
| U-TAX-14 | `isVatApplicable` | 급여 관련 카테고리 | `"급여"`, `"월급"`, `"연봉"` 포함 문자열 | `false` | |
| U-TAX-15 | `isVatApplicable` | 부가세 적용 카테고리 | `"임대료"`, `"사무용품"`, `"마케팅"` 등 | `true` | |
| U-TAX-16 | `isVatApplicable` | null | `null` | `false` | |

---

### 1.2 SalaryScheduleServiceImpl (기산일·기간 계산)

**대상 클래스**: `com.coresolution.consultation.service.impl.SalaryScheduleServiceImpl`  
**우선순위**: P0

- **의존성**: `CommonCodeService` — Mock 필요. `getCode("SALARY_BASE_DATE", "MONTHLY_BASE_DAY")` 등 반환 제어.

| ID | 메서드 | 시나리오 | 입력 | 기대 결과 | 비고 |
|----|--------|----------|------|-----------|------|
| U-SCH-01 | `getBaseDate` | 공통코드 LAST_DAY | year=2025, month=2, default_day="LAST_DAY" | `2025-02-28` | 2월 말일 |
| U-SCH-02 | `getBaseDate` | 공통코드 특정일(25일) | year=2025, month=2, default_day="25" | `2025-02-25` | |
| U-SCH-03 | `getBaseDate` | 해당 월 일수 초과(31일, 2월) | year=2025, month=2, default_day="31" | `2025-02-28` | Math.min(day, lastDay) |
| U-SCH-04 | `getBaseDate` | 공통코드 null/예외 시 폴백 | commonCodeService 예외 또는 null | `해당 월 말일` (예: 2025-01-31) | 기본값 말일 |
| U-SCH-05 | `getCalculationPeriod` | 1월 | year=2026, month=1 | `[전년 12월 기산일+1일, 1월 기산일]` | start = getBaseDate(2025,12).plusDays(1), end = getBaseDate(2026,1) |
| U-SCH-06 | `getCalculationPeriod` | 2월 이상 | year=2025, month=3 | `[2월 기산일+1일, 3월 기산일]` | start = getBaseDate(2025,2).plusDays(1), end = getBaseDate(2025,3) |
| U-SCH-07 | `getCalculationPeriod` | 경계: 12월 | year=2025, month=12 | `[11월 기산일+1일, 12월 기산일]` | 1월이 아닌 일반 월 |
| U-SCH-08 | `getPaymentDate` | 익월 지급일, 2월→3월 5일 | year=2025, month=2, payment_day=5 | `2025-03-05` | 익월 5일 |
| U-SCH-09 | `getPaymentDate` | 익월 일수 초과(31일, 2월→3월) | year=2025, month=2, payment_day=31 | `2025-03-31` | 3월 31일 |
| U-SCH-10 | `getCutoffDate` | LAST_DAY | year=2025, month=6, default_day="LAST_DAY" | `2025-06-30` | 말일 |

---

## 2. 통합 테스트 (API)

**대상**: `SalaryManagementController` — Base URL `/api/v1/admin/salary`  
**공통**: `@SpringBootTest(webEnvironment = RANDOM_PORT)` + MockMvc. 인증은 `@BeforeEach`에서 로그인 후 토큰·세션 설정.  
**헤더**: `Authorization: Bearer {token}`, `X-Tenant-ID: {tenantId}` (API 표준).  
**우선순위**: 인증·테넌트·정상·400·404 시나리오는 P0.

---

### 2.1 인증·권한

| ID | API | 시나리오 | 조건 | 기대 HTTP | 기대 응답 필드/메시지 |
|----|-----|----------|------|-----------|------------------------|
| I-AUTH-01 | 공통(대표: GET /profiles) | 인증 없음 | 세션/토큰 없음 | 401 | Unauthorized, 로그인 필요 메시지 |
| I-AUTH-02 | GET /profiles/{consultantId} | 권한 없음 | SALARY_MANAGE 권한 없는 사용자 | 403 | Forbidden, 급여 관리 권한 없음 |
| I-AUTH-03 | GET /calculation-period | 월 검증 | month=0 또는 month=13 | 400 | ValidationException, "월은 1~12 사이여야 합니다." |

---

### 2.2 테넌트 격리 (P0)

| ID | API | 시나리오 | 조건 | 기대 결과 |
|----|-----|----------|------|-----------|
| I-TENANT-01 | GET /calculations/{consultantId} | 현재 테넌트만 반환 | 테넌트 A 로그인, A 소속 상담사 consultantId | 응답 목록의 모든 항목이 테넌트 A의 급여 계산만 포함 |
| I-TENANT-02 | GET /calculations?startDate=&endDate= | 기간별 조회 현재 테넌트만 | 테넌트 A 로그인, start/end 기간 내에 B 테넌트 데이터 존재 | 응답 목록에 B 테넌트 급여 계산 0건 |
| I-TENANT-03 | GET /tax/{calculationId} | 다른 테넌트 calculationId | 테넌트 A 로그인, calculationId가 테넌트 B 소유 | 403 또는 404 (리소스 미존재로 처리 시 404) |
| I-TENANT-04 | POST /tax/calculate | 다른 테넌트 calculationId | request.calculationId가 테넌트 B 소유 | 403 또는 404 |

---

### 2.3 정상·검증·에러 응답

| ID | API | 시나리오 | 조건 | 기대 HTTP | 기대 응답 |
|----|-----|----------|------|-----------|-----------|
| I-API-01 | GET /profiles | 정상 | 인증+테넌트, 프로필 존재 | 200 | success, data(목록), message |
| I-API-02 | GET /calculations/{consultantId} | 정상 | 인증+테넌트, 해당 상담사 급여 있음 | 200 | success, data(calculation 목록), message |
| I-API-03 | GET /calculations?startDate=&endDate= | 정상 | 인증+테넌트, 유효 기간 | 200 | success, data(목록), message |
| I-API-04 | GET /calculations?startDate=&endDate= | 기간 역전 | startDate > endDate | 400 | 잘못된 요청 메시지 (startDate ≤ endDate 검증) |
| I-API-05 | GET /statistics?startDate=&endDate= | 기간 역전 | startDate > endDate | 400 | 동일 |
| I-API-06 | GET /calculation-period?year=&month= | 정상 | year=2025, month=6, 인증+권한 | 200 | data.periodStart, data.periodEnd, year, month |
| I-API-07 | GET /tax/{calculationId} | 정상 | 인증+테넌트 일치 calculationId | 200 | success, data(consultantName, calculationPeriod, 세목별 금액 등) |
| I-API-08 | GET /tax/{calculationId} | 존재하지 않는 ID | calculationId = 존재하지 않는 ID | 404 | 404, 해당 계산 없음 등 |
| I-API-09 | POST /tax/calculate | 정상 | 유효 TaxCalculateRequest, calculationId가 현재 테넌트 소유 | 201 | created, data(id, calculationId, taxType, taxAmount, taxRate) |
| I-API-10 | POST /tax/calculate | 존재하지 않는 calculationId | request.calculationId = 미존재 ID (같은 테넌트라 가정) | 404 | 404 또는 400 (정책에 따라) |
| I-API-11 | GET /tax/statistics?period= | 정상 | period=2025-06 | 200 | success, data(통계) |
| I-API-12 | GET /tax/statistics?period= | 잘못된 period | period=2025-13 또는 2025-00 또는 "invalid" | 400 | 명확한 검증 메시지 (YYYY-MM, 월 1~12) |
| I-API-13 | POST /calculate (미리보기) | 정상 | consultantId, periodStart, periodEnd 유효 | 200 | success, result(success 등) |
| I-API-14 | POST /confirm | 정상 | 권한+유효 파라미터 | 200 | success, result |
| I-API-15 | POST /approve/{calculationId} | 존재하지 않는 calculationId | calculationId 미존재 | 404 | 404 또는 ValidationException 대응 |
| I-API-16 | POST /pay/{calculationId} | 존재하지 않는 calculationId | calculationId 미존재 | 404 | 동일 |

---

### 2.4 응답 구조 검증 (선택)

| ID | API | 검증 항목 | 기대 |
|----|-----|-----------|------|
| I-RES-01 | GET /calculations/{consultantId} | data[] 각 항목 | calculationPeriodStart, calculationPeriodEnd, grossSalary, netSalary, status 등 필드 존재 |
| I-RES-02 | GET /tax/{calculationId} | data | consultantName, calculationPeriod(또는 start/end), 세목별 breakdown 등, consultant null로 인한 NPE 없음 |
| I-RES-03 | GET /tax/statistics | data | totalGrossSalary, totalNetSalary, totalTaxAmount, breakdown(withholdingTax, vat, incomeTax, fourInsurance, localIncomeTax 등) |

---

## 3. 검증 기준 요약 (체크리스트)

- [ ] **TaxCalculationUtil**: 부가세 포함/제외 변환, null·0 이하, `isVatApplicable` 카테고리별 반환값 — 위 표 U-TAX-xx 전부.
- [ ] **SalaryScheduleServiceImpl**: `getBaseDate` 공통코드/폴백/경계(일수 초과), `getCalculationPeriod` 1월 vs 2~12월, `getPaymentDate`/`getCutoffDate` — 위 표 U-SCH-xx 전부.
- [ ] **인증**: 인증 없음 401, SALARY_MANAGE 권한 없음 403, calculation-period 월 1~12 검증 400.
- [ ] **테넌트**: getSalaryCalculations(consultantId), getSalaryCalculations(start,end) 현재 테넌트만; getTaxDetails, calculateAdditionalTax에서 다른 테넌트 calculationId 시 403/404.
- [ ] **정상**: GET/POST 대상 API 200/201, 응답 success/data 구조.
- [ ] **검증**: startDate > endDate 시 400; period 잘못된 형식(2025-13, invalid) 시 400; 존재하지 않는 calculationId 시 404.
- [ ] **NPE 방지**: getTaxDetails에서 consultant 로딩/널 안전; getSalaryStatistics에서 gross/net null 안전 집계 (표준 반영 후).

---

## 4. 우선순위 및 구현 순서 제안

| 우선순위 | 대상 | 시나리오 ID | 비고 |
|----------|------|-------------|------|
| P0 | TaxCalculationUtil 단위 | U-TAX-01 ~ U-TAX-16 | 부가세 로직 핵심 |
| P0 | SalaryScheduleServiceImpl 단위 | U-SCH-01 ~ U-SCH-10 | 기산일·기간 배치/UI 공용 |
| P0 | API 인증·테넌트 | I-AUTH-01~03, I-TENANT-01~04 | 보안 필수 |
| P0 | API 정상·400·404 | I-API-01~16, I-API-12(period 검증) | 일관된 에러 처리 |
| P1 | 응답 구조·NPE 방지 | I-RES-01~03, getTaxDetails consultant / getSalaryStatistics null | 디버그 리포트 §4 체크리스트 반영 |

---

## 5. 참조

- `docs/project-management/SALARY_TAX_VERIFICATION_MEETING_RESULT.md` — Phase 5 테스트 도입, core-tester 보고
- `docs/debug/SALARY_TAX_LOGIC_VERIFICATION_REPORT.md` — §4 체크리스트(테넌트 격리, period 검증, NPE, placeholder 12개 등)
- `docs/standards/TESTING_STANDARD.md` — Given-When-Then, @DisplayName, 동적 테스트 데이터, 통합 시 인증·X-Tenant-ID
- `.cursor/skills/core-solution-testing/SKILL.md` — 테스트 피라미드, 백엔드 JUnit/Mockito/통합 테스트 규칙
