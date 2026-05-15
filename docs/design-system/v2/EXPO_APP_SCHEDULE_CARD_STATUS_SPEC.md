# Expo 상담사 스케줄 카드 — 상태·배지·액션 스펙

상담사 앱(`expo-app`) **홈·스케줄 탭·상세**에서 공통으로 쓰는 일정 카드(`ScheduleCard`)와 백엔드 `ScheduleStatus` 정합을 정의한다.  
구현 SSOT: `expo-app/src/utils/consultantScheduleCardUi.ts`, `expo-app/src/api/hooks/useSchedules.ts`의 `mapBackendStatusToCardStatus`.

## 관련 문서

- 컴포넌트 골격·레이아웃: [CONSULTANT_CLIENT_COMPONENTS_SPEC.md](./CONSULTANT_CLIENT_COMPONENTS_SPEC.md) §2 ScheduleCard
- 화면 와이어: `docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md`

## 백엔드 상태 → 카드 상태 매핑

| Spring `ScheduleStatus` | 카드 `status` (Expo) | 비고 |
|-------------------------|----------------------|------|
| `AVAILABLE` | `SCHEDULED` | 가용 슬롯 |
| `BOOKED` | `BOOKED` | 예약됨 |
| `TENTATIVE_PENDING_PAYMENT` | `BOOKED` | 가예약·결제 대기 → 카드는 예정 톤 |
| `CONFIRMED` | `CONFIRMED` | 예약확정 배지 |
| `IN_PROGRESS` | `IN_PROGRESS` | 상담 시작 후(PUT 성공 시 DB 반영) |
| `COMPLETED` | `COMPLETED` | |
| `CANCELLED` | `CANCELLED` | |
| `VACATION` | `CANCELLED` | UI 단순화(차단·휴가) |

## 상태별 한글·배지 variant·좌측 악센트

디자인 토큰(`var(--mg-*)`)은 웹 기준이며, **Expo는 `client-theme`의 `theme.colors.*`에 매핑**한다.

| 카드 `status` | 배지 문구 | Badge `variant` | 좌측 악센트 (`theme.colors`) |
|---------------|-----------|-----------------|------------------------------|
| `SCHEDULED` | 예정 | `info` | `primary` |
| `BOOKED` | 예정 | `info` | `primary` |
| `CONFIRMED` | 예약확정 | `info` | `primary` |
| `IN_PROGRESS` | 진행중 | `warning` | `warning` |
| `COMPLETED` | 완료 | `success` | `success` |
| `CANCELLED` | 취소 | `gray` | `gray[300]` |
| `NO_SHOW` | 불참 | `error` | `error` |

**시간 경과·미시작(예정·예약확정·예정 슬롯이 시작 시각은 지났으나 아직 `IN_PROGRESS`가 아님)**  
- 배지: 동일 문구 유지하되 `variant`를 `warning`으로 올림(카드 내부 규칙).  
- 보조 문구: `예정 시간이 지났습니다. 상담 시작 여부를 확인해 주세요.` (`theme.colors.warning`)

**과거·종료·완료 디밍**  
- `COMPLETED` / `CANCELLED` / `NO_SHOW`: 카드 `opacity` **0.78**  
- 슬롯 **종료 시각**이 지난 `BOOKED`·`CONFIRMED`·`SCHEDULED`·`IN_PROGRESS`: **0.82**  
- 종료 시각 이후 **목록·상세**에서 「상담 시작」 CTA 숨김. `IN_PROGRESS`는 「상담 완료」는 유지.

## 목록 주 액션(홈·스케줄 탭)

| 조건 | 버튼 라벨 | 동작 |
|------|-----------|------|
| `IN_PROGRESS` | 상담 완료 | 상세로 이동 |
| `BOOKED` / `CONFIRMED` / `SCHEDULED` 이고 종료 전 | 상담 시작 | 상세로 이동 |
| 그 외 | 없음 | — |

## API·표시 경계

- 상태 변경 실패 시 Alert 등에는 **`toApiMutationMessage`**(`expo-app/src/utils/safeDisplay.ts`)로 문자열만 노출한다. (`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` 준수)

## 상담 시작과 DB

앱은 `PUT /api/v1/schedules/{id}` body `{ "status": "IN_PROGRESS" }`를 보낸다. 백엔드 `ScheduleStatus`에 **`IN_PROGRESS`가 포함**되어야 갱신이 성공하고, 목록/단건 조회 응답에 동일 값이 내려와 카드가「진행중」으로 갱신된다.
