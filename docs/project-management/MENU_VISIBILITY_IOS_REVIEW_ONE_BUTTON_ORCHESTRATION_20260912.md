# iOS 심사 모드 원버튼 — 오케스트레이션 (사용자 확정 UX · 2026-09-12)

> **역할**: core-planner (오케스트레이션 전용 · 코드 직수정 금지)  
> **상위 인프라**: `docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md` (iOS|Android 이중 Switch · `can_view_ios`/`can_view_android`)  
> **디자인 SSOT**: `docs/design-system/clinic-os-app-menu-visibility-spec.md`  
> **브랜치**: `cursor/menu-visibility-ios-android-96b3` ← base **`origin/develop`** · develop PR  
> **사용자 확정 UX**: *「미리 시드로 다 막을 필요 없음. 버튼 하나로 iOS만 막으면 됨.」*

---

## 1. 목표 (1~2문장)

커뮤니티(UGC)를 Flyway로 사전 OFF하지 않는다. Admin `/admin/menu-permissions`에서 **원버튼(토글)** 한 번으로 CLIENT·CONSULTANT 커뮤니티(합의 UGC)의 `can_view_ios=false`만 일괄 grant하고, Android/웹은 유지한다. 심사 종료 후 대칭으로 iOS를 다시 켠다.

---

## 2. 사용자 관점 (§0.4 → designer 전달)

| 항목 | 내용 |
|------|------|
| **사용성** | 심사 담당 ADMIN이 `사용자 관리 → 앱 메뉴 노출`(`/admin/menu-permissions`) 진입 → **「iOS 심사 모드」/「iOS에서 커뮤니티(UGC) 숨기기」** 원버튼 1클릭 → 즉시 API. 행별 iOS\|Android Switch는 세밀 조정용으로 유지. 「iOS 다시 켜기」대칭 또는 토글. |
| **정보 노출** | 노출: 원버튼 상태(심사 모드 ON/OFF), 영향 역할·메뉴 요약(한국어), 행별 플랫폼 Switch. **비노출**: `menuCode`/`menuPath`/CRUD. |
| **레이아웃** | QuietHeader 하단 또는 Badge Rail **위**에 심사 액션 바 1줄. **LNB 신규 메뉴 금지**. `AdminCommonLayout` children 유지. Clinic-OS `--mg-v2-*` 토큰만. 일괄「변경사항 저장」금지(원버튼도 즉시 API). |

---

## 3. 범위

### 포함

| 영역 | 내용 |
|------|------|
| **정책 철회** | 사전 기본 OFF 시드 **금지**. `V20260912_002`의 CLT/CST 커뮤니티 `can_view*=0` INSERT/UPDATE **제거·개정**. 워크트리 WIP(커뮤니티 전플랫폼 OFF·CORE_LAUNCH 잠금)은 **본 UX와 충돌 → discard/되돌림** 후 원버튼 방향으로만 진행. |
| **DB** | 컬럼 `can_view_ios`/`can_view_android`는 유지. backfill은 `can_view` 복사만. 커뮤니티 시드 OFF 없음. 이미 적용된 환경은 후속 Flyway로 커뮤니티 `can_view_ios/android/can_view`를 **can_view 원복 또는 true 정렬**하지 말고 — **시드 OFF 로직만 제거**하고, 운영 값은 Admin 원버튼으로만 변경(이미 OFF로 박힌 DB는 **교정 마이그레이션**으로 ios/android/web을 `can_view` 복사값 또는 TRUE로 되돌리는 멱등 UPDATE 허용 — 코더가 Flyway 적용 여부 판단). |
| **BE** | 원버튼용 **즉시** API: 예) `POST /api/v1/admin/menu-permissions/ios-review-mode` body `{ enabled: boolean }` → CLIENT의 `CLT_COMMUNITY` + CONSULTANT의 `CST_COMMUNITY`에 `canViewIos=enabled?false:true` 일괄 grant. **`can_view_android` / `can_view` 미변경**. 기존 단건 grant·행별 Switch 유지. |
| **Admin UI** | 원버튼(+대칭 켜기 또는 토글). 클릭 즉시 API. Clinic-OS 토큰. 행별 이중 Switch 유지. |
| **Expo** | `X-Client-Platform` 헤더로 서버 필터 유지. `Platform.OS`로 커뮤니티 hide **금지**. |
| **스펙** | `clinic-os-app-menu-visibility-spec.md`에 **원버튼 섹션** 없으면 짧게 추가. |
| **테스트** | 시드 OFF 없음 · 원버튼 ios만 변경 · android/web 유지 · LNB ios 필터 · Expo 헤더 · Admin chrome. |

### 제외

- LNB 신규 메뉴
- `Platform.OS === 'ios'` 커뮤니티 하드코딩 hide
- 일괄「변경사항 저장」부활
- 커뮤니티를 출시 전부터 기본 숨김으로 잠그는 lock policy
- Org/EULA/letterbox 등 다른 App Store 트랙

---

## 4. 원버튼이 건드리는 menuCode (SSOT)

| menuCode | 역할 | 원버튼 OFF 시 | 원버튼 ON(다시 켜기) 시 | 건드리지 않음 |
|----------|------|---------------|-------------------------|---------------|
| `CLT_COMMUNITY` | CLIENT | `can_view_ios=false` | `can_view_ios=true` | `can_view_android`, `can_view` |
| `CST_COMMUNITY` | CONSULTANT | `can_view_ios=false` | `can_view_ios=true` | `can_view_android`, `can_view` |

**합의 UGC 집합(본 배치)**: 위 2개만.  
`ADM_COMMUNITY_MODERATION`은 Admin 웹 모더레이션용으로 **원버튼 범위 제외**(앱 CLIENT/CONSULTANT UGC 심사 경로 아님). 추가 UGC 코드가 explore에서 발견되면 기획에 보고 후 표에만 추가.

상수 위치 권장: BE `IosReviewModeMenuCodes` (또는 기존 menu permission constants) + FE `menuPermissionManagementStrings` / 작은 `iosReviewModeMenus.js` — **하드코딩 산재 금지**.

---

## 5. 현황·갭 (브랜치 `cursor/menu-visibility-ios-android-96b3`)

| 영역 | AS-IS | 갭 |
|------|-------|-----|
| 이중 Switch · 즉시 grant | Admin/BE 구현됨 | 유지 |
| Flyway `V20260912_002` | 커뮤니티 ios/aos/web **OFF 시드** (+ WIP는 더 강화) | **시드 OFF 철회** |
| 원버튼 | 없음 | **추가** |
| 스펙 | 행별 Switch만 | **§ 원버튼(심사 모드)** 추가 |
| Expo `X-Client-Platform` | `expo-app/src/api/client.ts` 설정됨 | 회귀만 확인 |
| PR | head 기준 open PR 없음 | push 후 develop PR |

**WIP 주의**: 미커밋 변경(`menuPermissionLockPolicy` CORE_LAUNCH 잠금, 문자열「출시 후 검토」, Flyway 커뮤니티 전플랫폼 OFF)은 **확정 UX와 반대**. Phase 구현 전 **discard** 또는 원버튼 방향 diff만 남길 것.

---

## 6. 의존성·순서

```
Phase 0 explore (UGC menuCode 확정 · Flyway 적용 여부 · WIP 충돌)
    ↓ (병렬 가능: 0 완료 후 1∥문서만)
Phase 1 core-designer — 스펙에 원버튼 섹션 추가 (model: gemini-3.1-pro 권장)
    ↓
Phase 2 core-coder — WIP discard → Flyway 시드 OFF 철회 → BE 원버튼 API → Admin UI → 상수
    ↓
Phase 3 core-tester — 게이트 (시드/원버튼/플랫폼 분리/Expo 헤더)
    ↓
Phase 4 push + develop PR (PR 본문에 menuCode 목록)
```

---

## 7. Phase · 분배실행 표

| Phase | subagent_type | 목표 | 전달 prompt 요약 | 스킬 |
|-------|---------------|------|------------------|------|
| 0 | explore | UGC 코드·Flyway·WIP 확정 | 아래 Phase 0 전문 | — |
| 1 | core-designer | 스펙 원버튼 섹션 | 아래 Phase 1 전문 · **model: gemini-3.1-pro** | `/core-solution-design-handoff`, planning §0.4 |
| 2 | core-coder | 시드철회+API+UI | 아래 Phase 2 전문 | frontend/backend/api/common-modules/encapsulation |
| 3 | core-tester | 검증 게이트 | 아래 Phase 3 전문 | `/core-solution-testing` |
| 4 | shell / 부모 | push·PR | develop base PR, menuCode 표 포함 | github-pr-operations |

**병렬**: Phase 0 단독. Phase 1은 0 요약 후. Phase 2는 1 스펙 반영 후(스펙 초안이 프롬프트에 있으면 1∥2 위험 — **직렬 권장**).

---

## 8. Phase별 전달 프롬프트 (전문)

### Phase 0 — explore

```
목적: iOS 심사 모드 원버튼 배치 전 갭 확정. 코드 수정 금지.

확인:
1) menus / RoleMenuPermission 시드에서 COMMUNITY·UGC 관련 menuCode 전부 목록
2) V20260912_002 및 관련 Flyway가 커뮤니티 can_view* 를 OFF로 박는지(현재 WIP 포함)
3) Admin MenuPermissionManagement 원버튼 유무, grant/batch API 형태
4) Expo X-Client-Platform 전송·CommunityFeatureGate가 Platform.OS hide 하는지
5) 미커밋 WIP가 확정 UX(시드 OFF 금지·원버튼)와 충돌하는지

산출: menuCode 후보 표, 수정 파일 목록, 「시드 OFF 철회 방법(같은 파일 개정 vs 후속 V20260912_003)」권고 1단락.
참조: docs/project-management/MENU_VISIBILITY_IOS_REVIEW_ONE_BUTTON_ORCHESTRATION_20260912.md
```

### Phase 1 — core-designer (model: gemini-3.1-pro)

```
역할: core-designer. 코드 작성 금지. Clinic-OS 토큰만.

문서: docs/design-system/clinic-os-app-menu-visibility-spec.md
작업: 「iOS 심사 모드 원버튼」섹션을 짧게 추가(없으면). 기존 행별 iOS|Android Switch·즉시 grant·LNB 신규 금지·일괄 저장 금지는 유지.

사용성: ADMIN이 심사 전 원버튼 1회 → CLIENT/CONSULTANT 커뮤니티 iOS만 숨김. 대칭「다시 켜기」또는 토글. 행 Switch는 세밀용.
정보 노출: 버튼 라벨 한국어, 상태(심사 모드 ON/OFF), 영향 요약. menuCode 비노출.
레이아웃: QuietHeader 아래 또는 Badge Rail 위 1줄 액션 바. AdminCommonLayout. --mg-v2-* 만. 레거시 B0KlA HEX 금지.

라벨 후보(택1 확정):
- 「iOS에서 커뮤니티(UGC) 숨기기」 / 「iOS에서 커뮤니티 다시 보이기」
- 또는 토글 「iOS 심사 모드」

산출: 스펙 문서 패치 + 코더 체크리스트 3~5항.
참조: CLINIC_OS_ADMIN_VISUAL_SSOT, clinic-os-menu-permissions.md, 본 오케스트레이션 §2·§4.
```

### Phase 2 — core-coder

```
역할: core-coder. 브랜치 cursor/menu-visibility-ios-android-96b3 (develop PR).

필수 참조:
- docs/project-management/MENU_VISIBILITY_IOS_REVIEW_ONE_BUTTON_ORCHESTRATION_20260912.md (§4 menuCode SSOT)
- docs/design-system/clinic-os-app-menu-visibility-spec.md (원버튼 섹션)
- docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md (safeDisplay)
- docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17 · SETTINGS… §1.3 (하드코딩 게이트)
- /core-solution-frontend, backend, api, common-modules, encapsulation-modularization, multi-tenant

작업 순서:
0) 확정 UX와 충돌하는 미커밋 WIP discard(커뮤니티 전플랫폼 OFF 시드 강화, CORE_LAUNCH 잠금이 본 배치 범위면 제거).
1) Flyway: 커뮤니티 사전 OFF 시드 철회. 컬럼 추가+can_view 복사는 유지. 필요 시 후속 마이그레이션으로 잘못 OFF된 행 교정(ios/android/web을 기존 can_view 복사 또는 TRUE — android/web을 심사 때문에 OFF로 두지 말 것).
2) BE: ios-review-mode 즉시 API(또는 동등). enabled=true → CLT_COMMUNITY(CLIENT)+CST_COMMUNITY(CONSULTANT) canViewIos=false. enabled=false → canViewIos=true. can_view_android·can_view 불변. tenantId 필수.
3) Admin: /admin/menu-permissions에 원버튼/토글. 클릭 즉시 API. 일괄 저장 없음. 행별 Switch 유지. Clinic-OS 토큰. LNB 신규 금지. 본문 AdminCommonLayout children.
4) Expo: Platform.OS 커뮤니티 hide 추가 금지. X-Client-Platform 유지.
5) 단위 테스트: 원버튼 부분 갱신, LNB ios 필터, 시드 OFF 없음(문서/테스트 서술).

완료 조건:
- [ ] 사전 시드로 커뮤니티 can_view* OFF 하지 않음
- [ ] 원버튼이 §4 menuCode만 ios 변경
- [ ] Android/웹 유지
- [ ] 즉시 API · 일괄 저장 없음 · LNB 신규 없음
- [ ] commit + push (테스트 전 push 포함 Cloud 규칙 시 준수)

금지: 임의 HEX, LNB 신규, Platform.OS hide community.
```

### Phase 3 — core-tester

```
역할: core-tester. 코드 수정은 실패 재현·로그에 한정, 패치는 core-coder 재위임.

검증:
1) Flyway/시드: 신규 테넌트·기본 상태에서 커뮤니티가 시드만으로 iOS OFF 강제되지 않음(또는 교정 후 ON)
2) 원버튼 OFF: CLT_COMMUNITY·CST_COMMUNITY can_view_ios=false, android/web 불변
3) 원버튼 ON: can_view_ios=true 복구
4) LNB X-Client-Platform=ios 시 해당 메뉴 제외, android면 포함(android 플래그 true일 때)
5) Admin: 원버튼 즉시 반영, 행 Switch 동작, 일괄 저장 CTA 없음, LNB에 신규 항목 없음
6) Expo: 헤더 전송, Platform.OS로 커뮤니티 hide 코드 경로 없음
7) 콘솔 #130 0건(해당 Admin 화면)

미통과 시 배치 미완료로 기획에 보고.
```

### Phase 4 — PR

```
gh로 develop base PR. 제목/본문에:
- 사용자 확정: 시드 OFF 금지 · iOS 심사 원버튼
- 원버튼 menuCode: CLT_COMMUNITY, CST_COMMUNITY
- 테스트 결과 요약
완료 보고: PR URL + menuCode 목록.
```

---

## 9. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| 이미 배포된 V20260912_002가 커뮤니티 OFF로 checksum 고정 | 같은 파일 개정은 미적용 환경만; 적용 환경은 **후속 V20260912_003** 교정 UPDATE |
| WIP「출시 범위=일정+알림」과 UX 충돌 | 본 배치에서 discard; 별도 제품 요청 시에만 재기획 |
| batch API를 Admin「변경사항 저장」처럼 오해 | UI에 일괄 저장 CTA 없음; 원버튼은 전용 즉시 엔드포인트 권장 |
| 멀티테넌트 | 모든 grant에 session tenantId |

---

## 10. 완료 기준·체크리스트

- [ ] 스펙에 원버튼 섹션 존재
- [ ] 사전 기본 OFF 시드 없음(철회·교정)
- [ ] 원버튼 → `CLT_COMMUNITY`, `CST_COMMUNITY`의 `can_view_ios`만 일괄 변경
- [ ] `can_view_android` / `can_view` 유지
- [ ] 행별 Switch 유지 · 즉시 API · Clinic-OS · LNB 신규 없음
- [ ] Expo는 헤더 필터만
- [ ] core-tester 통과
- [ ] push + develop PR URL + menuCode 목록 사용자 보고

---

## 11. 실행 요청문 (부모 에이전트)

다음 순서로 Task 호출하고, **각 결과를 기획(core-planner)에 전달**할 것.

1. **explore** — Phase 0 전문  
2. **core-designer** (`model: gemini-3.1-pro`) — Phase 1 전문  
3. **core-coder** — Phase 2 전문  
4. **core-tester** — Phase 3 전문  
5. 통과 시 push/PR — Phase 4  
6. 기획이 취합해 사용자에게 **PR URL + menuCode 목록** 최종 보고  

코드 직접 수정은 일반 어시스턴트·기획 금지. 구현은 core-coder만.
