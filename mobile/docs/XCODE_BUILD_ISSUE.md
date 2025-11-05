# Xcode 빌드 이슈 해결 가이드

## 현재 문제

### 1. 모듈 중복 정의 오류
```
error: Redefinition of module 'react_runtime'
- React-jsitooling.modulemap
- React-RuntimeCore.modulemap
```

두 파일이 같은 모듈 이름을 정의하고 있어 충돌 발생.

### 2. Xcode 26.0.1 호환성 문제
- React Native 0.82.1과 Xcode 26.0.1 (Clang 17) 간 호환성 이슈
- iOS SDK 26.0의 새로운 모듈 시스템이 더 엄격한 검사 수행

## 해결 방법

### 방법 1: Xcode에서 직접 빌드 (권장)
1. Xcode 열기: `open ios/MindGardenMobile.xcworkspace`
2. **Product → Clean Build Folder** (⇧⌘K)
3. **Product → Build** (⌘B)
4. 오류 메시지 확인

### 방법 2: React Native 업그레이드 (장기적 해결)
React Native 0.82.1은 비교적 최신이지만, Xcode 26.0.1과의 호환성 문제가 있을 수 있습니다.

```bash
cd mobile  # 프로젝트 루트에서 실행
npm install react-native@latest
cd ios && pod install
```

### 방법 3: 임시 해결책 (modulemap 수정)
⚠️ **주의**: 이 방법은 임시 해결책이며, React Native 업그레이드 시 덮어씌워질 수 있습니다.

1. `ios/Pods/Headers/Public/react_runtime/React-jsitooling.modulemap` 파일 수정
2. 모듈 이름을 다른 이름으로 변경 (예: `react_runtime_jsitooling`)

## 현재 상태
- ✅ DerivedData 정리 완료
- ✅ Pod 재설치 완료
- ✅ Deployment Target 통일 완료
- ❌ 모듈 중복 정의 오류 (Xcode 26.0.1 호환성 문제)

## 다음 단계
1. Xcode에서 직접 빌드 시도
2. 실패 시 React Native 업그레이드 고려
3. 또는 Xcode 버전 다운그레이드 (Xcode 15.x 또는 16.x)

