# Android 에뮬레이터 로그 확인 방법

## 방법 1: 화면 Alert 확인 (가장 간단) ⭐

앱을 실행하고 네이버 로그인 버튼을 클릭하면:
- "Deep Link 수신" Alert가 표시됩니다
- "OAuth 콜백 감지" Alert가 표시됩니다
- "handleOAuthCallback 결과" Alert가 표시됩니다

이 Alert들을 확인하면 어느 단계에서 문제가 발생하는지 알 수 있습니다.

## 방법 2: adb logcat 사용

터미널에서 다음 명령어 실행:

```bash
cd /Users/mind/mindGarden/mobile
adb logcat | grep -E "🔗|📊|✅|❌"
```

또는 React Native 로그만 보기:

```bash
adb logcat -s ReactNativeJS:* ReactNative:*
```

## 방법 3: Metro Bundler 터미널

Metro Bundler가 실행 중인 터미널에서 `console.log()` 출력이 표시됩니다.

## 방법 4: Android Studio Logcat

1. Android Studio 열기
2. View → Tool Windows → Logcat
3. 필터: `ReactNativeJS` 또는 `🔗` 검색

## 확인할 로그

- `🔗 Deep Link 수신` - Deep Link가 앱으로 전달되었는지 확인
- `📤 /api/auth/oauth2/callback 호출 시작` - API 호출 시작 확인
- `📊 백엔드 OAuth2 콜백 응답` - 백엔드 응답 확인
- `✅ 최종 세션 ID 저장` - 세션 ID 저장 확인

