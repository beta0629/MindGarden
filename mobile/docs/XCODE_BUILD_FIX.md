# Xcode 빌드 오류 해결 가이드

## 문제: Module map file not found

KakaoSDK 관련 module map 파일을 찾을 수 없다는 오류가 발생했습니다.

## 해결 방법

### 1. Xcode에서 Clean Build Folder
1. Xcode 메뉴: **Product → Clean Build Folder** (⌘ + Shift + K)
2. 완료될 때까지 대기

### 2. Derived Data 삭제
터미널에서:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/MindGardenMobile-*
```

### 3. Pod 재설치
```bash
cd mobile  # 프로젝트 루트에서 실행/ios

# UTF-8 인코딩 설정
export LANG=en_US.UTF-8

# Pod 재설치
pod deintegrate
pod install
```

### 4. Xcode에서 다시 빌드
1. Xcode에서 프로젝트 닫기
2. `.xcworkspace` 파일 다시 열기
3. **Product → Clean Build Folder** (⌘ + Shift + K)
4. **Product → Build** (⌘ + B)

## UTF-8 인코딩 문제 해결 (영구적)

터미널 설정 파일에 추가:
```bash
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
source ~/.zshrc
```

## 추가 확인 사항

### Pods 폴더 확인
```bash
cd mobile  # 프로젝트 루트에서 실행/ios
ls -la Pods/ | grep -i kakao
```

예상 결과:
- KakaoSDKAuth
- KakaoSDKCommon
- KakaoSDKUser

### Workspace 파일 확인
`.xcworkspace` 파일을 열어야 합니다 (`.xcodeproj`가 아님):
```bash
open mobile/ios  # 프로젝트 루트에서 실행/MindGardenMobile.xcworkspace
```

## 단계별 체크리스트

- [ ] Xcode에서 Clean Build Folder (⌘ + Shift + K)
- [ ] Derived Data 삭제
- [ ] UTF-8 인코딩 설정
- [ ] Pod 재설치 (pod deintegrate → pod install)
- [ ] Xcode에서 프로젝트 닫고 다시 열기
- [ ] 다시 빌드 (⌘ + B)

## 여전히 오류가 발생하는 경우

1. **node_modules 재설치**:
   ```bash
   cd mobile  # 프로젝트 루트에서 실행
   rm -rf node_modules
   npm install
   cd ios
   pod install
   ```

2. **전체 클린 빌드**:
   ```bash
   cd mobile  # 프로젝트 루트에서 실행/ios
   rm -rf build
   rm -rf Pods
   rm -rf ~/Library/Developer/Xcode/DerivedData/MindGardenMobile-*
   pod install
   ```

3. **Xcode 재시작**

