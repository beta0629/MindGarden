# Admin 모바일 MVP — 자동 스모크 준비 (Task K / O)

**실행 일시:** 2026-05-16 (로컬)  
**커밋:** 없음 (준비 기록만)  
**Task O (2026-05-16):** `npm run test:utils`·`tsc --noEmit` PASS; `app/(admin)` 내 `AdminMobilePlaceholderScreen` 0건

## 환경

| 항목 | 결과 |
|------|------|
| 디바이스 | `emulator-5554` (`adb devices` → `device`) |
| 패키지 / Activity | `com.mindgardenmobile` / `.MainActivity` |
| APK 경로 | `expo-app/android/app/build/outputs/apk/release/app-release.apk` (~132MB, 2026-05-16 19:57) |
| 재설치 | `cd expo-app && npm run android:apk:install` — 성공 (설치·실행 완료) |
| dev APK 재빌드 | **미실행** (설치 성공, 모듈 resolve 오류 없음) |

## 번들 설정 (`assets/app.config`)

- **`extra.apiBaseUrl`:** `https://dev.core-solution.co.kr` (APK 내 `assets/app.config` 확인)

## Logcat (앱 기동 후 ~30초, 필터 요약)

필터: `error|exception|AdminRoleGate|Unable to resolve` → **매칭 없음**

추가 ReactNativeJS:

- `expo-background-fetch: This library is deprecated. Use expo-background-task instead.` (경고 1건)

**판단:** 치명적 JS 오류·`Unable to resolve`·`AdminRoleGate` 관련 로그 없음.

## 수동 스모크 — 사용자가 할 일

> 저장소에 ADMIN/STAFF 계정·비밀번호를 넣지 않음. 아래는 기기에서 직접 수행.

1. 에뮬레이터(또는 실기기)에서 **MindGarden** 앱이 최신 release APK로 실행 중인지 확인.
2. **ADMIN 또는 STAFF** 권한 계정으로 로그인 (테넌트·자격 증명은 팀 내부 채널 사용).
3. 로그인 후 **관리자 탭/홈** 진입 — `AdminRoleGate`에 의해 비관리자는 차단되는지 확인.
4. MVP 범위 화면 스팟 체크 (테스트 플랜 문서 기준):
   - **홈** — `/(admin)/(home)` 대시·알림·오늘 일정·바로가기 로드
   - **검수** — `/(admin)/(review)` 대기 큐 목록 (ADMIN만; STAFF는 탭 숨김)
   - **운영 허브** — `/(admin)/(operation)` 메뉴 4종 노출 (ADMIN: 스케줄·사용자·기록·마음날씨 / STAFF: 마음날씨 항목 없음)
   - **스케줄** — `/(admin)/(operation)/schedule` 오늘 일정 목록·당겨서 새로고침
   - **사용자** *(Phase 2)* — `/(admin)/(operation)/users` 역할 필터·검색·상세 모달(읽기 전용)
   - **상담일지** *(Phase 2)* — `/(admin)/(operation)/records` 상담사 선택 → 목록 → `records/[id]` 상세
   - **마음날씨** *(Phase 2, ADMIN)* — `/(admin)/(operation)/mind-weather` 요약·카드 목록 (STAFF 진입 시 차단 UX)
   - **메시지** — `/(admin)/(messages)` 웹 어드민 안내·외부 링크 CTA (네이티브 채팅 아님)
   - **더보기** — `/(admin)/(more)` 프로필·알림 설정 `notification-settings`·로그아웃
5. API 호출이 **dev** (`https://dev.core-solution.co.kr`) 로 가는지(환경 배너·네트워크 프록시 등 팀 관례대로) 확인.
6. 이상 시: `adb logcat -c` 후 재현 → `adb logcat -d | grep -iE 'ReactNativeJS|error|AdminRoleGate'` 캡처.

## 참고 명령 (재현)

```bash
adb devices
cd expo-app && npm run android:apk:install
adb shell am start -n com.mindgardenmobile/.MainActivity
adb logcat -d -t 200 | grep -iE 'error|exception|AdminRoleGate|Unable to resolve' | tail -30
unzip -p expo-app/android/app/build/outputs/apk/release/app-release.apk assets/app.config | python3 -c "import sys,json; print(json.load(sys.stdin)['extra']['apiBaseUrl'])"
```

## Phase 2 rebuild (Task N, 2026-05-16)

| 항목 | 결과 |
|------|------|
| 명령 | `cd expo-app && npm run android:apk:dev` |
| 빌드 | **성공** (1회차, Gradle `assembleRelease` ~3m 55s, 총 ~4m) |
| 재시도 | 없음 (Metro resolve·AdminRoleGate 오류 없음) |
| APK | `expo-app/android/app/build/outputs/apk/release/app-release.apk` (~132MB, 20:09) |
| `extra.apiBaseUrl` | `https://dev.core-solution.co.kr` (`unzip -p … assets/app.config` 확인) |
| 설치 | `npm run android:apk:install` → `emulator-5554` **성공** (설치·`MainActivity` 실행) |

관련: `docs/project-management/ADMIN_MOBILE_MVP_TEST_PLAN.md`

## Automated prep run (Task W)

- **일시**: 2026-05-16 (스크립트 `admin-mvp-smoke-prep.sh --force-install`)
- **adb device**: `emulator-5554` (device)
- **APK**: `app-release.apk` ~132M, mtime 20:09:53 — 설치·`MainActivity` 기동 성공
- **apiBaseUrl (APK embedded)**: `https://dev.core-solution.co.kr`
- **logcat (5s, ReactNativeJS|error|AdminRoleGate|Unable to resolve)**: **E 2** (TaskPersister, chromium WebView); AdminRoleGate·Unable to resolve **0**
- **RN 주의**: `(messages)` 라우트 경고 1건; `expo-background-fetch` deprecation 경고
- **prep 결과**: exit 0 — 수동 스모크 체크리스트는 스크립트 출력 기준
