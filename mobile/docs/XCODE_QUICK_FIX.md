# Xcode 빌드 실패 빠른 해결 가이드

## ⚠️ 중요: 파일 선택
**CocoaPods를 사용하는 프로젝트에서는 두 개의 파일이 보입니다:**
- `MindGardenMobile.xcodeproj` ❌ **열지 마세요!**
- `MindGardenMobile.xcworkspace` ✅ **이 파일만 열어야 합니다!**

**`.xcodeproj`를 열면 Pods 라이브러리가 링크되지 않아 빌드 오류가 발생합니다.**

## 현재 상태
- ✅ 터미널 빌드: 성공
- ✅ CocoaPods 설치: 완료
- ❌ Xcode GUI 빌드: 실패

## 해결 방법

### 1. Xcode에서 Clean Build Folder
1. Xcode 열기
2. `Product` → `Clean Build Folder` (⌘⇧K)
3. 또는 `Shift` + `Command` + `K`

### 2. Xcode 재시작
1. Xcode 완전 종료
2. Xcode 재시작
3. `MindGardenMobile.xcworkspace` 파일 열기 (`.xcodeproj` 아님!)

### 3. Derived Data 수동 삭제 (이미 완료)
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/MindGardenMobile-*
```

### 4. 서명 설정 확인
1. Xcode에서 프로젝트 선택
2. `MindGardenMobile` 타겟 선택
3. `Signing & Capabilities` 탭
4. `Automatically manage signing` 체크
5. 팀 선택 (개인 팀 또는 개발자 계정)

### 5. 시뮬레이터 선택
1. 상단 툴바에서 시뮬레이터 선택
2. `iPhone 17 Pro` 또는 다른 시뮬레이터 선택
3. `Any iOS Device`는 선택하지 않기

### 6. 빌드 재시도
1. `Product` → `Build` (⌘B)
2. 에러 메시지 확인

## 일반적인 에러와 해결

### "Signing for 'MindGardenMobile' requires a development team"
→ `Signing & Capabilities`에서 팀 선택

### "Module map file not found"
→ Derived Data 삭제 후 재빌드 (이미 완료)

### "No such module"
→ `pod install` 실행 (이미 완료)

## 확인 사항
- ✅ `.xcworkspace` 파일을 열었는지 확인 (`.xcodeproj` 아님)
- ✅ 올바른 Scheme 선택 (`MindGardenMobile`)
- ✅ 올바른 시뮬레이터 선택

