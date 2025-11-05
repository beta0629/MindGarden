# Xcode 설정 확인 보고서

## ✅ 확인 완료 항목

### 1. 필수 파일 및 폴더
- ✅ **Podfile**: 존재함
- ✅ **Podfile.lock**: 존재함 (의존성 고정됨)
- ✅ **Pods/**: 폴더 존재 (CocoaPods 설치 완료)
- ✅ **MindGardenMobile.xcodeproj**: 프로젝트 파일 존재
- ✅ **MindGardenMobile.xcworkspace**: Workspace 파일 존재
- ✅ **AppDelegate.swift**: Swift 파일 존재
- ✅ **Info.plist**: 설정 파일 존재

### 2. 개발 환경
- ✅ **CocoaPods**: 1.16.2 설치됨
- ✅ **React Native**: 0.82.1 설치됨
- ✅ **Swift**: 5.0 설정됨
- ✅ **iOS Deployment Target**: 15.1 설정됨

### 3. 프로젝트 구조
- ✅ Pods와 프로젝트 연결됨 (libPods-MindGardenMobile.a 참조 확인)
- ✅ AppDelegate.swift 정상 구성
- ✅ Info.plist 기본 설정 완료

## ⚠️ 수정 필요 항목

### 1. Bundle Identifier 수정 필요
**현재 상태**: `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)`
**권장 변경**: `com.mindgarden.MindGardenMobile`

**수정 방법**:
1. Xcode에서 프로젝트 열기
2. 프로젝트 선택 → TARGETS → MindGardenMobile
3. **General** 탭에서 **Bundle Identifier** 변경
4. 또는 **Signing & Capabilities** 탭에서 변경

### 2. UTF-8 인코딩 경고
**현재 상태**: CocoaPods 실행 시 UTF-8 인코딩 경고 발생

**해결 방법**:
터미널에 다음 추가 (`.zshrc` 또는 `.bash_profile`):
```bash
export LANG=en_US.UTF-8
```

적용:
```bash
source ~/.zshrc
```

### 3. Info.plist 권한 설명 추가 필요
**현재 상태**: 일부 권한 설명이 비어있음

**추가 권장**:
- NSLocationWhenInUseUsageDescription: 현재 비어있음
- 카메라/사진 권한: 이미지 업로드 기능 사용 시 추가 필요
- 알림 권한: Firebase FCM 사용 시 추가 필요

## 📋 다음 단계 체크리스트

### Xcode에서 수정할 사항

- [ ] **Bundle Identifier 변경**
  1. Xcode에서 `MindGardenMobile.xcworkspace` 열기
  2. 프로젝트 → TARGETS → MindGardenMobile
  3. General 탭 → Bundle Identifier: `com.mindgarden.MindGardenMobile`

- [ ] **Signing & Capabilities 설정**
  1. Signing & Capabilities 탭 열기
  2. Team 선택 (Apple ID로 로그인 필요)
  3. "Automatically manage signing" 체크

- [ ] **Capabilities 추가 (필요한 경우)**
  - Push Notifications (Firebase FCM 사용 시)
  - Background Modes → Remote notifications

- [ ] **Info.plist 권한 설명 추가**
  - 카메라 권한: `NSCameraUsageDescription`
  - 사진 라이브러리: `NSPhotoLibraryUsageDescription`
  - 알림 권한: Firebase 설정 시 자동 추가

### 터미널 설정

- [ ] **UTF-8 인코딩 설정**
  ```bash
  echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
  source ~/.zshrc
  ```

### 테스트

- [ ] **Metro Bundler 실행**
  ```bash
  cd /Users/mind/mindGarden/mobile
  npm start
  ```

- [ ] **Xcode에서 빌드 테스트**
  1. Xcode에서 ⌘ + B (빌드)
  2. 오류 없이 빌드되는지 확인
  3. ⌘ + R (실행)으로 시뮬레이터에서 테스트

## 🎯 빠른 시작 가이드

### 1. Xcode 열기
```bash
open /Users/mind/mindGarden/mobile/ios/MindGardenMobile.xcworkspace
```

### 2. Bundle Identifier 수정
- 프로젝트 → TARGETS → MindGardenMobile
- General → Bundle Identifier: `com.mindgarden.MindGardenMobile`

### 3. Signing 설정
- Signing & Capabilities → Team 선택

### 4. 실행
```bash
# 터미널 1: Metro Bundler
cd /Users/mind/mindGarden/mobile
npm start

# Xcode에서 ⌘ + R 또는 Run 버튼 클릭
```

## 📝 참고 사항

1. **.xcworkspace 파일 사용 필수**: `.xcodeproj`가 아닌 `.xcworkspace`를 열어야 CocoaPods 의존성이 작동합니다.

2. **Pod 재설치가 필요한 경우**:
   ```bash
   cd /Users/mind/mindGarden/mobile/ios
   pod deintegrate
   pod install
   ```

3. **빌드 오류 시**:
   - Xcode에서 Clean Build Folder (⌘ + Shift + K)
   - Derived Data 삭제 후 재빌드

4. **실제 기기 테스트 시**:
   - USB로 iPhone/iPad 연결
   - 기기에서 "신뢰" 선택
   - Xcode에서 Team 선택하면 자동으로 프로비저닝 프로파일 생성

## ✅ 현재 상태 요약

- **기본 설정**: 완료
- **의존성 설치**: 완료
- **프로젝트 구조**: 정상
- **Bundle Identifier**: 수정 필요
- **Signing 설정**: Xcode에서 설정 필요
- **권한 설명**: 추가 권장

**결론**: 프로젝트는 기본적으로 잘 설정되어 있습니다. Bundle Identifier만 변경하고 Signing 설정을 완료하면 바로 실행 가능합니다.

