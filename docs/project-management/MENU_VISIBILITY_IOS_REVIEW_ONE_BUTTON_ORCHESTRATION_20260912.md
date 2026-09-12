# iOS 심사 모드 원버튼 — 오케스트레이션 (사용자 확정 UX · 2026-09-12)

> **역할**: core-planner (오케스트레이션 전용 · 코드 직수정 금지)  
> **본 브랜치 SSOT**: `cursor/menu-visibility-ios-android-96b3` ← `origin/develop` · develop PR  
> **인프라 선행**: iOS|Android 이중 Switch · `can_view_ios`/`can_view_android` (`MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md`)  
> **디자인**: `docs/design-system/clinic-os-app-menu-visibility-spec.md`  
> **사용자 확정 UX**: *「미리 시드로 다 막을 필요 없음. 버튼 하나로 iOS만 막으면 됨.」*  
> **주의**: 커밋 `24f126055`(커뮤니티 전플랫폼 OFF·P0 잠금)은 **본 확정 UX와 충돌** → Phase 2에서 철회·개정.

---

## 1. 목표

커뮤니티(UGC)를 Flyway로 사전 OFF하지 않는다. Admin `/admin/menu-permissions` **원버튼(토글)** 한 번으로 CLIENT·CONSULTANT 커뮤니티의 `can_view_ios`만 일괄 변경하고, Android/웹은 유지한다. 심사 후 대칭으로 iOS를 다시 켠다.

---

## 2. 사용자 관점 (§0.4 → designer)

| 항목 | 내용 |
|------|------|
| **사용성** | `사용자 관리 → 앱 메뉴 노출` → **「iOS 심사 모드」또는「iOS에서 커뮤니티(UGC) 숨기기」** 1클릭 즉시 API. 「iOS 다시 켜기」대칭/토글. 행별 Switch는 세밀용. |
| **정보 노출** | 원버튼 상태, 한국어 영향 요약. **비노출**: menuCode/path/CRUD. |
| **레이아웃** | QuietHeader 아래 또는 Badge Rail 위 1줄. LNB 신규 금지. AdminCommonLayout. Clinic-OS `--mg-v2-*`. 일괄 저장 CTA 금지. |

---

## 3. 범위

### 포함

1. **사전 OFF 시드 금지** — `V20260912_002` 커뮤니티 INSERT/UPDATE OFF 철회. 필요 시 `V20260912_003` 교정(이미 적용된 DB). `24f126055`의 CORE_LAUNCH 잠금·전플랫폼 OFF **되돌림**.
2. **원버튼 API** — 예: `POST /api/v1/admin/menu-permissions/ios-review-mode` `{ enabled: boolean }` → §4 menuCode만 `canViewIos` 일괄. android/web 불변. 즉시 반영.
3. **Admin UI** — 원버튼/토글. 행별 iOS|Android Switch 유지. Clinic-OS.
4. **스펙** — 원버튼 섹션 없으면 짧게 추가.
5. **Expo** — `X-Client-Platform`만. `Platform.OS` 커뮤니티 hide 금지.
6. **테스트·PR**.

### 제외

LNB 신규 · 일괄 저장 부활 · Platform.OS hide · 시드로 커뮤니티 기본 숨김.

---

## 4. 원버튼 menuCode (SSOT)

| menuCode | 역할 | enabled=true(심사) | enabled=false(해제) | 미변경 |
|----------|------|--------------------|---------------------|--------|
| `CLT_COMMUNITY` | CLIENT | `can_view_ios=false` | `can_view_ios=true` | `can_view_android`, `can_view` |
| `CST_COMMUNITY` | CONSULTANT | 동일 | 동일 | 동일 |

`ADM_COMMUNITY_MODERATION` 제외(웹 모더레이션). 추가 UGC는 explore 보고 후 표 갱신.

---

## 5. 현황 갭

| AS-IS (브랜치 tip) | TO-BE |
|--------------------|-------|
| 이중 Switch·즉시 grant·Expo 헤더 있음 | 유지 |
| Flyway·`24f126055`가 커뮤니티 OFF 시드 | **철회** |
| 원버튼 없음 | **추가** |
| 스펙에 원버튼 섹션 없음 | **추가** |
| open PR 없음 | develop PR |

---

## 6. 분배실행 표

| Phase | Agent | 병렬 | Prompt 요약 |
|-------|-------|------|-------------|
| 0 | explore | 단독 | UGC 코드·Flyway 적용여부·`24f126055` 충돌 파일 목록 |
| 1 | core-designer (`gemini-3.1-pro`) | 0 후 | 스펙에 원버튼 섹션 짧게 추가 |
| 2 | core-coder | 1 후 | 시드철회·API·UI·상수·테스트·push |
| 3 | core-tester | 2 후 | 시드/원버튼/플랫폼분리/Expo/LNB 게이트 |
| 4 | shell/부모 | 3 후 | develop PR · URL+menuCode 보고 |

---

## 7. Phase 전달 전문

### Phase 0 — explore

```
코드 수정 금지. iOS 심사 원버튼 배치 갭 조사.
1) COMMUNITY/UGC menuCode 목록
2) V20260912_002·24f126055 가 커뮤니티 can_view* OFF 하는지
3) ios-review-mode API/UI 유무
4) Expo X-Client-Platform · Platform.OS community hide 여부
산출: menuCode 표, 수정 파일, 시드 철회 방법(파일개정 vs V20260912_003).
참조: MENU_VISIBILITY_IOS_REVIEW_ONE_BUTTON_ORCHESTRATION_20260912.md
```

### Phase 1 — core-designer (model: gemini-3.1-pro)

```
코드 금지. docs/design-system/clinic-os-app-menu-visibility-spec.md 에
「iOS 심사 모드 원버튼」섹션 짧게 추가.
사용성: 1클릭으로 CLIENT/CONSULTANT 커뮤니티 iOS만 숨김·다시 켜기.
정보: 한국어 라벨·상태, menuCode 비노출.
레이아웃: QuietHeader下/Badge Rail上 1줄, LNB 신규 금지, --mg-v2-* 만,
일괄 저장 금지, 행별 Switch 유지.
라벨: 「iOS에서 커뮤니티(UGC) 숨기기」/「다시 보이기」또는 「iOS 심사 모드」토글.
산출: 스펙 패치 + 코더 체크리스트.
```

### Phase 2 — core-coder

```
브랜치: cursor/menu-visibility-ios-android-96b3 → develop PR.
참조: 본 오케스트레이션 §4, 스펙 원버튼 섹션,
COMMON_DISPLAY_BOUNDARY_MEETING_20260322,
ADMIN_LNB…§17, SETTINGS…§1.3,
/core-solution-frontend·backend·api·common-modules·multi-tenant.

0) 24f126055 방향(커뮤니티 전플랫폼 OFF, CORE_LAUNCH 잠금) 철회·개정
1) Flyway 시드 OFF 제거(+필요시 V20260912_003 교정). 컬럼+can_view 복사만 유지
2) BE: ios-review-mode 즉시 API — §4 menuCode만 canViewIos. android/web 불변. tenantId
3) Admin: 원버튼/토글 즉시 API. 행 Switch 유지. Clinic-OS. LNB 신규 금지. AdminCommonLayout
4) Expo: Platform.OS hide 금지. X-Client-Platform 유지
5) 테스트 + commit + push

완료: 시드 OFF 없음 · 원버튼 ios만 · 즉시 API · 테스터 전 push.
금지: HEX, LNB 신규, Platform.OS community hide.
```

### Phase 3 — core-tester

```
1) 시드로 커뮤니티 강제 OFF 없음(또는 교정 후)
2) 원버튼 OFF/ON: CLT/CST can_view_ios만 변경, android/web 유지
3) LNB X-Client-Platform=ios|android 필터
4) Admin 원버튼·행 Switch·일괄저장 없음·LNB 신규 없음
5) Expo 헤더 · Platform.OS hide 경로 없음
6) #130 0건
미통과=배치 미완료.
```

### Phase 4 — PR

```
develop base PR. 본문에 menuCode: CLT_COMMUNITY, CST_COMMUNITY.
보고: PR URL + menuCode 목록.
```

---

## 8. 완료 기준

- [ ] 스펙 원버튼 섹션
- [ ] 사전 OFF 시드 철회
- [ ] 원버튼 → `CLT_COMMUNITY`, `CST_COMMUNITY`의 `can_view_ios`만
- [ ] android/web 유지 · 행 Switch · 즉시 API · LNB 신규 없음 · Expo 헤더
- [ ] tester 통과 · push · develop PR URL

---

## 9. 실행 요청 (부모)

1. explore → 2. core-designer(gemini-3.1-pro) → 3. core-coder → 4. core-tester → 5. PR  
결과는 기획에 전달 후 사용자가 **PR URL + menuCode** 최종 보고를 받는다.  
기획·메인은 소스 직접 수정 금지.
