# Admin Mobile MVP — PR 초안 (Task S)

**작성일**: 2026-05-16  
**작성**: core-planner (read-only 패키징)  
**상태**: 구현 태스크 A–P·M·N·O 완료 · **커밋·푸시 없음** (~44 files uncommitted)  
**기준**: [`EXPO_NATIVE_APP_PLAN.md`](./EXPO_NATIVE_APP_PLAN.md) §2.4 · Tasks A–P·M·N·O

---

## 1. 제안 PR 제목

**[Expo] 어드민·스태프 모바일 MVP — 셸·검수 API·Phase 2 화면 (Admin Mobile MVP)**

영문 부제(선택): `Admin/staff shell, community moderation decision API, Phase 2 screens, role guards`

---

## 2. Summary

- **단일 Expo 앱에 `app/(admin)/` 셸 추가** — 바텀탭(홈·검수·메시지·운영·더보기), `AdminRoleGate`·`adminRole` 유틸로 ADMIN/STAFF만 진입, CONSULTANT/CLIENT는 기존 `/(consultant)`·`/(client)` 유지.
- **커뮤니티 검수 BW-4 계약** — `useAdminCommunityModeration`·`buildCommunityModerationPatchBody`로 PATCH 본문은 **`decision`만**; 백엔드 `BwAdminContentCommunityMvcSmokeIntegrationTest`에 STAFF GET 403·레거시 `status` PATCH 400 포함(7 tests green).
- **Phase 2 운영 화면** — 대시보드 홈, 스케줄 라이트, 사용자 조회·상담일지 목록/상세, 마음날씨 관측(ADMIN 전용), 알림 설정·웹 어드민 안내 메시지 탭; `AdminMobilePlaceholderScreen`은 `app/(admin)` 라우트에서 미사용(0건).
- **공통·회귀 정리** — `UnifiedModal`, tenant/JWT 동기화, API 환경 배너·dev APK 스크립트(`build-android-apk-dev.sh`, `dev-app.sh`); 상담사·내담자 커뮤니티/FlashList·세션 KPI·마음날씨 인박스 등 동일 PR 범위 내 회귀 수정.
- **게이트 문서** — [`ADMIN_MOBILE_MVP_TEST_PLAN.md`](./ADMIN_MOBILE_MVP_TEST_PLAN.md), [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md); 자동: `npm run test:utils`(24 tests)·`tsc --noEmit` PASS — **§6 APK 4역할 수동 스모크는 리뷰어 게이트로 잔여**.

---

## 3. 제안 커밋 분할 (최대 3커밋)

| # | 범위 (요지) | 대표 경로 |
|---|-------------|-----------|
| **(a)** | Expo **어드민 MVP 기능** — 라우트·훅·가드·카피·역할 분기 | `expo-app/app/(admin)/**`, `expo-app/src/api/hooks/useAdmin*.ts`, `expo-app/src/components/guards/AdminRoleGate.tsx`, `expo-app/src/constants/admin*.ts`, `expo-app/src/utils/admin*.ts`, `expo-app/app/_layout.tsx`, `expo-app/app/index.tsx`, `expo-app/src/stores/useAuthStore.ts`, `expo-app/src/utils/adminRole.ts`, `expo-app/src/utils/__tests__/adminRole.test.ts`, `expo-app/src/components/common/modals/UnifiedModal.tsx`, `expo-app/src/components/organisms/AdminMobilePlaceholderScreen.tsx`, `expo-app/scripts/build-android-apk-dev.sh`, `expo-app/scripts/dev-app.sh`, `expo-app/scripts/adb-reverse-metro-port.js` |
| **(b)** | Expo **공유·상담사·내담자** — tsc/FlashList·커뮤니티·메시지·테넌트/API 정리 | `expo-app/app/(client)/**/community/**`, `expo-app/app/(consultant)/**`, `expo-app/src/components/organisms/ChatScreen.tsx`, `ConversationListScreen.tsx`, `expo-app/src/api/client.ts`, `endpoints.ts`, `hooks/useCommunity.ts`, `useMindWeather.ts`, `useMessages.ts`, `useProfile*.ts`, `expo-app/jest.config.cjs`, `expo-app/package.json`, `expo-app/src/utils/communityFeedMerge.ts`, `tenantJwtSync.ts`, `resolveTenantId*.ts` 등 (admin 전용 제외) |
| **(c)** | **백엔드·웹 회귀·문서·테스트** | `src/main/java/.../config/SecurityConfig.java`, `JwtAuthenticationFilter.java`, `Consultant*`, `MindWeather*`, `MobilePush*`, `src/test/java/.../BwAdminContentCommunityMvcSmokeIntegrationTest.java`, `ConsultantSessionStatistics*`, `MindWeatherControllerInbox*`, `frontend/src/components/consultant/**`, `docs/project-management/ADMIN_MOBILE_MVP_*.md`, `EXPO_NATIVE_APP_PLAN.md` |

> **리뷰 팁**: (a)만으로 Admin MVP diff가 읽히도록 하고, (b)는 회귀·타입 안정, (c)는 API·스모크·기획 문서로 분리하면 PR 리뷰 부담이 줄어든다.

---

## 4. HEREDOC 커밋 메시지

### Commit (a) — Expo admin MVP

```bash
git commit -m "$(cat <<'EOF'
feat(expo): 어드민·스태프 모바일 MVP 셸과 Phase 2 운영 화면을 추가한다.

현장에서 조회·검수·알림 대응이 가능하도록 app/(admin) 라우트, AdminRoleGate, admin API 훅·카피를 한 번에 넣었고, 웹 어드민을 대체하지 않는 범위(Top 8·Phase 2)로 고정했다.
EOF
)"
```

### Commit (b) — Expo shared / consultant / client fixes

```bash
git commit -m "$(cat <<'EOF'
fix(expo): 상담사·내담자 공유 화면과 API 계층을 어드민 MVP와 함께 타입·목록 안정화한다.

동일 브랜치에서 tsc·FlashList·커뮤니티·테넌트 동기화를 맞춰 어드민 라우트 추가 후 기존 역할 화면이 깨지지 않도록 회귀 수정만 포함한다.
EOF
)"
```

### Commit (c) — Backend, web consultant, docs, tests

```bash
git commit -m "$(cat <<'EOF'
test: BW 어드민 커뮤니티 검수 스모크와 MVP 게이트 문서를 정리한다.

decision 전용 PATCH·STAFF 403을 MockMvc로 고정하고, 상담사 통계·마음날씨 인박스 회귀 테스트·ADMIN_MOBILE_MVP 테스트 플랜을 PR 리뷰어가 재현할 수 있게 문서화한다.
EOF
)"
```

---

## 5. Test plan (링크)

| 문서 | 용도 |
|------|------|
| [`docs/project-management/ADMIN_MOBILE_MVP_TEST_PLAN.md`](./ADMIN_MOBILE_MVP_TEST_PLAN.md) | 역할 매트릭스·라우팅·API 계약·자동 게이트 명령·DoD |
| [`docs/project-management/ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) | dev APK 빌드·설치·logcat·수동 스팟 체크 절차 |

**PR 본문에 붙일 자동 게이트 (머지 전):**

```bash
cd expo-app && npm run test:utils && npx tsc --noEmit
mvn -q test -Dtest=BwAdminContentCommunityMvcSmokeIntegrationTest
mvn -q test -Dtest=ConsultantSessionStatisticsControllerIntegrationTest,MindWeatherControllerInboxIntegrationTest
```

---

## 6. Manual gate remaining — §6 APK 4-role smoke (리뷰어 체크리스트)

> 자동 게이트는 통과(2026-05-16 Task O). **아래는 실기기/에뮬레이터 1회 필수** — [`ADMIN_MOBILE_MVP_TEST_PLAN.md` §6](./ADMIN_MOBILE_MVP_TEST_PLAN.md#6-android-dev-apk--수동-스모크-절차), [`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md).

### 6.1 준비

- [ ] `cd expo-app && npm run android:apk:dev` (또는 `android:apk:dev:install`)
- [ ] APK `extra.apiBaseUrl` = `https://dev.core-solution.co.kr` 확인
- [ ] 팀 내부 채널에서 **ADMIN·STAFF·CONSULTANT·CLIENT** 테스트 계정 확보 (저장소에 자격 증명 기록 없음)

### 6.2 4역할 시나리오

| # | 역할 | 확인 항목 | 기대 |
|---|------|-----------|------|
| 1 | **ADMIN** | 로그인 → 홈·검수·운영·더보기 | `/(admin)/(home)`; 검수 탭 표시; 운영에 스케줄·사용자·기록·**마음날씨**; dev URL 배너 |
| 2 | **ADMIN** | 검수 1건 승인(선택 반려) | PATCH body **`decision`** only; 목록 갱신·크래시 없음 |
| 3 | **STAFF** | 로그인 | admin 홈·운영 접근; **검수 탭 없음**; 마음날씨 진입 차단 UX |
| 4 | **CONSULTANT** | 로그인 + `/(admin)` URL 시도 | `/(consultant)/(home)`만; admin 셸 미노출 |
| 5 | **CLIENT** | 로그인 + 커뮤니티 | `/(client)/(home)`; 검수·admin 경로 불가; 기존 피드 동작 |

### 6.3 실패 시

- [ ] `adb logcat` — `ReactNativeJS|error|AdminRoleGate|Unable to resolve`
- [ ] 요청 본문에 `status` vs `decision` 혼동 여부
- [ ] 이상 시 logcat 캡처를 PR 코멘트에 첨부

**리뷰어 서명란 (PR 코멘트용):**

- [ ] §6.2 전항목 PASS — 기기: ______ / APK 빌드 시각: ______ / 테넌트: ______

---

## 7. Risk / rollback

이 PR은 **기존 상담사·내담자 플로우 위에 `app/(admin)/` 스택과 어드민 전용 API 훅을 추가**하며, JWT·`SecurityConfig`·테넌트 필터 변경이 포함될 수 있어 **역할 분기 오류 시 잘못된 셸 노출**이 가장 큰 리스크다. 롤백은 **단일 revert PR(권장 3커밋 역순)** 또는 배포 전이라면 feature 브랜치 폐기로 충분하다. 백엔드 `BwAdminContentCommunityMvcSmokeIntegrationTest` 실패 시에는 **모바일 검수 PATCH만 영향**받으므로 웹 어드민 레거시 `status` 경로와 혼동하지 말 것. Expo 측은 dev APK 재설치로 이전 빌드 복귀 가능하나, **OTA/스토어 배포 전**에는 §6 수동 4역할 게이트 없이 운영 반영하지 않는다.

---

## 부록 — diff 스코프 인벤토리 (패키징용)

### `expo-app/app/(admin)/` (18 files)

`(home)/`, `(review)/`, `(messages)/`, `(operation)/`(+ schedule, users, records, mind-weather), `(more)/`(+ notification-settings), 루트 `_layout.tsx`.

### Admin hooks & support

`useAdminDashboard`, `useAdminCommunityModeration`, `useAdminSchedules`, `useAdminConsultationRecords`, `useAdminUserManagement`, `useAdminMindWeatherObservability` · `AdminRoleGate` · `admin*Copy` · `admin*Normalize` · `adminRole.ts` (+ unit test).

### Backend smoke (대표)

`BwAdminContentCommunityMvcSmokeIntegrationTest` — moderation-queue 200, STAFF 403, `decision` PATCH 200, legacy `status` PATCH 400.

### Docs (본 PR 초안 제외 시 동봉)

`ADMIN_MOBILE_MVP_TEST_PLAN.md`, `ADMIN_MOBILE_MVP_SMOKE_RUN.md`, `EXPO_NATIVE_APP_PLAN.md` (§2.4 갱신).

---

## 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-05-16 | Task S — PR 초안 (커밋·푸시 없음) |
