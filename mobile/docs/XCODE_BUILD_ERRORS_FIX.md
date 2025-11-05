# Xcode 빌드 오류 해결 가이드

## 일반적인 빌드 오류 해결 방법

### 1. 완전 클린 빌드

```bash
# 1. Xcode에서 Clean Build Folder (⌘ + Shift + K)

# 2. 터미널에서 전체 클린
cd mobile  # 프로젝트 루트에서 실행/ios

# Derived Data 삭제
rm -rf ~/Library/Developer/Xcode/DerivedData/MindGardenMobile-*

# 빌드 폴더 삭제
rm -rf build

# Pods 재설치
export LANG=en_US.UTF-8
pod deintegrate
pod install

# 3. node_modules 재설치 (필요한 경우)
cd mobile  # 프로젝트 루트에서 실행
rm -rf node_modules
npm install

# 4. Metro 캐시 초기화
npm start -- --reset-cache
```

### 2. Xcode 프로젝트 재설정

```bash
# 프로젝트 닫기
# Xcode 완전 종료 (⌘ + Q)

# 프로젝트 다시 열기
open mobile/ios  # 프로젝트 루트에서 실행/MindGardenMobile.xcworkspace
```

### 3. Swift 버전 및 iOS Deployment Target 확인

Xcode에서:
1. 프로젝트 선택 → TARGETS → MindGardenMobile
2. Build Settings 탭
3. 검색: `SWIFT_VERSION` → 5.0 확인
4. 검색: `IPHONEOS_DEPLOYMENT_TARGET` → 15.1 확인

### 4. 모듈 임포트 오류 해결

#### KakaoSDK 관련 오류
```bash
cd mobile  # 프로젝트 루트에서 실행/ios
export LANG=en_US.UTF-8
pod install
```

#### React Native 모듈 오류
```bash
cd mobile  # 프로젝트 루트에서 실행
npm install
cd ios
pod install
```

### 5. 서명(Signing) 오류

Xcode에서:
1. Signing & Capabilities 탭
2. Team 선택 확인
3. "Automatically manage signing" 체크
4. Bundle Identifier 확인: `com.mindgarden.MindGardenMobile`

### 6. 링커 오류

```bash
# Pods 재설치
cd mobile  # 프로젝트 루트에서 실행/ios
export LANG=en_US.UTF-8
pod deintegrate
pod install

# Xcode에서 Clean Build Folder
```

### 7. 컴파일러 오류

#### Swift 컴파일 오류
- Swift 버전 확인 (5.0)
- Xcode 버전 호환성 확인

#### Objective-C 컴파일 오류
- Header Search Paths 확인
- Pods 헤더 경로 확인

### 8. 메모리 부족 오류

```bash
# Xcode 메모리 설정
# Xcode → Preferences → Locations
# Derived Data 위치 변경 또는 삭제

# 빌드 병렬 처리 줄이기
# Xcode → Preferences → Locations → Advanced
# Build Location → Derived Data 경로 확인
```

## 단계별 완전 재설정

### 전체 재설정 (최후의 수단)

```bash
# 1. 프로젝트 폴더로 이동
cd mobile  # 프로젝트 루트에서 실행

# 2. node_modules 삭제
rm -rf node_modules
rm -rf package-lock.json

# 3. iOS 빌드 관련 삭제
cd ios
rm -rf Pods
rm -rf Podfile.lock
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData/MindGardenMobile-*

# 4. 의존성 재설치
cd ..
npm install

# 5. Pod 재설치
cd ios
export LANG=en_US.UTF-8
pod install

# 6. Xcode에서 프로젝트 열기
open MindGardenMobile.xcworkspace
```

## 일반적인 오류 메시지와 해결책

### "Module 'XXX' not found"
- Pod 재설치 필요
- Header Search Paths 확인

### "No such module 'XXX'"
- Pods가 제대로 링크되지 않음
- .xcworkspace 파일 사용 확인

### "Command PhaseScriptExecution failed"
- Node.js 경로 확인
- npm install 완료 확인

### "Signing for XXX requires a development team"
- Signing & Capabilities에서 Team 선택

### "Undefined symbol"
- Pods 재설치
- Clean Build Folder

## 디버깅 팁

### 빌드 로그 확인
1. Xcode에서 빌드 실행
2. Report Navigator 열기 (⌘ + 9)
3. 최근 빌드 클릭
4. 오류 메시지 확인

### 터미널에서 빌드 (더 자세한 로그)
```bash
cd mobile  # 프로젝트 루트에서 실행/ios
xcodebuild -workspace MindGardenMobile.xcworkspace \
  -scheme MindGardenMobile \
  -configuration Debug \
  -sdk iphonesimulator \
  clean build 2>&1 | tee build.log
```

## 체크리스트

- [ ] Xcode에서 Clean Build Folder (⌘ + Shift + K)
- [ ] Derived Data 삭제
- [ ] Pod 재설치 (pod deintegrate → pod install)
- [ ] node_modules 재설치 (필요한 경우)
- [ ] .xcworkspace 파일 사용 확인
- [ ] Signing 설정 확인
- [ ] Swift 버전 확인 (5.0)
- [ ] iOS Deployment Target 확인 (15.1)
- [ ] Metro Bundler 실행 중 확인

## 도움이 필요한 경우

구체적인 오류 메시지를 알려주시면 더 정확한 해결책을 제공할 수 있습니다.

가장 많이 발생하는 오류:
1. 빌드 로그에서 첫 번째 오류 메시지 확인
2. Xcode Report Navigator에서 전체 오류 확인
3. 오류 메시지 복사하여 공유

