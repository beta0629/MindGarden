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
| **레이아웃** | 기존 카드 안 정보 밀도만 보강. 카드 중첩 추가 금지. 신원→패키지→메타(배지·mute)→**누적 진행**→**접이식 일정 상세**→액션. |

## 3. 세부 UI

### 3.1 누적 진행 (항상 노출)

- 문구: `누적 진행 {used}회 / 총 {total}회 · 잔여 {remaining}`
- total≤0 이면 `누적 진행 {used}회`만 (단회·미설정 패키지 방어 — 잔여 생략)
- 티켓 트랙(상단 3px)은 기존 `used/total` fill 유지
- mute meta(`잔여 N · 일정 …`)는 유지 — 진행 라인과 역할 분리(진행=청구, mute=일정 상태 요약)

### 3.2 일정 상세 (접이식)

- **한눈 일시(항상 노출)**: 월별 그룹 `8월 31일 · 9월 7일 · 14일` (최근 limit). boolean 「일정 이력 있음」 단독 **금지**
- 토글 라벨: `일정 N건` (occupying 건수). 0건이면 토글·한눈 미노출.
- 펼침 시 날짜 리스트(최근 limit건): `M/D · HH:mm · {상태}` + 회차 있으면 `· {seq}회차` (시각·회차 NULL이면 생략, 추정 금지)
- 상태 라벨(표준어): 완료 / 예약 / 확정 / 진행중 / 가예약
- 최대 표시: 카드당 최근·전체 목록 상한 24건(초과 시 `외 N건` — Peek/캘린더로 유도). 청구 스캔에 충분한 밀도.
- 토글은 카드 body peek 클릭과 충돌하지 않도록 `stopPropagation`

### 3.3 기관연동 (IL 전용 분기)

- `EngagementTypeBadge`(기관연동) 슬롯은 기존 유지 — **상태 행에 배지 1개만** (이중 렌더 금지)
- **누적**: client lifetime `COMPLETED` 상담 수 (`clientCompletedConsultationCount`). 문구 `누적 {n}회`. 매핑 단회기 used/total/잔여 **금지**
- **상담일시**: `clientConsultationSchedules[]` (내담자 lifetime 점유 일정). 토글·행 포맷은 §3.2와 동일
- rem=0 ACTIVE IL에 「상태 불일치」 desync 배지 **금지**
- 회기권·가예약 카드는 §3.1 used/total 경로 유지 (회귀 금지)

### 3.4 회기권·기타

- 진행·일정 블록은 회기권 배정에 §3.1·§3.2 적용. 기관연동은 §3.3.

## 4. 토큰 · 아토믹

| 요소 | 토큰/값 |
|------|---------|
| 진행 문구 | `var(--mg-v2-color-text-secondary)`, caption ~ `var(--mg-v2-font-size-caption)` |
| 일정 리스트 | tertiary text, gap `var(--mg-v2-space-1)` / `var(--mg-spacing-4)` |
| 토글 | ghost text button, height 28–32, 새 primary CTA 금지 |
| 구분 | hairline `var(--mg-v2-color-border-secondary)` 또는 `#E2E8F0` 화면 로컬(기존 카드 크롬과 동일) |

- **Atoms**: `SafeText`
- **Molecules**: `CardBillingProgress` (신규), 기존 `CardMeta` / `CardActionGroup`
- **Organisms**: `MappingScheduleCard`

## 5. 데이터 SSOT

| 표시 | 소스 |
|------|------|
| used / total / remaining | mapping 목록 API 기존 필드 (**회기권만** 누적 진행에 사용) |
| IL 누적 | `clientCompletedConsultationCount` (client lifetime COMPLETED 건수) |
| 회기권 일정 | mapping 목록 enrich `consultationSchedules[]` (mappingId 점유 SSOT) |
| IL 상담일시 | `clientConsultationSchedules[]` (clientId 점유 SSOT) |
| 회차 NULL | 표시 생략(복원 배치와 충돌 시 복원 결과 정합 — UI 추정 금지) |

## 6. 완료 기준

- [ ] 회기권 카드: `누적 진행 … / 총 … · 잔여 …` 확인
- [ ] 기관연동 카드: `누적 N회` + 한눈 월별 일시(예: `8월 31일 · 9월 7일 · 14일`) + 일정 토글. used/total·「상태 불일치」·boolean 「이력 있음」 단독 없음
- [ ] Side Peek 상태 행: 「기관연동」 배지 **1개** (mute/본문에 동일 문구 이중 렌더 금지)
- [ ] 일정 건수 토글로 날짜·상태 리스트 확인
- [ ] React #130 방어(`safeDisplay` / `SafeText`)
- [ ] 하드코딩 색·매직 문구 최소화(상태 라벨 상수화)
- [ ] 단위 테스트: 진행 문구·IL 분기·접이식·빈 목록·객체 방어
- [ ] 최가을(client 78) 기대: 누적 3 + 상담일시 목록

## 7. 참조

- `docs/design-system/clinic-os-sidebar-cards.md`
- `docs/project-management/INSTITUTION_LINK_DATA_SSOT_POLICY.md` (존재 시)
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
