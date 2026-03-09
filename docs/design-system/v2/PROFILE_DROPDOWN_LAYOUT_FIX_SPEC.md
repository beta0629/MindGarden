# ProfileDropdown 레이아웃 수정 명세 (GNB v2)

**작성일**: 2026-03-09  
**작성자**: Core Designer  
**목적**: GNB 프로필 드롭다운 패널 위치·헤더/정보 영역 깨짐 수정을 위한 디자인 명세. 코드 작성 없이 적용할 CSS·레이아웃 권장사항만 기술.

**참조**:
- 펜슬 가이드: `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- GNB 컴포넌트 스펙: `docs/design-system/v2/GNB_COMPONENTS_DESIGN_SPEC.md`
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. 현재 구조 요약

| 구분 | 내용 |
|------|------|
| **트리거** | 아바타 + 이름 + ChevronDown (`.mg-v2-profile-trigger`) |
| **패널** | `.mg-v2-dropdown-panel.mg-v2-profile-dropdown__panel` (absolute, top: calc(100%+8px), right: 0) |
| **공통** | `dropdown-common.css` — 패널 공통 스타일·애니메이션 |

**문제**:
- 패널이 `top = -46px` 등으로 인식되어 화면 위로 치우치거나 잘림.
- `__info` 영역(이름·이메일·역할 뱃지)이 136px 등 좁은 너비에 몰려 디자인 깨짐.

---

## 2. 레이아웃/포지셔닝 권장사항 (패널이 GNB 아래에 자연스럽게 붙도록)

### 2.1 포지셔닝·기준점

- **패널 위치 기준**: 패널의 `position: absolute` 기준은 **트리거를 감싼 래퍼**(`.mg-v2-profile-dropdown`)여야 함. 해당 래퍼에 `position: relative` 유지.
- **권장 위치 값**: `top: calc(100% + 8px)`, `right: 0` 유지. “100%”가 트리거 버튼의 하단이 되도록, 패널을 감싼 컨테이너가 **트리거와 동일한 래퍼**인지 확인 (DOM 구조상 패널이 해당 래퍼 직자식).
- **잘림 원인 점검**: GNB(`.mg-v2-desktop-gnb`) 또는 그 부모(`.mg-v2-desktop-gnb__center`, `.mg-v2-gnb-right`, `.mg-v2-gnb-right__icons`)에 `overflow: hidden`이 있으면 패널이 잘림. **권장**: 이 경로에는 `overflow: visible`만 두거나 overflow 미지정.

### 2.2 overflow

| 대상 | 권장 |
|------|------|
| `.mg-v2-profile-dropdown` | `overflow: visible` (기본이면 생략 가능, 숨김 금지). |
| `.mg-v2-desktop-gnb` | `overflow: visible` (또는 미지정). |
| `.mg-v2-desktop-gnb__center` | `overflow: visible` (또는 미지정). |
| `.mg-v2-gnb-right`, `.mg-v2-gnb-right__icons` | `overflow: visible` (또는 미지정). |

패널이 뷰포트 아래로 나가면 스크롤로 보이게 하는 것은 문서(body/main) 레벨에서 처리하고, GNB 영역은 잘리지 않도록 유지.

### 2.3 z-index

| 요소 | 권장 값 | 비고 |
|------|---------|------|
| `.mg-v2-dropdown-overlay` | 999 | 모바일 배경 딤 (기존 유지). |
| `.mg-v2-dropdown-panel` | 1000 | GNB(예: 100 미만)보다 위에 오도록. |
| GNB 헤더 | 100 이하 (예: 50) | 패널이 헤더 위에 그려지도록. |

패널이 다른 플로팅 요소(알림·빠른액션 드롭다운)와 동시에 열리지 않는다면 1000 유지로 충분.

### 2.4 애니메이션과의 관계

- 공통에서 `transform: translateY(-8px)` → `translateY(0)` 사용 시, **containing block**이 transform 有 요소로 바뀌지 않도록 주의.
- 패널의 위치 기준이 되는 조상에는 `transform`을 주지 않는 것이 안전. (필요 시 트리거 래퍼만 `position: relative`로 두고, 그 위 조상에는 transform 미적용.)

---

## 3. __header / __info 영역 명세 (아바타 위·이름·이메일·역할 뱃지 세로 정렬)

### 3.1 구조 (블록 방향)

- **레이아웃**: 세로 배치. **아바타 → 이름 → 이메일 → 역할 뱃지** 순서.
- **정렬**: 가운데 정렬(center). 단, 텍스트가 길 때를 대비해 `__info` 내부는 블록 방향으로만 쌓고, 인라인은 중앙 정렬.

### 3.2 __header (`.mg-v2-profile-dropdown__header`)

| 속성 | 값 |
|------|-----|
| display | flex |
| flex-direction | column |
| align-items | center |
| padding | 20px (상하좌우 동일) |
| border-bottom | 1px solid var(--mg-color-border-main, #D4CFC8) |
| flex-shrink | 0 (패널 내에서 헤더가 눌리지 않도록) |

### 3.3 아바타 (헤더 내 첫 번째 자식, ProfileAvatar)

| 속성 | 값 |
|------|-----|
| 크기 | 56×56px (medium 사이즈) |
| margin-bottom | 12px (아바타와 __info 사이 간격) |
| flex-shrink | 0 |

(ProfileAvatar 컴포넌트/atom 쪽에서 size="medium"일 때 56px 지정되어 있으면 유지.)

### 3.4 __info (`.mg-v2-profile-dropdown__info`)

| 속성 | 값 |
|------|-----|
| width | 100% (헤더 폭 260px에 맞춤) |
| min-width | 0 (flex 자식이 넘치지 않도록) |
| text-align | center |
| margin-top | 0 (아바타에서 이미 margin-bottom 12px로 간격 확보) |
| display | flex |
| flex-direction | column |
| align-items | center |
| gap | 4px (이름–이메일), 8px (이메일–뱃지)는 아래 개별 margin으로 처리 가능. 또는 gap: 4px만 주고 이메일 margin-bottom: 8px. |

**요약**: __info는 블록 세로 스택, 가운데 정렬, 너비 100%·min-width 0으로 긴 이메일 말줄임 가능하게.

### 3.5 이름 (`.mg-v2-profile-dropdown__name`)

| 속성 | 값 |
|------|-----|
| font-family | 'Noto Sans KR', sans-serif |
| font-size | 16px |
| font-weight | 600 |
| color | var(--mg-color-text-main, #2C2C2C) |
| margin | 0 0 4px 0 (또는 margin-bottom: 4px) |
| width | 100% (또는 max-width: 100%) |
| overflow | hidden |
| text-overflow | ellipsis |
| white-space | nowrap |
| text-align | center |

### 3.6 이메일 (`.mg-v2-profile-dropdown__email`)

| 속성 | 값 |
|------|-----|
| font-family | 'Noto Sans KR', sans-serif |
| font-size | 13px |
| font-weight | 400 |
| color | var(--mg-color-text-secondary, #5C6B61) |
| margin | 0 0 8px 0 (또는 margin-bottom: 8px) |
| width | 100% (또는 max-width: 100%) |
| min-width | 0 |
| overflow | hidden |
| text-overflow | ellipsis |
| white-space | nowrap |
| text-align | center |

(긴 이메일은 한 줄 말줄임.)

### 3.7 역할 뱃지 (`.mg-v2-badge.mg-v2-badge-role`)

| 속성 | 값 |
|------|-----|
| margin-top | 0 (이메일 margin-bottom 8px로 간격 확보) |
| display | inline-block |
| padding | 4px 10px |
| border-radius | 6px |
| font-size | 11px |
| font-weight | 600 |

역할별 색상은 GNB 스펙·PENCIL 가이드 팔레트 유지:
- ADMIN: 배경 var(--mg-color-primary-main, #3D5246), 텍스트 #FFFFFF
- CONSULTANT: 배경 #6B7F72, 텍스트 #FFFFFF
- CLIENT: 배경 #8B7355, 텍스트 #FFFFFF
- STAFF: 배경 var(--mg-color-border-main, #D4CFC8), 텍스트 var(--mg-color-text-main, #2C2C2C)

---

## 4. 수정 시 적용할 CSS 속성/값 제안 (파일·클래스별)

아래는 **추가·변경할 속성만** 나열. 기존에 이미 맞게 되어 있으면 생략 가능.

### 4.1 `dropdown-common.css`

| 클래스 | 속성 | 값 | 비고 |
|--------|------|-----|------|
| `.mg-v2-dropdown-panel` | position | absolute | 유지 |
| | top | calc(100% + 8px) | 유지 (기준이 트리거 래퍼인지 DOM 확인) |
| | right | 0 | 유지 |
| | z-index | 1000 | 유지 |
| | (상위에 overflow 미적용) | — | GNB 경로 overflow: visible 확인 |

(공통 파일 자체보다는, 이 패널을 사용하는 **부모 경로**에서 overflow 제거가 중요.)

### 4.2 `ProfileDropdown.css`

| 클래스 | 속성 | 값 | 비고 |
|--------|------|-----|------|
| `.mg-v2-profile-dropdown` | position | relative | 유지 |
| | overflow | visible | 명시 권장 (잘림 방지) |
| `.mg-v2-profile-dropdown__panel` | width | 260px | 유지 |
| | max-height | 400px | 유지 |
| | min-height | (삭제 권장) | 200px 제거 시 헤더+메뉴만큼만 높이 사용, 레이아웃 자연스러움 |
| | display | flex | 유지 |
| | flex-direction | column | 유지 |
| | overflow | hidden | 패널 박스 자체는 유지 (내부 스크롤은 __menu에) |
| `.mg-v2-profile-dropdown__header` | display | flex | 유지 |
| | flex-direction | column | 유지 |
| | align-items | center | 유지 |
| | padding | 20px | 유지 |
| | border-bottom | 1px solid var(--mg-color-border-main, #D4CFC8) | 유지 |
| | flex-shrink | 0 | 추가 권장 |
| `.mg-v2-profile-dropdown__info` | width | 100% | 명시 |
| | min-width | 0 | 추가 (flex 자식 오버플로 방지) |
| | margin-top | 0 | (아바타와 간격은 아바타 margin-bottom으로) |
| | text-align | center | 유지 |
| | display | flex | 추가 (세로 정렬·중앙 정렬 명확화) |
| | flex-direction | column | 추가 |
| | align-items | center | 추가 |
| `.mg-v2-profile-dropdown__name` | font-family | 'Noto Sans KR', sans-serif | 유지 |
| | font-size | 16px | 유지 |
| | font-weight | 600 | 유지 |
| | color | var(--mg-color-text-main, #2C2C2C) | 유지 |
| | margin | 0 0 4px 0 (또는 margin-bottom: 4px) | 유지 |
| | width | 100% (또는 max-width: 100%) | 추가 권장 |
| | overflow | hidden | 유지 |
| | text-overflow | ellipsis | 유지 |
| | white-space | nowrap | 유지 |
| | text-align | center | 추가 (헤더가 가운데 정렬일 때) |
| `.mg-v2-profile-dropdown__email` | font-size | 13px | 유지 |
| | font-weight | 400 | 유지 |
| | color | var(--mg-color-text-secondary, #5C6B61) | 유지 |
| | margin | 0 0 8px 0 (또는 margin-bottom: 8px) | 유지 |
| | width | 100% (또는 max-width: 100%) | 명시 |
| | min-width | 0 | 추가 |
| | overflow | hidden | 유지 |
| | text-overflow | ellipsis | 유지 |
| | white-space | nowrap | 유지 |
| | text-align | center | 추가 권장 |
| `.mg-v2-badge-role` | margin-top | 0 | (이메일 margin-bottom으로 간격 확보 시) |

### 4.3 GNB 쪽 CSS (잘림 원인 제거용)

**파일**: `DesktopGnb.css` 또는 `GnbRight.css`

| 대상 | 속성 | 값 | 비고 |
|------|------|-----|------|
| `.mg-v2-desktop-gnb` | overflow | visible | 기본이면 생략, hidden이 있으면 제거 또는 visible로 변경 |
| `.mg-v2-desktop-gnb__center` | overflow | visible | 위와 동일 |
| `.mg-v2-gnb-right` | overflow | visible | 위와 동일 |
| `.mg-v2-gnb-right__icons` | overflow | visible | 위와 동일 |

---

## 5. 체크리스트 (구현 후 검증)

- [ ] 프로필 트리거 클릭 시 패널이 트리거 **바로 아래**에서 8px 띄워져 보인다.
- [ ] 패널이 뷰포트 상단으로 잘리지 않는다 (GNB 아래로만 내려감).
- [ ] 헤더에서 아바타 → 이름 → 이메일 → 역할 뱃지가 **세로로** 한 줄씩, 가운데 정렬로 보인다.
- [ ] 긴 이메일은 한 줄 말줄임(…)으로 표시된다.
- [ ] 패널 너비 260px에서 __info 영역이 136px 등으로 좁게 묶이지 않고, 헤더 전체 폭을 쓴다.
- [ ] 색상·타이포는 PENCIL 가이드·`var(--mg-color-*)` 토큰과 일치한다.

---

**요약**: (1) 패널이 트리거 래퍼 기준 `top: calc(100%+8px)`, `right: 0`로 붙고, GNB·우측 영역에 `overflow: visible` 유지. (2) __header는 flex column·align center, __info는 width 100%·min-width 0·말줄임 적용해 세로 정렬 및 긴 이메일 처리. (3) 위 표의 파일·클래스별 속성만 반영하면 표준에 맞게 정리됨.
