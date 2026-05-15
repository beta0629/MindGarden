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

## 컨테이너(카드 전체) 시각 규칙

카드 전체의 테두리(보더)와 배경색을 통해 현재 상태의 중요도를 직관적으로 구분합니다. 컨테이너 기본 형태는 [CONSULTANT_CLIENT_COMPONENTS_SPEC.md](./CONSULTANT_CLIENT_COMPONENTS_SPEC.md) §2를 따릅니다.

- **`IN_PROGRESS` (진행 중)**: 카드 **테두리(보더)** + **얕은 배경 틴트** + 기존 좌측 악센트 바를 모두 적용하여 "지금 진행 중"임을 최우선으로 부각합니다. 다중 진행 중인 카드가 있을 경우를 대비해 과도하지 않게 보더 두께(최대 1.5~2px)와 배경 채도 상한을 둡니다.
- **시간 경과·미시작 (Warning)**: 보조 문구와 경고 배지만 표시하며, **보더·배경 강조는 약하게(또는 기본값 유지)** 처리하여 `IN_PROGRESS`와 역할을 시각적으로 명확히 분리합니다.
- **접근성**: 색상에만 의존하지 않고 텍스트(보조 문구)와 배지를 병행 표기하며, 명도 대비 AA 등급(4.5:1 이상)을 만족하도록 색상을 선정합니다.

구현 SSOT: 컨테이너 강조 여부는 `getConsultantScheduleCardContainerVariant` (`consultantScheduleCardUi.ts`)로 `IN_PROGRESS`만 분기한다.

### 상태별 컨테이너 매핑 (`theme.colors.*` 후보)

| 카드 상태 (또는 파생) | 테두리 (`borderColor`) | 배경색 (`backgroundColor`) | 좌측 악센트 | 접근성 / 비고 |
|---------------------|----------------------|--------------------------|-----------|--------------|
| **`IN_PROGRESS`** | `theme.colors.warning` (`theme.spacing['2xs']`) | `theme.colors.scheduleCardInProgressBackground` (`tokens.ts` → `colors.common`) | `warning` | 진행 중 최우선 부각. |
| **시간 경과·미시작** | 없음(기본 카드, `borderWidth` 0) | `theme.colors.surface` | `primary` | 배지(`warning`)·`footerHint`만으로 경고. 진행 중과 분리. |
| **일반 예약/가용** | 없음(`borderWidth` 0) | `theme.colors.surface` | `primary` | 기본 카드 스타일. |
| **종료 / 과거** | 없음(`borderWidth` 0) | `theme.colors.surface` | 상태별 악센트 | `containerOpacity` 0.78~0.82로 후순위화. |

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
