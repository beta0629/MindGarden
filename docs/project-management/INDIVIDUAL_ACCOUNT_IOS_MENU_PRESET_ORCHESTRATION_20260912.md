# Individual 계정 재제출 — iOS 메뉴 Admin 프리셋 오케스트레이션 (2026-09-12)

> **역할**: core-planner (오케스트레이션 전용 · 코드 직수정 금지)  
> **사용자 전략(필수 반영)**: Apple Developer **Individual** 유지 · Organization 전환은 **당장 불가** · 그래도 **출시(재제출)** · 민감·규제성 표면은 **Admin 플랫폼별 canView로 iOS만 숨김** · **Android는 기능 유지(노출)** · 추후 Org 준비 시 Admin에서 iOS만 재ON  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_*` / 빌드 extra / `Platform.OS === 'ios' hide` 소스 하드코딩  
> **선행·병행 SSOT**:  
> - iOS/AOS 이중 스위치: `docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md` (**반드시 완료**)  
> - RBAC 통일(완료): `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> - 구 팔로우업(양측 OFF·Org 전제): `APPLE_FOLLOWUP_ORCHESTRATION_20260912.md` → **본 문서로 재정렬(supersede)**  
> **목표 브랜치**: `cursor/individual-ios-menu-preset-891c` (기획) → 구현은 iOS/AOS 브랜치와 통합 PR 또는 후속 `cursor/*-891c`  
> **목표 반영**: `develop` PR

---

## 0. 정직성 고지 (기획 보고 필수 · 운영·PR 설명에도 반복)

| 사실 | 의미 |
|------|------|
| Guideline **5.1.1(ix)** | Apple Developer가 **Individual**인 한, 앱이 **심리상담·민감 건강 서비스**로 인식되면 **메뉴 숨김만으로 재거절 가능**. |
| 본 전략의 성격 | Admin 플랫폼 게이트는 **UGC·부가 민감 표면 축소로 리스크를 낮추는 운영 전략**이다. **Organization 요구의 법적·심사 대체재가 아니다.** |
| 그래도 하는 이유 | 사용자가 **Individual로 재제출을 진행**하기로 함. **메뉴로 막을 수 있는 범위는 최대한 준비**(iOS OFF / AOS ON). |
| 코어 비즈 | **상담 예약·회기·내 상담·메시지 등**을 끄면 앱이 **빈 껍데기** → **함부로 OFF 금지**. |

---

## 1. 목표 (1~2문장)

Individual 계정으로 iOS 재제출이 가능하도록, **소스 플래그가 아닌 Admin 프리셋/체크리스트**로 「심사(Individual) 모드」를 운영한다.  
**iOS / Android 메뉴 노출을 분리**한 뒤, 최소 **CLIENT/CONSULTANT 커뮤니티(UGC)는 iOS=숨김 · Android=노출** 시드·원클릭(또는 명확한 기본값)을 제공하고, EULA 17+·iPad(G4)는 병행 유지한다.

---

## 2. 사용자 관점 (§0.4 → designer 전달)

| 항목 | 내용 |
|------|------|
| **사용성** | ADMIN이 `/admin/menu-permissions`에서 역할 칩 → 메뉴 행의 **iOS \| Android 이중 Switch**를 각각 토글(즉시 grant). 심사 전 **「Individual 심사 권장」** 프리셋/체크리스트로 커뮤니티 등 **iOS만 OFF**. AOS·웹은 운영 유지. Org 전환 후 iOS만 다시 ON. |
| **정보 노출** | 노출: 한국어 메뉴명, iOS/Android 상태, 「심사 유의」뱃지, Individual 권장 OFF 안내. **비노출**: `menuCode`/`menuPath`/CRUD 4체크. 정직성 고지(5.1.1)는 **운영 문서·Review Notes**에 두고 Admin UI에 법률 오해 문구 과다 배치 금지. |
| **레이아웃** | Clinic-OS `MenuPermissionManagement` + `AdminCommonLayout` 재사용. 행 우측 **이중 Switch**. QuietHeader 일괄 저장 CTA **금지**. 선택: 「Individual 심사 프리셋 적용」보조 액션(ghost) — **원클릭 iOS OFF 목록**만, AOS는 건드리지 않음. |

---

## 3. 범위

### 포함

| # | 항목 | 비고 |
|---|------|------|
| 1 | **iOS / Android 메뉴 노출 분리** | `MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION` Phase 전부 **필수 완료** (DB `can_view_ios`/`can_view_android`, LNB `X-Client-Platform`, Admin 이중 Switch, Expo 헤더) |
| 2 | **Individual 심사 Admin 프리셋/시드** | 최소: `CLT_COMMUNITY`/`CST_COMMUNITY` → **ios=false, android=true** (웹 `can_view`는 explore 확정·권장 true). **양쪽 can_view=0 시드 폐기·개정** |
| 3 | **숨김 후보 vs 코어 유지 표** | explore 산출 → 사용자 보고. 메뉴로 가릴 수 있는 UGC·민감 허브만 후보 |
| 4 | **EULA 17+ · iPad(G4)** | 병행 트랙 유지(Individual이어도 1.2·4 필수). 기존 팔로우업 WIP 재사용 가능 |
| 5 | **운영 문서** | `docs/운영반영/APP_STORE_REVIEW_MENU_PERMISSION_CHECKLIST.md`에 **「Individual 계정 재제출 — iOS 메뉴 OFF 목록」** 섹션 |

### 제외

- Organization 계정 전환 자동화 / Apple 측 법인 절차
- 소스 `REVIEW_MODE` 부활
- 상담 예약·회기·홈·메시지 등 **코어 비즈 메뉴 일괄 OFF**
- 스케줄/사이드바/fc-event 대규모 수정
- Admin LNB에 신규 메뉴 추가

---

## 4. 확정 표 — 숨김 vs 코어 유지 (Phase 0 explore · 2026-09-12)

> Expo 라우트·`menus` Flyway·`menuPermissionCodes.ts` 조사 확정. 스토어 메타·온보딩 카피는 메뉴 밖 → 표 B.  
> 사용자 정책: **위험한 건 다 막고 → 출시 → 이후 기능 추가 검토**. iOS만 OFF, AOS 유지.

### 표 A — 앱 메뉴·탭

| 표면 | 역할 | 진입 | 판정 | Individual iOS | AOS | menuCode / 게이트 | 근거 |
|------|------|------|------|----------------|-----|-------------------|------|
| **커뮤니티**(UGC·게시/댓글) | CLIENT / CONSULTANT | 더보기 → 커뮤니티 | **OFF 확정(필수)** | **OFF** | **ON** | `CLT_COMMUNITY` / `CST_COMMUNITY` | Apple 1.2 UGC · 공개 피드 |
| 차단 사용자 등 커뮤니티 부속 | 동일 | community·blocked | **동묶음 OFF** | OFF | ON | 별도 code 없음 · FeatureGate | 커뮤니티 OFF 시 딥링크 가드 |
| **홈** | CLIENT / CONSULTANT | 탭 | **유지 필수** | ON | ON | (탭 고정) | 앱 본체 |
| **예약** | CLIENT | `(booking)` | **유지 필수** | ON | ON | (탭/스택) | 코어 비즈 |
| **내 상담 / 회기·결제** | CLIENT | 탭·더보기 | **유지 필수** | ON | ON | `CLT_SESSIONS`/`CLT_PAYMENT` 등 웹 LNB | 코어·결제 경로 |
| **스케줄 / 내담자 / 기록** | CONSULTANT | 탭 | **유지 필수** | ON | ON | `CST_*` 웹 LNB | 코어 비즈 |
| **메시지 · 알림** | CLIENT / CONSULTANT | 더보기 | **유지 필수** | ON | ON | `CST_MESSAGES` 등 | 1:1 운영 통신. 공개 UGC 아님 |
| **프로필 / 앱 설정** | 동일 | 더보기 | **유지 필수** | ON | ON | `CLT_SETTINGS` 등 | EULA·계정 |
| **온라인 쇼핑** | CLIENT | 더보기(테넌트) | **유지** | ON | ON | RoleMenu 시드 **제외**(테넌트 플래그) | 커머스. 5.1.1(ix) 주원인 아님 |
| **웰니스 허브**(명상·심리교육·마음날씨·무드·자가점검·힐링피드) | CLIENT | 탭 `(wellness)` | **OFF 후보 · 본 시드 제외** | (못 끔) | ON | **menuCode 없음** | 건강 콘텐츠 허브 → 출시 후 menuCode 도입 후 iOS OFF 재검토 |
| 상담사 마음날씨/무드 수신함·KPI·급여 | CONSULTANT | 더보기 | **유지** | ON | ON | menuCode 없음(하드 링크) | 1:1 운영. 공개 피드 아님 |
| Admin 검수 등 | ADMIN | Admin 앱 | **본 배치 비대상** | — | — | `ADM_COMMUNITY_MODERATION` | 심사 동선은 CLIENT/CONSULTANT |

### 표 B — 메뉴로 못 막는 표면 (체크리스트·카피·ASC)

| 표면 | 조치 | Individual 재제출 |
|------|------|-------------------|
| ASC 앱 설명·키워드·스크린샷 | 심리상담·클리닉 과장 표현 완화 여부 **운영 판단** | 코드 밖 |
| 온보딩/스플래시 카피 | “의료·진단” 오인 문구 점검 | 카피 수정은 별 트랙 |
| EULA 17+ · Privacy · Review Notes | 필수 | EULA/iPad Phase |
| Organization 계정 | **불가 시 재거절 리스크 잔존** | 정직성 고지 |
| 웰니스 탭(현재) | RoleMenu로 숨김 **불가** | 출시 후 menuCode+게이트 TODO |

### 시드/프리셋 SSOT (본 배치 확정 · coder 전달)

| menuCode | 역할 (`tenant_roles.name_en`) | can_view_ios | can_view_android | can_view(웹) |
|----------|-------------------------------|--------------|------------------|--------------|
| `CLT_COMMUNITY` | CLIENT | **false** | **true** | **true** |
| `CST_COMMUNITY` | CONSULTANT | **false** | **true** | **true** |

> **충돌**: `V20260912_001`(양쪽 `can_view=0`)은 **본 정책과 불일치** → `V20260912_002`가 **ios=0 / android=1 / web=1** 로 정정. 웰니스 등 추가 OFF는 **시드에 넣지 않음**(menuCode 부재).  
> 운영 체크리스트: `docs/운영반영/APP_STORE_REVIEW_MENU_PERMISSION_CHECKLIST.md` §출시 전 iOS OFF / §출시 후 재개 검토.

---

## 5. 의존성·순서

```
Phase 0  explore — 숨김 후보/유지 필수 확정표 + Flyway·헤더·WIP 충돌
    ↓
Phase 1a core-designer — 이중 Switch + Individual 프리셋 UI 스펙     ⎫ 병렬 가능
Phase 1b docs(generalPurpose) — 운영 체크리스트 Individual 섹션     ⎭
    ↓
Phase 2  core-coder — (A) iOS/AOS 이중 스위치 완료 + (B) Individual 시드/프리셋
         + (C) EULA·iPad 병행(기존 팔로우업 WIP 이식 가능)
    ↓
Phase 3  core-tester — 플랫폼 필터·시드·EULA/iPad·하드코딩 회귀
    ↓
Phase 4  develop PR (+ 필요 시 core-deployer)
```

**선행 필수**: Phase 2의 (A)가 없으면 (B) 프리셋 의미 없음 → **iOS/AOS 오케스트레이션과 동일 배치로 묶거나 A 먼저 머지**.

**구 팔로우업 재정렬**:
| 구 Phase (APPLE_FOLLOWUP) | 본 전략 |
|---------------------------|---------|
| 커뮤니티 `can_view=0` 양측 | ❌ → **ios=false, android=true** |
| Org를 Blocked로만 표기 | 유지하되 **Individual로 재제출 진행** + **정직성 고지** |
| 즉시 토글·EULA·iPad | ✅ 유지 |

---

## 6. 분배실행 표

| Phase | subagent_type | 목표 | 병렬 | 적용 스킬 |
|-------|---------------|------|------|-----------|
| 0 | `explore` | 표 A/B 확정, Flyway·API·Admin·Expo 갭, WIP 충돌 | — | (읽기 전용) |
| 1a | `core-designer` | 이중 Switch + Individual 프리셋 스펙 개정 | 1b와 병렬 | `/core-solution-design-handoff`, atomic · **model: gemini-3.1-pro** |
| 1b | `generalPurpose` | 운영 체크리스트 Individual 섹션 | 1a와 병렬 | `/core-solution-documentation` |
| 2 | `core-coder` | DB/BE/Admin/Expo + 시드/프리셋 + EULA/iPad | 0+1 후 | backend·frontend·api·multi-tenant·database-first·encapsulation · Expo Metro §5 |
| 3 | `core-tester` | 게이트 검증 | 2 후 | `/core-solution-testing` |
| 4 | 부모/`core-deployer` | develop PR | 3 통과 후 | deployment |

---

## 7. 서브에이전트 전달 프롬프트

### 7.1 Phase 0 — explore

```
역할: explore (읽기 전용). 코드 수정 금지.

목적: Individual 계정 재제출용 「숨김 후보 vs 코어 유지」확정 + iOS/AOS 이중 스위치 갭.

필수 맥락:
- Individual Org 전환 당장 불가. 메뉴 게이트는 UGC 축소 전략이지 5.1.1(ix) 대체재 아님.
- 상담 예약 등 코어 비즈는 숨기면 안 됨.
- 최소: CLT_COMMUNITY/CST_COMMUNITY iOS OFF / Android ON.
- 소스 REVIEW_MODE 금지.

조사:
1) Expo CLIENT/CONSULTANT 탭·더보기·웰니스·쇼핑·커뮤니티 진입점 목록(경로).
2) menus/Flyway에 앱 메뉴로 토글 가능한 menuCode 존재 여부(커뮤니티 외).
3) RoleMenuPermission can_view_ios/android 존재 여부, LNB X-Client-Platform, Admin 이중 Switch 현황.
4) V20260912_* 시드가 양쪽 OFF인지 ios/android 분리인지.
5) 온보딩/스토어 메타 중 “심리상담·건강” 강조 카피 위치(파일 경로만).
6) 병렬 WIP: cursor/menu-visibility-ios-android-96b3, app-store-followup-menu, stash 문서 충돌.

산출(한국어):
- 「숨김 후보 / 유지 필수 / 조사만(메뉴 밖)」최종 표
- Individual iOS OFF 권장 목록(최소+추가)
- 코더용 파일 경로 표
참조: docs/project-management/INDIVIDUAL_ACCOUNT_IOS_MENU_PRESET_ORCHESTRATION_20260912.md
     docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md
```

### 7.2 Phase 1a — core-designer

```
역할: core-designer. 코드 작성 금지. model: gemini-3.1-pro 권장.

개정 대상: docs/design-system/clinic-os-app-menu-visibility-spec.md

사용성: ADMIN이 역할 칩 → 행별 iOS|Android 이중 Switch 즉시 적용. Individual 심사 시 커뮤니티 iOS만 OFF.
정보 노출: 한글 메뉴명·이중 상태·심사 유의 뱃지. menuCode/path/CRUD 비노출.
레이아웃: AdminCommonLayout + Clinic-OS Stage Row. QuietHeader 일괄 저장 CTA 제거.
선택 UI: 「Individual 심사 프리셋」ghost — 권장 iOS OFF 목록만 적용, Android 유지.

필수: 단일 Switch → 이중 Switch(iOS|Android) 와이어/토큰. B0KlA/Clinic-OS 토큰만.
산출: 스펙 문서 개정 + 코더 handoff 체크리스트. /core-solution-design-handoff.
```

### 7.3 Phase 1b — generalPurpose (문서)

```
역할: 문서 정리. /core-solution-documentation.

갱신: docs/운영반영/APP_STORE_REVIEW_MENU_PERMISSION_CHECKLIST.md

추가 섹션 제목: 「Individual 계정 재제출 — iOS 메뉴 OFF 목록」
포함:
1) 정직성 고지(5.1.1(ix) — 메뉴 게이트≠Org 대체)
2) 전제: iOS/Android 이중 canView 배포됨
3) 최소 OFF: CLIENT/CONSULTANT 커뮤니티 → iOS OFF, Android ON
4) explore 확정 추가 OFF 목록(플레이스홀더→Phase0 결과로 채움)
5) 코어 유지(예약·회기·홈·메시지 등) 끄지 말 것
6) 심사 후/Org 준비 후: Admin에서 iOS만 재ON
7) EULA 17+ · iPad · ASC 메타는 병행
8) REVIEW_MODE 금지
링크: INDIVIDUAL_ACCOUNT_IOS_MENU_PRESET_ORCHESTRATION_20260912.md
```

### 7.4 Phase 2 — core-coder

```
역할: core-coder. develop 기준 구현·커밋·푸시·PR(develop).

금지:
- APP_STORE_REVIEW_MODE / EXPO_PUBLIC 심사 플래그 / Platform.OS로 커뮤니티 hide
- 양쪽 can_view=0 시드를 Individual 기본으로 유지
- 코어 비즈 메뉴 일괄 OFF
- 하드코딩 색상(§17 / §1.3 / PRE_PRODUCTION 게이트)
- 스케줄·fc-event·AdminCommonLayout CSS 대규모 변경

필수 (순서):
A) MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION 완료 조건 전부
   - can_view_ios / can_view_android, Grant 부분갱신, LNB X-Client-Platform,
     Admin 이중 Switch 즉시 grant, Expo 플랫폼 헤더, Platform.OS hide 없음
B) Individual 시드/프리셋
   - CLT_COMMUNITY/CST_COMMUNITY: ios=false, android=true (웹 권장 true)
   - 기존 양쪽 OFF 마이그레이션 있으면 개정·후속 UPDATE
   - (스펙에 있으면) Admin「Individual 심사 프리셋」원클릭 — iOS OFF 목록만
C) EULA 동의 게이트·iPad letterbox/requireFullScreen — 팔로우업 WIP 재사용 가능, 본 전략과 충돌 없게
D) 단위 테스트: 플랫폼 필터, 시드 의미, grant, Expo 헤더, REVIEW_MODE grep 0

참조:
- docs/project-management/INDIVIDUAL_ACCOUNT_IOS_MENU_PRESET_ORCHESTRATION_20260912.md
- docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md
- docs/design-system/clinic-os-app-menu-visibility-spec.md (Phase 1a 산출)
- docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md §5
- docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17
- docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3

브랜치: cursor/menu-visibility-ios-android-96b3 연장 또는 cursor/individual-ios-menu-impl-891c
완료 후 develop PR.
```

### 7.5 Phase 3 — core-tester

```
역할: core-tester. /core-solution-testing. 통과 전 완료 보고 금지.

시나리오:
1) Admin: CLIENT 커뮤니티 iOS OFF / Android ON 저장 → ios LNB에 없음, android LNB에 있음
2) CONSULTANT 동일
3) Expo iOS: 더보기 커뮤니티 미노출 + 딥링크 가드; Android: 노출
4) 예약·회기·홈·메시지 등 코어 메뉴 iOS에서 유지
5) Individual 프리셋(있으면)이 AOS를 끄지 않음
6) EULA 게이트·iPad letterbox 스모크
7) REVIEW_MODE / Platform.OS community hide grep 0
8) 테넌트 격리·기존 fail-closed 회귀

증거(테스트 로그) 첨부.
```

---

## 8. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| 5.1.1(ix) 재거절 | 정직성 고지. 메뉴는 UGC 축소만. Org는 추후 |
| 양측 OFF 시드가 AOS까지 죽임 | 시드 정책 ios/android 분리로 개정 |
| 웰니스 OFF로 제품 공허 | explore가 유지 필수에 가깝게 판정 유도 |
| iOS/AOS 미구현 채 프리셋만 | Phase 2A 선행/동봉 |
| 병렬 브랜치 충돌 | develop 기준 통합, 스케줄 파일 비터치 |

---

## 9. 완료 기준·체크리스트

- [ ] 정직성 고지가 본 기획·운영 체크리스트에 명시
- [ ] iOS/Android 이중 canView 구현·테스트 완료
- [ ] Individual 권장: 커뮤니티 iOS OFF / Android ON 시드(또는 원클릭 프리셋)
- [ ] explore 「숨김 후보 / 유지 필수」표 사용자 보고
- [ ] 운영 체크리스트에 「Individual 계정 재제출 — iOS 메뉴 OFF 목록」
- [ ] EULA 17+·iPad 병행 진행
- [ ] REVIEW_MODE 신규 0
- [ ] develop PR

---

## 10. 실행 요청 (부모 에이전트)

1. Phase 0 `explore` → 표 확정 후 본 문서 §4 갱신·사용자 중간 보고.  
2. Phase 1a `core-designer`(gemini-3.1-pro) **∥** Phase 1b 문서.  
3. Phase 2 `core-coder` (iOS/AOS + Individual 시드 + EULA/iPad).  
4. Phase 3 `core-tester`.  
5. develop PR.

**확인 질문 금지. Individual 전략·정직성 고지를 모든 위임 프롬프트에 유지.**
