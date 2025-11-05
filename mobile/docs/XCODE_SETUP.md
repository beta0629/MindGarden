# Xcode 설정 가이드

React Native 프로젝트를 Xcode에서 실행하기 위한 설정 가이드입니다.

## 필수 요구사항

1. **macOS** (macOS 13.0 이상 권장)
2. **Xcode** (최신 버전 권장, Xcode 15.0 이상)
3. **CocoaPods** (iOS 의존성 관리)
4. **Node.js** (v20 이상)
5. **npm** 또는 **yarn**

## 1. Xcode 설치 및 설정

### Xcode 설치
1. Mac App Store에서 Xcode를 다운로드하고 설치
2. Xcode를 열고 **Preferences > Locations**에서 Command Line Tools가 설치되어 있는지 확인

### Command Line Tools 설치
```bash
xcode-select --install
```

## 2. CocoaPods 설치

### CocoaPods 설치 확인
```bash
pod --version
```

### CocoaPods 설치 (없는 경우)
```bash
sudo gem install cocoapods
```

## 3. 프로젝트 설정

### 3.1 디렉토리 이동
```bash
cd mobile  # 프로젝트 루트에서 실행/ios
```

### 3.2 Pod 설치
```bash
pod install
```

> **참고**: `pod install`은 최초 1회 또는 `Podfile`이 변경된 경우에만 실행하면 됩니다.
> 
> Pod 설치가 완료되면 `Pods/` 폴더와 `MindGardenMobile.xcworkspace` 파일이 생성됩니다.

### 3.3 Firebase 설정 (선택사항)
Firebase를 사용하는 경우:

1. Firebase Console에서 `GoogleService-Info.plist` 파일을 다운로드
2. `mobile/ios/GoogleService-Info.plist.template` 파일을 참고하여 설정
3. `mobile/ios/MindGardenMobile/GoogleService-Info.plist` 위치에 파일 복사

```bash
# 템플릿 파일이 있는 경우
cp mobile/ios/GoogleService-Info.plist.template mobile/ios/MindGardenMobile/GoogleService-Info.plist

# 실제 Firebase 설정 값으로 수정 필요
```

## 4. Xcode에서 프로젝트 열기

### ⚠️ 중요: .xcodeproj가 아닌 .xcworkspace를 열어야 합니다!

```bash
# 터미널에서 열기
open mobile/ios  # 프로젝트 루트에서 실행/MindGardenMobile.xcworkspace

# 또는 Finder에서 직접 열기
# mobile/ios/MindGardenMobile.xcworkspace 파일을 더블클릭
```

> **주의**: `MindGardenMobile.xcodeproj`가 아닌 `MindGardenMobile.xcworkspace`를 열어야 CocoaPods 의존성이 제대로 작동합니다.

## 5. Xcode 프로젝트 설정

### 5.1 프로젝트 선택
1. Xcode 왼쪽 Navigator에서 **MindGardenMobile** 프로젝트를 선택
2. **TARGETS > MindGardenMobile** 선택

### 5.2 Signing & Capabilities 설정

#### Team 설정
1. **Signing & Capabilities** 탭 선택
2. **Team** 드롭다운에서 Apple Developer 계정 선택
   - Apple ID로 로그인 필요
   - 무료 계정도 가능 (개발용)

#### Bundle Identifier 설정
- 기본값: `com.mindgarden.MindGardenMobile`
- 변경이 필요한 경우 수정

#### Capabilities 추가 (필요한 경우)
- **Push Notifications** (Firebase FCM 사용 시)
- **Background Modes** (백그라운드 알림)
- **Associated Domains** (Deep Link 사용 시)

### 5.3 Deployment Info 설정
1. **General** 탭 선택
2. **Deployment Target**: iOS 13.0 이상 권장
3. **Devices**: iPhone, iPad 선택

### 5.4 Build Settings 확인
1. **Build Settings** 탭 선택
2. **Swift Language Version**: Swift 5 (또는 최신)
3. **iOS Deployment Target**: 프로젝트와 동일하게 설정

## 6. 스키마(Scheme) 설정

### 6.1 스키마 선택
1. Xcode 상단 툴바에서 스키마 선택
2. **MindGardenMobile** 선택
3. 옆의 디바이스 선택:
   - **시뮬레이터**: iPhone 15 Pro, iPhone 14 등
   - **실제 기기**: 연결된 iOS 기기

### 6.2 스키마 편집
1. 스키마 옆의 **Edit Scheme...** 클릭
2. **Run** 설정 확인:
   - **Build Configuration**: Debug (개발용) 또는 Release (배포용)
   - **Executable**: MindGardenMobile.app

## 7. 실행

### 7.1 Metro Bundler 실행
터미널에서 Metro 번들러를 먼저 실행:

```bash
cd mobile  # 프로젝트 루트에서 실행
npm start
```

또는

```bash
cd mobile  # 프로젝트 루트에서 실행
yarn start
```

### 7.2 Xcode에서 빌드 및 실행
1. Xcode에서 **⌘ + R** 또는 **Run** 버튼 클릭
2. 시뮬레이터가 자동으로 실행되거나 연결된 기기에서 실행됩니다

### 7.3 터미널에서 실행 (선택사항)
```bash
cd mobile  # 프로젝트 루트에서 실행
npm run ios
```

또는 특정 시뮬레이터 지정:

```bash
cd mobile  # 프로젝트 루트에서 실행
npx react-native run-ios --simulator="iPhone 15 Pro"
```

## 8. 문제 해결

### 8.1 Pod 설치 오류
```bash
cd mobile  # 프로젝트 루트에서 실행/ios
pod deintegrate
pod install
```

### 8.2 빌드 오류
1. **Clean Build Folder**: **⌘ + Shift + K**
2. **Derived Data 삭제**:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
3. **Pod 재설치**:
   ```bash
   cd mobile  # 프로젝트 루트에서 실행/ios
   pod deintegrate
   pod install
   ```

### 8.3 시뮬레이터 문제
```bash
# 시뮬레이터 재시작
xcrun simctl shutdown all
xcrun simctl boot "iPhone 15 Pro"
```

### 8.4 Metro Bundler 캐시 초기화
```bash
cd mobile  # 프로젝트 루트에서 실행
npm start -- --reset-cache
```

### 8.5 Node_modules 재설치
```bash
cd mobile  # 프로젝트 루트에서 실행
rm -rf node_modules
npm install
cd ios
pod install
```

## 9. 개발자 계정 설정 (실제 기기 테스트)

### 9.1 Apple Developer 계정
1. [Apple Developer](https://developer.apple.com) 가입
2. 무료 계정으로도 개발용 테스트 가능

### 9.2 프로비저닝 프로파일
1. Xcode에서 **Signing & Capabilities** 탭
2. **Automatically manage signing** 체크
3. **Team** 선택하면 자동으로 프로비저닝 프로파일 생성

### 9.3 실제 기기 연결
1. USB로 iPhone/iPad 연결
2. 기기에서 **신뢰** 선택
3. Xcode에서 기기 선택
4. 첫 실행 시 기기에서 **설정 > 일반 > VPN 및 기기 관리**에서 개발자 앱 신뢰

## 10. 배포 설정 (App Store)

### 10.1 Archive 생성
1. **Product > Scheme > Edit Scheme...**
2. **Archive** 설정 확인
3. **Product > Archive** 실행

### 10.2 배포
1. **Window > Organizer** 열기
2. Archive 선택 후 **Distribute App** 클릭
3. App Store Connect에 업로드

## 11. 유용한 명령어

```bash
# iOS 빌드 클린
cd mobile  # 프로젝트 루트에서 실행/ios
xcodebuild clean -workspace MindGardenMobile.xcworkspace -scheme MindGardenMobile

# Pod 업데이트
cd mobile  # 프로젝트 루트에서 실행/ios
pod update

# 모든 캐시 삭제
cd mobile  # 프로젝트 루트에서 실행
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
npm install
cd ios
pod install
```

## 12. 참고 자료

- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup)
- [CocoaPods Guide](https://guides.cocoapods.org/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)

## 13. 체크리스트

- [ ] Xcode 설치 완료
- [ ] Command Line Tools 설치 완료
- [ ] CocoaPods 설치 완료
- [ ] `pod install` 실행 완료
- [ ] `.xcworkspace` 파일로 프로젝트 열기
- [ ] Signing & Capabilities 설정 완료
- [ ] Metro Bundler 실행
- [ ] 시뮬레이터에서 앱 실행 성공

---

**문제가 발생하면**:
1. 위의 문제 해결 섹션 참고
2. Xcode Console 로그 확인
3. Metro Bundler 로그 확인
4. React Native 공식 문서 확인

