# 통합 스케줄링 센터 — 매칭 목록 필터 UI 스펙

## 1. 개요 및 목적

- **대상 화면**: `/admin/integrated-schedule` (통합 스케줄링 센터) 좌측 **매칭 목록** 필터 영역만 설계.
- **기획 근거**: `docs/project-management/INTEGRATED_SCHEDULE_FILTER_PLAN.md` 에 따른 필터 구조·기본값 반영.
- **목적**: "회기" 라디오를 **"보기"** 또는 **"우선순위"**로 변경하고, 옵션을 **신규 매칭 | 회기 남은 매칭 | 전체** 3가지로 통합. **상태** 필터는 기존 유지. B0KlA·unified-design-tokens·어드민 대시보드 샘플 스타일 준수.
- **산출물**: 코더가 추측 없이 구현할 수 있는 레이아웃·라벨·토큰·클래스·접근성 명세. **코드 작성 없음.**

---

## 2. 디자인 기준

- **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `frontend/src/styles/unified-design-tokens.css`
- **참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample
- **필수 문서**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` 디자이너 숙지 체크리스트 적용

---

## 3. 필터 블록 레이아웃

### 3.1 전체 구조

좌측 사이드바(`.integrated-schedule__sidebar`) 내부, "매칭 목록" 제목(`.integrated-schedule__sidebar-title`) 아래에 **두 개의 필드셋**이 세로로 배치된다.

| 순서 | 필드셋 역할 | 비고 |
|------|-------------|------|
| 1 | **보기(또는 우선순위)** — 라디오 3옵션 | 기존 "회기" 필드셋 위치·스타일 재사용 |
| 2 | **상태** — 버튼 그룹 | 기존 유지, 변경 없음 |

### 3.2 위치·간격

- **첫 번째 필드셋(보기/우선순위)**  
  - **위치**: `.integrated-schedule__sidebar-title` 직하단.  
  - **하단 여백**: `margin: 0 0 var(--mg-spacing-20, 20px)` — 기존 `.integrated-schedule__filter`와 동일.  
  - **시각적 위계**: 섹션 블록 내 "첫 번째 필터"로, 라디오 pill 형태(가로 나열)로 표시.

- **두 번째 필드셋(상태)**  
  - **위치**: 첫 번째 필드셋 바로 아래.  
  - **클래스**: `integrated-schedule__filter integrated-schedule__filter--status` (기존 유지).  
  - **레이아웃**: `display: flex; flex-direction: column; align-items: stretch; width: 100%;`  
  - **버튼 영역**: `.integrated-schedule__status-btns` — `flex-wrap: wrap`, `gap: var(--mg-spacing-6, 6px)`.

- **두 필드셋 사이 간격**: 첫 번째 필드셋의 `margin-bottom: 20px`으로 충분. 별도 gap 없음.

### 3.3 시각적 위계

- **첫 번째 필드셋**: "목록을 어떤 기준으로 볼지" 선택 — 라디오 3개가 한 줄(또는 좁을 때 wrap) pill 형태.
- **두 번째 필드셋**: "상태로 필터" — 라벨 "상태" 아래 버튼 그룹.  
- 둘 다 **동일한 필터 블록 스타일** 적용: 배경 `var(--mg-color-surface-sub)`, 테두리 `1px solid var(--mg-color-border-main)`, `border-radius: var(--mg-radius-md, 10px)`.

---

## 4. 라벨·텍스트

### 4.1 첫 번째 필드셋 legend: "보기" vs "우선순위"

- **권장**: **"보기"**
- **이유**:
  - 세 옵션(신규 매칭, 회기 남은 매칭, 전체)이 모두 **"목록을 어떤 범위로 볼지"**를 선택하는 **뷰(view)** 개념과 일치함.
  - "우선순위"는 "신규 매칭"에만 잘 맞고, "회기 남은 매칭"·"전체"는 우선순위보다 **보기 범위**에 가까움.
  - 사용자 인지: "보기: 신규 매칭 / 회기 남은 매칭 / 전체"가 자연스럽고, 기존 "회기" 필터를 대체하는 맥락과도 부합함.
- **대안**: 기획·운영 요청 시 "우선순위"로 교체 가능. 구현 시 상수화 권장.

### 4.2 첫 번째 필드셋 라디오 옵션 (3가지)

| 값(권장 name) | 표시 라벨 | 기본 선택 |
|---------------|-----------|-----------|
| `new` (또는 기획·API와 맞춘 상수) | **신규 매칭** | ✅ 기본값 |
| `remaining` | **회기 남은 매칭** | |
| `all` | **전체** | |

- **라벨 문구**: 위 표와 동일. "회기 남은 매칭만" → **"회기 남은 매칭"**으로 통일(기존 "회기 남은 매칭만"에서 "만" 제거 권장).

### 4.3 두 번째 필드셋(상태)

- **legend**: **"상태"** (기존 유지)
- **버튼 라벨**: 전체, 결제 대기, 결제 확인, 승인 대기, 활성, 비활성, 종료됨, 회기 소진, 일시정지 — 기존 `STATUS_FILTER_OPTIONS` 유지.

---

## 5. 토큰·클래스 정합성

### 5.1 기존 클래스 유지 (정합성)

첫 번째 필드셋은 **기존 "회기" 필드셋과 동일한 클래스 체계**를 사용한다. 옵션 개수·legend 텍스트만 변경.

| 요소 | 클래스 | 비고 |
|------|--------|------|
| 필드셋(첫 번째) | `integrated-schedule__filter` | aria-label로 용도 구체화 |
| legend | `integrated-schedule__filter-legend` | 시각적으로 숨김, 스크린 리더용 |
| 라디오 래퍼(각 옵션) | `integrated-schedule__filter-label`, 선택 시 `integrated-schedule__filter-label--selected` | 기존과 동일 |
| 라디오 표시 텍스트 | `integrated-schedule__filter-text` | |
| 필드셋(두 번째) | `integrated-schedule__filter integrated-schedule__filter--status` | 기존 유지 |
| 상태 버튼 영역 | `integrated-schedule__status-btns` | 기존 유지 |
| 상태 버튼 | `integrated-schedule__status-btn`, 선택 시 `integrated-schedule__status-btn--selected` | 기존 유지 |

### 5.2 디자인 토큰 (B0KlA·unified-design-tokens)

필터 블록·라벨·버튼에 사용할 토큰(기존 CSS와 동일하게 명시).

| 용도 | 토큰(우선) | fallback/참고 값 |
|------|------------|------------------|
| 필터 컨테이너 배경 | `var(--mg-color-surface-sub)` | #F5F3EF 계열 |
| 필터 테두리 | `var(--mg-color-border-main)` | #D4CFC8 |
| 필터 border-radius | `var(--mg-radius-md)` | 10px |
| 필터 하단 여백 | `var(--mg-spacing-20)` | 20px |
| 라벨 패딩 | `var(--mg-spacing-8)`, `var(--mg-spacing-14)` | 8px, 14px |
| 라벨 min-height | 40px | |
| 라벨 폰트 | 14px, font-weight 500 | |
| 라벨 기본 텍스트 | `var(--mg-color-text-secondary)` | #5C6B61 |
| 라벨 선택/호버 | `var(--mg-color-primary-main)`, `var(--mg-color-primary-inverse)` | #3D5246, #FAF9F7 |
| 상태 버튼 gap | `var(--mg-spacing-6)` | 6px |
| 상태 버튼 radius | `var(--mg-radius-sm)` | 8px |

---

## 6. 접근성·일관성

### 6.1 ARIA·시맨틱

- **첫 번째 fieldset**  
  - `aria-label="매칭 목록 보기 필터"` (또는 "목록 보기 방식 선택") — 용도가 "보기"로 바뀌었음을 반영.  
  - `legend`는 **시각적으로만 숨김** (기존처럼 `.integrated-schedule__filter-legend`로 clip). 스크린 리더는 "보기" + 옵션을 읽을 수 있도록 유지.

- **각 라디오 input**  
  - `aria-label`: 옵션과 동일하게 **"신규 매칭"**, **"회기 남은 매칭"**, **"전체"** 권장.  
  - `name`: 동일 그룹이므로 하나의 name(예: `viewFilter` 또는 기존 `sessionFilter`를 `viewFilter`로 변경 시 일관된 name) 사용.

- **두 번째 fieldset(상태)**  
  - `aria-label="상태별 필터"` (기존 유지).  
  - 각 상태 버튼: `aria-pressed`, `aria-label="${라벨} (${count}건)"` (기존 유지).

### 6.2 키보드·포커스

- 라디오 그룹: Tab으로 진입 후 화살표로 옵션 이동 (기본 라디오 동작).  
- 포커스 가시성: 기존 `.integrated-schedule__filter-label`, `.integrated-schedule__status-btn`의 focus-visible 스타일 유지.

---

## 7. 요약 체크리스트 (구현 시)

- [ ] 첫 번째 필드셋 legend: **"보기"** (또는 기획 확정 시 "우선순위").
- [ ] 라디오 옵션 3개: **신규 매칭**(기본) | **회기 남은 매칭** | **전체**.
- [ ] 첫 필드셋 클래스: `integrated-schedule__filter`, legend `integrated-schedule__filter-legend`, 라벨 `integrated-schedule__filter-label`, 텍스트 `integrated-schedule__filter-text`.
- [ ] 두 번째 필드셋(상태): 기존 구조·클래스·버튼 옵션 유지.
- [ ] 간격: 첫 필드셋 `margin-bottom: var(--mg-spacing-20)`.
- [ ] 색상·radius·패딩: `var(--mg-*)` 토큰 사용.
- [ ] aria-label: 첫 fieldset "매칭 목록 보기 필터", 각 라디오 "신규 매칭" / "회기 남은 매칭" / "전체".

---

**문서 버전**: 1.0  
**작성일**: 2025-03-13  
**기획 참조**: `docs/project-management/INTEGRATED_SCHEDULE_FILTER_PLAN.md`  
**적용 화면**: `/admin/integrated-schedule` (통합 스케줄링 센터 좌측 매칭 목록 필터)
