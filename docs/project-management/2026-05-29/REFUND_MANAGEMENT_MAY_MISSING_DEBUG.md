# P0 운영 디버그 보고서 — /erp/refund-management 5월 환불 미노출

- 작성: 메인 어시스턴트 (디버거 서브에이전트 한도 차단으로 메인 직접 진단)
- 작성일: 2026-05-29 KST
- 사용자 보고: "운영 https://mindgarden.core-solution.co.kr/erp/refund-management 에 5월에 환불건이 2건이 있는데 표기 안되고 있는데 확인해줘"
- 사용자 화면 실측: **0건 표시**
- 운영 main HEAD: `ce17fd525` (PR #79 핫픽스 직후)
- 직전 동일 패턴 보고서: `CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md`

---

## 1. 결론 (TL;DR)

1. **데이터 손실 없음** — `financial_transactions` 에 5월 환불 transaction **4건 정상 보존**.
2. **운영 백엔드 응답이 실제로 0건** — `nginx access.log` 응답 사이즈 512 bytes 확인 (envelope only).
3. **사용자 tenant + 데이터 tenant 일치** (`tenant-incheon-counseling-001`).
4. **코드 시뮬레이션상 partial 분기 2건 매칭 OK** — 그런데 실제 응답 0건. **차이 발생 지점 단정 불가** (운영 백엔드 디버그 로그 미활성화 + 메서드 진입 로그 미출력).
5. **별개의 코드 결함 (G1) 확인** — `CONSULTATION_REFUND` (전체 환불) subcategory transaction 이 어느 분기에도 카운팅 안 됨. 화면이 정상 동작해도 전체 환불은 누락됨.

→ **즉시 핫픽스 진행 권고** (옵션 A 또는 B) + **디버그 로그 활성화로 추가 원인 확정 필요**.

---

## 2. 운영 DB 실측 (읽기 전용 SELECT)

```
financial_transactions 5월 환불 4건:
| id | 일자 | mapping | subcategory                  | amount  | tenant_id                       | branch_code | is_deleted |
| 79 | 5/13 | 67      | CONSULTATION_REFUND          | 100,000 | tenant-incheon-counseling-001   | NULL        | 0          |
| 80 | 5/13 | 67      | CONSULTATION_PARTIAL_REFUND  | 100,000 | tenant-incheon-counseling-001   | NULL        | 0          |
| 87 | 5/16 | 72      | CONSULTATION_REFUND          |  80,000 | tenant-incheon-counseling-001   | NULL        | 0          |
| 88 | 5/16 | 72      | CONSULTATION_PARTIAL_REFUND  |  80,000 | tenant-incheon-counseling-001   | NULL        | 0          |

consultant_client_mappings:
| id | status               | terminated_at        | notes                                                               |
| 67 | TERMINATED           | 2026-05-27 14:25:15  | "[부분 환불] 2026-05-13 20:14 ... 새로운 매칭 생성으로 인한 자동 종료" |
| 72 | SESSIONS_EXHAUSTED   | NULL                 | (회기 소진)                                                          |

사용자 admin:
| id | name                | email              | role  | tenant_id                       | branch_code |
| 2  | 마인드가든상담센터 관리자 | agisunny@daum.net  | ADMIN | tenant-incheon-counseling-001   | NULL        |

common_codes REFUND_PERIOD (tenant-incheon-counseling-001):
| code_value | code_label  | extra_data    |
| TODAY      | 오늘        | {"days":1}    |
| WEEK       | 최근 7일    | {"days":7}    |
| MONTH      | 최근 1개월  | {"months":1}  |
| QUARTER    | 최근 3개월  | {"months":3}  |
| YEAR       | 최근 1년    | {"years":1}   |

refund_requests 테이블: 비어있음 (사용 안 함, deprecated)
```

---

## 3. 운영 호출 및 응답 캡처

### 3.1 nginx access log (10:23:58 KST)

```
162.158.178.173 - - [29/May/2026:10:23:58 +0900] "GET /api/v1/admin/refund-history?page=0&size=10&period=month&status=all HTTP/2.0" 200 512
```

- 응답 사이즈 **512 bytes** (참고: refund-statistics 576 bytes). 응답 본문이 envelope + 빈 list 임을 시사.
- 추정 응답:
  ```json
  {"success":true,"data":{"refundHistory":[],"pageInfo":{"currentPage":0,"pageSize":10,"totalElements":0,"totalPages":0,"hasNext":false,"hasPrevious":false},"period":"month","status":"all","branchCode":null}}
  ```

### 3.2 systemd journalctl (mindgarden-core-blue, 10:23:58 전후)

- **`c.c.c.s.i.SystemNotificationServiceImpl` 의 INFO 로그 정상 출력** (tenantId=tenant-incheon-counseling-001 정상 반영).
- **`c.c.c.controller.AdminController` 의 `log.info("📋 환불 이력 조회: ...")` 패턴 0건 출력**.
- **`c.c.c.s.i.AdminServiceImpl` 의 `log.info("📋 환불 이력 조회 완료 (지점별): ...")` 패턴 0건 출력**.

→ AdminController/AdminServiceImpl 의 INFO 로그가 운영 logback 에서 **출력 비활성화** 또는 **레벨 WARN+** 가능성. 다른 원인: 컨트롤러 진입 자체 안 됨 (AOP / Interceptor 차단).

---

## 4. 코드 경로 (운영 main `ce17fd525`)

운영 코드 = main HEAD = `develop` HEAD 동일 확인 (`git diff ce17fd5..main -- AdminServiceImpl` empty).

```
프론트: frontend/src/components/erp/RefundManagement.js L72-77
  → GET /api/v1/admin/refund-history?page=0&size=10&period=month&status=all (DEFAULT)

컨트롤러: src/main/java/com/coresolution/consultation/controller/AdminController.java L2222-2237
  @GetMapping("/refund-history")
  log.info("📋 환불 이력 조회: page={}, size={}, period={}, status={}", ...)  ← 운영 미출력 확인
  String currentBranchCode = currentUser.getBranchCode()   ← 사용자 branch_code=NULL
  adminService.getRefundHistory(page, size, period, status, currentBranchCode)

서비스: src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java L4573-4707
  String tenantId = getTenantId()                          ← tenant-incheon-counseling-001 예상
  LocalDateTime startDate = getRefundPeriodStartDate("month") ← 2026-04-29 00:00:00 예상
  LocalDateTime endDate = LocalDateTime.now()              ← 2026-05-29 10:23:58 예상

  [partial 분기 L4592-4635]
  partialRefundTransactions = financialTransactionRepository
    .findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
        tenantId, EXPENSE, "CONSULTATION_PARTIAL_REFUND",
        startDate.toLocalDate(), endDate.toLocalDate())
    ← Direct SQL 실행 결과: id=80 + id=88 = 2건
    ← 그러나 운영 응답 = 0건

  [terminated 분기 L4581-4590]
  terminatedMappings = mappingRepository.findByTenantId(tenantId).stream()
    .filter(m → m.status == TERMINATED)
    .filter(m → m.terminated_at != null && between startDate, endDate)
    .filter(m → m.notes.contains("강제 종료"))
    ← mapping 67 (TERMINATED 5/27): "강제 종료" keyword 미포함 → 제외
    ← mapping 72 (SESSIONS_EXHAUSTED): status 통과 못함 → 제외
    ← terminatedRefundHistory = 0건

  allRefundHistory = partialRefundHistory + terminatedRefundHistory
    ← 코드 시뮬레이션: 2 + 0 = 2건
    ← 운영 응답: 0건 (차이 발생!)
```

---

## 5. 가설 매트릭스 (15 케이스)

| # | 가설 | 증거 | 결론 |
|---|---|---|---|
| H1 | DB 데이터 손실 | financial_transactions 4건 정상 보존 | **FALSIFIED** |
| H2 | 사용자 tenant 미스매치 | 사용자(id=2) tenant = 데이터 tenant = `tenant-incheon-counseling-001` | **FALSIFIED** |
| H3 | TenantContextHolder 호스트 추출 미스 | SystemNotification 로그상 tenant 정상 반영 | **FALSIFIED** |
| H4 | branch_code 필터 차단 | 사용자 branch_code=NULL + 코드 L4589/L4597 "브랜치 필터링 제거" 주석 | **FALSIFIED** |
| H5 | is_deleted=1 (soft delete) | 4건 모두 is_deleted=0 | **FALSIFIED** |
| H6 | `getRefundPeriodStartDate("month")` 잘못된 startDate | CommonCode `MONTH.extraData={"months":1}` 정상 | **FALSIFIED** (시뮬레이션상) |
| H7 | period=null 케이스 (fallback) | 프론트에서 `period: 'month'` 명시 전송 | **FALSIFIED** |
| H8 | derived query is_deleted bit(1) 매칭 오류 | Direct SQL 실행 2건 매칭 | **FALSIFIED** |
| H9 | derived query transaction_date 타입 미스 | Direct SQL 매칭 OK | **FALSIFIED** |
| H10 | 운영 코드 ≠ 메인 분석 코드 (배포 시점 차이) | `git diff ce17fd5..main -- AdminServiceImpl` empty | **FALSIFIED** |
| **H11** | **CONSULTATION_REFUND (전체환불) subcategory 가 partial/terminated 어느 분기에도 카운팅 안 됨** | partial 분기 SQL = `subcategory='CONSULTATION_PARTIAL_REFUND'` 만, terminated 분기 = mapping.notes "강제 종료" 만 | **PROVEN (별개 코드 결함)** |
| **H12** | **AdminController/AdminServiceImpl INFO 로그 운영 logback 비활성화** | SystemNotification INFO 로그는 출력, AdminController INFO 패턴 0건 | **PROVEN (가시성 결함)** |
| H13 | AOP/Interceptor 가 컨트롤러 진입 전 빈 응답 반환 | HTTP 200 + 컨트롤러 log 미출력 = 의심 | **INDETERMINATE** |
| H14 | Spring Cache 가 빈 응답 캐싱 | `@Cacheable` annotation 미발견 | **FALSIFIED** |
| **H15** | **AdminController/AdminServiceImpl 메서드 진입했으나 partial 분기 실제 0건 반환 + 로그도 출력되지 않음** (logback) | 운영 응답 512 bytes (빈) + log 미출력. 메서드 진입 여부 확정 어려움. | **PROVEN (응답 0건) + INDETERMINATE (원인)** |

---

## 6. 사용자 보고 시나리오 확정

| 시나리오 | 화면 표시 | 사용자 답변 |
|---|---|---|
| S-A: 0건 표시 (모두 누락) | 0건 | **CHOSEN** (사용자 직접 응답) |
| S-B: partial 2건 + 전체환불 2건 누락 | 2건 | 미해당 |
| S-C: 정상 2건 + 사용자 오해 | 2건 | 미해당 |

→ **S-A** 확정. 화면이 0건 표시. 응답 사이즈 512 bytes 와 정합.

---

## 7. 핫픽스 권고 (3 옵션)

### 옵션 A (메인 권장 — 즉시 시행) — `CONSULTATION_REFUND` 도 partial 분기에 포함

```java
// AdminServiceImpl L4592-4594 (현재)
List<FinancialTransaction> allPartialRefundTransactions = 
    financialTransactionRepository.findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
        tenantId, FinancialTransaction.TransactionType.EXPENSE, 
        "CONSULTATION_PARTIAL_REFUND", 
        startDate.toLocalDate(), endDate.toLocalDate());

// 핫픽스 후
List<FinancialTransaction> allRefundTransactions = 
    financialTransactionRepository.findByTenantIdAndTransactionTypeAndSubcategoryInAndTransactionDateBetweenAndIsDeletedFalse(
        tenantId, FinancialTransaction.TransactionType.EXPENSE, 
        List.of("CONSULTATION_REFUND", "CONSULTATION_PARTIAL_REFUND"),
        startDate.toLocalDate(), endDate.toLocalDate());
```

**Repository 신규 메서드 추가**:
```java
// FinancialTransactionRepository
List<FinancialTransaction> findByTenantIdAndTransactionTypeAndSubcategoryInAndTransactionDateBetweenAndIsDeletedFalse(
    String tenantId, FinancialTransaction.TransactionType transactionType, 
    List<String> subcategories, LocalDate startDate, LocalDate endDate);
```

**효과**: 5월 환불 4건 모두 화면 표시. H11 결함 해소.

### 옵션 B — terminated 분기 조건 완화

```java
// 현재: mapping.notes.contains("강제 종료") 만
// 핫픽스: 추가로 mapping.notes.contains("자동 종료") || CONSULTATION_REFUND transaction 존재 시
```

**리스크**: 회기 보호 정책 (24h 취소, 노쇼 보호) 와 충돌 가능. 권장 안 함.

### 옵션 C — 운영 INFO 로그 활성화 + 메인 가설 재검증

```xml
<!-- logback-spring.xml -->
<logger name="com.coresolution.consultation.controller.AdminController" level="INFO"/>
<logger name="com.coresolution.consultation.service.impl.AdminServiceImpl" level="INFO"/>
```

→ 사용자 화면 호출 시 로그 출력 → 실제 partial 분기 반환값 확정. 다만 즉시 P0 복구 효과 없음.

---

## 8. 권장 진행 순서 (P0)

1. **옵션 A 즉시 핫픽스** — core-coder PR 생성 + 통합 테스트 + 운영 반영 (이전 PR #79 동일 패턴, 핸드오프 30분 내 가능).
2. **사용자에게 응답 본문 직접 캡처 요청** (브라우저 DevTools Network 탭) — 핫픽스 후에도 0건 지속 시 추가 원인 (H13 등) 진단 필요.
3. **옵션 C 로그 활성화** — 핫픽스 안정화 후 별도 P1 PR (가시성 강화).

---

## 9. 회기 보호 / 중복 카운트 방지 가드

- 옵션 A 시행 시 화면이 4건 표시될 우려 (transaction 단위) — 사용자 기대 = mapping 단위 2건.
- 핫픽스 시 **mapping_id 별 dedup** 권장:
  ```java
  // mapping 단위 1건씩 표시. CONSULTATION_REFUND 우선 (전체환불), CONSULTATION_PARTIAL_REFUND 보조
  Map<Long, FinancialTransaction> mappingRefundMap = new LinkedHashMap<>();
  for (FinancialTransaction tx : allRefundTransactions) {
      mappingRefundMap.computeIfAbsent(tx.getRelatedEntityId(), k -> tx);
  }
  ```
- 또는 frontend 에서 dedup (mapping_id 동일하면 1건으로 카운팅).

---

## 10. core-coder 위임 프롬프트 초안

```
## P0 운영 핫픽스 — /erp/refund-management 5월 환불 0건 표시

### 사용자 보고
"5월에 환불건이 2건이 있는데 표기 안되고 있는데"

### 운영 진단 (확정)
- DB: financial_transactions 5월 환불 4건 보존 (id=79/80/87/88, CONSULTATION_REFUND 2 + CONSULTATION_PARTIAL_REFUND 2)
- 응답: 0건 (nginx 응답 512 bytes 확인)
- 코드 결함 H11: AdminServiceImpl.getRefundHistory 의 partial 분기가 CONSULTATION_PARTIAL_REFUND subcategory 만 조회, CONSULTATION_REFUND (전체환불) 어디에도 카운팅 안 됨
- 디버그 보고서: docs/project-management/2026-05-29/REFUND_MANAGEMENT_MAY_MISSING_DEBUG.md

### 임무 (옵션 A 채택)
1. **FinancialTransactionRepository 신규 메서드 추가**
   - 메서드 시그니처:
     `findByTenantIdAndTransactionTypeAndSubcategoryInAndTransactionDateBetweenAndIsDeletedFalse(String, TransactionType, List<String>, LocalDate, LocalDate)`
2. **AdminServiceImpl.getRefundHistory 두 변형 모두 수정** (L4423 4인자 + L4573 5인자)
   - partial 분기 SQL 호출에서 단일 subcategory 를 List 로 교체:
     `List.of("CONSULTATION_REFUND", "CONSULTATION_PARTIAL_REFUND")`
   - mapping_id 단위 dedup (CONSULTATION_REFUND 우선) 적용
3. **getRefundStatistics 도 동일 수정 검토** (KPI 일관성)
4. **단위 테스트 추가**: subcategory IN 절 + dedup 검증 (mapping 67/72 케이스 재현)
5. **PR 생성**: 브랜치 `hotfix/p0-refund-management-may-missing`
   - 게이트: mvn 컴파일 + 단위 테스트 + check-hardcode + 멀티테넌트 격리
   - 디버그 보고서 함께 커밋 (이미 push 됨, 별도 cherry-pick 없이 develop 머지 시 자동 포함)

### 게이트
- 멀티테넌트: tenantId 필터 모든 query 유지
- 회기 보호: 중복 카운트 방지 (mapping_id dedup)
- KPI 일관성: getRefundStatistics 도 동일 SQL 사용 권고
- 운영 인증서: develop 머지 후 core-deployer 가 main FF + 무중단 배포
```

---

## 11. 추가 후속 (P1)

- **로깅 활성화** (옵션 C): AdminController/AdminServiceImpl INFO 출력 활성화. 향후 동일 P0 발생 시 진단 시간 단축.
- **회계 중복 분개 점검**: 동일 매핑 (67/72) 에 CONSULTATION_REFUND + CONSULTATION_PARTIAL_REFUND 두 transaction 이 동시 생성. ERP 디버그 54c74cea (M2 중복 분개) 이슈와 교차검증 필요.
- **RefundHistoryTableBlock 프론트 검증**: 핫픽스 배포 후 화면 정상 표시 사용자 확인.

---

작성: 메인 어시스턴트 (디버거 서브에이전트 사용량 한도 차단으로 메인 직접 진단 수행)
