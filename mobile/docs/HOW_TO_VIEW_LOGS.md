# React Native 로그 확인 방법

## 1. Metro Bundler 터미널에서 확인

앱을 실행한 터미널(Metro Bundler가 실행 중인 터미널)에서 로그를 확인할 수 있습니다.

```bash
cd mobile  # 프로젝트 루트에서 실행
npm start
```

이 터미널에서 `console.log()` 출력이 표시됩니다.

## 2. Xcode Console에서 확인 (iOS)

1. Xcode에서 앱 실행
2. Xcode 하단의 **Debug Area** 열기 (⇧⌘Y)
3. Console 탭에서 로그 확인

## 3. React Native Debugger 사용

1. React Native Debugger 설치 (선택사항)
2. 앱에서 흔들기 → "Debug" 선택
3. Debugger에서 Console 탭 확인

## 4. Alert로 임시 확인 (현재 구현)

현재 코드에 Alert를 추가하여 주요 단계를 화면에 표시하도록 했습니다:
- 딥 링크 수신 확인
- 콜백 처리 결과
- login() 함수 결과

## 5. 로그 필터링

Metro 터미널에서 특정 키워드로 필터링:
- `🔗 OAuth2` - OAuth 관련 로그
- `✅` - 성공 메시지
- `❌` - 오류 메시지

## 6. 로그 제거 (프로덕션 배포 전)

프로덕션 배포 전에는 Alert를 제거하고 console.log만 사용하세요.

