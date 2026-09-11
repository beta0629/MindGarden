# App Store 심사 대응 — 메뉴 노출 RBAC (원격 권한) 통일 (2026-09-11)

> **반려**: Version 1.0 (17) · Submission `8e74baef-072c-4ea3-b1e7-d8518e04df6b` · Review Device: iPad Air 11" M3 · 2026-06-10  
> **확정 전략**: `APP_STORE_REVIEW_MODE` / 빌드 플래그 / 메뉴 하드코딩 hide **폐기**.  
> **통일 모델**: 기존 **테넌트 RoleMenuPermission + Admin 메뉴 권한 UI + `/api/v1/menus/lnb`** 를 재사용·확장. 심사 시 관리자가 문제 메뉴만 OFF → 앱/웹이 API 기준으로 필터 (재빌드 최소화).

**폐기 문서**: `APP_STORE_REVIEW_MODE_PLAN_20260911.md`(하드 게이트) — **본 문서가 SSOT**.  
**병렬 주의**: `bc-aea9eac6`(애플 심사 메뉴 게이트)가 하드 게이트로 진행 중이면 **폐기·본 권한 모델로 통일**. 스케줄/사이드바 작업(`AdminCommonLayout` CSS·fc-event·사이드바 검색)과 **파일 충돌 최소화**.

**브랜치**: `cursor/menu-visibility-rbac-cac0` · base `develop`  
**목표 반영**: `develop`

---

## 1. 목표 (사용자 의도)

1. App Store 심사마다 **소스를 고쳐 메뉴를 막지 않는다.**
2. **관리자(`/admin/menu-permissions`)** 에서 역할별 메뉴 노출 on/off.
3. Expo·웹 네비는 **서버/권한 API**로 필터 → 설정 변경만으로 반영(원격 설정이 이상적; Expo는 OTA 가능 범위에서 API 재조회로 충분).

---

## 2. 반려 ↔ 대응 매핑

| Guideline | 앱 기능 | 코드로 가능 | 본 배치 대응 |
|-----------|---------|-------------|--------------|
| **1.2 Safety UGC** | 내담자/상담사 `더보기 → 커뮤니티`(익명·UGC), 차단·검수 | ✅ | CLIENT/CONSULTANT 커뮤니티 메뉴를 DB 메뉴로 등록·권한 토글. OFF 시 Expo/웹 메뉴 숨김 + 딥링크 가드. EULA(zero-tolerance) 인앱 링크. |
| **4 Design (iPad)** | iPad에서 레이아웃 깨짐 | △ (권한과 무관) | **본 배치 최소**: 치명 화면 maxWidth shell만 허용(기존 토큰). 전면 iPad 리디자인 **제외**. |
| **5.1.1(ix) Org** | Individual 계정 제출 | ❌ 코드 불가 | **운영 체크리스트**만 (Organization 계정 전환). |

---

## 3. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | 센터 ADMIN이 `/admin/menu-permissions`에서 역할 칩 → 메뉴 행 토글 → 저장. 심사 전 커뮤니티만 OFF. 일반 운영은 다시 ON. 내담자/상담사는 설정 반영 후 더보기에서 해당 항목이 사라짐. |
| **정보 노출** | ADMIN: 한국어 메뉴명·노출 토글·잠금 사유. 본문 `menuCode`/`menuPath` 비노출(Clinic-OS 스펙 유지). 심사 민감 메뉴(커뮤니티 등)는 행에서 식별 가능해야 함(한글명 «커뮤니티»). |
| **레이아웃** | Admin: 기존 Clinic-OS `MenuPermissionManagement`(AdminCommonLayout) **재사용** — 신규 시안 불필요. Expo: 기존 `MenuListItem` 조건부 렌더. |

---

## 4. 현황·갭 (기획 조사 요약 — Phase 0에서 확정)

### 이미 있음 (재사용)

| 영역 | 경로 |
|------|------|
| Admin UI | `frontend/src/components/admin/MenuPermissionManagement.js` + Clinic-OS (`docs/design-system/clinic-os-menu-permissions.md`) |
| API | `GET/POST/DELETE /api/v1/admin/menu-permissions/*`, `batch` |
| Entity | `RoleMenuPermission` · `MenuPermissionServiceImpl.canAccessMenu` (`canView` 우선, 없으면 min-role) |
| LNB 조회 | `GET /api/v1/menus/lnb` → `MenuServiceImpl.getLnbMenus` |
| 웹 LNB 소비 | `AdminCommonLayout` → `GET` LNB → `normalizeLnbTree` |
| Expo legal | `LEGAL_PUBLIC_PATHS` · `/legal/terms` · `buildPublicLegalWebUrl` |
| UGC 백엔드 | `/api/v1/community/**` + admin moderation |

### 핵심 갭 (구현 필수)

1. **`MenuServiceImpl.getLnbMenus`가 `RoleMenuPermission`을 적용하지 않음**  
   → Admin에서 토글해도 LNB/클라이언트 메뉴에 원격 반영이 안 될 수 있음.  
   → **권한 필터를 LNB(및 필요 시 user menus) 응답에 연결**해야 함.
2. **Expo 더보기 메뉴가 하드코딩** (`expo-app/app/(client)/(more)/index.tsx` 등 커뮤니티 고정)  
   → 서버 접근 가능 메뉴/코드 목록으로 필터 필요. 테넌트 플래그 패턴(`useTenantComponentFlags` / shop) 참고.
3. **모바일 커뮤니티가 DB `menus` 행으로 관리되는지 불명확**  
   → CLIENT/CONSULTANT용 커뮤니티 `menuCode` 시드(Flyway) 없으면 Admin 토글 불가 → **시드 추가**.
4. **딥링크**: 메뉴 숨김만으로는 `/community` 직접 진입 가능 → **라우트 가드**(권한 없으면 replace).
5. **EULA**: terms와 별도 zero-tolerance EULA 노출이 약하면 설정/legal에 링크 보강.

### 하지 말 것

- `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_APP_STORE_REVIEW_MODE` / `extra.appStoreReviewMode`
- `HIDDEN_ADMIN_LNB_PATHS`에 커뮤니티·심사 메뉴를 추가하는 방식(운영 숨김 Set 확장으로 심사 대응)
- 빌드마다 소스에서 메뉴 목록 hide
- 스케줄 사이드바·`fc-event`·`AdminCommonLayout` CSS 대규모 수정 (병렬 충돌)

---

## 5. 범위

### 포함

- BE: LNB(및 접근 메뉴)에 **tenant `RoleMenuPermission.canView` 필터** 연결; 멀티테넌트 `tenantId` 필수
- DB: CLIENT/CONSULTANT(필요 시 ADMIN) **커뮤니티·관련** 메뉴 시드 + menuLocation
- Admin: 기존 메뉴 권한 UI로 해당 메뉴 on/off (신규 페이지 지양; 식별·저장 UX만 필요 시 미세 조정)
- Expo: client/consultant 더보기·탭에서 **API/권한 기준** 커뮤니티 숨김 + 딥링크 가드
- 웹 client/consultant 커뮤니티 네비도 동일 권한 기준(가능하면 LNB/메뉴 API 경로 통일)
- EULA(또는 terms zero-tolerance) 인앱 링크
- 운영 체크리스트: Org 5.1.1 · 심사 전 메뉴 OFF 절차 · 심사 후 ON
- iPad: **최소** TabletContentShell(또는 기존 패턴) — 권한 배치에 묶지 말고 충돌 없으면 소량만

### 제외

- `APP_STORE_REVIEW_MODE` 하드 게이트
- iPad 전면 리디자인 / 디자인 토큰 SSOT 개편
- Org 계정 전환 자동화
- 통합스케줄·사이드바 드래그/검색 작업
- 커뮤니티 UGC 정책 전면 재구현(검수 API는 이미 있음 — 노출만 제어)

---

## 6. 의존성·순서

```
Phase 0 explore (갭·menuCode·Expo 호출면 확정)
    ↓
Phase 1 core-coder (BE 필터 연결 + Flyway 시드 + Admin 확인 + Expo/웹 필터 + EULA + 가드)
    ↓
Phase 2 core-tester (권한 on/off · 메뉴 숨김 · 딥링크 · 테넌트)
    ↓
Phase 3 docs (심사 운영 체크리스트) — Phase 1과 문서만 병렬 가능
    ↓
Phase 4 core-deployer (develop 머지·푸시·dev 워크플로)
```

**core-designer**: 신규 시안 **불필요**(Clinic-OS 메뉴 권한 스펙 재사용).  
**병렬 금지 파일(충돌 최소화)**:  
`frontend/src/utils/lnbMenuUtils.js`의 HIDDEN Set 확장 지양;  
스케줄 사이드바·`IntegratedMatchingSchedule`·fc-event CSS **비터치**.  
우선 수정 후보: `MenuServiceImpl` / `MenuPermissionService*` / Flyway / `MenuPermissionManagement`(필요 시) / `expo-app/**/more/**` / Expo menu API 훅 / legal EULA.

---

## 7. Phase · 분배실행

### Phase 0 — explore

**subagent_type**: `explore`  
**목표**: 구현 전 인벤토리·갭 확정 (코더 프롬프트에 경로 박제)

**전달 프롬프트**:

```
목적: App Store 심사용 «메뉴 권한 원격 on/off» 통일. APP_STORE_REVIEW_MODE 하드 게이트는 폐기 대상.

조사·산출:
1) MenuServiceImpl.getLnbMenus vs MenuPermissionServiceImpl.getUserAccessibleMenus 연결 여부.
   - LNB 응답에 RoleMenuPermission.canView가 반영되는지 코드 근거(파일:라인).
2) menus 테이블/Flyway에 CLIENT·CONSULTANT 커뮤니티 메뉴(menuCode/path/location) 존재 여부.
   - 없으면 시드에 넣을 권장 menuCode 제안(기존 ADM_CONTENT_COMMUNITY 등과 충돌 없이).
3) Expo: client/consultant/admin 커뮤니티 진입점 목록(더보기·탭·href).
4) 웹 client/consultant 커뮤니티 라우트·네비 진입점.
5) EULA/terms zero-tolerance 문구·설정 링크 현황.
6) 병렬 충돌 위험 파일 목록(AdminCommonLayout, lnbMenuUtils, schedule sidebar).

산출: 경로 목록 + «코더가 손댈 파일 제안» 표. 코드 수정 금지.
참조: docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md
```

### Phase 1 — core-coder

**subagent_type**: `core-coder`  
**skills**: `/core-solution-backend`, `/core-solution-frontend`, `/core-solution-multi-tenant`, `/core-solution-database-first`, `/core-solution-api`, `/core-solution-encapsulation-modularization`  
**참조**:  
- `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
- `docs/design-system/clinic-os-menu-permissions.md`  
- `docs/planning/MENU_PERMISSION_SYSTEM_OVERVIEW.md`  
- `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`  
- `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` (§5 체크리스트)  
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17  
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3  

**전달 프롬프트**:

```
역할: core-coder. 기획서 APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md 구현.

금지:
- APP_STORE_REVIEW_MODE / EXPO_PUBLIC_APP_STORE_REVIEW_MODE / 빌드 extra 심사 플래그
- 메뉴 목록 하드코딩 hide로 심사 대응
- HIDDEN_ADMIN_LNB_PATHS에 커뮤니티 추가
- 스케줄 사이드바·fc-event·AdminCommonLayout CSS 대규모 변경
- 하드코딩 색상·매직 스트링(운영 게이트 §17·§1.3)

필수 구현:
1) BE: GET /api/v1/menus/lnb (및 user 메뉴가 쓰이면)에 tenant RoleMenuPermission 반영.
   - 테넌트 행 있으면 canView로 필터; 없으면 기존 min-role/location 기본.
   - MenuPermissionService.getUserAccessibleMenus 재사용·확장 우선. tenantId 세션 필수.
2) Flyway: CLIENT/CONSULTANT용 커뮤니티(및 심사 토글 대상) menus 시드.
   - Admin /admin/menu-permissions 역할 칩에서 토글 가능해야 함.
3) Expo: client(+consultant) 더보기 커뮤니티를 서버 권한/접근 메뉴 API 기준으로 조건부 렌더.
   - 권한 OFF면 메뉴 미노출 + community 라우트 딥링크 가드(더보기로 replace).
   - Metro: @/lib/getMmkv 규칙 유지, EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md §5 완료.
4) 웹: client/consultant 커뮤니티 네비가 있으면 동일 권한 기준(가능하면 menus API).
5) EULA: zero-tolerance UGC 정책 링크를 설정/legal에서 열 수 있게(기존 LEGAL_PUBLIC 패턴 재사용).
6) iPad Guideline 4: 충돌 없으면 최소 TabletContentShell(또는 기존 패턴)만 — 권한 모델과 분리된 소량 패치.
7) 단위 테스트: BE 권한 필터 fail-closed; Expo/FE 헬퍼 테스트(권한 off → 메뉴 제외).

완료 조건:
- [ ] Admin에서 CLIENT 커뮤니티 canView OFF → lnb/user menus에서 제외
- [ ] Expo 더보기에서 커뮤니티 미표시(재빌드 없이 API만으로)
- [ ] 딥링크로 community 진입 시 가드
- [ ] APP_STORE_REVIEW_MODE 문자열 저장소에 신규 도입 0
- [ ] develop 대상 브랜치 cursor/menu-visibility-rbac-cac0 에 커밋·푸시
```

### Phase 2 — core-tester

**subagent_type**: `core-tester`  
**skill**: `/core-solution-testing`

**전달 프롬프트**:

```
검증 대상: 메뉴 권한 원격 on/off (App Store RBAC 배치).
시나리오:
1) Admin /admin/menu-permissions: CLIENT «커뮤니티» OFF 저장 → GET /api/v1/menus/lnb(또는 접근 메뉴 API)에 해당 코드 없음.
2) 다시 ON → 메뉴 복귀.
3) Expo: 권한 OFF 시 더보기 커뮤니티 미노출; 딥링크 가드.
4) 테넌트 격리: 다른 tenantId 권한 영향 없음.
5) APP_STORE_REVIEW_MODE 미사용(grep).
6) 기존 MenuPermission fail-closed(STAFF ops-finance, CONSULTANT schedule-create) 회귀 없음.
통과 전 배치 완료 보고 금지. 증거(테스트 로그/명령 출력) 첨부.
```

### Phase 3 — generalPurpose (문서)

**skill**: `/core-solution-documentation`  
**Phase 1과 병렬 가능**

**전달 프롬프트**:

```
작성: docs/운영반영/APP_STORE_REVIEW_MENU_PERMISSION_CHECKLIST.md
포함:
- 심사 전: Admin에서 CLIENT/CONSULTANT 커뮤니티(및 필요 UGC) OFF 절차
- 심사 후: ON 복구
- EULA/약관 인앱 확인
- ASC 18+ 메타(해당 시)
- Guideline 5.1.1 Organization 계정 전환(코드 밖)
- «하드 게이트(APP_STORE_REVIEW_MODE) 사용 금지» 명시
기획서 링크: APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md
```

### Phase 4 — core-deployer

**subagent_type**: `core-deployer` (없으면 generalPurpose + `.cursor/agents/core-deployer.md`)

**전달 프롬프트**:

```
테스터 통과 후: cursor/menu-visibility-rbac-cac0 → develop 반영.
backend/frontend/expo paths에 맞게 deploy-backend-dev / deploy-frontend-dev 등 저장소 워크플로만 트리거.
APP_STORE_REVIEW_MODE 관련 PR/브랜치가 있으면 머지하지 말고 본 RBAC 브랜치만 반영.
확인 질문 금지. 짧게 결과만.
```

---

## 8. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| LNB가 RoleMenuPermission 미연결인 채 Admin만 수정 | Phase 1에서 LNB 필터를 **필수** 완료 조건 |
| Expo 오프라인/캐시로 옛 메뉴 잔존 | 로그인·포그라운드 시 메뉴 재조회; fail-closed(불명확 시 숨김 정책은 코더가 기존 패턴 따름) |
| 병렬 에이전트 하드 게이트 머지 | develop에 REVIEW_MODE 들어오면 즉시 제거·RBAC만 유지 |
| 사이드바/스케줄 파일 충돌 | 해당 파일 비터치 |
| Org 5.1.1 | 코드로 해결 불가 — 체크리스트만 |
| iPad 4 전면 | 본 배치 최소 shell만; 잔여 후속 |

---

## 9. 완료 기준·체크리스트

- [ ] 하드 게이트/심사 플래그 **신규 도입 없음**
- [ ] Admin 메뉴 권한으로 커뮤니티 등 UGC 메뉴 on/off 가능
- [ ] `/api/v1/menus/lnb`(또는 동등 API)가 테넌트 권한 반영
- [ ] Expo·웹 네비가 해당 API 기준으로 필터
- [ ] EULA/zero-tolerance 링크 접근 가능
- [ ] 운영 체크리스트(Org 포함) 문서화
- [ ] core-tester 통과
- [ ] `develop` 반영

---

## 10. 실행 요청 (부모 에이전트)

1. Phase 0 `explore` 호출 → 결과를 기획/코더 프롬프트에 경로 보강.  
2. Phase 1 `core-coder` + (병렬) Phase 3 문서.  
3. Phase 2 `core-tester`.  
4. Phase 4 `core-deployer` → develop.

**확인 질문 금지. 하드 게이트 방향이면 폐기하고 본 권한 모델로 통일.**
