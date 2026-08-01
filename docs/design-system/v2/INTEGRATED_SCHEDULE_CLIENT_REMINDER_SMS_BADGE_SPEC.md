# [Design Spec] 통합 스케줄 내담자 예약 문자(SMS) 배지

## 1. 개요 및 배경 (Context)
* **목적**: 통합 스케줄 화면(캘린더 및 사이드바)에서 관리자가 **내담자에게 발송되는 예약 리마인더 SMS의 상태(발송됨/대기/실패)**를 직관적으로 파악할 수 있도록 배지 UI를 제공합니다.
* **UX 목표**:
  * 관리자가 일정 확인 중 스크롤/호버만으로 발송 상태를 파악 가능하게 함.
  * 정보 노출 최소화: 전화번호나 상세 본문은 비노출. 발송 상태와 필요 시 툴팁(시각/짧은 실패 사유)만 제공.
  * 노이즈 제거: 해당없음(N/A) 또는 생략(SKIPPED)된 건은 배지를 숨겨 인지 부하를 줄임.
* **관련 문서**:
  * `docs/project-management/2026-06-04/SCHEDULE_REGISTRATION_IMMEDIATE_SMS_POLICY.md`
  * `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`
  * `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_SCHEDULE_STATUS_SPEC.md`
  * `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`

## 2. 상태별 카피 및 시각 스펙 (State & Visuals)

**최종 라벨 선택**: **발송됨 / 대기 / 실패**
*(선정 사유: 캘린더나 사이드바 등 좁은 영역에서 가장 빠르게 읽히는 최소 단위의 업무 언어이며, '문자'라는 맥락은 툴팁과 위치를 통해 보완 가능함)*

| 상태 (Data) | UI 노출 라벨 | 시각적 강조 (Variant) | 툴팁 (Tooltip) | 표시 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| **SENT** | `발송됨` | 차분한 성공/완료 (Info/Success)<br/>`var(--mg-color-semantic-success)` | 발송 완료 시각 (예: `발송: 14:00`) | 노출 |
| **PENDING** | `대기` | 경고/대기 (Warning)<br/>`var(--mg-color-semantic-warning)` | 예정 시각 (예: `예정: 09:00`) | 노출 |
| **FAILED** | `실패` | 오류/위험 (Error)<br/>`var(--mg-color-semantic-error)` | 짧은 실패 사유 (예: `실패: 번호 형식 오류`) | 노출 (**강조**) |
| **N/A** | - | - | - | **숨김** (렌더링 안 함) |
| **SKIPPED** | - | - | - | **숨김** (렌더링 안 함) |

* **SafeDisplay**: 모든 표시 문자열과 툴팁 텍스트는 `safeDisplay` (SafeText) 처리를 전제로 합니다. 전화번호 등 개인정보는 절대 포함하지 않습니다.

## 3. 레이아웃 구역별 스펙 (Layout Specs)

### 3.1. 캘린더 일정 (Calendar Event / `fc-event`)
* **위치**: 일정 블록 내 **내담자명 인접 (우측 또는 하단)**
* **디자인 밀도**: 캘린더 높이에 따라 라벨 노출이 어려울 경우 Compact 형태 적용. 공간이 허락하면 라벨형(`발송됨`) 배지 사용.
* **우선순위**: 해당 일정 이벤트(`scheduleId`)에 귀속된 SMS 로그를 1순위로 표시.

### 3.2. 사이드바 Comfortable (`CardMeta`)
* **위치**: 일정 카드의 메타 정보(Badge) 열. 기존 `StatusBadge`, `RemainingSessionsBadge` 등과 동일한 행에 배치.
* **다일정 기준**: 사이드바에서는 **'다음 상담일(가장 가까운 예정 schedule)'** 기준으로 상태를 표시. 해당 일정이 없으면 배지 숨김.
* **줄바꿈 방지**: 좁은 사이드바(260px) 내에서 다른 배지들과 충돌하여 줄바꿈이 발생하지 않도록 `flex-wrap: wrap` 및 적절한 `gap` (예: `var(--mg-spacing-1)`)을 유지.

### 3.3. 사이드바 Compact (밀도 높은 뷰)
* **표현 방식**: **색점(Color Dot) + 툴팁** (밀도가 가장 높은 1안 선택)
* **스펙**: `width: 6px; height: 6px; border-radius: 50%;`. 텍스트는 완전히 생략하고 색상만으로 상태(초록/노랑/빨강)를 표시하며, 마우스 오버 시 툴팁으로 상세(발송됨/대기/실패 + 시각) 안내.

## 4. 컴포넌트 아키텍처 및 재사용 (Component Architecture)

* **기존 Atom 재사용성 판단**: `frontend/src/components/admin/PushMonitoring/atoms/SmsLogStatusBadge.jsx`
* **판단 결과**: 기존 Atom은 `successFlag`에 따라 카피(`PUSH_MONITOR_SMS_LOGS_STATUS_*`)가 하드코딩되어 있고 툴팁을 지원하지 않아 그대로 사용하기 어렵습니다.
* **설계 권장안 (Molecule 래퍼)**:
  * 스케줄 전용 **Molecule 컴포넌트 (`ScheduleReminderSmsBadge`)**를 신규 생성합니다.
  * 시각적 일관성을 위해 기존 `mg-sms-log-status-badge` CSS 클래스와 디자인 토큰을 **재사용**합니다.
  * 해당 Molecule에서 N/A, SKIPPED 처리(숨김 로직) 및 툴팁 주입, 스케줄 전용 라벨(`발송됨`/`대기`/`실패`) 매핑을 담당합니다.

## 5. 디자인 토큰 사양 (Design Tokens)

코더는 아래의 토큰만을 사용하여 구현해야 합니다. (하드코딩 Hex 금지)

* **Badge Background**:
  * Success(발송됨): `var(--mg-color-semantic-success-bg)` (또는 상응하는 파스텔톤 배경)
  * Warning(대기): `var(--mg-color-semantic-warning-bg)`
  * Error(실패): `var(--mg-color-semantic-error-bg)`
* **Badge Text/Dot**:
  * Success: `var(--mg-color-semantic-success)`
  * Warning: `var(--mg-color-semantic-warning)`
  * Error: `var(--mg-color-semantic-error)`
* **Typography**:
  * Label: `var(--mg-font-size-caption)` (일반적으로 12px), `font-weight: 500` 혹은 `600`
* **Spacing & Shape**:
  * Padding: `var(--mg-spacing-1)` `var(--mg-spacing-2)` (e.g., `4px 8px`)
  * Border Radius: `var(--mg-radius-sm)` (e.g., `4px`)

## 6. 접근성 (Accessibility)

* 화면 판독기를 위한 `aria-label`을 반드시 제공합니다.
* 예: `aria-label="예약 문자 발송 상태: 발송됨. 발송 시각 14시 00분"`
* 색점에만 의존하는 Compact 모드의 경우, 맹인 사용자가 상태를 알 수 있도록 툴팁 내용과 동일한 `sr-only` 텍스트나 명확한 `aria-label`을 적용합니다.

## 7. 코더 체크리스트 (Coder Handoff Checklist)

- [ ] `ScheduleReminderSmsBadge` Molecule 컴포넌트 생성 (기존 Atom의 CSS 클래스/스타일 차용)
- [ ] 데이터 매핑 로직 구현 (SENT, PENDING, FAILED) 및 N/A, SKIPPED 상태일 때 `return null` 처리
- [ ] 사이드바 뷰에서 '다음 상담일' 스케줄 데이터 기준으로 배지 렌더링
- [ ] 툴팁 컴포넌트(공통 모듈 우선)를 연결하여 발송/예정 시각 또는 실패 사유 표시
- [ ] 사용자 전화번호나 민감 정보가 툴팁이나 DOM에 노출되지 않도록 `safeDisplay` 검증
- [ ] 캘린더 `fc-event` 내 적절한 위치(이름 옆) 렌더링 및 클릭 이벤트 전파 차단 (`e.stopPropagation()`)
- [ ] Compact 모드(`isCompact={true}` 등의 prop)일 때 텍스트 라벨 대신 색점(Dot)만 렌더링하도록 분기 처리
- [ ] 어드민 대시보드 샘플 톤과 일치하도록 지정된 CSS 토큰(`var(--mg-*)`)만 사용 (하드코딩 절대 금지)
