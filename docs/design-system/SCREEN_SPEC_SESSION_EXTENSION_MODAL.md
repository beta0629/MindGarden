# 회기 추가 모달 (Session Extension) UI/UX 스펙

**문서 버전**: 1.0  
**작성일**: 2026-07-17  
**작성자**: core-designer  
**관련 PR/이슈**: PR #600 (도메인 재정의)  

## 1. 개요 및 배경

기존 `SessionExtensionModal`은 레거시 구조와 클래스가 혼재되어 있으며, PR #600에 따른 새로운 비즈니스 도메인 규칙(가변 회기/금액, ACTIVE 패키지 승계 등)을 반영하기 위해 **아토믹 디자인(B0KlA) 및 UnifiedModal 기반으로 전면 재설계**합니다. 본 문서는 코더가 코드 레벨에서 즉시 구현할 수 있도록 상세한 UI/UX 스펙과 와이어프레임을 제공합니다.

## 2. 도메인 요구사항 (PR #600)

- 기존 `ACTIVE` 상태 매핑의 패키지 정보를 그대로 승계 (읽기 전용).
- 추가할 회기 수 및 추가 금액을 자유롭게 입력 가능 (예: 10회 패키지에 5회만 추가).
- 입금 확인 시, 사용 횟수(used)는 그대로 유지되고, 잔여(remaining) 및 총(total) 횟수가 증가.
- 현재 `PENDING` 상태의 연장 요청이 있는 경우, 폼 대신 대기 상태 화면을 보여주고 [입금 확인], [요청 취소] 액션 제공.

## 3. 세부 UI/UX 스펙

### 3.1. 모달 셸 (UnifiedModal)
모든 커스텀 오버레이는 제거하고 공통 `UnifiedModal`을 사용합니다.
- `size`: `medium` (가로 약 600px 내외)
- `className`: `mg-v2-ad-b0kla` 전달 (B0KlA 테마 적용)
- 구성: `mg-modal__header`, `mg-modal__body`, `mg-modal__actions`

### 3.2. 화면 1: 회기 추가 폼 (Idle / 신규 요청)

**헤더 (`mg-modal__header`)**
- 제목: `회기 추가` (20px, fontWeight 600, `var(--mg-color-text-main)`)
- 부제/컨텍스트: 내담자명 & 상담사명 뱃지 (예: `김내담 - 박상담`)

**본문 (`mg-modal__body`)**
본문은 3개의 섹션(블록)으로 구성되며, 각 섹션 사이 gap은 `var(--mg-spacing-24)`입니다.

**섹션 A: 현재 상태 요약 (읽기 전용)**
- 배경: `var(--mg-color-surface-elevated)` (#F5F3EF)
- 테두리: 1px solid `var(--mg-color-border-main)` (#D4CFC8), 반경 10px
- 좌측 악센트 바: 4px width, `var(--mg-color-primary-main)` (#3D5246)
- 내용: 
  - 현재 패키지명 (예: "프리미엄 10회권")
  - 진행 상태 텍스트 (예: "사용 3회 / 남은 7회 / 총 10회")
  - Progress Bar: `value={used}`, `max={total}`

**섹션 B: 추가 정보 입력**
- Grid 레이아웃 (1열 기반, 필요시 2열 분배)
- **추가 회기 수**: Number Stepper 또는 `type="number"` Input (최소 1)
- **추가 금액**: Input (우측 "원" 라벨, 포맷팅된 숫자)
- **결제 수단**: `BadgeSelect` 컴포넌트 재사용 (카드, 계좌이체, 현금 등)
- **참조 번호**: 텍스트 Input (선택)
- **사유**: 텍스트 Input 또는 Textarea (선택)

**섹션 C: 예상 결과 (Projection)**
- 배경: `var(--mg-color-background-main)` (#FAF9F7)
- Padding: `16px`, 테두리 반경 `8px`
- 타이포그래피: 추가 전/후 비교를 명확히 보여줌
  - "총 회기 수: 10회 ➔ **15회**"
  - "남은 회기 수: 7회 ➔ **12회**"
- 강조 텍스트 색상: `var(--mg-color-primary-main)` (#3D5246)

**액션 (`mg-modal__actions`)**
- 취소: Outline 버튼 (`var(--mg-color-text-secondary)`)
- 제출: Primary 버튼 (`MGButton` variant="primary", 배경 `#3D5246`), 문구: `+{X}회기 추가 요청`

---

### 3.3. 화면 2: PENDING 상태 모달 (입금 대기 중)

연장 요청 후 입금 대기 중인 상태의 화면입니다.

**헤더 (`mg-modal__header`)**
- 제목: `회기 추가 대기 중`
- 상태 뱃지: PENDING (노란색/주황색 계열 `var(--mg-color-warning-main)`)

**본문 (`mg-modal__body`)**
- 중앙 정렬된 요약 카드 (배경: `#FAF9F7`)
- **요청 정보**: 
  - "추가 요청 회기: **+5회**"
  - "입금 대기 금액: **500,000원**"
  - "결제 수단: 계좌이체"
  - "요청 일시: 2026.07.17 14:30"
- 하단 안내 문구: "입금이 확인되면 즉시 회기가 추가되며, 취소 시 요청이 삭제됩니다." (`var(--mg-color-text-secondary)`)

**액션 (`mg-modal__actions`)**
- **요청 취소**: Danger Outline 버튼 (글자색 `#D32F2F` 또는 `var(--mg-color-error-main)`)
- **입금 확인**: Primary 버튼 (`#3D5246`)

### 3.4. 위험 동작 확인 (Risk UX)
- "입금 확인" 및 "요청 취소" 클릭 시 곧바로 API를 호출하지 않고, **Confirm 모달(또는 브라우저 confirm, 혹은 인라인 경고)**을 띄워 재확인합니다.
- 예: "입금을 확인하시겠습니까? 총 회기 수가 즉시 +5회 증가합니다."

---

## 4. 컴포넌트 트리 및 설계 계층 (Atomic)

- **Templates / Organisms**:
  - `SessionExtensionModal` (루트, 데이터 패칭 및 분기 처리)
  - `SessionExtensionFormView` (입력 폼 화면)
  - `SessionExtensionPendingView` (대기 중 상태 화면)
- **Molecules**:
  - `PackageStatusCard` (섹션 A - 현재 상태 요약)
  - `ProjectionCard` (섹션 C - 예상 결과)
  - `ExtensionInputGroup` (입력 폼 그리드)
- **Atoms**:
  - `UnifiedModal` (공통 모듈 필수 사용)
  - `MGButton`, `MGInput`, `BadgeSelect`, `Progress` (기존 공통 컴포넌트)
  - 디자인 토큰 (CSS 변수)

---

## 5. 와이어프레임 (Text 구조)

### 신규 추가 폼
```text
===================================================
[ 회기 추가 ]                    [ 내담자 - 상담사 ]
---------------------------------------------------
| ▌ [ 프리미엄 10회권 ]                           |
|   진행률 -------------------- (30%)             |
|   사용 3회 / 남은 7회 / 총 10회                 |
---------------------------------------------------
 추가 회기 수     [ - ]   5   [ + ]
 추가 금액        [ 500,000 ] 원
 결제 수단        (카드) (계좌이체) (현금)
 참조 번호        [ 입력하세요... ]
 사유             [ 연장 사유 입력... ]
---------------------------------------------------
| 예상 결과                                       |
| 총 회기: 10회 ➔ 15회                          |
| 남은 회기: 7회 ➔ 12회                         |
---------------------------------------------------
                           [ 취소 ] [+5회기 요청]
===================================================
```

### PENDING 상태
```text
===================================================
[ 회기 추가 대기 중 ]                  [ PENDING ]
---------------------------------------------------
|                                                 |
|  요청 회기 : +5회                               |
|  입금 대기 금액 : 500,000원                     |
|  결제 수단 : 계좌이체                           |
|  요청 일시 : 2026-07-17 14:30                   |
|                                                 |
| * 입금이 확인되면 즉시 회기가 추가됩니다.       |
---------------------------------------------------
                       [요청 취소] [입금 확인]
===================================================
```

---

## 6. CSS 디자인 토큰 목록

코딩 시 하드코딩(`hex`, `rgb`)을 금지하고 반드시 아래의 토큰을 사용합니다.
- 배경색: `var(--mg-color-background-main)`, `var(--mg-color-surface-elevated)`
- 테두리: `var(--mg-color-border-main)`
- 텍스트: `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`
- 악센트/Primary: `var(--mg-color-primary-main)`
- Warning/Error: `var(--mg-color-warning-main)`, `var(--mg-color-error-main)`
- 간격/반경: `var(--mg-spacing-16)`, `var(--mg-spacing-24)`, `var(--mg-radius-8)`, `var(--mg-radius-10)`

---

## 7. 접근성 (Accessibility) 가이드
- **Focus & Keyboard**: 모달 오픈 시 포커스가 모달 내부로 트랩되어야 하며(UnifiedModal 기본 제공), 모든 Input과 Button은 탭 키(Tab)로 접근 및 실행 가능해야 합니다.
- **Labeling**: `추가 회기 수`, `추가 금액` 등 모든 입력 필드에는 명시적인 `<label>`(또는 `aria-label`)이 제공되어야 합니다.
- **Contrast**: `var(--mg-color-text-main)` 및 `var(--mg-color-text-secondary)`는 배경색 대비 WCAG AA 등급의 대비를 준수합니다.

---

## 8. 삭제 및 대체 대상 레거시 클래스/컴포넌트
`SessionExtensionModal.js` 코더 구현 시, 아래 레거시 요소는 **전면 삭제** 또는 대체되어야 합니다.
- **삭제 대상 클래스**: `session-extension-overlay`, `session-extension-modal`, `session-extension-header`, `session-extension-form` 등 기존 CSS.
- **대체 대상 컴포넌트**: 별도로 구현되었던 커스텀 백드롭(Backdrop)은 삭제하고, `UnifiedModal`로 일괄 대체.

---

## 9. 전달 체크리스트 (Handoff Checklist)

`core-publisher` 또는 `core-coder`가 작업 시 준수해야 할 항목입니다.

- [ ] 기존 커스텀 모달 오버레이/클래스(`session-extension-*` 등)를 완전 제거했는가?
- [ ] `frontend/src/components/common/modals/UnifiedModal.js`를 사용하고, `className="mg-v2-ad-b0kla"`를 주입했는가?
- [ ] PENDING 상태 화면과 신규 추가 폼 화면이 정상적으로 분기 렌더링 되는가?
- [ ] 입력 폼에서 추가 회기 값에 따라 "예상 결과(Projection)" 영역이 동각으로 업데이트 되는가?
- [ ] 입금 확인 및 요청 취소 액션 전 Confirm 경고창(Risk UX)이 구현되었는가?
- [ ] 화면의 텍스트가 잘리거나 오버플로우 되지 않는가? (데스크톱/모바일 반응형 확인)
- [ ] 스타일 작성 시 하드코딩된 색상 값이 없는가? (모두 `var(--mg-*)`로 치환)
- [ ] `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`에 따라 수치와 텍스트 출력 시 `toSafeNumber`, `toDisplayString` 등 안전 래퍼를 사용했는가?
