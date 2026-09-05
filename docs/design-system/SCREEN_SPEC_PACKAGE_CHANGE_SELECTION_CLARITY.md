# 화면설계·비주얼 스펙 — 패키지 변경「패키지 선택」칩 구분

**역할 산출**: Phase 1 core-designer (코드 없음)  
**대상**: `PendingPackageEditModal` 「패키지 선택」 2열 그리드 칩  
**참조 증상**: 기존 선택이 thin teal border만이라 구분이 약함  
**스크린샷**: `/workspace/uploads/package-change-selection.png` (환경에 없을 수 있음 — 증상 설명 기준으로 설계)  
**SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` · tokens `unified-design-tokens.css` / `design-v2-tokens.css`  
**금지**: B0KlA/Pencil 좌측 accent bar · raw hex in CSS(문서 참고 hex만)

---

## 사용성 · 정보 노출 · 레이아웃

| 항목 | 내용 |
|------|------|
| 사용성 | 관리자가 가계약 매핑의 **지금 패키지**와 **바꿀 패키지**를 한눈에 구분. 클릭으로 선택 토글(기존 multi-select 유지). |
| 정보 노출 | 칩: 패키지명 · 회기 · 가격. 「현재」배지는 **매핑에 묶인 기존 패키지**만. 선택 상태는 강한 채움. |
| 레이아웃 | 모달 본문 내 「패키지 선택」섹션 → 기존 공유 그리드 `.mg-v2-mapping-edit-modal__package-grid`. 칩은 카드형 옵션 버튼. |

---

## 상태 매트릭스 (필수)

| 상태 | 조건 | 시각 | 비색 단서 |
|------|------|------|-----------|
| Neutral | not current, not selected | surface + hairline border | — |
| Current only | current ∧ ¬selected | muted teal wash + outline | 배지 「현재」 |
| Selected only | ¬current ∧ selected | solid dusty teal fill | `aria-pressed="true"` |
| Current + Selected | current ∧ selected | solid fill **+** 배지 「현재」 | 배지 + `aria-pressed` |

`current === selected`일 때도 배지와 solid를 **동시에** 보여 혼동 없이 “지금 이것도 선택 중”임을 전달.

---

## CSS 클래스 · 토큰 (코더 구현용)

공유 옵션 컴포넌트 BEM (권장명):

| 요소 | 클래스 |
|------|--------|
| Root | `mg-v2-package-option-card` |
| Current | `mg-v2-package-option-card--current` |
| Selected | `mg-v2-package-option-card--selected` |
| Label | `mg-v2-package-option-card__label` |
| Meta | `mg-v2-package-option-card__meta` |
| Badge | `mg-v2-package-option-card__badge` |

Pending 모달 스코프 래퍼는 기존 `mg-v2-pending-package-edit__*` 유지 가능. 신규 상태 스타일은 **공유 클래스**에 두는 것을 우선.

### Neutral

- `background`: `var(--mg-v2-color-neutral-100)` 또는 `var(--mg-color-surface-main)`
- `border-color`: `var(--mg-v2-color-neutral-300)` / `var(--mg-color-border-main)`
- `color`: `var(--mg-v2-color-text-primary)` / `var(--mg-color-primary-dark)`

### Current (`--current`, not `--selected`)

- `background`: `var(--mg-v2-color-primary-subtle)` (= `#DCE8E5` 참고)
- `border-color`: `var(--mg-v2-color-primary-main)` (= `#0E5F5A`)
- `border-width`: medium (thin보다 눈에 띄게; 토큰 있으면 `--mg-border-width-*`)
- 배지: 작은 pill, fill `var(--mg-v2-color-primary-main)`, text `var(--mg-v2-color-text-inverse)` 또는 `var(--mg-v2-color-neutral-50)`

### Selected (`--selected`)

- `background`: `var(--mg-v2-color-primary-solid)` / `var(--mg-color-primary-solid)` (= `#0E5F5A`)
- `border-color`: same solid
- `color` (label/meta): `var(--mg-v2-color-text-inverse)` 또는 `var(--mg-v2-color-neutral-50)` (`#FAF9F7`)
- meta도 동일 계열(대비 유지; opacity만 살짝 낮춰도 됨 — 토큰 기반)

### Current + Selected

- Selected fill 우선 적용
- 배지 「현재」유지: solid 위에서는 outline/soft inverse 배지  
  - `background`: `var(--mg-v2-color-neutral-50)` 또는 subtle  
  - `color`: `var(--mg-v2-color-primary-solid)`  
  - 또는 inverse border + inverse text (가독성 우선)

### Hover / focus

- Neutral/current: border → `var(--mg-v2-color-primary-main)`, transform 없음(기존 Pending 패턴)
- Selected: hover `var(--mg-v2-color-primary-dark)` / `#0A4F4B` 토큰
- `:focus-visible`: 기존 MGButton/Clinic-OS ring 유지

---

## i18n (ko only keys; 한국어 라벨)

| Key | Value |
|-----|-------|
| `mapping.pendingPackage.modal.badgeCurrent` | `현재` |
| `mapping.pendingPackage.modal.ariaPackageOption` | 선택적 — `"{{name}}, {{status}}"` 등 |

상태 문구 예: `현재` / `선택됨` / `현재, 선택됨`

---

## a11y

- Selected: `aria-pressed={true|false}` (토글 버튼)
- Current: 배지 텍스트로 비색 단서; `aria-label`에 「현재」포함 권장
- 색만으로 구분하지 말 것

---

## 데이터 경계 (구현 힌트 — 디자인 제약)

- **currentPackageIds**: 모달 오픈·옵션 로드 시 mapping에서 1회 추론, 이후 사용자 토글에 불변
- **selectedPackageIds**: 사용자 선택 (초기값 = current)
- 가격·결제·API 변경 없음

---

## 완료 기준 (디자이너)

- [x] 4상태 시각·클래스·토큰 명시
- [x] 「현재」배지 + solid selected 구분
- [x] Clinic-OS 토큰만 · B0KlA accent 금지
- [x] 코더가 추측 없이 구현 가능
