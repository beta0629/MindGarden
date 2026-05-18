# 모바일 푸시 권한·강제 업데이트 오케스트레이션 (초안)

**작성**: 2026-05-18 · **범위**: Expo 네이티브 + Spring `mindgarden.mobile.app-version`

## A. Android 푸시 권한

| 항목 | 구현 |
|------|------|
| 채널 → 권한 순서 | `NotificationService.requestPermission()` — Android `setNotificationChannelAsync('default')` 선행 |
| 설정 UI | `NotificationSettingsScreen` 상단 「기기 알림」 — 상태·허용·설정 열기 |
| 토큰 재등록 | `app/_layout.tsx` — `_hasHydrated` + `tenantId` + `isAuthenticated` 후 `registerToken()` (debounce 500ms) |
| 카피 | `pushPermissionCopy.ts` |
| EAS projectId | `app.config.ts` — env `EAS_PROJECT_ID` / `EXPO_PUBLIC_EAS_PROJECT_ID` |

## B. 강제 업데이트

| 레이어 | 경로·계약 |
|--------|-----------|
| 설정 | `application.yml` → `mindgarden.mobile.app-version.*` |
| API | `GET /api/v1/mobile/app-version/check?platform&version&versionCode?` — **permitAll**, 테넌트 무관 |
| 비교 | Android: `versionCode` 우선, 없으면 semver · iOS: semver |
| Expo | `useForceUpdateCheck` + `ForceUpdateGate` (`updateRequired && forceUpdate` 시 전면 모달) |

## 검증

- `expo-app`: `npm run test:utils` — `notificationServiceRequestPermission.test.ts`
- 백엔드: `MobileAppVersionServiceImplTest`

## 비목표

- expo-updates OTA, Play Store 자동 업로드, soft-update 배너(P0는 hard only)
