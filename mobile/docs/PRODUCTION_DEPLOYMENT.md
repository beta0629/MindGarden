# MindGarden 모바일 앱 운영 배포 가이드

## 📱 운영 배포 개요

**중요**: 운영 환경에서는 **Metro bundler가 필요 없습니다.**

React Native 앱의 운영 배포는 다음과 같이 작동합니다:

### 🚀 자동 빌드 (GitHub Actions)

**웹과 동일하게 Git 커밋하면 자동으로 빌드됩니다!**

- `mobile/` 폴더의 코드가 변경되면 자동으로 GitHub Actions가 실행됩니다
- Android와 iOS 빌드가 자동으로 생성됩니다
- 빌드 결과물은 GitHub Actions의 **Artifacts**에서 다운로드할 수 있습니다

**워크플로우 파일**: `.github/workflows/deploy-mobile.yml`

**수동 실행 방법:**
1. GitHub Repository → Actions 탭
2. "📱 MindGarden 모바일 앱 빌드" 워크플로우 선택
3. "Run workflow" 클릭
4. 플랫폼 선택 (android, ios, both)

**참고**: 
- 빌드는 자동으로 되지만, **앱 스토어 업로드는 수동**으로 해야 합니다
- Google Play Store / App Store Connect에 업로드하려면 빌드 파일을 다운로드하여 수동으로 업로드해야 합니다

### 개발 환경 vs 운영 환경

| 구분 | 개발 환경 | 운영 환경 |
|------|----------|----------|
| **Metro bundler** | 필요 (실행 중이어야 함) | **불필요** |
| **JavaScript 번들** | Metro 서버에서 가져옴 | 앱 내부에 포함됨 |
| **빌드 타입** | Debug | Release |
| **설치 방법** | `npm run android` / `npm run ios` | APK/AAB (Android) / IPA (iOS) |

---

## 🚀 운영 배포 절차

### 1. Android 운영 배포

#### Step 1: 릴리즈 빌드 생성

```bash
cd mobile/android
./gradlew assembleRelease
```

**빌드 결과물:**
- 위치: `mobile/android/app/build/outputs/apk/release/app-release.apk`
- 또는 AAB: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

#### Step 2: 서명 (키스토어)

**주의**: 운영 배포를 위해서는 **릴리즈 키스토어**를 생성해야 합니다.

```bash
# 키스토어 생성 (최초 1회만)
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**키스토어 정보를 `android/app/build.gradle`에 설정:**

```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword '키스토어_비밀번호'
            keyAlias 'my-key-alias'
            keyPassword '키_비밀번호'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

#### Step 3: Google Play Store 업로드

1. Google Play Console 로그인
2. 앱 선택 → "프로덕션" 트랙 선택
3. "새 버전 만들기" 클릭
4. AAB 파일 업로드
5. 출시 노트 작성
6. 검토 요청

---

### 2. iOS 운영 배포

#### Step 1: Xcode에서 Release 빌드

1. Xcode에서 `mobile/ios/MindGardenMobile.xcworkspace` 열기
2. Product → Scheme → Edit Scheme
3. Run → Build Configuration을 **Release**로 변경
4. Product → Archive (⌘+B 후 ⌘+Shift+B)
5. Organizer 창에서 Archive 선택
6. "Distribute App" 클릭
7. "App Store Connect" 선택
8. 업로드

#### Step 2: App Store Connect에서 배포

1. App Store Connect 로그인
2. 내 앱 → "MindGardenMobile" 선택
3. "TestFlight" 또는 "App Store" 탭
4. 업로드된 빌드 확인
5. 앱 정보 입력 (스크린샷, 설명 등)
6. 심사 제출

---

## 🔑 중요 설정

### 1. 환경 변수 설정 (운영 환경)

`mobile/src/config/environments.js` 확인:

```javascript
// 운영 환경
const PRODUCTION_CONFIG = {
  API_BASE_URL: 'https://m-garden.co.kr', // 운영 서버 URL
  // ... 기타 설정
};
```

### 2. API Base URL 설정

**운영 배포 전 반드시 확인:**
- 개발 환경: `http://localhost:8080` 또는 `http://192.168.0.71:8080`
- 운영 환경: `https://m-garden.co.kr`

### 3. 소셜 로그인 설정

**카카오:**
- 카카오 개발자 센터에서 운영 환경 Redirect URI 등록
- Bundle ID 확인 (iOS: `com.mindgarden.MindGardenMobile`)

**네이버:**
- 네이버 개발자 센터에서 운영 환경 Redirect URI 등록
- iOS/Android 앱 설정 확인

---

## 📦 빌드 명령어 요약

### Android

```bash
# Debug 빌드 (개발용)
cd mobile/android && ./gradlew assembleDebug

# Release 빌드 (운영용)
cd mobile/android && ./gradlew assembleRelease

# AAB 빌드 (Google Play 업로드용)
cd mobile/android && ./gradlew bundleRelease
```

### iOS

```bash
# Debug 빌드 (개발용)
cd mobile && npm run build:ios:debug

# Release 빌드 (운영용)
cd mobile && npm run build:ios:release

# 또는 Xcode에서 Archive 사용
```

---

## ❓ FAQ

### Q: 운영 서버에 Metro bundler를 설치해야 하나요?

**A: 아니요. 필요 없습니다.**

- Release 빌드는 JavaScript 번들을 앱 내부에 포함합니다
- 사용자가 앱을 설치하면 번들이 이미 포함되어 있습니다
- Metro bundler는 개발 환경에서만 필요합니다

### Q: 운영 환경에서 앱이 작동하지 않으면?

1. **API Base URL 확인**: `environments.js`에서 운영 서버 URL이 올바른지 확인
2. **소셜 로그인 설정 확인**: 운영 환경 Redirect URI가 등록되었는지 확인
3. **네트워크 권한**: Android `AndroidManifest.xml`, iOS `Info.plist` 확인
4. **로그 확인**: Firebase Crashlytics 또는 다른 로깅 도구 사용

### Q: 빌드 파일 크기는?

일반적으로:
- Android APK: 30-50MB
- Android AAB: 25-40MB
- iOS IPA: 40-60MB

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] `environments.js`에서 운영 서버 URL 설정
- [ ] Android 릴리즈 키스토어 생성 및 설정
- [ ] iOS 개발자 인증서 및 프로비저닝 프로필 준비
- [ ] 카카오/네이버 개발자 센터에 운영 환경 Redirect URI 등록
- [ ] Firebase 프로덕션 설정 (google-services.json, GoogleService-Info.plist)
- [ ] 앱 버전 번호 업데이트
- [ ] 앱 아이콘 및 스플래시 이미지 준비
- [ ] 스크린샷 준비
- [ ] 개인정보 보호 정책 URL 준비

---

## 🔄 업데이트 배포

새 버전 배포 시:

1. 버전 번호 업데이트
   - Android: `android/app/build.gradle`의 `versionCode`, `versionName`
   - iOS: `ios/MindGardenMobile/Info.plist`의 `CFBundleShortVersionString`, `CFBundleVersion`
   - `package.json`의 `version`

2. 코드 변경사항 커밋 및 푸시

3. Release 빌드 생성

4. 앱 스토어 업로드

---

**참고**: Metro bundler는 개발 중에만 실행하면 되며, 운영 배포된 앱은 Metro 없이 독립적으로 작동합니다.

