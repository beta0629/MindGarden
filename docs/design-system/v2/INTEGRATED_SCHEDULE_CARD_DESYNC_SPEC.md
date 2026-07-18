# 통합 스케줄 매칭 카드 — 스케줄-매칭 Desync(불일치) 시각 스펙

**작성일**: 2026-07-18  
**목적**: 통합 스케줄 사이드바 매칭 카드 단위에서 캘린더 스케줄과 매칭 상태 간의 싱크가 맞지 않는 경우(desync)를 어드민 관리자가 즉시 인지하고, 잘못된 CTA(특히 `SESSIONS_EXHAUSTED` 오탐) 없이 정리/완료/취소 처리를 할 수 있도록 시각적 가이드를 제공함.  
**참조**: `INTEGRATED_SCHEDULE_CARD_SCHEDULE_STATUS_SPEC.md`, `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`, `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`, `docs/design-system/PENCIL_DESIGN_GUIDE.md`

---

## 1. 개요 및 사용성

- **대상 사용자**: 어드민 관리자
- **목표**: 카드(mappingId) 단위로 desync를 즉시 인지하고 조치.
- **주요 워크플로우**: 툴팁으로 이유 확인 → Danger CTA 클릭 → `UnifiedModal` 확인 다이얼로그 → 실행
- **정보 노출**: 점유 상태(`BOOKED`, `TENTATIVE_PENDING_PAYMENT`, `CONFIRMED`) 기준. `hasConsultationSchedule`, `nextConsultationDate` 필드를 사용함 (페어 기준 `hasUpcomingConsultationSchedule` 사용 금지).

---

## 2. 제품 규칙 및 상태별 시각 스펙 (오탐 방지)

| Kind | 조건 | 배지 문구 (토큰) | 툴팁 (Title) | CTA 라벨 (Danger) | 비고 (오탐 방지) |
|---|---|---|---|---|---|
| **정상 (CTA 금지)** | `SESSIONS_EXHAUSTED` + `nextConsultationDate` 있음 | (기존 스케줄 배지 유지) | 「예정 상담 진행 중」 | **없음 (종료 버튼 노출 금지)** | 예약 시점 차감 SSOT상 정상. |
| **desync-cleanup** | `TERMINATED` / `INACTIVE` / `SUSPENDED` + 미래 점유 일정(`nextConsultationDate`) | `일정 정리 필요` (Warning) | 「잔여 일정 정리 필요」 | `일정 정리` | |
| **desync-cancel** | `PENDING_PAYMENT` (비 Option-B 가예약) + 미래 점유 일정 | `매칭 취소 필요` (Error) | 「매칭을 취소해 주세요」 | `매칭 취소` | 기존 매칭 취소 강조 |
| **desync-status** | `ACTIVE` + `remainingSessions <= 0` (`SESSIONS_EXHAUSTED` 미전이) | `상태 불일치` (Warning) | 「완료 처리해 주세요」 | `완료 처리` | |
| **미등록** | `hasConsultationSchedule === false` | `일정 미등록` (Muted) | (없음) | (기존 로직 유지) | Desync 아님. 기존 스펙 유지 |

### 2.1 토큰 정의 (하드코딩 금지)

- **Warning 배지 (desync-cleanup, desync-status)**:
  - 배경: `var(--mg-warning-100)`
  - 텍스트: `var(--mg-warning-700)`
- **Error 배지 (desync-cancel)**:
  - 배경: `var(--mg-error-100)`
  - 텍스트: `var(--mg-error-700)`
- **Danger CTA 버튼**:
  - 배경: `var(--mg-error-600)` (또는 Danger 변형 토큰)
  - 텍스트: `var(--mg-color-white)` 또는 `var(--mg-gray-50)`
  - Hover: `var(--mg-error-700)`

---

## 3. 레이아웃 및 배치

### 3.1 Comfortable 카드

- **배지 영역 (`CardMeta`)**:
  - 위치: `.integrated-schedule__card-meta` 내부.
  - 위계: 기존 스케줄 상태 배지보다 **Desync 배지가 더 높은 위계**를 가짐. (Desync 발생 시 기존 스케줄 배지를 대체하거나 가장 앞에 배치)
  - 툴팁: 배지에 `title` 속성을 사용하여 툴팁 노출.
  - BEM 클래스: `.integrated-schedule__card-desync-badge`
- **액션 영역 (`CardActionGroup`)**:
  - 위치: `.integrated-schedule__card-actions` 내부.
  - 스타일: Danger CTA 버튼 배치.
  - BEM 클래스: `.integrated-schedule__action-danger`

### 3.2 Compact 행 (MatchingScheduleCompactRow)

- **정보 영역 (`secondary`)**:
  - 위치: 두 번째 줄(secondary) 정보 텍스트 영역.
  - 표시: 공간 제약으로 인해 배지 대신 텍스트로 표시하되, Warning/Error 색상 토큰을 텍스트에 직접 적용.
  - 예시: `활성 | 0회 남음 | 상태 불일치` (텍스트 색상: `var(--mg-warning-700)`)
  - 툴팁: 텍스트 영역에 마우스 오버 시 `title` 또는 `aria-label`로 안내 문구 노출.
- **액션 영역**:
  - 기존 Compact 액션 패턴 유지 (아이콘 버튼 등). Danger 액션의 경우 Error 색상 토큰 적용.

### 3.3 UnifiedModal 확인 다이얼로그

Danger CTA 클릭 시 반드시 `UnifiedModal`을 띄워 관리자의 최종 확인을 받음.

- **컴포넌트**: `UnifiedModal` 사용 (커스텀 모달 금지)
- **Props**: `className="mg-v2-ad-b0kla"` 전달.
- **문구 가이드**:
  - **desync-cleanup**:
    - Title: "잔여 일정 정리"
    - Subtitle: "매칭이 종료되었으나 미래 일정이 남아있습니다. 일정을 정리하시겠습니까?"
  - **desync-cancel**:
    - Title: "매칭 취소"
    - Subtitle: "결제 대기 중인 가예약 매칭입니다. 취소하시겠습니까?"
  - **desync-status**:
    - Title: "완료 처리"
    - Subtitle: "남은 회기가 없습니다. 매칭을 완료 처리하시겠습니까?"
- **액션**: 취소(Outline) / 확인(Danger 버튼)

---

## 4. SESSIONS_EXHAUSTED 오탐 방지 노트 (중요)

- `SESSIONS_EXHAUSTED` 상태이면서 미래 점유 일정(`nextConsultationDate`)이 존재하는 경우는 **정상적인 "예정 상담 진행 중" 상태**입니다.
- 예약 시점에 회기가 차감되는 시스템(SSOT) 특성상 발생하는 자연스러운 현상입니다.
- **절대 이 상태를 Desync로 간주하여 "종료", "정리" 등의 Danger CTA를 노출해서는 안 됩니다.**
- 툴팁으로만 「예정 상담 진행 중」임을 안내하고, 기존 스케줄 배지를 유지합니다.
