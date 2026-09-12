# 메뉴 노출 iOS / Android 분리 — 오케스트레이션 (2026-09-12)

> **역할**: core-planner (오케스트레이션 전용 · 코드 직수정 금지)  
> **단일 기능**: Admin RoleMenuPermission에서 **iOS / Android(AOS) 메뉴 노출을 독립 토글**  
> **금지**: 소스 `if (Platform.OS === 'ios') hide community` 하드코딩  
> **목표 브랜치**: `cursor/menu-visibility-ios-android-96b3` ← base **`origin/develop`**  
> **병렬**: 다른 App Store 트랙(`cursor/app-store-followup-menu-96b3` 등)과 파일 충돌 최소화하며 병행 가능

---

## 1. 목표 (1~2문장)

센터 ADMIN이 `/admin/menu-permissions`에서 역할·메뉴별 **iOS Switch / Android Switch**를 각각 켜고 끌 수 있게 한다.  
Expo는 **자기 플랫폼 플래그만** 적용하고, LNB API는 `X-Client-Platform: ios|android|web`을 존중해 서버 필터한다. App Store 심사 시 **커뮤니티는 iOS만 숨김 · Android는 노출 유지**.

---

## 2. 사용자 관점 (§0.4 → designer 전달)

| 항목 | 내용 |
|------|------|
| **사용성** | ADMIN이 역할 칩(CLIENT 기본) → 메뉴 행에서 **iOS | Android** 이중 Switch를 각각 토글 → **즉시 grant**(일괄 저장 없음). 심사 전 커뮤니티 **iOS만 OFF**, AOS는 ON 유지. |
| **정보 노출** | 노출: 한국어 메뉴명, iOS/Android 상태 배지·Switch, 잠금 사유, 기본/센터맞춤/심사유의 뱃지. **비노출**: `menuCode`, `menuPath`, CRUD 4체크. |
| **레이아웃** | 기존 Clinic-OS `MenuPermissionManagement` + `AdminCommonLayout` 재사용. 행 우측 단일 Switch → **이중 Switch 그룹(iOS \| Android)** 로 교체. QuietHeader에 일괄 저장 CTA **금지**. |

---

## 3. 범위

### 포함

| 영역 | 내용 |
|------|------|
| **DB** | `role_menu_permissions.can_view_ios`, `can_view_android` 추가. 기존 `can_view`는 **웹/레거시** 호환 유지. 마이그레이션: 기존 `can_view` → 양쪽 복사 후, `CLT_COMMUNITY`/`CST_COMMUNITY`만 **ios=false, android=true** (및 웹 `can_view` 정책은 코더가 explore 결과로 확정 — 권장: 웹=`can_view` 또는 android와 동일). |
| **BE Entity/DTO/API** | `RoleMenuPermission`, `MenuPermissionDTO`, `MenuPermissionGrantRequest`에 `canViewIos`/`canViewAndroid`. Grant 즉시 부분 갱신 허용. |
| **LNB 필터** | `filterMenuTreeByPermissions`가 플랫폼별 플래그 적용. `MenuController.getLnbMenus`가 `X-Client-Platform`(또는 동등 쿼리) 파싱. 미지정 시 **web → can_view** (레거시). |
| **Admin UI** | 행별 **이중 Switch + 즉시 grant**. 일괄 batch 저장 UX 제거(이미 제거된 WIP가 develop에 없으면 본 배치에서 함께 반영). |
| **Expo** | `useLnbMenus` / API 클라이언트에 플랫폼 헤더. `isCommunityMenuVisible` / `CommunityFeatureGate`는 **트리 존재 여부**(서버 필터 결과)만 사용 — **Platform.OS로 커뮤니티 hide 하드코딩 금지**. |
| **테스트** | 단위: 마이그레이션 의미·grant·LNB 플랫폼 필터·Admin 이중 토글·Expo 헤더. |

### 제외

- `APP_STORE_REVIEW_MODE` / 빌드 플래그 hide
- EULA 동의 게이트·iPad letterbox·Org 계정 (다른 App Store 팔로우업 트랙)
- Admin LNB에 신규 메뉴 추가
- 스케줄/사이드바/fc-event 대규모 수정
- CRUD 권한 매트릭스 부활

---

## 4. 스키마·정책 결정 (권장 → Phase 0/2에서 검증 후 채택)

### 4.1 컬럼

| 컬럼 | 의미 | 기본 |
|------|------|------|
| `can_view` | **웹(및 레거시 단일 플래그 소비자)** | 기존 유지 |
| `can_view_ios` | iOS 앱 메뉴 노출 | 마이그레이션 시 `can_view` 복사 |
| `can_view_android` | Android 앱 메뉴 노출 | 마이그레이션 시 `can_view` 복사 |

### 4.2 커뮤니티 시드 기본값 (본 기능 SSOT)

| menuCode | 역할 | can_view_ios | can_view_android | can_view (웹) |
|----------|------|--------------|------------------|---------------|
| `CLT_COMMUNITY` | CLIENT | **false** | **true** | explore 확정(권장 **true** — 웹 커뮤니티 유지, 또는 기존 운영 정책) |
| `CST_COMMUNITY` | CONSULTANT | **false** | **true** | 동일 |

> **주의**: WIP `V20260912_001__hide_client_consultant_community_menu_default.sql`은 **양쪽 can_view=0**이라 본 정책과 충돌한다. develop에 미머지면 **본 배치 마이그레이션으로 대체·개정**(ios=0, android=1). 이미 머지됐으면 후속 UPDATE 시드로 정정.

### 4.3 플랫폼 해석

| `X-Client-Platform` | 필터 플래그 |
|---------------------|-------------|
| `ios` | `can_view_ios` |
| `android` | `can_view_android` |
| `web` / 미지정 | `can_view` |

권한 행 없음 → 기존 min-role fail-open/closed 정책 **유지**(explore가 현재 `canAccessMenu` 동작 문서화).

### 4.4 Grant API

- Request: `canViewIos`, `canViewAndroid` (및 기존 `canView` — 웹 토글이 필요하면 Admin에 웹 Switch는 **본 배치 최소 범위에서 생략 가능**, API만 필드 유지).
- 행에서 iOS만 토글 시: 해당 필드만 갱신(나머지 보존). 부분 null = 미변경 권장.

---

## 5. 현황·갭 (기획 선조사 — Phase 0에서 확정)

| 영역 | AS-IS | 갭 |
|------|-------|-----|
| Entity | `can_view` 단일 | `can_view_ios`/`can_view_android` 없음 |
| DTO/Grant | `canView`만 | 플랫폼 필드 없음 |
| LNB | `filterMenuTreeByPermissions` → `canView`만, **플랫폼 헤더 없음** | 헤더 파싱 + 플랫폼 분기 |
| Admin UI | Clinic-OS 단일 Switch(develop #980). WIP 브랜치에 즉시 grant | **이중 Switch** + grant 페이로드 확장 |
| Expo | `useLnbMenus` → 트리 존재로 `isCommunityMenuVisible` | 헤더 `X-Client-Platform` 미전송 |
| Seed | `V20260911_001` 메뉴만. WIP `V20260912_001`은 양쪽 OFF | **ios OFF / android ON** 시드 필요 |
| 하드코딩 | 커뮤니티 hide에 Platform.OS 직접 분기 **없어야 함**(유지) | 회귀 금지 |

**참조 파일 (수정 후보)**

- BE: `RoleMenuPermission.java`, `MenuPermissionDTO.java`, `MenuPermissionGrantRequest.java`, `MenuPermissionServiceImpl.java`, `MenuPermissionService.java`, `MenuController.java`, `MenuPermissionController.java`
- Flyway: `src/main/resources/db/migration/` (신규 `V20260912_00x__...` — 버전 충돌 시 explore가 최신 번호)
- Admin: `MenuPermissionManagement.js`, `MenuPermissionManagementUI.js`, `menuPermissionApi.js`, `menuPermissionManagementStrings.js`, Clinic-OS CSS
- Expo: `expo-app/src/api/client`(헤더), `useLnbMenus.ts`, `menuAccessUtils.ts`, `CommunityFeatureGate.tsx`
- Spec: `docs/design-system/clinic-os-app-menu-visibility-spec.md` (이중 Switch로 개정)
- 테스트: `MenuPermissionServiceImplLnbFilterTest.java`, `MenuPermissionServiceImplGrantFailClosedTest.java`, Admin chrome test, Expo menuAccessUtils test

---

## 6. 의존성·순서

```
Phase 0 explore (갭·Flyway 버전·헤더 패턴·WIP 충돌 확정)
    ↓
Phase 1 core-designer (이중 Switch Clinic-OS 스펙 개정)     ← model: gemini-3.1-pro 권장
    ↓
Phase 2 core-coder (DB→BE→Admin→Expo, 브랜치+PR)
    ↓
Phase 3 core-tester (단위·스모크 게이트)
```

Phase 0 완료 전 Phase 1 착수 **가능**(스펙은 권장 설계 기준). Phase 2는 Phase 0+1 산출물 필수.

**충돌 주의**: `cursor/app-store-followup-menu-96b3`가 같은 Admin/시드 파일을 건드림. 코더는 **develop 기준 신규 브랜치**에서 구현하고, 팔로우업 WIP의 “즉시 토글”이 develop에 없으면 본 PR에 최소 포함.

---

## 7. Phase·분배실행 표

### Phase 0 — explore

| 항목 | 내용 |
|------|------|
| **subagent_type** | `explore` |
| **목표** | 스키마·API·Admin·Expo·Flyway 갭 표 + 플랫폼 헤더 기존 패턴 유무 |
| **산출** | 갭 표(파일 경로·라인 요약), Flyway 다음 버전 제안, WIP `V20260912_001` 충돌 판정, 웹 `can_view` 권장값 한 줄 |
| **프롬프트** | 아래 §8.1 |

### Phase 1 — core-designer

| 항목 | 내용 |
|------|------|
| **subagent_type** | `core-designer` |
| **model** | `gemini-3.1-pro` (권장) |
| **스킬** | `/core-solution-design-handoff`, `/core-solution-atomic-design`, Clinic-OS SSOT |
| **목표** | 이중 Switch(iOS\|Android) 즉시적용 UI 스펙 개정 |
| **산출** | `docs/design-system/clinic-os-app-menu-visibility-spec.md` 개정(또는 섹션 추가). 코드 금지 |
| **프롬프트** | 아래 §8.2 |

### Phase 2 — core-coder

| 항목 | 내용 |
|------|------|
| **subagent_type** | `core-coder` |
| **스킬** | `/core-solution-database-first`, `/core-solution-backend`, `/core-solution-frontend`, `/core-solution-api`, `/core-solution-multi-tenant`, `/core-solution-encapsulation-modularization`, Expo시 `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5 |
| **목표** | develop 기준 브랜치 구현 + push + develop PR |
| **브랜치** | `cursor/menu-visibility-ios-android-96b3` |
| **완료 조건** | §9 체크리스트 |
| **프롬프트** | 아래 §8.3 |

### Phase 3 — core-tester

| 항목 | 내용 |
|------|------|
| **subagent_type** | `core-tester` |
| **스킬** | `/core-solution-testing` |
| **목표** | 단위·관련 테스트 통과 + 회귀(하드코딩 hide 없음) |
| **프롬프트** | 아래 §8.4 |

---

## 8. 서브에이전트 전달 프롬프트 (전문)

### 8.1 explore

```
역할: explore (읽기 전용)

목적: Admin 메뉴 노출 iOS/Android 분리 기능의 코드베이스 갭 조사.

조사 범위:
1) DB/Entity: RoleMenuPermission, role_menu_permissions 스키마, Flyway V20260911_001 / V20260912_* / 최신 버전 번호
2) Service: MenuPermissionServiceImpl.filterMenuTreeByPermissions, canAccessMenu, grant
3) Controller: MenuController /api/v1/menus/lnb — 플랫폼 헤더/쿼리 유무
4) DTO: MenuPermissionDTO, MenuPermissionGrantRequest
5) Admin: MenuPermissionManagement.js, MenuPermissionManagementUI.js, menuPermissionApi.js — 단일 Switch vs 즉시 grant 상태(develop vs WIP)
6) Expo: useLnbMenus.ts, api client 헤더, menuAccessUtils.ts, CommunityFeatureGate.tsx — Platform.OS 커뮤니티 hide 하드코딩 여부
7) 기존 X-Client-Platform 또는 유사 헤더 패턴 검색

산출(한국어 요약):
- 갭 표 (영역 | AS-IS 경로 | TO-BE | 위험)
- Flyway 신규 파일명 제안
- WIP V20260912_001(양쪽 can_view=0) vs 본 정책(ios=0, android=1) 충돌 판정
- 웹 can_view 커뮤니티 기본값 권장 1줄
코드 수정 금지.
```

### 8.2 core-designer

```
역할: core-designer (시안·스펙만, 코드 금지)
model: gemini-3.1-pro

과제: Clinic-OS `/admin/menu-permissions` 행 UI를 **iOS | Android 이중 Switch**로 개정.

사용성:
- ADMIN이 역할 칩 → 행에서 iOS/Android를 각각 즉시 토글(일괄 저장 CTA 없음)
- App Store 심사: 커뮤니티 iOS만 OFF, Android ON 유지가 한눈에 보이도록 라벨·상태 배지

정보 노출:
- 노출: 한국어 메뉴명, iOS/Android 라벨+Switch+상태, 잠금, 기본/센터맞춤/심사유의
- 비노출: menuCode, menuPath, CRUD

레이아웃:
- AdminCommonLayout children 유지
- QuietHeader: 일괄 저장 없음. 부제에 "iOS·Android 각각 즉시 적용" 명시
- 행 우측: [iOS Switch] [Android Switch] 그룹 (SettingSwitchRow/Switch atom 재사용)
- 앱 표면 행에만 이중 Switch; 웹 전용 행은 기존 단일(웹) 또는 can_view — 스펙에 명시
- 토큰: unified-design-tokens / Clinic-OS SSOT. 하드코딩 색 금지

참조:
- docs/design-system/clinic-os-app-menu-visibility-spec.md (개정 대상)
- docs/design-system/clinic-os-menu-permissions.md
- docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md
- docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md §2·§4

산출: clinic-os-app-menu-visibility-spec.md 개정 + 코더 핸드오프(컴포넌트·토큰·완료 체크리스트). 코드 작성 없음.
```

### 8.3 core-coder

```
역할: core-coder

브랜치: origin/develop 에서 cursor/menu-visibility-ios-android-96b3 생성(또는 동일 접미사 규칙).
SSOT: docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md
스펙: docs/design-system/clinic-os-app-menu-visibility-spec.md (designer 개정본)
explore 갭 표 반영.

구현:
1) Flyway: can_view_ios, can_view_android 추가 → 기존 can_view 복사 → CLT_COMMUNITY/CST_COMMUNITY 를 ios=false, android=true 로 시드(멱등).
   - WIP V20260912_001이 develop에 없으면 본 마이그레이션에 통합하거나 버전 충돌 없이 후속 파일로.
   - 양쪽 OFF 시드와 충돌 시 본 정책(ios OFF / aos ON) 우선.
2) Entity/DTO/Grant/Service: canViewIos, canViewAndroid. filterMenuTreeByPermissions(platform).
3) MenuController LNB: X-Client-Platform: ios|android|web 존중(미지정=web→can_view).
4) Admin: 이중 Switch 즉시 grant(부분 필드). 일괄 저장 UX 제거. visible=canView* 플래그만(hasPermission OR 버그 금지). AdminCommonLayout 유지.
5) Expo: API 클라이언트에 Platform에 맞는 X-Client-Platform. 커뮤니티 가드는 서버 필터된 트리만 사용.
   - if (Platform.OS==='ios') hide community 금지.
   - Metro/MMKV: docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md §5 체크리스트.
6) 하드코딩 금지(색·역할·테넌트). 멀티테넌트 tenantId 필수.
7) 단위 테스트 보강(LNB 플랫폼 필터, grant 부분갱신, 시드 의미).

스킬: database-first, backend, frontend, api, multi-tenant, encapsulation.
완료 후: commit, push -u origin cursor/menu-visibility-ios-android-96b3, develop 대상 PR 생성, PR URL 보고.
다른 App Store 트랙과 불필요한 파일 섞지 말 것.
```

### 8.4 core-tester

```
역할: core-tester
스킬: /core-solution-testing

검증 대상 브랜치: cursor/menu-visibility-ios-android-96b3

필수:
1) MenuPermissionServiceImpl LNB 필터: platform=ios → can_view_ios=false 메뉴 제외, android=true면 포함
2) Grant: canViewIos/canViewAndroid 부분 갱신
3) Admin chrome/관련 Jest: 이중 Switch·즉시 적용(가능 범위)
4) Expo menuAccessUtils: fail-closed 유지; Platform.OS 커뮤니티 하드 hide 검색 0건
5) 커뮤니티 시드 기본: ios 숨김 / android 노출 의미 테스트 또는 마이그레이션 검증

통과 기준: 관련 단위 테스트 green + 하드코딩 hide 0건.
실패 시 재현·로그·수정 제안만(패치는 core-coder).
결과: PASS/FAIL + 증거 요약.
```

---

## 9. 완료 기준·체크리스트

- [ ] DB에 `can_view_ios`, `can_view_android` 존재; 기존 행은 `can_view`에서 복사됨
- [ ] 커뮤니티 CLIENT/CONSULTANT 기본: **iOS 숨김 · Android 노출**
- [ ] Grant/DTO에 플랫폼 필드; Admin 이중 Switch 즉시 적용; 일괄 저장 없음
- [ ] LNB가 `X-Client-Platform` 존중
- [ ] Expo가 플랫폼 헤더 전송; 소스에 커뮤니티 Platform.OS hide 하드코딩 없음
- [ ] `can_view` 웹/레거시 호환 유지
- [ ] core-tester 게이트 통과
- [ ] develop 대상 PR URL 확보

---

## 10. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| 팔로우업 WIP와 Admin/시드 충돌 | develop 신규 브랜치; 시드 정책은 본 문서 §4.2 우선 |
| 구 클라이언트는 can_view만 인식 | 웹/미지정=can_view; 컬럼 유지 |
| 권한 행 없을 때 기본 노출 | 커뮤니티는 명시 시드 행 필수(멱등 INSERT/UPDATE) |
| Expo 헤더 누락 | 미지정 시 web 필터 → 앱에서 오노출 가능 → 클라이언트 헤더 필수 |

---

## 11. 실행 요청 (부모 에이전트)

다음 순서로 Task 호출하고, 각 결과를 **core-planner**에 전달할 것.

1. **explore** — §8.1  
2. **core-designer** (`model: gemini-3.1-pro`) — §8.2 (Phase 0과 병렬 가능)  
3. **core-coder** — §8.3 (0·1 산출물 첨부)  
4. **core-tester** — §8.4  

최종 사용자 보고(한국어): **스키마 결정**, **커뮤니티 기본값(iOS숨김/AOS노출)**, **PR URL**.

---

**작성**: core-planner · 2026-09-12  
**관련**: `APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`, `APPLE_FOLLOWUP_ORCHESTRATION_20260912.md`(병렬·범위 다름)
