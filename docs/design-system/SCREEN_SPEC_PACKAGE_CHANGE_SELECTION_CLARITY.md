# 화면설계·비주얼 스펙 — 패키지 변경「패키지 선택」칩 구분

**역할 산출**: core-designer (코드 없음) · polish 반영 2026-09-05  
**대상**: `PendingPackageEditModal` / `MappingEditModal` 「패키지 선택」 2열 그리드 칩  
**SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md` · tokens `unified-design-tokens.css` / `design-v2-tokens.css`  
**금지**: B0KlA/Pencil 좌측 accent bar · raw hex in CSS(문서 참고 hex만)

---

## 사용성 · 정보 노출 · 레이아웃

| 항목 | 내용 |
|------|------|
| 사용성 | **지금 패키지** vs **바꿀 패키지(변경예정)** 를 한눈에 구분. 클릭 토글(기존 multi-select 유지). |
| 정보 노출 | 칩: 패키지명 · 회기 · 가격. 배지는 「현재」또는 「변경예정」중 하나만(이중 배지 금지). |
| 레이아웃 | 공유 그리드 `.mg-v2-mapping-edit-modal__package-grid`. 칩 = `PackageOptionCard`. |

---

## 상태 매트릭스 (필수)

| 상태 | 조건 | 시각 | 배지 |
|------|------|------|------|
| Default | ¬current ∧ ¬selected | cream/outline (neutral surface + hairline) | 없음 |
| Current only | current ∧ ¬selected | primary-subtle + primary-main border | 「현재」 |
| Current + Selected | current ∧ selected | primary-solid + inverse text | 「현재」만 |
| Pending change | ¬current ∧ selected | warning-100 bg · warning-500 border · warning-800 text | 「변경예정」 |

`current === selected`일 때도 배지「현재」와 solid를 **동시에** 보여 “지금 이것도 선택 중”임을 전달.  
다른 패키지를 고르면 그 칩만 amber **변경예정** (primary-solid selected 규칙이 pending-change를 덮지 않음).

---

## CSS 클래스 · 토큰

| 요소 | 클래스 |
|------|--------|
| Root | `mg-v2-package-option-card` |
| Current | `--current` |
| Selected | `--selected` |
| Pending change | `--pending-change` (`isSelected && !isCurrent`) |
| Label / Meta / Badge | `__label` / `__meta` / `__badge` |
| Badge modifiers | `__badge--current` / `__badge--pending-change` |

### Padding · typography

```
.mg-v2-package-option-card.mg-button.mg-button--outline,
.mg-v2-package-option-card.mg-button.mg-button--medium {
  padding-block: var(--mg-v2-space-3, 0.75rem) !important;
  padding-inline: var(--mg-spacing-md, var(--mg-v2-space-4, 1rem)) !important;
  min-height: auto !important;
  height: auto !important;
}
```

- label: `--mg-v2-font-size-body-md`
- meta / badge: `--mg-v2-font-size-caption`
- button text gap: `--mg-spacing-xs`

### Default

- `background`: `var(--mg-v2-color-neutral-100)` / `var(--mg-color-surface-main)`
- `border-color`: `var(--mg-v2-color-neutral-300)` / `var(--mg-color-border-main)`

### Current only (`--current`, not `--selected`)

- `background`: `var(--mg-v2-color-primary-subtle)`
- `border-color`: `var(--mg-v2-color-primary-main)` · medium width
- 배지: fill primary-main · text inverse/neutral-50

### Current + Selected (`--current.--selected`, no `--pending-change`)

- solid dusty teal: `var(--mg-v2-color-primary-solid)` + inverse text
- 배지 「현재」: neutral-50 fill · primary-solid text (solid 위 inverse 배지)

### Pending change (`--pending-change`)

- `background`: `var(--mg-color-warning-100, var(--mg-color-warning-bg))`
- `border`: `var(--mg-color-warning-500)` medium
- `color`: `var(--mg-color-warning-800, var(--mg-color-warning-dark))`
- 배지: bg warning-800 · text neutral-50
- meta: inherit warning-800 (opacity ok)
- hover: warning-200 bg / warning-600 border (토큰만)
- **Cascade**: `--pending-change`는 `--selected` **이후**에 두어 primary-solid를 덮음

### Hover / focus

- Default/current: border → primary-main, transform 없음
- Current+Selected: hover primary-dark
- Pending-change: 위 warning hover
- `:focus-visible`: 기존 MGButton/Clinic-OS ring

---

## i18n (ko · `mapping.pendingPackage.modal`)

| Key | Value |
|-----|-------|
| `badgeCurrent` | `현재` |
| `badgePendingChange` | `변경예정` |
| `ariaStatusCurrent` | `현재` |
| `ariaStatusPendingChange` | `변경예정` |
| `ariaStatusCurrentSelected` | `현재, 선택됨` |
| `ariaStatusSelected` | `선택됨` (레거시; pending 변경 시 aria는 PendingChange 사용) |

JS: `badgePendingChangeLabel` required · `buildPackageAriaLabel`에서 `!isCurrent && isSelected` → `ariaStatusPendingChange`.

---

## a11y

- Selected: `aria-pressed={true|false}`
- Current / pending: 배지 + `aria-label` 상태 문구
- `data-package-current` / `data-package-selected` / `data-package-pending-change`
- 색만으로 구분하지 말 것

---

## 데이터 경계

- **currentPackageIds**: 오픈·옵션 로드 시 1회 추론, 이후 불변
- **selectedPackageIds**: 사용자 선택 (초기 = current)
- 가격·결제·API 변경 없음 (FE chrome만)

---

## 완료 기준

- [x] 4상태 시각·클래스·토큰 (pending-change amber 포함)
- [x] 배지 「현재」/「변경예정」상호 배타 · padding/body-md/caption
- [x] Clinic-OS 토큰만 · B0KlA accent 금지
