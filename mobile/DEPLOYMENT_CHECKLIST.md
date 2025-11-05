# MindGarden 모바일 앱 배포 체크리스트

## 📋 사전 준비사항

### 1. 환경 설정
- [ ] `src/config/environments.js`의 프로덕션 설정 확인
  - API_BASE_URL이 올바른 프로덕션 URL로 설정
  - Firebase 설정이 프로덕션용으로 업데이트
- [ ] Firebase 프로젝트 설정
  - [ ] `android/app/google-services.json` 파일 생성 및 배치
  - [ ] `ios/GoogleService-Info.plist` 파일 생성 및 배치

### 2. 앱 스토어 준비
- [ ] iOS App Store Connect 설정
  - [ ] 앱 정보 등록
  - [ ] 앱 아이콘 및 스플래시 이미지 준비
  - [ ] 스크린샷 준비 (다양한 기기 사이즈)
  - [ ] 개인정보 보호 정책 URL 설정
  - [ ] 지원 URL 설정

- [ ] Google Play Console 설정
  - [ ] 앱 정보 등록
  - [ ] 앱 아이콘 및 기능 그래픽 준비
  - [ ] 스크린샷 준비 (다양한 기기 사이즈)
  - [ ] 개인정보 보호 정책 URL 설정
  - [ ] 지원 이메일 설정

### 3. 인증서 및 키 준비
- [ ] iOS 인증서
  - [ ] Apple Developer Program 가입 및 인증서 생성
  - [ ] App Store 배포 인증서
  - [ ] 프로비저닝 프로필 생성

- [ ] Android 키스토어
  - [ ] 릴리즈용 키스토어 파일 생성
  - [ ] 키스토어 비밀번호 및 키 별칭 기록

### 4. CI/CD 환경 변수 설정
```bash
# iOS 배포용
APP_STORE_CONNECT_PRIVATE_KEY_ID=""
APP_STORE_CONNECT_ISSUER_ID=""
APP_STORE_CONNECT_PRIVATE_KEY=""

# Android 배포용
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=""
ANDROID_KEYSTORE_FILE=""
ANDROID_KEYSTORE_PASSWORD=""
ANDROID_KEY_ALIAS=""
ANDROID_KEY_PASSWORD=""
```

## 🔧 빌드 및 테스트

### 1. 개발 환경 테스트
- [ ] 개발 빌드 생성 및 설치
- [ ] 모든 기능 테스트
  - [ ] 로그인/로그아웃
  - [ ] 각 사용자 역할별 기능
  - [ ] 푸시 알림
  - [ ] 프로필 사진 촬영
  - [ ] 네트워크 연결

### 2. 프로덕션 빌드 생성
- [ ] 릴리즈 빌드 생성
  - [ ] Android: `./gradlew assembleRelease`
  - [ ] iOS: `xcodebuild -workspace MindGarden.xcworkspace -scheme MindGarden -configuration Release`
- [ ] 빌드 파일 검증
  - [ ] 파일 크기 확인
  - [ ] 앱 아이콘 및 이름 확인

## 🚀 배포 실행

### 1. 베타 배포 (선택사항)
- [ ] TestFlight 베타 배포
- [ ] Google Play 베타 트랙 배포
- [ ] 베타 테스터 피드백 수집

### 2. 프로덕션 배포
- [ ] Fastlane을 사용한 자동 배포
  - [ ] iOS: `fastlane ios release`
  - [ ] Android: `fastlane android release`
- [ ] 앱 심사 제출
  - [ ] iOS: App Store Connect에서 심사 제출
  - [ ] Android: Google Play Console에서 출시

## 📊 배포 후 확인사항

### 1. 앱 스토어 확인
- [ ] 앱 스토어에 앱 표시 확인
- [ ] 앱 정보 및 설명 확인
- [ ] 스크린샷 및 아이콘 확인
- [ ] 다운로드 및 설치 테스트

### 2. 기능 검증
- [ ] 프로덕션 환경에서 모든 기능 테스트
- [ ] 푸시 알림 작동 확인
- [ ] API 연결 상태 확인
- [ ] 크래시 리포팅 확인

### 3. 모니터링 설정
- [ ] Firebase Analytics 설정 확인
- [ ] 크래시 리포팅 (Firebase Crashlytics) 확인
- [ ] 사용자 피드백 수집 채널 준비

## 🆘 문제 해결

### 빌드 실패 시
1. 캐시 정리: `npm run clean && npm install`
2. Metro 번들러 재시작: `npx react-native start --reset-cache`
3. Gradle 캐시 정리 (Android): `./gradlew clean`
4. Xcode 캐시 정리 (iOS): `rm -rf ~/Library/Developer/Xcode/DerivedData`

### 배포 실패 시
1. 환경 변수 확인
2. 인증서 및 키 파일 유효성 확인
3. Fastlane 로그 확인
4. 앱 스토어 정책 준수 여부 확인

## 📞 지원 연락처

배포 관련 문의사항이 있으시면 개발팀에 연락해주세요.

---

**배포 일시**: ____년 ____월 ____일
**담당자**: ____________________
**체크자**: ____________________
