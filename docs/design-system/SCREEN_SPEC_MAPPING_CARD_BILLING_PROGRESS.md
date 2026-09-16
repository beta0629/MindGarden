# 통합스케줄 배정 카드 — 누적 진행·일정 상세 (청구 스캔) UI/UX 스펙

**범위**: Clinic-OS 통합스케줄 사이드바 `MappingScheduleCard` 본문만  
**SSOT 카드 크롬**: `docs/design-system/clinic-os-sidebar-cards.md` v2.1 유지  
**목적**: 기관연동(예: 최가을) 카드를 보고 **월 청구·누적 회차·등록 일**을 바로 확인

---

## 1. 개요 및 배경

기관연동 배정은 고정 단가·월 청구가 흔한데, 카드 앞면에 「단회기 90,000원」과 「일정 이력 있음」만 있으면 청구용으로 불충분하다.  
**누적 진행(used/total/remaining)** 과 **일정 날짜·상태 목록**을 카드에서 스캔 가능하게 한다.

## 2. 사용성 · 정보 노출 · 레이아웃

| 항목 | 내용 |
|------|------|
| **사용성** | ADMIN/STAFF가 사이드바에서 스크롤만으로 청구 대상 회차·날짜를 확인. Peek/패키지내역 진입 없이도 1차 스캔. |
| **정보 노출** | mapping `usedSessions` / `totalSessions` / `remainingSessions` (회차 SSOT). 일정은 occupying 상태만(취소 제외). 역할 제한 없음(기존 매핑 VIEW와 동일). |
| **레이아웃** | 기존 카드 안 정보 밀도만 보강. 카드 중첩 추가 금지. 신원→패키지→메타(배지·할일)→**누적 진행(한 줄)**→액션. 일정 상세는 **Side Peek 아코디언**. |

## 3. 세부 UI

### 3.1 누적 진행 (사이드바 카드 — 항상 노출)

- 문구: `누적 진행 {used}회 / 총 {total}회 · 잔여 {remaining}`
- total≤0 이면 `누적 진행 {used}회`만 (단회·미설정 패키지 방어 — 잔여 생략)
- 티켓 트랙(상단 3px)은 기존 `used/total` fill 유지
- mute meta(`잔여 N · 일정 …` / 날짜 나열)는 **카드에서 제거** — 진행 한 줄만 크게 노출

### 3.2 일정 상세 (Side Peek 아코디언)

- **위치**: Side Peek (`SidePeekBillingScheduleAccordion`). 카드 본문에 한눈·토글·목록 **금지**
- **아코디언**: 기본 접힘. 헤더 `일정 상세`(회기권) 또는 `월 청구 일정`(기관연동) + `일정 N건` (occupying 건수). 0건이면 섹션 미노출
- **펼침 시 한눈 일시**: 월별 그룹 `8월 31일 · 9월 7일 · 14일` (최근 limit). boolean 「일정 이력 있음」 단독 **금지**
- **기관연동 Peek 스코프**: 같은 내담자의 기관연동 관련 COMPLETED(+점유) 일정 **union**
  (`institutionLinkConsultationSchedules` 우선, 없으면 `clientConsultationSchedules`).
  형제 IL·월 청구에 쓰인 관련 SAME_DAY COMPLETED 포함. **카드「이 연동 누적」과 분리**
- **초기 결제 완료**: 재무/이력에 선납 FT가 있을 때만 `초기 결제 완료` 배지(한 줄). **금액 필수 아님·10만 강제 표시 금지**
- **월말 기관 청구 안내**: 말일 N일 전(상수, 기본 5일) Side Peek에 `월말이 다가옵니다. 기관 청구를 진행해 주세요.`
- 펼침 시 날짜 리스트(최근 limit건): `M/D · HH:mm · {상태}` + 회차 있으면 `· {seq}회차` (시각·회차 NULL이면 생략, 추정 금지)
- 상태 라벨(표준어): 완료 / 예약 / 확정 / 진행중 / 가예약
- 최대 표시: 최근·전체 목록 상한 24건(초과 시 `외 N건` — 캘린더로 유도)
- 공통 `mg-accordion*` 토큰 재사용

### 3.3 기관연동 (IL 전용 분기)

- `EngagementTypeBadge`(기관연동) 슬롯은 기존 유지 — **상태 행에 배지 1개만** (이중 렌더 금지)
- **스코프 결정 (고정)**: **mappingId = 카드 단위**. 동일 내담자의 형제 IL 매핑·종료 SAME_DAY 일정은 **이 카드에 섞지 않음**.
  - 근거: `INSTITUTION_LINK_DATA_GAP_AUDIT` DUP LEAVE — ACTIVE IL 245/265 **이력 스케줄 분리 유지**
  - 계약(contract) 월청구는 재무 SSOT와 별개. 카드 청구 스캔 표시는 매핑 단위로 일관 적용
- **누적(카드)**: 이 매핑 `consultationSchedules[]` 중 `COMPLETED` 건수. 문구 `이 연동 누적 {n}회`. 매핑 단회기 used/total/잔여 **금지**. client lifetime `clientCompletedConsultationCount` **표시 SSOT 아님**
- **상담일시(Peek)**: `institutionLinkConsultationSchedules[]`(또는 `clientConsultationSchedules[]`) —
  내담자 기준 IL 관련 union(형제 IL·월 청구 관련 SAME_DAY COMPLETED 포함). 카드 `consultationSchedules` 로 되돌리지 말 것
- **완료일 갱신**: `GET /api/v1/admin/mappings` enrich 가 **매 목록 조회마다** schedules 를 재조회한다. COMPLETED 신규 건은 캐시·스냅샷에 고정되지 않고 Peek 완료일/월별 목록에 반영되어야 한다
- rem=0 ACTIVE IL에 「상태 불일치」 desync 배지 **금지**
- 회기권·가예약 카드는 §3.1 used/total 경로 유지 (회귀 금지)

### 3.4 회기권·기타

- 카드 진행은 회기권 배정에 §3.1 적용. 일정 상세는 §3.2. 기관연동은 §3.3.

## 4. 토큰 · 아토믹

| 요소 | 토큰/값 |
|------|---------|
| 진행 문구 | `var(--mg-v2-color-text-secondary)`, `var(--mg-v2-font-size-sm)` · bold/semibold |
| 일정 리스트(Peek) | secondary text, gap `var(--mg-spacing-xs)` / `var(--mg-spacing-sm)` |
| 아코디언 | 공통 `mg-accordion*` (Peek에서 shadow/fill 오버라이드) |
| 구분 | hairline `var(--mg-v2-color-border-secondary)` |

- **Atoms**: `SafeText`, `MGButton`
- **Molecules**: `CardBillingProgress`, `SidePeekBillingScheduleAccordion`, 기존 `CardMeta` / `CardActionGroup`
- **Organisms**: `MappingScheduleCard`, `MappingScheduleSidePeekContent`

## 5. 데이터 SSOT

| 표시 | 소스 |
|------|------|
| used / total / remaining | mapping 목록 API 기존 필드 (**회기권만** 누적 진행에 사용) |
| IL 누적(카드) | 이 매핑 `consultationSchedules[]` 의 COMPLETED 건수 (`이 연동 누적 N회`) |
| 회기권 일정 / IL 카드 일정 | mapping 목록 enrich `consultationSchedules[]` (mappingId·COMPLETED 포함·매 조회 재조회) |
| IL Peek 월 청구 일정 | `institutionLinkConsultationSchedules[]` (IL 매핑·IL 내담자 시 내담자 점유 union). 없으면 `clientConsultationSchedules[]` |
| clientConsultationSchedules | **카드 누적 비사용**. Peek 월 청구 fallback·legacy 호환 |
| 초기 결제 완료 배지 | 재무 FT `relatedEntityType=INSTITUTION_LINK_PREPAID` 존재 → `hasInstitutionLinkInitialPayment=true`. **금액 미표시**. contract prepaid_amount / 10만 강제 금지 |
| 월말 기관 청구 안내 | 기관연동 + 말일 N일 전(`MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS`, 기본 5). Side Peek 톤 메시지 |
| 회차 NULL | 표시 생략(복원 배치와 충돌 시 복원 결과 정합 — UI 추정 금지) |

## 6. 완료 기준

- [ ] 회기권 카드: `누적 진행 … / 총 … · 잔여 …` 만 노출 (한눈·일정 N건·mute 날짜 없음)
- [ ] 기관연동 카드: `이 연동 누적 N회` 만. used/total·「상태 불일치」·boolean 「이력 있음」 단독 없음. **매핑 단위** (lifetime 3을 카드에 강제하지 않음)
- [ ] Side Peek(회기권): 일정 상세 아코디언 — mapping `consultationSchedules`
- [ ] Side Peek(기관연동): `월 청구 일정` 아코디언 — 내담자 IL union(`institutionLinkConsultationSchedules`). 예: 최가을 mapping 265 Peek에 8/31·9/7·9/14 3건, 카드 265 누적은 1 유지
- [ ] Side Peek/카드: 재무에 선납 FT 있을 때만 `초기 결제 완료` 짧은 배지 (금액·10만 문구 없음)
- [ ] Side Peek: 월말 N일 전 `월말이 다가옵니다. 기관 청구를 진행해 주세요.` 안내
- [ ] Side Peek 상태 행: 「기관연동」 배지 **1개** (mute/본문에 동일 문구 이중 렌더 금지)
- [ ] React #130 방어(`safeDisplay` / `SafeText`)
- [ ] 하드코딩 색·매직 문구 최소화(상태 라벨 상수화)
- [ ] 단위 테스트: 진행 문구·IL 매핑 스코프·Peek union·초기결제 배지·월말 안내·빈 목록·객체 방어
- [ ] prepaid 10만 표시 금지. DATAFIX·고객 ID 하드코딩 금지

## 7. 참조

- `docs/design-system/clinic-os-sidebar-cards.md`
- `docs/project-management/INSTITUTION_LINK_DATA_SSOT_POLICY.md` (존재 시)
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
