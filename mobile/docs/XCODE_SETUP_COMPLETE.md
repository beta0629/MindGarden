# Xcode 설정 완료 보고서

## ✅ 완료된 설정

### 1. Bundle Identifier 변경
- **변경 전**: `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)`
- **변경 후**: `com.mindgarden.MindGardenMobile`
- **위치**: Debug 및 Release 빌드 설정 모두 수정 완료

### 2. Info.plist 권한 설명 추가
- ✅ **NSCameraUsageDescription**: 프로필 사진 촬영용 카메라 권한
- ✅ **NSPhotoLibraryUsageDescription**: 사진 선택용 라이브러리 권한
- ✅ **NSPhotoLibraryAddUsageDescription**: 사진 저장용 라이브러리 권한
- ✅ **NSLocationWhenInUseUsageDescription**: 위치 정보 권한

### 3. 프로젝트 버전 정보
- **MARKETING_VERSION**: 1.0
- **CURRENT_PROJECT_VERSION**: 1
- **iOS Deployment Target**: 15.1
- **Swift Version**: 5.0

## 📋 다음 단계 (Xcode에서 수동 설정)

### 1. Xcode 열기
```bash
open mobile/ios  # 프로젝트 루트에서 실행/MindGardenMobile.xcworkspace
```

### 2. Signing & Capabilities 설정
1. Xcode에서 프로젝트 선택
2. **TARGETS** → **MindGardenMobile** 선택
3. **Signing & Capabilities** 탭 클릭
4. **Team** 드롭다운에서 Apple Developer 계정 선택
   - Apple ID로 로그인 필요
   - 무료 계정으로도 개발 테스트 가능
5. **Automatically manage signing** 체크박스 확인

### 3. Capabilities 추가 (필요한 경우)
- **Push Notifications** (Firebase FCM 사용 시)
- **Background Modes** → Remote notifications
- **Associated Domains** (Deep Link 사용 시)

## 🚀 실행 방법

### 1. Metro Bundler 실행
```bash
cd mobile  # 프로젝트 루트에서 실행
npm start
```

### 2. Xcode에서 빌드 및 실행
1. Xcode에서 **⌘ + B** (빌드)
2. 빌드 성공 확인
3. **⌘ + R** (실행) 또는 Run 버튼 클릭
4. 시뮬레이터 선택 또는 연결된 기기 선택

### 3. 터미널에서 실행 (선택사항)
```bash
cd mobile  # 프로젝트 루트에서 실행
npm run ios
```

## ✨ 설정 완료 확인

다음 명령으로 설정이 제대로 되었는지 확인할 수 있습니다:

```bash
# Bundle Identifier 확인
cd mobile  # 프로젝트 루트에서 실행/ios
grep "PRODUCT_BUNDLE_IDENTIFIER.*com.mindgarden" MindGardenMobile.xcodeproj/project.pbxproj
```

**예상 결과**: `com.mindgarden.MindGardenMobile`가 2번 나타나야 합니다 (Debug, Release)

## 📝 참고 사항

1. **첫 실행 시**: Xcode에서 Team을 선택해야 Signing이 완료됩니다.
2. **실제 기기 테스트**: USB로 iPhone/iPad 연결 후 기기에서 "신뢰" 선택 필요
3. **시뮬레이터**: Xcode 상단 툴바에서 원하는 시뮬레이터 선택 가능

## 🎯 완료 체크리스트

- [x] Bundle Identifier 변경 완료
- [x] Info.plist 권한 설명 추가 완료
- [ ] Xcode에서 Team 선택 (Signing 설정)
- [ ] Metro Bundler 실행
- [ ] Xcode에서 빌드 성공
- [ ] 시뮬레이터/실제 기기에서 앱 실행 성공

---

**설정 완료!** 이제 Xcode에서 Team만 선택하면 바로 실행할 수 있습니다. 🎉

