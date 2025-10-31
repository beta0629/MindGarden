# MindGarden 모바일 앱 빌드 가이드

**작성일**: 2025년 1월  
**버전**: 1.0

---

## 빌드 전 체크리스트

### 1. 디자인 가이드 준수 확인

`docs-mobile-app/MOBILE_DESIGN_GUIDE.md` 문서의 규칙을 준수했는지 확인:

- [ ] 모든 스타일이 `StyleSheet.create()` 사용
- [ ] 인라인 스타일 객체 (`style={{ ... }}`) 사용하지 않음
- [ ] 모든 색상 값이 `COLORS` 상수 사용
- [ ] 모든 간격 값이 `SPACING` 상수 사용
- [ ] 모든 폰트 크기가 `TYPOGRAPHY` 상수 사용
- [ ] 하드코딩된 숫자 값 없음
- [ ] 상태별 스타일이 StyleSheet에 미리 정의됨

### 2. 코드 품질 확인

```bash
cd mobile
npm run lint
```

**중요**: 모든 `error` 레벨 린트 오류를 수정해야 빌드 가능합니다.

### 3. 의존성 확인

```bash
cd mobile
npm install

# iOS 의존성 (macOS만)
cd ios && pod install && cd ..
```

---

## 개발 빌드 (Development Build)

### Android

```bash
cd mobile

# Metro 번들러 시작 (별도 터미널)
npm start

# Android 앱 실행
npm run android
```

또는 Android Studio에서:
1. `mobile/android` 폴더를 프로젝트로 열기
2. `Run` 버튼 클릭

### iOS (macOS만)

```bash
cd mobile

# Metro 번들러 시작 (별도 터미널)
npm start

# iOS 앱 실행
npm run ios
```

또는 Xcode에서:
1. `mobile/ios/MindGarden.xcworkspace` 파일 열기
2. 시뮬레이터 선택
3. `Run` 버튼 클릭 (⌘+R)

---

## 디버그 빌드 (Debug Build)

### Android

```bash
cd mobile/android
./gradlew assembleDebug
```

빌드 결과: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### iOS

```bash
cd mobile
npm run build:ios:debug
```

빌드 결과: `mobile/ios/build/`

---

## 릴리즈 빌드 (Release Build)

### Android

```bash
cd mobile/android
./gradlew assembleRelease
```

빌드 결과: `mobile/android/app/build/outputs/apk/release/app-release.apk`

**주의사항**:
- 릴리즈 키스토어 설정 필요
- 서명 설정 확인 필요
- ProGuard/R8 난독화 설정 확인

### iOS

```bash
cd mobile
npm run build:ios:release
```

**주의사항**:
- 개발자 인증서 및 프로비저닝 프로필 필요
- App Store 배포용 서명 설정 필요

---

## 빌드 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `npm start` | Metro 번들러 시작 |
| `npm run android` | Android 개발 빌드 및 실행 |
| `npm run ios` | iOS 개발 빌드 및 실행 |
| `npm run build:android:debug` | Android 디버그 빌드 |
| `npm run build:android:release` | Android 릴리즈 빌드 |
| `npm run build:ios:debug` | iOS 디버그 빌드 |
| `npm run build:ios:release` | iOS 릴리즈 빌드 |
| `npm run clean` | 빌드 캐시 정리 |

---

## 빌드 전 필수 확인사항

### 1. 환경 변수

- API Base URL 설정 확인 (`mobile/src/config/environments.js`)
- 소셜 로그인 키 설정 확인 (Kakao, Naver)

### 2. 네이티브 설정

**Android:**
- `mobile/android/app/build.gradle` 확인
- 패키지명 확인 (`com.mindgardenmobile`)
- 키스토어 설정 확인 (릴리즈 빌드 시)

**iOS:**
- `mobile/ios/Podfile` 확인
- `pod install` 실행 완료 확인
- 번들 ID 확인 (`com.mindgardenmobile`)
- 개발자 인증서 설정 확인

### 3. 디자인 가이드 준수

`MOBILE_DESIGN_GUIDE.md`의 모든 규칙 준수:
- StyleSheet 사용
- 상수 사용 (COLORS, SPACING, TYPOGRAPHY 등)
- 인라인 스타일 금지

---

## 빌드 실패 시 해결 방법

### Metro 번들러 문제

```bash
cd mobile
npx react-native start --reset-cache
```

### Android 빌드 실패

```bash
cd mobile
npm run clean:android
cd android
./gradlew clean
./gradlew assembleDebug
```

### iOS 빌드 실패

```bash
cd mobile
npm run clean:ios
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData
pod install
```

### 의존성 문제

```bash
cd mobile
rm -rf node_modules
npm install

# iOS
cd ios && pod install && cd ..
```

---

## 배포 준비

릴리즈 빌드 전 확인사항:

- [ ] 버전 번호 업데이트 (`package.json`, `android/app/build.gradle`, `ios/Info.plist`)
- [ ] 앱 아이콘 및 스플래시 스크린 설정
- [ ] 릴리즈 키스토어/인증서 설정
- [ ] 환경 변수 프로덕션 설정 확인
- [ ] 최종 테스트 완료

자세한 배포 절차는 `mobile/DEPLOYMENT_CHECKLIST.md` 참조

---

**참고 문서**:
- 디자인 가이드: `docs-mobile-app/MOBILE_DESIGN_GUIDE.md`
- 구현 가이드: `docs-mobile-app/DETAILED_IMPLEMENTATION_GUIDE.md`
- 배포 체크리스트: `mobile/DEPLOYMENT_CHECKLIST.md`

