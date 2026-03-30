# MG Button — B0KlA/펜슬·아토믹 디자인 스펙

**목적**: MG Button이 "예전 스타일"이 아닌 **B0KlA/펜슬 디자인 시스템** 및 **아토믹 디자인**에 맞는 비주얼로 보이도록 적용할 토큰·수치를 정의한다.  
**대상**: core-coder (구현만 수행, 본 문서는 스펙만 제공)  
**참조**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` 2.5, `mindgarden-design-system.pen`, `unified-design-tokens.css`

---

## 1. B0KlA 버튼 비주얼 기준 (PENCIL_DESIGN_GUIDE 2.5)

| 항목 | 값 |
|------|-----|
| **주조 버튼** | 배경 #3D5246, 텍스트 #FAF9F7, padding 10–20px, **height 40px**, **border-radius 10px** |
| **아웃라인 버튼** | 배경 없음, 테두리 #D4CFC8 |

현재 `MGButton.css`는 `var(--mg-primary-500)`, `var(--cs-radius-md)`(8px) 등을 사용 중이며, B0KlA에서는 **주조가 녹색 #3D5246**이므로 primary 계열은 **B0KlA 전용 토큰**으로 통일해야 한다.

---

## 2. MG Button에 적용할 B0KlA 호환 토큰 목록

### 2.1 색상

| 용도 | B0KlA 값 | 적용할 토큰 (우선순위) | 비고 |
|------|----------|------------------------|------|
| Primary 배경 | #3D5246 | `var(--mg-color-primary-main)` → 없으면 `var(--mg-layout-sidebar-active-bg)` | 둘 다 #3D5246 대응 |
| Primary 텍스트 | #FAF9F7 | `var(--mg-color-text-on-primary)` 또는 `var(--mg-color-background-main)` → 없으면 `#FAF9F7` fallback | 토큰 추가 제안 |
| Primary 호버 배경 | #4A6354 | `var(--mg-color-primary-light)` → 없으면 `var(--mg-layout-sidebar-active-bg)` + 밝기 조정 또는 별도 토큰 | PENCIL 주조 밝음 |
| Outline 테두리/텍스트 | #D4CFC8 | `var(--mg-color-border-main)` → 없으면 `var(--mg-layout-header-border)` | 둘 다 #D4CFC8 |
| Outline 호버 배경 | #3D5246 | Primary 배경과 동일 토큰 | |
| Secondary(보조) 배경 | #6B7F72 | `var(--mg-color-secondary-main)` → 없으면 별도 토큰 추가 제안 | PENCIL 보조 |
| Disabled 배경/텍스트/테두리 | — | 기존 `var(--cs-secondary-100)`, `var(--cs-secondary-400)`, `var(--cs-secondary-300)` 유지 가능 | B0KlA와 충돌 없음 |
| Focus 링 | #3D5246 | `var(--mg-color-primary-main)` 또는 `var(--mg-layout-sidebar-active-bg)` | |

### 2.2 크기 · 간격 · radius

| 용도 | B0KlA 값 | 적용할 토큰 (우선순위) | 비고 |
|------|----------|------------------------|------|
| border-radius | **10px** | `var(--mg-button-radius)` → 없으면 `10px` | 현재 `--cs-radius-md`는 8px이므로 B0KlA용 10px 필요 |
| min-height (medium) | **40px** | `var(--button-height-default)` | 이미 40px 정의됨 |
| min-height (small) | 32px | `var(--button-height-sm)` | |
| min-height (large) | 48px | `var(--button-height-lg)` | |
| padding (medium) | 10–20px | `var(--button-padding-default)` (현재 12px 24px) 또는 `10px 20px` | PENCIL 10–20px에 맞추려면 토큰 값 조정 가능 |
| padding (small/large) | — | `var(--button-padding-sm)`, `var(--button-padding-lg)` | |
| gap (아이콘·텍스트) | — | `var(--cs-spacing-sm)` | 유지 |

### 2.3 요약 표 (variant별 B0KlA 토큰)

| Variant | 배경 | 텍스트 | 테두리 | 호버 배경 | 호버 텍스트 |
|---------|------|--------|--------|-----------|-------------|
| **primary** | `var(--mg-color-primary-main)` 또는 `var(--mg-layout-sidebar-active-bg)` | `var(--mg-color-text-on-primary)` 또는 `var(--mg-color-background-main)` | transparent | `var(--mg-color-primary-light)` 또는 동일 + opacity | 동일 |
| **outline** | transparent | `var(--mg-color-text-main)` 또는 outline용 primary | `var(--mg-color-border-main)` 또는 `var(--mg-layout-header-border)` | `var(--mg-color-primary-main)` / `var(--mg-layout-sidebar-active-bg)` | `var(--mg-color-text-on-primary)` / #FAF9F7 |
| **secondary** | `var(--mg-color-secondary-main)` (추가 제안) | `var(--mg-color-text-on-primary)` / #FAF9F7 | 필요 시 `var(--mg-color-border-main)` | 밝기 조정 또는 secondary-light | 동일 |
| success / danger / warning / info | 기존 시맨틱 유지 가능 | `var(--mg-white)` 또는 `var(--mg-color-text-on-primary)` | transparent | 기존 호버 토큰 | 동일 |
| **progress** | `var(--mg-primary-100)` 등 연한 주조 | `var(--mg-primary-700)` 등 진한 주조 | transparent | — | — |

---

## 3. core-coder에게 전달할 한 줄 지시

> **MGButton.css**에서 **primary**는 배경 `var(--mg-color-primary-main)`(없으면 `var(--mg-layout-sidebar-active-bg)`), 텍스트 `var(--mg-color-text-on-primary)` 또는 `var(--mg-color-background-main)`(없으면 #FAF9F7), **border-radius 10px**(또는 `var(--mg-button-radius)`), **min-height 40px**(medium은 `var(--button-height-default)`) 적용. **outline**은 테두리 `var(--mg-color-border-main)`(없으면 `var(--mg-layout-header-border)`), 배경 없음. 나머지 variant(secondary, success, danger, warning, info, progress)도 B0KlA 팔레트 토큰(`--mg-color-*`, `--mg-layout-*`)으로 통일하고, 기존 `--mg-primary-500`(파란 계열) 대신 주조 녹색(#3D5246) 계열 토큰을 사용한다.

---

## 4. 토큰이 없을 때 추가 제안

다음 토큰이 `unified-design-tokens.css` 또는 B0KlA 전용 오버레이(예: `responsive-layout-tokens.css`, 별도 `b0kla-tokens.css`)에 없으면 **추가를 제안**한다.

| 토큰명 | 권장 값 | 용도 |
|--------|---------|------|
| `--mg-color-primary-main` | #3D5246 | 주조 배경(버튼, 액티브 메뉴 등) |
| `--mg-color-primary-light` | #4A6354 | 주조 호버 |
| `--mg-color-secondary-main` | #6B7F72 | 보조 버튼/요소 |
| `--mg-color-background-main` | #FAF9F7 | 메인 배경·주조 위 텍스트 |
| `--mg-color-text-on-primary` | #FAF9F7 | 주조 배경 위 텍스트(버튼 라벨 등) |
| `--mg-color-border-main` | #D4CFC8 | 아웃라인 버튼 테두리, 구분선 |
| `--mg-color-text-main` | #2C2C2C | 본문 텍스트 |
| `--mg-button-radius` | 10px | 버튼 전용 border-radius (B0KlA 10px) |

이미 있는 경우:
- **레이아웃 쪽**: `--mg-layout-sidebar-active-bg` (#3D5246), `--mg-layout-header-border` (#D4CFC8), `--mg-layout-header-bg` (#FAF9F7) 등은 `responsive-layout-tokens.css`에 있으므로, **시맨틱 버튼 토큰이 없을 때 fallback**으로 사용 가능.

---

## 5. 참조 문서·파일

| 문서/파일 | 용도 |
|-----------|------|
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | 2.5 버튼 수치, 2.1 색상 팔레트·토큰명 |
| `docs/design-system/MG_BUTTON_ATOMIC_SPEC.md` | 기존 아토믹 토큰 목록·variant·size·상태 |
| `frontend/src/styles/unified-design-tokens.css` | 기존 `--mg-*`, `--cs-*` 토큰 확인 |
| `frontend/src/styles/responsive-layout-tokens.css` | B0KlA 레이아웃 색상 (`--mg-layout-*`) |
| `frontend/src/components/common/MGButton.css` | 현재 적용 대상 파일 |

---

## 6. 체크리스트 (구현 후 검증)

- [ ] Primary 버튼 배경이 **#3D5246(녹색)** 으로 보이는가?
- [ ] Primary 버튼 텍스트가 **#FAF9F7** 로 보이는가?
- [ ] 버튼 **border-radius 10px**, **min-height 40px**(medium) 적용되었는가?
- [ ] Outline 버튼 테두리가 **#D4CFC8** 로 보이는가?
- [ ] `var(--mg-primary-500)` 등 파란 계열이 primary에 더 이상 쓰이지 않는가?
