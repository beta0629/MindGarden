# 기관 월계약 바우처 — 기획·오케스트레이션 (SSOT)

**작성**: core-planner · 2026-09-14  
**상태**: 기획 산출 (오늘 **코드 구현 없음**)  
**브랜치**: `cursor/monthly-institution-voucher-da06` (사용자 제안명 `cursor/monthly-institution-voucher-7f13` 대응. `cursor/institution-voucher-7f13` **미존재** 확인 후 별 브랜치)  
**베이스**: `deploy/dev-991-998-999-1000` (`4893c598b`)  
**금지**: `deploy/dev-991-998-999-1000` 푸시 · `gh pr create` · GitHub Actions 트리거 · 운영 DB UPDATE · SSH 배포

---

## 1. 제목·목표

기관 바우처는 **월 단위 계약**(기간·월별 한도/정산·기관 연계)이다. 현재 회기권 SSOT(`totalSessions` / `usedSessions` / `remainingSessions` / `sessionSequence` / `SESSIONS_EXHAUSTED` / 회기 소진 시 일정·일지 차단)로 흉내 내면 **최가을 사례가 반복**된다. 목표는 월계약을 **별도 도메인 SSOT**로 두고, 회기 차감으로 바우처를 흉내 내지 않는 것이다.

## 2. 사용자 전제 (이번 배치의 핵심)

> 「기관 바우처는 보통 월단위로 계약이 이뤄지니까 현재 시스템과는 많이 바뀔 거야.」

현장 시나리오(기획 입력, 원인 단정은 **core-debugger 의뢰**):

1. 월결제 예정이라 가예약(`SAME_DAY_CARD`)으로 잡으려 함
2. 가예약 일정 저장 실패 → 16:00 일반 `CONFIRMED`로 상담 진행
3. `remainingSessions=0` + `sessionSequence` null → 상담일지 작성 실패

이 시나리오는 **회기권 모델에 월계약을 억지로 얹은 결과**로 읽는다. 응급 일지 픽스와 **월바우처 SSOT는 다른 트랙**이다.

## 3. 사용자 관점 (기획 §0.4 — 디자이너 전달용 초안)

| 항목 | 내용 |
|------|------|
| **사용성** | 관리자: 기관·계약 월·기간을 먼저 고르고 매칭·일정을 잡는다. 상담사: 계약이 살아있는 달이면 일지 작성이 막히지 않는다. 내담자: 「남은 N회」보다 **이번 달 이용 가능 여부**가 먼저다. |
| **정보 노출** | 관리자/STAFF: 기관명, 계약 기간, 당월 한도·사용량(한도가 있을 때만), 정산 상태. 상담사: 당월 가능 여부·회차 라벨. 내담자: 계약 월·이용 가능. 기관 담당: 월 정산 요약. **패키지 잔여 회기를 기관 바우처에 노출하지 않음.** |
| **레이아웃** | 신규 어드민 화면이 생기면 **AdminCommonLayout** 필수(본문은 children, title/loading만 페이지별). 목록은 카드형 우선·반응형 기본. 이번 배치는 **화면 구현 없음** — 시안은 다음 슬라이스에서 core-designer. |

## 4. 범위

### 4.1 포함 (오늘)

- 회기권 → 월계약으로 바꿀 때 **깨지는 면 목록화**
- 목표 도메인 스케치 (월계약 SSOT)
- 형제 트랙과의 **경계** (응급 일지 픽스·잔여 표시 SSOT)
- 다음 슬라이스 분배실행 표
- 하드코딩 게이트 인용

### 4.2 제외 (오늘)

- Java/JS/SQL **구현·패치**
- 회기 `remainingSessions` 우회·백필·응급 일지 로직
- `cursor/provisional-log-session-number-7f13` 커밋/파일
- `cursor/remaining-session-display-ssot-7f13` 표시 SSOT 덮어쓰기
- PR·Actions·운영 DB

### 4.3 영향 영역 (이후 슬라이스, 구현 시)

매핑 상태, 결제/`PENDING_PAYMENT`, 가예약, 스케줄 저장, 일지 회차, 목록「잔여」, 완료처리, ERP 정산. 역할: ADMIN/STAFF(계약·정산), CONSULTANT(일정·일지), CLIENT(이용 가능), 기관 담당(월 정산).

## 5. 형제 트랙 — 섞지 말 것

| 트랙 | 브랜치 | 역할 | 이 문서와의 관계 |
|------|--------|------|------------------|
| 가예약 rem=0 일지 응급 픽스 | `cursor/provisional-log-session-number-7f13` | 일지 작성 차단 응급 | **월바우처 SSOT 아님.** 커밋·파일 금지 |
| 잔여 회기 표시 SSOT | `cursor/remaining-session-display-ssot-7f13` | 스케줄 상세 잔여 = 매핑 `remainingSessions` | 회기권 표시 정합. 월계약 UI와 별개 |
| 기관연계 인벤토리 (형제 플래너) | `cursor/institution-voucher-7f13` | 기관 슬라이스 | **존재.** 로컬 tip `d67aa1793`(origin/main 계열 ops 커밋). **덮어쓰지 않음.** 월계약 문서는 본 브랜치에만 둠 |
| 본 기획 | `cursor/monthly-institution-voucher-da06` | 월계약 도메인 기획 | 문서만. 베이스 `deploy/dev-991-998-999-1000` |

## 6. 의존성·순서

1. **도메인 합의**(본 문서 + 스케치 + ADR-0005 Proposed) — 오늘
2. explore: 깨지는 면 포인터 전수 확인 (코드 수정 없음)
3. core-debugger: 최가을 경로를 월계약 전제로 **재해석** (응급 픽스 파일 수정 금지)
4. PO: 월한도 유무·정산 시점·기관 엔티티 범위 확정
5. `/core-solution-database-first`: 월계약 테이블·테넌트 격리 설계 **후** 백엔드
6. 새 도메인 모듈만 core-coder (회기 엔티티 패치로 흉내 금지)
7. core-designer: 계약/정산 UI (AdminCommonLayout)
8. core-tester: 월계약 vs 회기권 **공존** 회귀

선행 표준: `/core-solution-business-flow`(5단계 파이프라인은 **패키지 회기권** 전제 — 월계약은 3~5단계가 바뀜), `/core-solution-erp`, `/core-solution-multi-tenant`, `/core-solution-database-first`.

## 7. 현재 회기권 모델에서 깨지는 면

아래는 **기획이 위임할 면 목록**이다. 라인 단위 원인 단정·수정안은 Phase의 explore / core-debugger가 수행한다.

### 7.1 매핑 상태

| 현재 (회기권) | 월계약에서 깨지는 점 | 위임 포인터 |
|---------------|----------------------|-------------|
| `PENDING_PAYMENT` → 결제/입금 → `ACTIVE` | 월 정산·기관 청구와 개인 결제 파이프가 다름 | `ConsultantClientMapping.MappingStatus` |
| `ACTIVE` + `remainingSessions > 0` = 이용 가능 | 월계약은 **당월 커버리지**가 이용 가능. rem은 SSOT가 아님 | `isActive()` / `canScheduleForMapping` |
| rem→0 → `SESSIONS_EXHAUSTED` | 월말·한도 소진·계약 종료는 **다른 전이**. 회기 소진으로 묶으면 일지·일정 차단이 재발 | `useSession()` / `SESSIONS_EXHAUSTED` |
| 패키지 `total/used/remaining` 불변식 | 월 한도가 없거나 월마다 리셋되면 불변식이 성립하지 않음 | 매핑 컬럼 `total_sessions` 등 |

### 7.2 결제 / `PENDING_PAYMENT`

| 현재 | 월계약에서 깨지는 점 | 위임 포인터 |
|------|----------------------|-------------|
| `confirm-payment` / `confirm-deposit` / 원샷 활성화 | 기관은 **월 단위 청구·입금**. 매핑 1건 = 패키지 1회 결제와 불일치 | `MAPPING_ONESHOT_PAYMENT_ACTIVATE_PLAN.md`, `AdminServiceImpl` |
| `paymentTiming` `ADVANCE` vs `SAME_DAY_CARD` | 월결제를 SAME_DAY_CARD 가예약으로 우회하면 최가을 경로가 재현됨 | `ScheduleServiceImpl` SAME_DAY 분기 |
| 미수금(RECEIVABLES) 매핑 단위 | 기관 월 인보이스 단위가 필요 | ERP `confirmPayment` 3인자 경로 |

### 7.3 가예약

| 현재 | 월계약에서 깨지는 점 | 위임 포인터 |
|------|----------------------|-------------|
| `TENTATIVE_PENDING_PAYMENT` + SAME_DAY, rem 검증 우회 | 월계약은 「결제 전 슬롯」이 아니라 「계약월 안 슬롯」 | 가예약 인벤토리 20260506 첨부 |
| 가예약은 `sessionSequence` null이 흔함 | 일지가 `sessionSequence` 필수면 월계약 상담도 막힘 | `ConsultationRecordServiceImpl.assertSessionNumberMatchesSchedule` |
| occupying 가드(동일 쌍 재등록 차단) | 월계약 다회 일정과 가예약 1건 전제가 충돌할 수 있음 | `ScheduleStatusOccupiesForProvisionalMappingGuard` |

### 7.4 스케줄 저장

| 현재 | 월계약에서 깨지는 점 | 위임 포인터 |
|------|----------------------|-------------|
| 저장 전 `validateRemainingSessions` | rem=0이면 CONFIRMED 저장 실패 → 현장은 우회 저장/진행 | `ScheduleServiceImpl` create 경로 |
| 저장 후 `useSessionForMapping` 차감 | 월계약은 차감이 SSOT가 아님. 차감하면 한 달 안에 rem=0 | ADR-0002 |
| 가예약 실패 후 일반 CONFIRMED | 회기권 가드와 월결제 의도 불일치 | 최가을 시나리오 → debugger |

### 7.5 일지 회차

| 현재 | 월계약에서 깨지는 점 | 위임 포인터 |
|------|----------------------|-------------|
| `sessionNumber` 필수, 기본값 1 금지 | 회차 출처가 매핑 잔여 산식 | `requireSessionNumber` |
| 요청 회차 = `Schedule.sessionSequence` | sequence null이면 작성 실패 | `assertSessionNumberMatchesSchedule` |
| 회차 = `total - remaining + 1` (차감 직전) | 월계약 회차는 **해당 월(또는 계약) 내 서수**일 수 있음 | `ScheduleServiceImpl` 회차 산식 |

### 7.6 목록 「잔여」

| 현재 | 월계약에서 깨지는 점 | 위임 포인터 |
|------|----------------------|-------------|
| 사이드바 「회기 남은 매칭만」 `remainingSessions > 0` | 월계약 매칭이 목록에서 사라짐 | `integratedScheduleSidebarFilterConstants.js`, 테스트 플랜 |
| 카드/모달 「남은 회기 N」 | 기관 바우처에 잔여 회기 카피가 오안내 | `ScheduleDetailModal`, `SCHEDULE_REMAINING_SESSIONS_FIELD` |
| 대시보드 회기 소진율 KPI | 월계약 테넌트 KPI가 왜곡 | `AdminDashboardV2` §D |

### 7.7 완료처리

| 현재 | 월계약에서 깨지는 점 | 위임 포인터 |
|------|----------------------|-------------|
| COMPLETED + `sessionSequence` 채움 / leftover rem 백필 | 완료 = 회기 1 차감. 월계약 완료는 **이용 실적**이지 잔여 차감이 아님 | `LeftoverOccupyingCompleteExhaustBackfill` |
| `sessionSequence IS NULL` 보정 배치 | 월계약 일정을 회기 미차감으로 오인 보정할 위험 | `ScheduleRepository` 차감 누락 쿼리 |

### 7.8 ERP 정산

| 현재 | 월계약에서 깨지는 점 | 위임 포인터 |
|------|----------------------|-------------|
| 매핑 결제 확인 → INCOME/RECEIVABLES | 기관 **월 청구서** vs 개인 패키지 매출 | `docs/standards/ERP_TROUBLESHOOTING.md` |
| `UpdateMappingInfo` / 패키지 가격·세션 수 | 월 단가·인원·한도는 패키지 세션과 다른 차원 | `MAPPING_ERP_INTEGRATION_STATUS.md` |
| 환불: rem 기준 부분 환불 | 월 계약 해지·당월 정산 취소 | `REFUND_SESSION_LOGIC_AUDIT.md` |
| 회기 승계 (`remaining` 이동) | 월계약은 회기 쪼개기가 아님 | `SESSION_SUCCESSION_PLAN.md` |

## 8. 목표 도메인 스케치 (요약)

상세는 [`docs/planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md`](../planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md), 결정 초안은 [`docs/adr/adr-0005-monthly-institution-contract-ssot.md`](../adr/adr-0005-monthly-institution-contract-ssot.md).

- **SSOT**: 기관 월계약(기간, 청구 주기, 선택적 월 한도, `tenantId`).
- **하지 말 것**: `remainingSessions`를 크게 넣어 바우처처럼 쓰기.
- **일정 가능**: 상담일이 계약 커버 월 안인가 (한도가 있으면 당월 실적 < 한도).
- **일지 회차**: 커버 월(또는 계약) 안 서수. `sessionSequence` 필수와 분리해 설계할지는 debugger+PO.
- **정산**: 기관 월 인보이스. 매핑 1회 `confirm-payment`와 1:1 금지.
- **공존**: 기존 패키지 회기권은 유지. 매칭에 이용권 종류를 둔다(이름은 코더가 공통코드와 맞출 것).

## 9. 오늘 슬라이스 결정

**구현하지 않는다.** 월계약과 충돌하지 않는 「최소 코드 슬라이스」에 확신이 없다. 회기 가드만 느슨하게 풀면 최가을 유형이 다른 경로로 재발한다. 오늘 산출은 문서·인덱스·ADR Proposed 뿐이다.

core-coder 위임이 열려 있는 범위: **문서 또는 새 도메인 모듈만**. 새 모듈도 DB-first·PO 한도 합의 전이면 착수 금지.

## 10. 하드코딩 게이트 (운영 반영 전, 인용 필수)

이후 어떤 슬라이스든 코드가 생기면 아래를 **예외 없이** 코더 전달문에 넣는다.

- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` **§17**  
  검색·스캔·훅에 하드코딩으로 잡히면 전부 수정. 색상은 `unified-design-tokens.css` / `var(--mg-*)`. 상태값은 공통코드/API. `config/shell-scripts/check-hardcode.sh`. 완료: 위반 0건, `frontend` `npm run build:ci`.
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` **§1.3**  
  운영 배포 전 하드코딩 스캔 항목 전부 제거·토큰화. 상세는 §17.
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

월계약 상태·결제 타이밍·기관 유형 문자열을 Java/JS에 박지 말 것. `ConsultantClientMapping`의 `paymentStatus` 주석(공통코드 동적 조회)과 동일 원칙.

## 11. 리스크·제약

- 회기권 SSOT를 전제로 한 ADR-0002·통합일정 가드·일지 회차 fail-closed와 **정면 충돌**.
- 응급 일지 픽스와 병합하면 「월바우처가 된 줄」 착각.
- 멀티테넌트: 기관 계약도 `tenantId` 필수 (`/core-solution-multi-tenant`).
- 5단계 비즈니스 파이프라인 스킬은 회기 부여·차감 전제 — 월계약 테넌트는 별 파이프라인으로 문서화해야 함.
- Expo/웹 대칭: 앱이 잔여 회기를 보여 주면 동일하게 깨짐. 포함 시 기획서에 앱 경로를 적을 것.

## 12. Phase · 분배실행

의존 없는 Phase 0a / 0b는 **병렬** 가능. 오늘 문서는 플래너+문서 스킬로 이미 남김. 아래는 **다음 호출**용.

### 분배실행 표

| Phase | 담당 | 병렬 | 목표 | 적용 스킬 |
|-------|------|------|------|-----------|
| **0a 탐색** | **explore** | 0b와 동시 | 깨지는 면 파일·테스트 전수 목록. 코드 수정 없음 | (탐색) |
| **0b 재해석** | **core-debugger** | 0a와 동시 | 최가을 경로를 월계약 전제로 분석. 응급 픽스 파일 수정 금지. 수정 제안은 「새 도메인」만 | `/core-solution-debug` |
| **1 문서 보강** | **generalPurpose** | 0 이후 | explore/debugger 결과를 스케치·본 문서에 반영. 인덱스 유지 | `/core-solution-documentation` |
| **2 도메인 모듈** | **core-coder** | Phase 1 + PO 한도 합의 + DB 설계 후 | **새 패키지/모듈만.** 매핑 rem 패치 금지 | `/core-solution-database-first`, `/core-solution-backend`, `/core-solution-multi-tenant`, `/core-solution-erp` |
| **3 화면** | **core-designer** → **core-publisher** → **core-coder** | Phase 2 엔티티 확정 후 | AdminCommonLayout, 토큰, UnifiedModal. Task model `gemini-3.1-pro` (designer/publisher) | `/core-solution-design-handoff`, `/core-solution-atomic-design`, `/core-solution-common-modules` |
| **4 검증** | **core-tester** | 코드 변경 시 필수 | 월계약 vs 회기권 공존, 최가을 회귀, 하드코딩 0 | `/core-solution-testing` |

### Phase 0a — explore 전달 프롬프트 초안

```
역할: explore. 코드 수정 금지. 브랜치 cursor/provisional-log-session-number-7f13 및
cursor/remaining-session-display-ssot-7f13 커밋/파일 건드리지 말 것.

목적: 기관 월계약 바우처를 도입하면 회기권 SSOT가 깨지는 파일·테스트를 전수 목록화.
문서: docs/project-management/MONTHLY_INSTITUTION_VOUCHER_ORCHESTRATION.md §7
키워드: remainingSessions, SESSIONS_EXHAUSTED, SAME_DAY_CARD, TENTATIVE_PENDING_PAYMENT,
sessionSequence, sessionNumber, canScheduleForMapping, confirm-payment, useSession
산출: 면(매핑/결제/가예약/스케줄/일지/잔여목록/완료/ERP)별 경로 표.
운영 DB·SSH·Actions·PR 금지.
```

### Phase 0b — core-debugger 전달 프롬프트 초안

```
역할: core-debugger. 코드 수정 금지. 응급 일지 픽스 브랜치 파일 수정 금지.

증상(기획 입력): 월결제 예정 → SAME_DAY_CARD 가예약 시도 → 가예약 저장 실패 →
16:00 CONFIRMED 진행 → rem=0 + sessionSequence null → 일지 실패.

과제: 위 경로를 「기관 월계약」 전제로 재해석. 회기 차감 흉내가 어느 가드와
충돌하는지 확인 포인트·로그·재현만. 수정 제안은 새 월계약 도메인 쪽만
core-coder용으로. 회기 remaining 핫픽스 제안 금지.
참조: MONTHLY_INSTITUTION_VOUCHER_ORCHESTRATION.md, DOMAIN_SKETCH, ADR-0005.
```

### Phase 2 — core-coder 전달 프롬프트 초안 (착수 조건 충족 시에만)

```
역할: core-coder. 조건: PO 월한도·정산 합의 + Flyway 초안 리뷰 후.
대상: 새 도메인 모듈만 (institution monthly contract). 
ConsultantClientMapping.remainingSessions / useSession / SESSIONS_EXHAUSTED 패치로
바우처 흉내 금지. tenantId 필수. 상태값은 공통코드.
하드코딩 게이트: ADMIN_LNB ... HANDOFF.md §17, SETTINGS_PAGES ... §1.3,
check-hardcode.sh, npm run build:ci.
응급 일지 픽스·잔여 표시 SSOT 브랜치 파일 금지.
완료 전 core-tester 게이트.
```

## 13. 단계별 완료 기준

### 오늘 (문서)

- [x] 깨지는 면 8영역 목록
- [x] 도메인 스케치 + ADR Proposed
- [x] 형제 트랙 경계
- [x] 분배실행 표
- [x] 하드코딩 게이트 인용
- [x] docs 인덱스 갱신
- [ ] 코드 변경 0 (의도)

### 다음 슬라이스

- [ ] explore 전수 표가 §7과 정합
- [ ] debugger 재해석 문서 (`docs/debug/`)
- [ ] PO: 월 한도 유무, 정산일, 기관 엔티티
- [ ] DB-first 후 새 모듈만 구현
- [ ] 테스터: 회기권 회귀 0 + 월계약 일정/일지 가능

## 14. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요. **오늘 이미 끝난 일**: 본 문서·스케치·ADR·인덱스. **지금 코드 호출은 하지 마세요.**

1. (병렬) Phase 0a `explore` + Phase 0b `core-debugger` — 위 프롬프트
2. Phase 1 `generalPurpose` + `/core-solution-documentation`
3. PO 합의 전에는 Phase 2 코더 호출 금지
4. 코드가 생기면 Phase 4 `core-tester` 없이 완료 보고 금지

## 15. 참조

- 위임 순서: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- ADR-0002 잔여·매핑 전이
- 선예약·후결제: `INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`
- 비즈니스 흐름 스킬: `/core-solution-business-flow` (회기권 5단계 — 월계약은 재정의 대상)
- 도메인 스케치: [`../planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md`](../planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md)
- ADR-0005: [`../adr/adr-0005-monthly-institution-contract-ssot.md`](../adr/adr-0005-monthly-institution-contract-ssot.md)
