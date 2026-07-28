# 어드민 대시보드 V2 — 목표 달성률 KPI 목표 설정 UI/UX 스펙

**작성**: core-designer  
**일자**: 2026-07-28  
**목적**: 대시보드 시각화 그룹의 '목표 달성률 KPI 카드'에서 관리자가 직접 목표 건수를 설정할 수 있는 UI 제공  
**기준**: `PENCIL_DESIGN_GUIDE.md`, `COMMON_MODULES_USAGE_GUIDE.md`, B0KlA 디자인 시스템

---

## 1. 개요 및 배경
현재 어드민 대시보드 시각화 그룹의 목표 달성률 KPI 카드(`VizTargetKpiCard`)는 기본 상수(100건)를 기준으로 달성률을 표시하고 있습니다. 테넌트별, 시기별로 유연한 목표 관리가 가능하도록 관리자가 직접 목표 건수를 설정할 수 있는 모달 UI를 설계합니다. 프론트엔드 전용 기능으로, 설정된 값은 브라우저의 `localStorage`에 테넌트 스코프로 저장됩니다.

---

## 2. 레이아웃 및 아이디어

### 2.1 진입점 (Entry Point)
기존 '총 내담자 현황 KPI' 레이아웃을 깨지 않기 위해, 목표 건수를 표시하는 텍스트 영역 우측에 작고 눈에 띄지 않는 설정 아이콘(또는 텍스트 버튼)을 배치합니다.

```text
┌─────────────────────────────────────────────────────────┐
│ 목표 달성률 (완료 기준)                                 │
│ 85% 달성 (목표 100건 ⚙️)   <-- 진입점 (설정 아이콘)      │
│ [■■■■■■■■□□]                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 모달 와이어프레임
공통 모듈인 `UnifiedModal`을 사용하여 일관된 모달 경험을 제공합니다.

```text
┌─────────────────────────────────────────────────────────┐
│ 목표 설정                                           [X] │
├─────────────────────────────────────────────────────────┤
│ 현재 목표: 100건                                        │
│                                                         │
│ 1. 프리셋 선택                                          │
│ [ 50건 ] [ 100건 ] [ 200건 ] [ 500건 ]                  │
│                                                         │
│ 2. 빠른 가산 (현재 입력값 기준)                         │
│ [ +10% (110건) ] [ +20% (120건) ]                       │
│                                                         │
│ 3. 직접 입력                                            │
│ ┌─────────────────────────────────────────────┐         │
│ │ 100                                         │ 건      │
│ └─────────────────────────────────────────────┘         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                       [취소] [저장]     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 세부 UI/UX 스펙

### 3.1 진입점 UI
- **위치**: `VizTargetKpiCard` 내 "목표 N건" 텍스트 우측
- **스타일**: 14px 톱니바퀴 아이콘 또는 12px 텍스트 버튼("설정")
- **토큰**: `var(--mg-color-text-secondary)` (호버 시 `var(--mg-color-text-main)`)

### 3.2 목표 설정 모달 (UnifiedModal)
- **크기**: `size="small"` (최대 너비 400px 내외)
- **배경**: `var(--mg-color-background-main)`
- **섹션 간격 (Gap)**: 24px (`var(--mg-spacing-24)`)

#### A. 프리셋 선택 (BadgeSelect)
- **설명**: 자주 사용하는 목표 건수를 빠르게 선택
- **옵션**: 50건, 100건, 200건, 500건
- **토큰**: 활성 상태 `var(--mg-color-primary-main)`, 비활성 상태 `var(--mg-color-surface-main)` 및 `var(--mg-color-border-main)`

#### B. 빠른 가산 (Quick Add)
- **설명**: 현재 입력 필드에 있는 값을 기준으로 상대적인 비율을 더함
- **옵션**: `+10%`, `+20%`
- **표시 방식**: 아웃라인 버튼 형태. 버튼 내부에 예상 결과값 병기 (예: `+10% (110건)`)
- **계산식**: `Math.round(현재 입력값 * 1.1)` (소수점 발생 시 반올림)

#### C. 직접 입력 (FormInput)
- **설명**: 원하는 목표 건수를 직접 타이핑하여 입력
- **타입**: `number` (숫자 키패드 유도)
- **단위 표시**: 입력 필드 우측에 "건" 텍스트 고정 표시 (`var(--mg-color-text-secondary)`)
- **토큰**: 테두리 `var(--mg-color-border-main)`, 포커스 시 `var(--mg-color-primary-main)`

#### D. 하단 액션 (Modal Actions)
- **취소 버튼**: 아웃라인 스타일, 텍스트 `var(--mg-color-text-main)`
- **저장 버튼**: 주조색 채움 스타일, 배경 `var(--mg-color-primary-main)`, 텍스트 `var(--mg-color-background-main)`

---

## 4. 상호작용 및 상태 (Validation)

1. **초기 상태**: 모달을 열면 현재 설정된 목표값이 '직접 입력' 필드에 채워져 있음.
2. **프리셋/빠른 가산 클릭**: 클릭 시 '직접 입력' 필드의 값이 해당 결과값으로 즉시 업데이트됨.
3. **유효성 검사 (Validation)**:
   - **빈 값**: 저장 버튼 비활성화 또는 클릭 시 에러 메시지 ("목표 건수를 입력해주세요.")
   - **양수 제한**: 0 이하의 값 입력 시 에러 메시지 ("목표는 1건 이상이어야 합니다.") 및 저장 불가
   - **상한선**: 비현실적인 값 입력을 막기 위해 99,999건 상한 제안 (초과 입력 시 99,999로 자동 보정 또는 에러)
4. **저장 완료**: 저장 시 모달이 닫히고, KPI 카드의 달성률 및 목표 건수가 즉시 리렌더링됨.

---

## 5. 공통 모듈 검토 결과

본 설계는 프로젝트의 공통 모듈 우선 원칙(`COMMON_MODULES_USAGE_GUIDE.md`)을 준수합니다.

- **UnifiedModal**: 모달 쉘(오버레이, 헤더, 바디, 액션)로 필수 사용. 커스텀 래퍼 사용 안 함.
- **BadgeSelect**: 프리셋 선택 UI로 적합하여 채택.
- **FormInput**: 직접 입력 필드 및 에러 메시지 처리를 위해 채택.
- **MGButton** (또는 B0KlA 버튼 클래스): 하단 액션 버튼 및 빠른 가산 버튼에 적용.

---

## 6. 코더 핸드오프 (Coder Handoff)

본 스펙은 디자이너 시안/UX 스펙으로, 코더는 다음을 참조해 구현합니다.

### 6.1 파일 후보
- **진입점 추가**: `frontend/src/components/dashboard-v2/organisms/AdminDashboardVisualizationGroup.js` (`VizTargetKpiCard` 내부에 설정 아이콘 추가)
- **신규 모달**: `frontend/src/components/dashboard-v2/organisms/VizTargetGoalSettingModal.js` (또는 `modals` 폴더)

### 6.2 스토리지 키 제안 (FE 전용)
- **localStorage 키 패턴**: `mg.dashboard.vizTarget.v1:{tenantId}:{userId}`
- **no-op 조건**: `tenantId` 또는 `userId` 가 없으면 저장·조회를 수행하지 않는다(no-op).
- **초기값 폴백**: 로컬 스토리지에 값이 없으면 기존 상수 `DASHBOARD_VIZ_TARGET_COMPLETED` (100) 사용.

### 6.3 i18n 다국어 키 제안
- `admin.dashboard.viz.targetGoal.title`: "목표 설정"
- `admin.dashboard.viz.targetGoal.preset`: "프리셋 선택"
- `admin.dashboard.viz.targetGoal.quickAdd`: "빠른 가산"
- `admin.dashboard.viz.targetGoal.directInput`: "직접 입력"
- `admin.dashboard.viz.targetGoal.save`: "저장"
- `admin.dashboard.viz.targetGoal.cancel`: "취소"

### 6.4 접근성 (A11y)
- 톱니바퀴 아이콘에 `aria-label="목표 설정"` 부여
- 모달 열림 시 포커스 트랩 적용 (UnifiedModal 기본 기능 활용)
- 직접 입력 필드에 `aria-invalid` 및 에러 메시지 `aria-describedby` 연결 (FormInput 기본 기능 활용)
