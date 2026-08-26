# Header QuickActions / Notification / Profile — 공통 표면 추출 제안

**역할**: core-component-manager (제안·문서만, 코드 수정 없음)  
**일자**: 2026-08-26  
**스킬**: `/core-solution-common-modules`, `/core-solution-encapsulation-modularization`, 아토믹 디자인  
**참조**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`, `docs/design-system/v2/GNB_DROPDOWN_SPEC.md`, `dropdown-common.css`, `GnbDropdownPortal.js`

---

## 0. 현황 요약 (조사 결과)

| 단위 | 경로 | 이미 공통 | 중복·마찰 |
|------|------|-----------|-----------|
| Portal 쉘 | `dashboard-v2/molecules/GnbDropdownPortal.js` | 3드롭다운 공유 (body portal + overlay + panel 래퍼) | 충분. 새 포털 래퍼 불필요 |
| 패널 surface | `dashboard-v2/styles/dropdown-common.css` | `.mg-v2-dropdown-panel` — bg / border / **radius 16px** / shadow / fade-in; `__header`·`__title` | 너비·높이만 각 CSS. **이미 HeaderPopover surface 역할** |
| QuickActions | `molecules/QuickActionsDropdown.js` + CSS | Portal + common header | 행 = **MGButton** + outline 무효화 CSS |
| Notification | `molecules/NotificationDropdown.js` + CSS | Portal + common header + footer(로컬) | 행 = **MGButton** 무효화; 탭 = **SegmentedTabs** + 레거시 underline CSS 잔존 |
| Profile | `molecules/ProfileDropdown.js` + CSS | Portal + common panel class | 행 = **native button** (이미 flush). 헤더는 **전용** (`__header` 아바타 블록) |
| 탭 | `common/SegmentedTabs` | SSOT: **갭 있는** track+pill | GNB 알림 CSS는 full-width **underline 탭 바**를 가정 → 시각·의도 불일치 |
| (범위 외 언급) | MappingCreationModal person/pkg cards | — | MGButton flush 카드와 **동일 안티패턴**. 이번 Header 추출 필수 아님 |

공통 모듈 우선: **UnifiedModal**(알림 상세만), **NotificationContext**, **SegmentedTabs**, **NavIcon** / **NotificationBadge** / **ProfileAvatar**(atoms). 신규 포털·모달 쉘을 만들지 말 것.

---

## 1) HeaderPopover(또는 동등) shell — 패널 surface 공유

**결론: 3드롭다운이 이미 surface를 공유한다. 신규 `HeaderPopover` React 컴포넌트는 만들지 않는다.**

| 공유 항목 | 상태 | 권장 |
|-----------|------|------|
| surface / padding(헤더) / shadow / radius / animation | `dropdown-common` + `GnbDropdownPortal` | **유지·문서화**를 SSOT로 명시 |
| 패널 너비·min/max-height | 각 `*Dropdown.css` | **유지** (스펙: 260 / 280 / 360) |
| 프로필 identity 헤더 | Profile 전용 | **유지** (공통 `__header`와 합치지 말 것) |
| 알림 footer | Notification CSS의 `dropdown-panel__footer` | 알림만 사용 → **유지**; 2곳 이상 필요 시 common으로 승격 |

코더 작업 시(선택): 네이밍만 정리 — 주석/가이드에 “`GnbDropdownPortal` + `.mg-v2-dropdown-panel` = Header popover shell”. `HeaderPopover`라는 **별도 파일 추가 금지**(이중 래핑·과도한 추상화).

---

## 2) HeaderMenuRow — flush native button row

**문제**: QuickActions·Notification이 `MGButton` + `buildErpMgButtonClassName` + 대량 outline 보정 CSS로 “메뉴 행”을 흉내 냄. Profile는 이미 native flush. GNB 오버레이도 native button(MGButton `display:!important` 충돌 회피) 선례와 일치.

**추출 권장 (Atom)**

| 항목 | 제안 |
|------|------|
| 이름 | `HeaderMenuRow` (또는 `GnbMenuRow`) |
| 계층 | **Atom** — `frontend/src/components/dashboard-v2/atoms/HeaderMenuRow.js` + `.css` |
| 마크업 | native `<button type="button">`, flush (border/bg none, full width, text-align left, hover `var(--mg-color-bg-hover)`) |
| props | `onClick`, `children`, `danger?`, `role?` (`menuitem`), `className`, `disabled` |
| 스타일 귀속 | 행 공통은 atom CSS 또는 `dropdown-common`의 `.mg-v2-header-menu-row`; 도메인 장식은 각 molecule |

**재사용**

| 소비자 | 적용 |
|--------|------|
| Profile `mg-v2-profile-menu-item` | → HeaderMenuRow (+ `--danger`) |
| QuickActions `mg-v2-quick-action-item` | → HeaderMenuRow, **MGButton 제거** |
| Notification `mg-v2-notification-item` | 동일 flush base + **children 슬롯**(unread dot·title/time). 별도 Molecule `NotificationMenuRow`는 **선택**(구조가 복잡할 때만) |

**하지 말 것**: ActionButton/MGButton으로 메뉴 행 통일; MappingCreationModal 카드까지 이번 Phase에 묶기.

---

## 3) 중복 vs 유지 (과도한 추상화 금지)

| 후보 | 판정 | 이유 |
|------|------|------|
| GnbDropdownPortal | **유지** | 이미 3곳 공통 |
| dropdown-common 패널 surface | **유지** | HeaderPopover shell SSOT |
| useDropdownPosition + click-outside/Escape 훅 통합 | **유지 또는 경량 훅만** | 3곳 동일 패턴이나 Organism 합병 금지 |
| HeaderMenuRow | **추출** | 2곳+ MGButton 안티패턴 + Profile native와 정합 |
| 3 Dropdown → 단일 Organism | **금지** | 데이터·ARIA(role menu vs dialog)·헤더 구조 상이 |
| 프로필 헤더 ↔ 공통 `__header` 통합 | **금지** | 시각·책임이 다름 |
| MappingCreation “선택 가능 카드” | **언급만 / 후순위** | 패턴 유사( MGButton flush ). Header 완료 후 별도 후보 |
| 알림 상세 UnifiedModal | **유지** | 공통 모듈 준수 |

---

## 4) 파일 경로·계층 · 기존 공통 모듈

```
Atoms     dashboard-v2/atoms/HeaderMenuRow(.js/.css)   ← 신규 제안
          NavIcon, NotificationBadge, ProfileAvatar    ← 기존 유지
Molecules GnbDropdownPortal                            ← shell (기존)
          QuickActionsDropdown / NotificationDropdown / ProfileDropdown
Styles    dashboard-v2/styles/dropdown-common.css      ← surface SSOT
Common    SegmentedTabs, UnifiedModal, NotificationContext, SafeText
```

- **common/** 로 HeaderMenuRow를 올리지 않음 — GNB/헤더 드롭다운 전용. 전역 메뉴 행 수요가 생기면 그때 승격.
- `COMMON_MODULES_USAGE_GUIDE` 갱신(코더/문서 Phase): GNB 드롭다운 = Portal + dropdown-common; 메뉴 행 = HeaderMenuRow(native); 본문 CTA만 MGButton/ActionButton.

---

## 5) SegmentedTabs — “진짜 segmented(갭 없음)” vs GNB variant

| 옵션 | 내용 | 판정 |
|------|------|------|
| A. 전역 SegmentedTabs를 갭 없는 한 덩어리로 변경 | wellness·ERP·Shop 등 SSOT 파괴 | **금지** |
| B. GNB 전용 `variant="underline"` / `appearance="panel"` | full-width, track·gap 없음, 하단 border + active underline (현 Notification CSS 의도) | **권장** |
| C. SegmentedTabs 대신 로컬 PanelTabs 복원 | 공통 모듈 후퇴 | 비권장 |
| D. GNB도 현 SSOT(갭+pill) 수용 + 레거시 `__tab` CSS 삭제 | 디자인 합의 시만 | 차선 |

**권장**: **B**. `common/SegmentedTabs`에 **variant만 추가**(기본 = 현 SSOT segmented). Notification은 `variant="underline"`(가칭) + `className="mg-v2-notification-dropdown__tabs"`. 죽은 `.mg-v2-notification-dropdown__tab*` 규칙 정리. “갭 없는 진짜 segmented”가 필요하면 SSOT에 `gap: 0` **별 variant**로 두고, GNB underline과 혼동하지 말 것.

---

## 6) core-coder 실행 순서 (제안만)

1. HeaderMenuRow atom 추가 → Profile · QuickActions · Notification 행을 native로 치환, MGButton 보정 CSS 삭제.  
2. SegmentedTabs `underline`(panel) variant → Notification 적용, 레거시 탭 CSS 정리.  
3. Portal/surface는 문서·주석만; 컴포넌트 신설 없음.  
4. (후속) MappingCreationModal 선택 카드 = 별 문서/Phase.

**테스터 게이트**: 3드롭다운 열림/위치/Escape/모바일 overlay; 메뉴·알림 행 클릭; 알림 탭 키보드(Arrow/Home/End); 프로필 danger(로그아웃) 색.

---

## 7) 재사용 매트릭스 (요약)

| 표면/단위 | QuickActions | Notification | Profile | 공통 모듈·위치 |
|-----------|:------------:|:------------:|:-------:|----------------|
| Portal + overlay | ✓ | ✓ | ✓ | `GnbDropdownPortal` (Molecule) |
| Panel surface (radius/shadow/bg) | ✓ | ✓ | ✓ | `dropdown-common` `.mg-v2-dropdown-panel` |
| Common title header | ✓ | ✓ | — | `dropdown-panel__header` |
| Profile identity header | — | — | ✓ | Profile 전용 (유지) |
| HeaderMenuRow (flush native) | **추출→** | **추출→** | **추출→** | `dashboard-v2/atoms` **신규** |
| MGButton 메뉴 행 | 제거 | 제거 | 해당 없음 | — |
| SegmentedTabs | — | variant **underline** | — | `common/SegmentedTabs` |
| Footer link | — | ✓ 유지 | — | Notification CSS |
| UnifiedModal 상세 | — | ✓ | — | `common/modals` |

**한 줄**: Shell은 이미 공통(Portal + dropdown-common). 이번에 추출할 것은 **HeaderMenuRow(native flush)** 와 **SegmentedTabs GNB underline variant**뿐; HeaderPopover 신설·3-in-1 Organism은 하지 않는다.
