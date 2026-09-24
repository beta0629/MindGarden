# Clinic OS — rem=0 + ERP 금액 공존 / 환불 거절 RCA

**작성**: core-debugger (RCA ONLY)  
**브랜치**: `cursor/rca-clinic-os-erp-rem-mismatch-4d3b`  
**기준 tip**: `1d8095de5` ≡ `origin/release/prod`  
**범위**: 코드 경로 확인. DB heal 없음. Fix PR 없음.

---

## 확인 결과 (사실)

| # | 주장 | 판정 | 근거 |
|---|------|------|------|
| 1 | `status=SESSIONS_EXHAUSTED` 시 환불 클릭 → ACTIVE 가드가 먼저 | **확인** | `MappingManagementPage.handleRefundMapping` L475–477: `status !== 'ACTIVE'` → `msgRefundOnlyActive` |
| 2 | `status=ACTIVE` + `rem<=0` → rem 가드 | **확인** | 동 메서드 L479–481 → `msgRefundNoRemaining` |
| 3 | 백엔드 `partialRefundMapping`도 rem 게이트 | **확인** | `AdminServiceImpl` L7995–8002: `refundSessions<=0` / `refundSessions > remainingSessions` |
| 4 | `useSession`이 ERP INCOME을 되돌리지 않음 | **확인** | `ConsultantClientMapping.useSession` L250–260: rem/used/status만 변경 |
| 5 | `erpTotalAmount = SUM(INCOME)-SUM(refund EXPENSE)` | **확인** | `AmountManagementServiceImpl.checkAmountConsistency` L248–266 |
| 6 | UI 금액은 흔히 `packagePrice` | **확인** | `MappingListRow` / `MappingTableView`: `packagePrice \|\| paymentAmount` |

메시지 문자열(ko):

- `admin:mapping.page.msgRefundOnlyActive` = 「활성 상태의 배정만 환불 처리할 수 있습니다.」
- `admin:mapping.page.msgRefundNoRemaining` = 「남은 회기가 없는 배정은 환불 처리할 수 없습니다.」

---

## Parent 전달용 요약

### Exact first reject (전형: rem=0 after full use)

전회기 소진 후 `ConsultantClientMapping.useSession()`이 `remainingSessions<=0`이면 `status=SESSIONS_EXHAUSTED`로 전이한다.  
관리자가 「환불」(`onRefund` → `handleRefundMapping`)을 누르면 **첫 거절은 L475 `status !== 'ACTIVE'`** 이며, 메시지 **「활성 상태의 배정만 환불 처리할 수 있습니다.」**  
(rem 가드 L479는 이 경로에 도달하지 않음.)

예외 경로(가설): 상태만 ACTIVE로 남고 rem=0인 desync면 L479 rem 메시지. 백엔드까지 오면 L7999 `refundSessions > remainingSessions`.

### Why rem0 + ERP 250k coexist (1 sentence)

입금/결제로 ERP `INCOME`(및 매핑 `packagePrice`≈250000)이 잡힌 뒤, 회기 차감은 `useSession`이 rem·status만 줄이고 환불 EXPENSE를 만들지 않으므로 `erpTotalAmount`/`packagePrice`는 그대로 남는 설계(회기 SSOT ≠ 원장 잔액 자동 상계).

### IDENTIFIERS

`IDENTIFIERS=TBD` (실측 mappingId / FT id / tenant 없음 — 가설만)

### Verdict

**Fix PR 불필요 (likely NO — by design SSOT).**  
회기 소진은 매핑 회기·상태 SSOT이고, ERP 금액은 FinancialTransaction 원장 SSOT이며, 환불 API는 **미사용 잔여 회기**에만 허용한다. rem=0+ERP잔액은 버그라기보다 「서비스 완료(회기 소진) ≠ 미환불 원장」공존이다.

---

## 재현 절차 (코드 기준)

1. 패키지 결제/입금 확인으로 ACTIVE + rem=N, ERP INCOME≈packagePrice.
2. 상담 완료 등으로 `useSession` N회 → rem=0, status=`SESSIONS_EXHAUSTED`.
3. 매핑 관리 「환불」클릭.
4. 기대: warning 「활성 상태의 배정만 환불 처리할 수 있습니다.」 (API 미호출).

---

## 부수 관찰 (버그 아님 / UX)

- `buildMappingEntityActionItems`는 status로 「환불」버튼을 숨기지 않음 → 클릭 후 가드. 회의록(`REFUND_SYSTEM_MEETING_RESULT`)은 TERMINATED/SESSIONS_EXHAUSTED 비노출을 언급하나, 본 RCA 범위의 rem/ERP 공존과는 별개 UX.
- 백엔드 `partialRefundMapping` closed 가드는 TERMINATED/CANCELLED만 — SESSIONS_EXHAUSTED는 FE ACTIVE 가드·rem 가드에 의존. FE 우회 시 rem=0이면 L7999에서 거절.

---

## 체크리스트 (부모/운영)

- [ ] 실측 시 mappingId·status·remainingSessions·packagePrice·FT INCOME/refund EXPENSE 스냅샷 → IDENTIFIERS 채움
- [ ] DB heal / partial-refund 강제 호출 금지
- [ ] Fix PR 열지 않음 (제품이 「소진 후 원장 환불」을 새로 요구하면 그때 별도 기획)
