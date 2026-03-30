# GNB 드롭다운 레이아웃 겹침 현상 — 수정 계획

> **목표**: 사용자 제출 스크린샷 기준으로 프로필·빠른 액션 드롭다운의 레이아웃 겹침 현상을 정리하고, 원인 분석·모듈 검토·수정 적용 단계를 분배실행으로 진행하기 위한 계획 문서.  
> **작성**: 기획(core-planner). 원인 분석은 core-debugger, 컴포넌트 검토는 core-component-manager, 수정 구현은 core-coder에 위임.

---

## 1. 현상 확인 (스크린샷 기반)

### 1.1 프로필 드롭다운

| 번호 | 현상 설명 | 비고 |
|------|-----------|------|
| 1 | 상단 **원형 아바타**(이니셜 "탁")가 **"내 정보" 텍스트 및 person 아이콘**과 겹침 | 헤더 영역과 메뉴 영역의 시각적 겹침 |
| 2 | **이메일**(beta74@olive.co.kr)이 **"로그아웃" 텍스트와 빨간 화살표 아이콘**에 가려져 거의 읽기 어려움 | 이메일·메뉴 항목 간 겹침 또는 z-index/overflow |
| 3 | **설정**(설정 아이콘+설정 텍스트), **"탁구와마음 관리자" 역할**, 하단 **녹색 "관리자" 버튼** 등 요소가 한곳에 몰려 정리되지 않은 상태 | 헤더(__header)·정보(__info)·메뉴(__menu)·뱃지 배치 혼재 |

### 1.2 빠른 액션 드롭다운

| 번호 | 현상 설명 | 비고 |
|------|-----------|------|
| 1 | 상단 **"빠른 대시보드 보기"**(또는 "빠른 액션") 텍스트가 **이중으로 렌더된 것처럼 겹쳐 보임**(ghosting) | 헤더 타이틀 영역 텍스트 중복·페인트 이슈 가능 |
| 2 | 구분선 아래 **메뉴 항목**(사용자 관리, 시스템 설정, 통계 리포트)은 아이콘·텍스트·화살표가 나란히 있는 것으로 보임 | 리스트 영역은 정상에 가깝게 보일 수 있음 |

---

## 2. 참조 코드·문서

| 구분 | 경로 |
|------|------|
| 프로필 드롭다운 | `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.js`, `ProfileDropdown.css` |
| 빠른 액션 드롭다운 | `frontend/src/components/dashboard-v2/molecules/QuickActionsDropdown.js`, `QuickActionsDropdown.css` |
| 공통 드롭다운 스타일 | `frontend/src/components/dashboard-v2/styles/dropdown-common.css` |
| 포지셔닝 훅 | `frontend/src/components/dashboard-v2/hooks/useDropdownPosition.js` |
| 기존 명세 | `docs/design-system/v2/PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md`, `docs/project-management/GNB_DROPDOWN_FIX_SPEC.md` |

---

## 3. 원인 분석 위임 안내

- **원인 분석은 기획이 수행하지 않으며, core-debugger에 위임한다.**
- 증상(위 §1), 재현 환경(브라우저·뷰포트·GNB 노출 여부), 확인할 파일·로그 포인트를 전달하고, **원인 분석 결과·수정 제안·체크리스트**를 core-debugger가 보고한다.
- 기획은 그 보고를 바탕으로 Phase 2·3의 담당과 전달 내용을 정리하고, 코더가 수정을 적용한다.

---

## 4. 수정 단계(Phase) 및 분배실행

| Phase | 담당 서브에이전트 | 목표 | 호출 시 전달할 태스크 설명 요약 |
|-------|-------------------|------|--------------------------------|
| **1** | **core-debugger** | 스크린샷 기반 겹침 현상의 원인 분석 및 수정 제안 | §5의 "Phase 1: core-debugger 호출용" 참고. 증상·재현·확인 포인트 전달 후, 원인 보고·수정 제안·체크리스트 산출 요청. |
| **2** | **core-component-manager** | 프로필·빠른 액션 드롭다운 모듈 구조·중복·적재적소 검토 | §5의 "Phase 2: core-component-manager 호출용" 참고. 디버거 보고 반영한 뒤, 컴포넌트/스타일 구조 검토 및 제안서 요청. |
| **3** | **core-coder** | 디버거 제안·컴포넌트 매니저 제안을 반영한 코드 수정 | §5의 "Phase 3: core-coder 호출용" 참고. core-designer 스펙·PROFILE_DROPDOWN_LAYOUT_FIX_SPEC·GNB_DROPDOWN_FIX_SPEC 참조하여 레이아웃·클래스 적용. |

**순서**: Phase 1 완료 → Phase 2(필요 시 디버거 보고 참조) → Phase 3. Phase 2와 3은 디버거 보고 수신 후 진행.

---

## 5. 스크린샷 요소 ↔ 클래스명 매핑 표 (디자이너·코더 참고)

### 5.1 프로필 드롭다운

| 스크린샷에서 보이는 요소 | 대응 클래스명(또는 컴포넌트) | 파일 |
|-------------------------|------------------------------|------|
| 트리거 영역 전체(아바타+이름+화살표) | `.mg-v2-profile-trigger` | ProfileDropdown.css |
| 트리거 내 이름 텍스트 | `.mg-v2-profile-trigger__name` | ProfileDropdown.css |
| 트리거 내 ChevronDown 아이콘 | `.mg-v2-profile-trigger__icon` | ProfileDropdown.css |
| 드롭다운 패널 전체 | `.mg-v2-dropdown-panel.mg-v2-profile-dropdown__panel` | dropdown-common.css, ProfileDropdown.css |
| 패널 상단 헤더 블록(아바타+이름+이메일+역할) | `.mg-v2-profile-dropdown__header` | ProfileDropdown.css |
| 헤더 내 원형 아바타 | `ProfileAvatar` (size="medium"), `.mg-v2-profile-avatar` | atoms, ProfileDropdown.css |
| 헤더 내 이름·이메일·뱃지 감싸는 영역 | `.mg-v2-profile-dropdown__info` | ProfileDropdown.css |
| 헤더 내 이름 텍스트 | `.mg-v2-profile-dropdown__name` | ProfileDropdown.css |
| 헤더 내 이메일 텍스트 | `.mg-v2-profile-dropdown__email` | ProfileDropdown.css |
| 역할 뱃지(예: "관리자") | `.mg-v2-badge.mg-v2-badge-role.mg-v2-badge-role--admin` 등 | ProfileDropdown.css |
| 메뉴 영역 컨테이너 | `.mg-v2-profile-dropdown__menu` | ProfileDropdown.css |
| 메뉴 항목 "내 정보"(User 아이콘+텍스트) | `.mg-v2-profile-menu-item` (첫 번째 button) | ProfileDropdown.js, ProfileDropdown.css |
| 메뉴 항목 "설정"(Settings 아이콘+텍스트) | `.mg-v2-profile-menu-item` (두 번째 button) | ProfileDropdown.js, ProfileDropdown.css |
| 메뉴 항목 "로그아웃"(LogOut 아이콘+텍스트, 빨간색) | `.mg-v2-profile-menu-item.mg-v2-profile-menu-item--danger` | ProfileDropdown.js, ProfileDropdown.css |
| 배경 딤(모바일) | `.mg-v2-dropdown-overlay` | dropdown-common.css |

### 5.2 빠른 액션 드롭다운

| 스크린샷에서 보이는 요소 | 대응 클래스명(또는 컴포넌트) | 파일 |
|-------------------------|------------------------------|------|
| 트리거(Zap 아이콘 등) | `.mg-v2-quick-actions-trigger`, `NavIcon` | QuickActionsDropdown.js, QuickActionsDropdown.css |
| 드롭다운 패널 전체 | `.mg-v2-dropdown-panel.mg-v2-quick-actions-dropdown__panel` | dropdown-common.css, QuickActionsDropdown.css |
| 패널 상단 헤더(타이틀 영역) | `.mg-v2-dropdown-panel__header` | dropdown-common.css |
| 헤더 타이틀 텍스트("빠른 액션" 등) | `.mg-v2-dropdown-panel__title` | dropdown-common.css |
| 구분선 아래 리스트 영역 | `.mg-v2-quick-actions-list` | QuickActionsDropdown.css |
| 리스트 항목 한 줄(아이콘+라벨+화살표) | `.mg-v2-quick-action-item` | QuickActionsDropdown.css |
| 항목 내 아이콘 | `.mg-v2-quick-action-item__icon` | QuickActionsDropdown.css |
| 항목 내 라벨 텍스트 | `.mg-v2-quick-action-item__label` | QuickActionsDropdown.css |
| 항목 내 ChevronRight 화살표 | `.mg-v2-quick-action-item__arrow` | QuickActionsDropdown.css |
| 배경 딤(모바일) | `.mg-v2-dropdown-overlay` | dropdown-common.css |

### 5.3 공통

| 요소 | 클래스명 | 파일 |
|------|----------|------|
| 패널 공통(위치·배경·테두리·애니메이션) | `.mg-v2-dropdown-panel` | dropdown-common.css |
| 패널 헤더 공통(일부 드롭다운) | `.mg-v2-dropdown-panel__header` | dropdown-common.css |
| 패널 타이틀 공통 | `.mg-v2-dropdown-panel__title` | dropdown-common.css |

---

## 6. Phase별 실행 위임문 (호출 시 전달용)

### Phase 1: core-debugger 호출용

다음 태스크를 core-debugger에게 전달하여 **원인 분석·수정 제안·체크리스트**를 요청한다.

- **문서**: 본 계획서 `docs/project-management/GNB_DROPDOWN_LAYOUT_OVERLAP_FIX_PLAN.md`의 §1 현상 확인 참고.
- **증상 요약**  
  - 프로필: 아바타와 "내 정보" 겹침, 이메일이 "로그아웃"에 가림, 헤더·메뉴·뱃지가 한곳에 몰림.  
  - 빠른 액션: 헤더 타이틀 텍스트가 이중 렌더(ghosting)처럼 겹쳐 보임.
- **확인 요청**  
  - 위 현상의 원인(레이아웃·flex/position·z-index·overflow·중복 렌더·CSS 우선순위·전역 스타일/스크립트 등) 분석.  
  - 관련 파일: `ProfileDropdown.js/.css`, `QuickActionsDropdown.js/.css`, `dropdown-common.css`, `useDropdownPosition.js`, 필요 시 `_dropdowns.css`, `globalDropdownFix.js`, `_layout-fixes.css`.  
- **산출물**: 원인 보고, 수정 제안(구체적 파일·클래스·속성 수준), 검증용 체크리스트. (코드 직접 수정 없음.)

### Phase 2: core-component-manager 호출용

다음 태스크를 core-component-manager에게 전달한다.

- **문서**: 본 계획서 및 core-debugger Phase 1 보고서.
- **요청 내용**  
  - 프로필·빠른 액션 드롭다운의 **모듈/컴포넌트 구조**, **스타일 중복·적재적소** 검토.  
  - 디버거 수정 제안과의 정합성, 공통화 가능 여부(dropdown-common, atoms 사용처) 검토.  
- **산출물**: 검토 결과·제안서(목록·중복 여부·배치 제안). (코드 직접 작성 없음.)

### Phase 3: core-coder 호출용

다음 태스크를 core-coder에게 전달한다.

- **문서**: 본 계획서, Phase 1 디버거 보고, Phase 2 컴포넌트 매니저 제안(있는 경우), `docs/design-system/v2/PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md`, `docs/project-management/GNB_DROPDOWN_FIX_SPEC.md`.
- **요청 내용**  
  - 디버거의 **원인·수정 제안**과 컴포넌트 매니저 **제안**을 반영하여, 프로필·빠른 액션 드롭다운의 **레이아웃 겹침 수정** 구현.  
  - §5 스크린샷–클래스 매핑 표를 참고해, 헤더·정보·메뉴·타이틀 영역이 겹치지 않고 정리되도록 수정.  
  - 디자인 시스템·기존 명세(PROFILE_DROPDOWN_LAYOUT_FIX_SPEC, GNB_DROPDOWN_FIX_SPEC) 및 `/core-solution-frontend`, `/core-solution-design-system-css` 스킬 준수.
- **산출물**: 수정된 코드·간단 검증 방법. 필요 시 core-designer와 협의해 비주얼 일관성 확인.

---

## 7. 리스크·제약

- 전역 스타일(`_dropdowns.css`, `globalDropdownFix.js`, `_layout-fixes.css`) 변경 시 다른 드롭다운·페이지 영향 범위 확인 필요.
- 접근성(role/aria, 포커스) 유지. 기존 GNB_DROPDOWN_FIX_SPEC·GNB_DROPDOWN_MARKUP_A11Y 참고.

---

## 8. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| 1 | 디버거가 원인·수정 제안·체크리스트를 보고함 | [ ] 원인 분석 보고서 수신 [ ] 수정 제안(파일·클래스·속성) 수신 [ ] 검증 체크리스트 수신 |
| 2 | 컴포넌트 매니저가 검토·제안서를 보고함 | [ ] 모듈/구조 검토 결과 수신 [ ] 중복·적재적소 제안 수신(해당 시) |
| 3 | 코더가 수정 적용 후 겹침 현상 해소 | [ ] 프로필: 아바타–내 정보·이메일–로그아웃 겹침 해소 [ ] 프로필: 헤더·메뉴·뱃지 정리 [ ] 빠른 액션: 헤더 타이틀 ghosting 해소 [ ] 기존 명세·디자인 토큰 유지 |

---

## 9. 참조

- 기획·레이아웃: `/core-solution-planning`, `docs/standards/`
- 서브에이전트 활용: `docs/standards/SUBAGENT_USAGE.md`
- GNB·드롭다운 기존 스펙: `docs/project-management/GNB_DROPDOWN_FIX_SPEC.md`, `docs/design-system/v2/PROFILE_DROPDOWN_LAYOUT_FIX_SPEC.md`, `docs/design-system/v2/GNB_DROPDOWN_SPEC.md`

---

*문서 끝. 실행은 분배실행 표(§4)·Phase별 위임문(§6)에 따라 해당 서브에이전트를 호출하여 진행.*
