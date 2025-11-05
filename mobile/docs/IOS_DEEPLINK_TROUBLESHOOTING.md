# iOS 딥 링크 문제 해결 가이드

## 현재 상황

iOS Safari에서 "주소가 유효하지 않기 때문에 Safari가 해당 페이지를 열 수 없습니다" 오류가 발생하고 있습니다.

## 확인 사항

### 1. Info.plist 설정 확인
- ✅ URL Scheme 등록: `mindgarden://`, `com.mindgardenmobile://`
- ✅ Bundle Identifier: `com.mindgarden.MindGardenMobile`

### 2. 앱 재빌드 필요
Info.plist 변경사항을 반영하려면:
1. 앱을 완전히 삭제
2. Xcode에서 Clean Build Folder (⇧⌘K)
3. 앱 재빌드 및 재설치

### 3. iOS Safari 제한사항
iOS Safari는 보안상의 이유로 JavaScript에서 프로그래밍 방식으로 커스텀 URL 스킴을 여는 것을 차단합니다.

## 해결 방법

### 방법 1: 사용자가 직접 버튼 클릭
현재 구현된 "앱 열기" 버튼을 사용자가 직접 클릭하도록 유도합니다.

### 방법 2: 백엔드에서 딥 링크 URL 검증
백엔드에서 생성하는 딥 링크 URL이 올바른지 확인:
```
mindgarden://oauth/callback?success=true&provider=KAKAO&userId=...
```

### 방법 3: 앱 재설치
1. 시뮬레이터에서 앱 삭제
2. Xcode에서 Clean Build Folder
3. 앱 재빌드 및 재설치

### 방법 4: 테스트
터미널에서 직접 딥 링크 테스트:
```bash
xcrun simctl openurl booted "mindgarden://oauth/callback?success=true&provider=KAKAO&userId=1"
```

## 다음 단계

1. ✅ 앱 재빌드 완료
2. ✅ 앱 재설치 완료
3. 📱 시뮬레이터에서 앱 실행
4. 🔐 소셜 로그인 테스트
5. 👆 "앱 열기" 버튼 클릭하여 딥 링크 확인

## 참고

- iOS 13 이상에서는 사용자 제스처 맥락에서만 커스텀 URL 스킴을 열 수 있습니다
- Safari 인앱 브라우저에서는 더 엄격한 제한이 있을 수 있습니다
- 실제 기기에서는 시뮬레이터와 다르게 동작할 수 있습니다

