# 옵션 B v2.0 통합 스케줄링 테스트 매트릭스 — 80+ 케이스

**작성일**: 2026-05-28
**작성자**: core-planner
**연관 합의서**: `OPTION_B_RESERVATION_FIRST_PLAN_V2.md` §7·§8
**목적**: 사용자 강력 요구 ("통합 스케줄링은 우리 시스템의 꽃이야. 절대 오류 있으면 안 돼. 과할 정도로 테스트가 진행이 되어야 해") 반영. 80+ 케이스 전수 매트릭스로 옵션 B v2.0 의 모든 결함·회귀·운영 시나리오를 차단.

---

## §0 매트릭스 요약

| 섹션 | 분류 | 케이스 수 | 누적 |
|---|---|---|---|
| §1 | 백엔드 단위 — `checkoutSameDayCard` (A 결함 + 멱등성) | 15 | 15 |
| §2 | 백엔드 단위 — `createConsultantSchedule` (B 결함 + mapping_id wiring) | 9 | 24 |
| §3 | 백엔드 단위 — `terminateMapping` (R4 + 회귀) | 5 | 29 |
| §4 | 백엔드 단위 — 멀티테넌트 격리 + Repository/DTO | 7 | 36 |
| §5 | 프론트 RTL — `IntegratedMatchingSchedule` | 6 | 42 |
| §6 | 프론트 RTL — `MappingMatchActions` + `CardActionGroup` | 5 | 47 |
| §7 | 프론트 RTL — `MappingCancelModal` | 5 | 52 |
| §8 | 프론트 RTL — `sameDayPendingEventDecorator` | 4 | 56 |
| §9 | 프론트 RTL — `CheckoutSameDayModal` | 4 | 60 |
| §10 | E2E (Cypress 또는 Playwright) | 8 | 68 |
| §11 | 회귀 + 성능 | 5 | 73 |
| §12 | 운영 시뮬레이션 | 3 | 76 |
| §13 | 디버그/장애 시나리오 | 6 | 82 |
| §14 | 사용자 dev 검증 체크리스트 | 8~10 | — |

→ **총 82 자동화 케이스 + 8~10 수동 사용자 체크리스트**

---

## §1 백엔드 단위 — `checkoutSameDayCard` (15건)

> 결함 A (TenantContext clear 401) + 멱등성 가드 + 회기 부여/차감 + 회계 거래 정합

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 흐름 | PENDING_PAYMENT + SAME_DAY_CARD + remaining=0 + 가예약 1건 | confirmPayment + confirmDeposit + approveMapping 자동 연속 PASS, ACTIVE 전이, 회기 부여+1회 차감, SESSION_USED history, 일정 CONFIRMED |
| 2 | TenantContext save/restore | confirmPayment 종료 직후 confirmDeposit 진입 | ThreadLocal 의 tenantId 보존, IllegalStateException 미발생 (A 결함 fix) |
| 3 | 멱등성 가드 — 동일 매칭 2회 호출 | 첫 번째 PASS 후 같은 매칭 ID 재호출 | 두 번째는 차단 (IllegalStateException 또는 멱등 정상 무동작), 회계 거래 중복 0 |
| 4 | 부분 실패 보상 | confirmPayment 성공 + confirmDeposit 강제 실패 | `@Transactional` REQUIRES_NEW 경계 검증 — 회계 거래 rollback 또는 보상 트랜잭션 실행 |
| 5 | 동시성 — 같은 매칭 2 thread | 동시 호출 | `@Version` OptimisticLock 한 쪽만 성공, 다른 쪽 OptimisticLockException |
| 6 | 회기 부여 동시성 | 동일 매칭 회기 grant + deduct 동시 | 낙관적 잠금 PASS, 잔여 회기 = n-1 보장 |
| 7 | 결제 금액 불일치 | amount ≠ packagePrice | 경고 로그 또는 차단 정책 검증 (정책 결정 후 케이스 보강) |
| 8 | paymentMethod 분기 | 신용카드 / 체크카드 / 기타 | 각각 financial_transactions.method 정합 + 매출 분개 정합 |
| 9 | sameDaySessionScheduleId NULL | 가예약 미지정 | 첫 가예약 자동 확정 (정책 SSOT 검증) |
| 10 | sameDaySessionScheduleId 지정 | 특정 일정 ID | 해당 일정만 CONFIRMED, 다른 가예약 그대로 TENTATIVE_PENDING_PAYMENT |
| 11 | 매칭 status ≠ PENDING_PAYMENT | ACTIVE 또는 TERMINATED 매칭 재시도 | 차단 (IllegalStateException) |
| 12 | paymentTiming ≠ SAME_DAY_CARD | 옵션 A(ADVANCE) 매칭 잘못 진입 | 차단 (정책 위반) |
| 13 | tenant_id NULL fail-safe | 매칭 tenant_id NULL | 명확한 에러 + 회계 거래 미생성 |
| 14 | 결제 금액 음수 | amount < 0 | 차단 (validator) |
| 15 | 결제 승인번호 빈 문자열 | paymentReference="" | 차단 (validator) |

---

## §2 백엔드 단위 — `createConsultantSchedule` (9건)

> 결함 B (`setMappingId` 미호출) + mapping_id wiring + tentativeBeforeDeposit 자동 분기

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 16 | setMappingId 호출 검증 (3 오버로드) | 매칭 1건 존재 + 일정 생성 | 모든 오버로드에서 schedules.mapping_id 정착 (B 결함 fix) |
| 17 | mapping_id NULL 보존 | 매칭 없는 일반 일정 | mapping_id NULL 정상 (회귀 0) |
| 18 | 매칭 다수 후보 resolve | 동일 (consultant, client) 매칭 다수 | 신규 헬퍼의 resolve 정책 (가장 최근 PENDING_PAYMENT + SAME_DAY_CARD 우선) PASS |
| 19 | TENTATIVE_PENDING_PAYMENT + 매칭 자동 연결 | tentativeBeforeDeposit=true | mapping_id 자동 wiring + status=TENTATIVE_PENDING_PAYMENT |
| 20 | ACTIVE 매칭 + remaining>0 | 일반 예약 | BOOKED 일정 + setMappingId 정상 |
| 21 | PENDING_PAYMENT + ADVANCE 차단 | 옵션 A 매칭 + 가예약 시도 | 차단 (회귀 0) |
| 22 | 백엔드 자동 강제 분기 | PENDING_PAYMENT + SAME_DAY_CARD + tentativeBeforeDeposit=false (프론트 누락) | `resolveEffectiveTentativeBeforeDeposit` 자동 강제 분기, 가예약 생성 PASS |
| 23 | TENTATIVE_PENDING_PAYMENT → CONFIRMED 전환 시 mapping_id 보존 | checkoutSameDayCard 트랜잭션 | 전환 후에도 mapping_id 유지 |
| 24 | 일정 status 매트릭스 | TENTATIVE / TENTATIVE_PENDING_PAYMENT / BOOKED / CONFIRMED / CANCELLED 각각 | setMappingId 동작 정합 |

---

## §3 백엔드 단위 — `terminateMapping` (5건)

> R4 매칭 취소 + 기존 ACTIVE 종료 회귀

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 25 | PENDING_PAYMENT + SAME_DAY_CARD + remaining=0 | R4 디러티 매칭 취소 | TERMINATED + 가예약 CANCELLED + paymentStatus REJECTED + audit log |
| 26 | PENDING_PAYMENT + ADVANCE + remaining=0 | 옵션 A 잔존 매칭 | TERMINATED 정상 (Q5 R4 UI 정리) |
| 27 | ACTIVE + remaining>0 | 기존 활성 매칭 종료 | TERMINATED + 환불 트리거 (기존 흐름 회귀 0) |
| 28 | 매칭 1건 + 가예약 다수 | 매칭당 가예약 N건 | 모두 CANCELLED + mappingId 일치 가드 (다른 매칭 가예약 영향 0) |
| 29 | 격리 — 다른 매칭 가예약 영향 0 | 매칭 A 취소 시 매칭 B 가예약 | 영향 0 |

---

## §4 백엔드 단위 — 멀티테넌트 + Repository/DTO (7건)

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 30 | 테넌트 격리 — A→B 침범 | 테넌트 A 매칭을 테넌트 B 어드민이 조회/수정/취소 | 403 또는 NotFound |
| 31 | Repository tenant_id 가드 | 모든 매핑·일정·결제 Repository 쿼리 | tenant_id 필터 명시 (정적 분석 또는 통합 테스트) |
| 32 | TenantContext 보존 후 다른 테넌트 누출 0 | checkoutSameDayCard 종료 후 별 테넌트 요청 | 노출 0 (save/restore 패턴 검증) |
| 33 | `ScheduleResponse` DTO 직렬화 | status 필드 | 프론트 점선 분기 의존 — 직렬화 정합 |
| 34 | `ConsultantClientMapping` DTO paymentTiming | SAME_DAY_CARD / ADVANCE / NULL | JSON 직렬화 정합 (PR #54 회귀) |
| 35 | 일정 목록 API 응답 | mapping_id + extendedProps.status | 직렬화 정합 |
| 36 | snake_case ↔ camelCase 변환 | 모든 필드 | 일관성 보장 |

---

## §5 프론트 RTL — `IntegratedMatchingSchedule` (6건)

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 37 | handleScheduleCreated 후 자동 모달 오픈 0 | 가예약 일정 생성 직후 | CheckoutSameDayModal 자동 오픈 0 (UX 핫픽스) |
| 38 | 토스트 안내 노출 (SAME_DAY_CARD) | paymentTiming=SAME_DAY_CARD | "당일 결제 + 활성화" 안내 토스트 |
| 39 | 사이드바 → 캘린더 드래그/드롭 | preFilledMapping 전파 | ScheduleModal 오픈 + 매칭 정보 prefill |
| 40 | "당일 결제 + 활성화" 버튼 클릭 | 사이드바 카드 | CheckoutSameDayModal 정상 오픈 |
| 41 | 결제 완료 후 사이드바 갱신 | API 성공 응답 | 사이드바 카드 사라짐 (loadMappings 갱신) |
| 42 | handleMappingCreated 후 자동 모달 오픈 0 | 매칭 생성 직후 | 자동 모달 0 (PR #54 회귀) |

---

## §6 프론트 RTL — `MappingMatchActions` + `CardActionGroup` (5건)

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 43 | PENDING_PAYMENT + SAME_DAY_CARD | 사이드바 카드 | "당일 결제 + 활성화" 버튼 + "매칭 취소" 텍스트 링크 |
| 44 | PENDING_PAYMENT + ADVANCE | 옵션 A 잔존 | "결제 확인" 버튼 + "매칭 취소" 텍스트 링크 |
| 45 | ACTIVE | 일반 매칭 | 일반 액션 + "매칭 취소" 미노출 (회귀 0) |
| 46 | TERMINATED | 종료된 매칭 | 액션 미노출 |
| 47 | 텍스트 링크 클릭 | 매칭 취소 | MappingCancelModal 오픈 |

---

## §7 프론트 RTL — `MappingCancelModal` (5건)

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 48 | 확인 클릭 | 모달 오픈 + 확인 | terminateMapping API 호출 + onCancelled callback |
| 49 | 취소 클릭 | 모달 오픈 + 취소 | 닫힘 + API 호출 0 |
| 50 | UnifiedModal 사용 | DOM 검증 | 커스텀 오버레이 사용 0 |
| 51 | AlertTriangle 아이콘 | DOM 검증 | 경고 아이콘 노출 |
| 52 | i18n 5 시드 키 | `admin:mapping.cancel.modal.*` | 모든 키 매칭 |

---

## §8 프론트 RTL — `sameDayPendingEventDecorator` (4건)

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 53 | TENTATIVE_PENDING_PAYMENT 점선 | event.extendedProps.status === 'TENTATIVE_PENDING_PAYMENT' | 점선 클래스 부여 + prefix |
| 54 | mapping_id NULL 일 때 status 분기 | mapping_id 누락 + status='TENTATIVE_PENDING_PAYMENT' | 점선 분기 동작 (B 결함 fix 보강) |
| 55 | CONFIRMED 솔리드 | status='CONFIRMED' | 점선 클래스 미부여 |
| 56 | 다크 모드 cascade | dark theme | 토큰 cascade 정상 |

---

## §9 프론트 RTL — `CheckoutSameDayModal` (4건)

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 57 | 필수 props 가드 | mapping.id / consultantId / packageName 누락 | 가드 작동 (PR #47 회귀) |
| 58 | 결제 금액 자동 채움 | packagePrice 존재 | input value 자동 prefill |
| 59 | 결제 승인번호 placeholder | input | "예: 12345678" placeholder 노출 |
| 60 | 사용자 재시도 안내 토스트 | 백엔드 멱등성 가드 응답 | "이미 처리 중입니다. 새 매칭 카드로 확인하세요." 토스트 (Q6) |

---

## §10 E2E 시나리오 (Cypress 또는 Playwright) (8건)

| # | 케이스 | 흐름 | 기대 결과 |
|---|---|---|---|
| 61 | 옵션 B 전체 흐름 | 매칭 생성 → 사이드바 → 드래그 → 시간 설정 → 예약 완료 → 당일 결제 + 활성화 | DB 수준 검증 — 매칭 ACTIVE / 일정 CONFIRMED / 회기 부여+차감 / SESSION_USED history / 회계 거래 1건 |
| 62 | 매칭 취소 흐름 (R4) | 생성 → 사이드바 카드 취소 → 확인 모달 → API | DB 검증 — 매칭 TERMINATED / 가예약 CANCELLED / paymentStatus REJECTED |
| 63 | 옵션 A 흐름 회귀 0 | 선납 입금 흐름 전체 | 회귀 0 (기존 동작 보존) |
| 64 | 동시 어드민 2명 결제 시도 | 같은 매칭 동시 결제 | 한 쪽만 성공, 다른 쪽 명확한 에러 (멱등성) |
| 65 | 네트워크 끊김 재시도 | 결제 후 네트워크 끊김 + 재시도 | 멱등성 보장 — 중복 결제 0 |
| 66 | 세션 만료 후 재로그인 | 세션 만료 + 재로그인 | 옵션 B 흐름 정상 재개 |
| 67 | 다중 테넌트 격리 E2E | 테넌트 A 어드민 → 테넌트 B 매칭 시도 | 403 |
| 68 | 모바일 반응형 | 사이드바 280-320px | 텍스트 링크 줄바꿈 0, 영역 이탈 0 |

---

## §11 회귀 + 성능 (5건)

| # | 케이스 | 검증 대상 | 기대 결과 |
|---|---|---|---|
| 69 | 옵션 A ADVANCE 회귀 0 | 단위 + E2E | 기존 흐름 정상 |
| 70 | ACTIVE 매칭 일반 예약 회귀 0 | 단위 + E2E | 기존 흐름 정상 |
| 71 | 멀티테넌트 격리 회귀 0 | 단위 + E2E | 격리 보장 |
| 72 | 동시 요청 100건 stress test | k6 또는 Gatling | p95 응답 시간 < 2s, 에러율 < 0.1% |
| 73 | DailyStatistics 카운트 정합 | R6 통계 | 옵션 B 통합 후 매칭/결제 카운트 정합 |

---

## §12 운영 시뮬레이션 (3건)

| # | 케이스 | 검증 대상 | 기대 결과 |
|---|---|---|---|
| 74 | dev DB 매칭 #91~98 회계 거래 transactionId=109 중복 검증 | 현행 데이터 | 단건 commit 확인 (멱등성 가드 도입 전 base line) |
| 75 | dev 매칭 #98 부분 commit + 401 정합 검증 | financial_transactions / accounting / alerts | 부분 commit 항목 식별 + 정합 검증 |
| 76 | PROD 반영 전 staging-like dev 검증 체크리스트 | §14 사용자 시나리오 | 사용자 PASS |

---

## §13 디버그/장애 시나리오 (6건)

| # | 케이스 | 입력 / 사전조건 | 기대 결과 |
|---|---|---|---|
| 77 | tenant_id NULL fail-safe | 잘못된 매칭 | 401 또는 명확한 에러 (현재처럼 401 보존) |
| 78 | 결제 금액 ≠ packagePrice | amount mismatch | 경고 로그 또는 차단 (정책 결정) |
| 79 | 가예약 다수 정책 | 같은 매칭에 가예약 2건 시도 | 정책 결정 후 케이스 보강 (현행 미정 — 별도 결재 권장) |
| 80 | 결제 승인번호 중복 | 같은 paymentReference 재사용 | 차단 또는 경고 |
| 81 | 결제 후 ACTIVE 전이 실패 | approveMapping 강제 실패 | 자동 보상 또는 명확한 에러 + audit log |
| 82 | SMS_GATE tenant=null 회귀 | 일반 흐름 SMS 발송 | 회귀 0 (기존 동작 보존) |

---

## §14 사용자 dev 검증 체크리스트 (수동, 8~10 시나리오)

> 사용자가 직접 dev 환경에서 PASS 확인 후 운영 반영 (Q12 권장).

### 필수 PASS 시나리오

- [ ] **[1] 옵션 B 정상 흐름**: 매칭 생성(상담사→내담자→패키지→사후 카드) → 사이드바 카드 확인(점선 또는 색 톤 차이) → 캘린더 드래그/드롭 → 시간 설정 → 예약 완료 → 캘린더 점선 + prefix 시각 확인 → "당일 결제 + 활성화" 클릭 → 결제 완료 → ACTIVE 전이 + 캘린더 솔리드 전환 + 토스트
- [ ] **[2] 결제 모달 자동 오픈 0 회귀**: 매칭 생성 직후 / 가예약 일정 생성 직후 결제 모달 자동 오픈 0
- [ ] **[3] 사용자 재시도 멱등성**: 결제 진행 중 네트워크 끊김 시뮬레이션 → 재시도 → 회계 거래 1건 보장 + "이미 처리 중입니다" 토스트
- [ ] **[4] 매칭 취소 (R4)**: PENDING_PAYMENT 매칭 사이드바 "매칭 취소" 텍스트 링크 → 확인 모달 → 확인 → 매칭 TERMINATED + 가예약 CANCELLED
- [ ] **[5] 옵션 A (선납 입금) 회귀 0**: 기존 옵션 A 흐름 정상 작동
- [ ] **[6] 캘린더 시각 분기**: TENTATIVE_PENDING_PAYMENT (점선 + prefix) vs CONFIRMED (솔리드) vs ACTIVE 일반 일정 (솔리드) 시각 차이 명확
- [ ] **[7] 다크 모드**: 모든 시각 토큰 cascade 정상 (점선·prefix·텍스트 링크 색상)
- [ ] **[8] dev DB 회계 거래 transactionId=109 정합**: 멱등성 가드 도입 후 동일 매칭 재시도 시 financial_transactions 단건 commit 보장
- [ ] **[9]** (선택) 모바일 반응형 (사이드바 280-320px): 텍스트 링크 줄바꿈 0
- [ ] **[10]** (선택) 다중 테넌트 격리: 테넌트 A 어드민 로그인 후 다른 테넌트 매칭 직접 URL 접근 시 차단

### 사용자 결재 절차

1. core-coder 머지 + core-tester 매트릭스 PASS 보고서 (`OPTION_B_V2_REGRESSION_REPORT.md`) 수령
2. 사용자가 dev 환경에서 위 [1]~[8] 필수 시나리오 직접 PASS 확인 (선택 [9]·[10] 시간 허용 시 추가)
3. 미통과 시나리오 1건이라도 존재 → 운영 반영 차단 + 코더 재작업 위임
4. 모두 PASS → blue 슬롯 검증 모드 배포 → cutover

---

## §15 매트릭스 가드 (메타)

- **하드코딩 금지**: 모든 색상·여백은 `unified-design-tokens.css` SSOT 토큰
- **i18n 시드**: `npm run check:i18n-seed` PASS
- **D11 가드**: PASS
- **회귀 가드**: PR 머지 전 `./gradlew test --tests "*Mapping*" --tests "*Schedule*" --tests "*Session*"` PASS
- **테스터 보고서**: `OPTION_B_V2_REGRESSION_REPORT.md` 모든 매트릭스 PASS/FAIL 정착
- **사용자 결재 단계**: §14 체크리스트 PASS 후 운영 반영
