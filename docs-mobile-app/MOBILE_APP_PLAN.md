# MindGarden 네이티브 앱 개발 계획

**작성일**: 2025-01-XX  
**버전**: 1.0  
**상태**: 계획 단계

---

## 목표

- React Native를 사용한 iOS/Android 크로스 플랫폼 앱 개발
- 기존 Spring Boot REST API 그대로 활용
- 웹과 동일한 전체 기능 제공
- 모든 역할 지원 (Client, Consultant, Admin, HQ 등)
- 웹의 모든 알림 기능을 푸시 알림으로 대체
- 네이티브 카메라를 활용한 프로필 사진 촬영 기능

---

## Phase 1: 프로젝트 초기 설정 및 기반 구축 (1주)

### 1.1 React Native 프로젝트 초기화
- React Native CLI로 새 프로젝트 생성
- 프로젝트 구조: `mobile/` 디렉토리
- iOS/Android 빌드 환경 설정
- 필수 패키지 설치:
  - `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
  - `react-native-safe-area-context`
  - `react-native-screens`
  - `axios` (API 호출)
  - `@react-native-async-storage/async-storage` (로컬 저장소)
  - `react-native-gesture-handler`
  - `react-native-firebase` (푸시 알림)
  - `react-native-image-picker` (이미지 선택/촬영)
  - `react-native-image-crop-picker` (이미지 크롭)
  - 필요한 UI 라이브러리

### 1.2 프로젝트 구조 설정
```
mobile/
├── src/
│   ├── api/              # API 호출 레이어 (기존 ajax.js 기반)
│   ├── components/       # 공통 컴포넌트
│   ├── screens/          # 화면 컴포넌트
│   │   ├── auth/         # 인증 화면
│   │   ├── client/       # 내담자 화면
│   │   ├── consultant/   # 상담사 화면 conf
│   │   ├── admin/        # 관리자 화면
│   │   └── hq/          # 본사 화면
│   ├── navigation/       # 네비게이션 설정
│   ├── contexts/         # Context API (세션 관리 등)
│   ├── utils/            # 유틸리티 함수 (기존 utils 재사용)
│   ├── constants/        # 상수 정의 (기존 constants 재사용)
│   └── styles/           # 스타일 정의
├── ios/                  # iOS 네이티브 코드
├── android/              # Android 네이티브 코드
└── package.json
```

### 1.3 API 레이어 구축
- 기존 `frontend/src/utils/ajax.js`를 React Native에 맞게 포팅
- `mobile/src/api/client.js` 생성 (API 호출 함수)
- 세션 쿠키 대신 AsyncStorage에 토큰 저장
- API Base URL 설정 (`https://m-garden.co.kr`)
- 에러 핸들링 및 세션 만료 처리

### 1.4 인증 시스템 구현
- 로그인 화면 (기존 BranchLogin, HeadquartersLogin 로직 재사용)
- 세션 관리 Context (기존 SessionContext 기반)
- AsyncStorage에 토큰 저장
- 자동 로그인 기능
- OAuth2 지원 (카카오, 네이버) - React Native OAuth 라이브러리 사용

---

## Phase 2: 공통 컴포넌트 및 디자인 시스템 (1주)

### 2.1 디자인 시스템 포팅
- 기존 CSS를 React Native StyleSheet로 변환
- 주요 컴포넌트 포팅:
  - `MGButton` → `mobile/src/components/MGButton.js`
  - `StatCard` → `mobile/src/components/StatCard.js`
  - `DashboardSection` → `mobile/src/components/DashboardSection.js`
  - `UnifiedNotification` → `mobile/src/components/Notification.js`
  - `ConfirmModal` → `mobile/src/components/ConfirmModal.js`
- 색상 상수 정의 (CSS Variables를 JavaScript 상수로)
- 타이포그래피 설정

### 2.2 네비게이션 설정
- 스택 네비게이션 (인증, 메인 앱)
- 탭 네비게이션 (역할별 메인 탭)
- 딥링크 처리
- 뒤로가기 버튼 처리

### 2.3 레이아웃 컴포넌트
- `SimpleLayout` 포팅
- SafeArea 처리
- 키보드 처리 (react-native-keyboard-aware-scroll-view)

---

## Phase 3: 내담자(Client) 기능 구현 (2주)

### 3.1 내담자 대시보드
- `ClientDashboard.js` 포팅
- 통계 카드 표시
- 최근 상담 내역
- 웰니스 알림 (푸시 알림으로 처리)

### 3.2 상담 관리
- `ClientSessionManagement.js` 포팅
- 스케줄 조회 및 예약
- 회기 관리

### 3.3 메시지 기능
- `ClientMessageScreen.js` 포팅
- 실시간 메시지 (WebSocket 또는 Polling)
- 메시지 알림 (푸시 알림으로 처리)

### 3.4 결제 내역
- `ClientPaymentHistory.js` 포팅

### 3.5 설정
- `ClientSettings.js` 포팅
- 프로필 관리 (프로필 사진 촬영 포함)

---

## Phase 4: 상담사(Consultant) 기능 구현 (2주)

### 4.1 상담사 대시보드
- `ConsultantDashboard.js` 포팅
- 내담자 목록
- 오늘의 스케줄

### 4.2 스케줄 관리
- `UnifiedScheduleComponent.js` 포팅
- 캘린더 뷰 (react-native-calendars)
- 스케줄 등록/수정/삭제
- 스케줄 알림 (푸시 알림으로 처리)

### 4.3 상담 일지
- `ConsultationRecordScreen.js` 포팅
- 상담 일지 작성
- 파일 첨부
- 상담 일지 미작성 알림 (푸시 알림으로 처리)

### 4.4 메시지 기능
- 상담사 메시지 화면
- 메시지 알림 (푸시 알림으로 처리)

### 4.5 통계
- 상담 통계 조회

---

## Phase 5: 관리자(Admin) 기능 구현 (3주)

### 5.1 관리자 대시보드
- `AdminDashboard.js` 포팅
- 통계 대시보드
- 지점 관리

### 5.2 사용자 관리
- `UserManagement.js` 포팅
- `ConsultantManagement.js` 포팅
- `ClientComprehensiveManagement.js` 포팅

### 5.3 매칭 관리
- `MappingManagement.js` 포팅
- 매칭 생성/수정/삭제
- 매칭 관련 알림 (푸시 알림으로 처리)

### 5.4 세션 관리
- `SessionManagement.js` 포팅

### 5.5 통계 분석
- `StatisticsDashboard.js` 포팅
- 차트 표시 (react-native-chart-kit)

### 5.6 ERP 관리 (Branch Super Admin)
- `ErpDashboard.js` 포팅
- `FinancialManagement.js` 포팅
- `SalaryManagement.js` 포팅
- 결제 알림 (푸시 알림으로 처리)

---

## Phase 6: 본사(HQ) 기능 구현 (1주)

### 6.1 본사 대시보드
- `HQDashboard.js` 포팅
- 지점 현황
- 전사 통계

### 6.2 지점 관리
- 지점 CRUD
- 사용자 이동

---

## Phase 7: 네이티브 기능 구현 (2주)

### 7.1 푸시 알림 시스템 (웹의 모든 알림 기능 대체)
**목표**: 웹의 모든 알림 기능을 푸시 알림으로 대체

#### 7.1.1 Firebase Cloud Messaging (FCM) 설정
- Firebase 프로젝트 생성 및 설정
- iOS: APNs 인증 키 설정 및 연동
- Android: FCM SDK 설정
- `react-native-firebase` 라이브러리 설정

#### 7.1.2 푸시 알림 권한 관리
- iOS/Android 권한 요청 화면 구현
- 권한 거부 시 안내 메시지
- 권한 상태 확인 및 재요청

#### 7.1.3 푸시 알림 토큰 관리
- 앱 설치/업데이트 시 토큰 등록
- 백엔드 API 연동: `/api/mobile/push-token/register`
- 토큰 갱신 처리 (앱 재시작 시)
- 로그아웃 시 토큰 삭제
- 다중 디바이스 토큰 관리

#### 7.1.4 푸시 알림 수신 처리
- 백그라운드 알림 수신 및 처리
- 포그라운드 알림 수신 및 처리 (로컬 알림 표시)
- 알림 클릭 시 해당 화면으로 딥링크 이동
- 알림 데이터 파싱 및 분기 처리

#### 7.1.5 알림 타입별 핸들러 구현
- **웰니스 알림**: 웰니스 알림 목록 화면으로 이동
- **메시지 알림**: 해당 대화방으로 이동
- **스케줄 알림**: 스케줄 상세 화면으로 이동
- **상담 일지 미작성 알림**: 상담 일지 작성 화면으로 이동
- **매칭 관련 알림**: 매칭 관리 화면으로 이동
- **결제 알림**: 결제 내역 화면으로 이동
- **시스템 알림**: 시스템 알림 목록 화면으로 이동

#### 7.1.6 알림 설정 화면 구현
- 알림 타입별 on/off 설정
- 알림 소리/진동 설정
- 알림 수신 시간대 설정 (업무 시간 외 알림 차단)
- 백엔드 API 연동: `/api/mobile/push-settings`
- 설정 동기화

#### -index.1.7 알림 히스토리 관리
- 수신한 알림 목록 표시 (알림 센터)
- 알림 읽음 처리
- 알림 삭제 기능
- 알림 검색 기능

### 7.2 프로필 사진 촬영 기능
**목표**: 네이티브 카메라/갤러리를 활용한 프로필 사진 촬영 및 업로드

#### 7.2.1 필수 라이브러리 설치 및 설정
- `react-native-image-picker` 설치 (이미지 선택/촬영)
- `react-native-image-crop-picker` 설치 (이미지 크롭)
- `react-native-image-resizer` 설치 (이미지 리사이즈/압축)

#### 7.2.2 권한 설정
- iOS: Info.plist에 카메라/갤러리 권한 추가
  - `NSCameraUsageDescription`
  - `NSPhotoLibraryUsageDescription`
- Android: AndroidManifest.xml에 권한 추가
  - `android.permission.CAMERA`
  - `android.permission.READ_EXTERNAL_STORAGE`
  - `android.permission.WRITE_EXTERNAL_STORAGE` (API 28 이하)
- 런타임 권한 요청 (Android 6.0+)

#### 7.2.3 프로필 사진 관리 화면 구현
- 현재 프로필 사진 표시 (원형)
- 프로필 사진 변경 버튼
- 액션 시트 (카메라/갤러리 선택)
- 프로필 사진 삭제 버튼

#### 7.2.4 카메라 촬영 기능
- 카메라 앱 실행
- 사진 촬영 후 미리보기
- 재촬영 옵션
- 촬영 취소 처리

#### 7.2.5 갤러리 선택 기능
- 갤러리 앱 실행
- 이미지 선택 (단일 선택)
- 선택 취소 처리

#### 7.2.6 이미지 편집 기능
- 이미지 크롭 (원형/사각형 선택 가능)
- 이미지 회전
- 이미지 리사이즈 (최대 800x800 해상도 제한)
- 이미지 압축 (용량 최적화, 최대 500KB)
- 편집 취소 및 재편집

#### 7.2.7 프로필 사진 업로드
- Base64 또는 FormData로 변환
- 기존 `/api/user/profile/update` API 연동
- 업로드 진행률 표시 (Progress Bar)
- 업로드 실패 시 에러 처리 및 재시도
- 업로드 성공 시 즉시 UI 업데이트

#### 7.2.8 프로필 사진 미리보기
- 업로드 전 미리보기 (편집된 이미지)
- 업로드 후 즉시 반영
- 로딩 상태 표시

#### 7.2.9 프로필 사진 삭제
- 기본 프로필 이미지로 복원
- 삭제 확인 모달
- 삭제 API 호출

#### 7.2.10 기본 프로필 이미지 처리
- 사용자 이니셜 아바타 생성 (react-native-avatar)
- 기본 아이콘 표시
- 색상 테마 적용 (이름 기반 색상 할당)

### 7.3 오프라인 지원
- 데이터 캐싱 (AsyncStorage)
- 오프라인 모드 감지
- 동기화 메커니즘
- 오프라인 큐 (네트워크 복구 시 자동 전송)

---

## Phase 8: 테스트 및 최적화 (1주)

### 8.1 테스트
- 단위 테스트 작성
- 통합 테스트 작성
- E2E 테스트 (Detox)
- 푸시 알림 테스트 (iOS/Android)
- 프로필 사진 촬영 테스트

### 8.2 성능 최적화
- 이미지 최적화
- 리스트 최적화 (FlatList)
- 메모리 관리
- 네트워크 요청 최적화

---

## Phase 9: 배포 준비 (1주)

### 9.1 빌드 설정
- iOS App Store 배포 설정
- Android Play Store 배포 설정
- 앱 아이콘 및 스플래시 스크린
- 버전 관리

### 9.2 보안 강화
- 키체인/키스토어 설정
- 코드 난독화
- SSL Pinning 검토

### 9.3 문서화
- 사용자 가이드
- 개발자 가이드
- API 통합 문서

---

## 주요 파일 및 경로

### API 레이어
- `mobile/src/api/client.js` - API 호출 클라이언트
- `mobile/src/api/endpoints.js` - API 엔드포인트 상수 (기존 `frontend/src/constants/api.js` 기반)

### 컨텍스트
- `mobile/src/contexts/SessionContext.js` - 세션 관리 (기존 `frontend/src/contexts/SessionContext.js` 기반)

### 네비게이션
- `mobile/src/navigation/AppNavigator.js` - 메인 네비게이션
- `mobile/src/navigation/AuthNavigator.js` - 인증 네비게이션

### 주요 화면
- `mobile/src/screens/auth/LoginScreen.js`
- `mobile/src/screens/client/ClientDashboard.js`
- `mobile/src/screens/consultant/ConsultantDashboard.js`
- `mobile/src/screens/admin/AdminDashboard.js`
- `mobile/src/screens/hq/HQDashboard.js`

### 푸시 알림
- `mobile/src/services/PushNotificationService.js` - 푸시 알림 서비스
- `mobile/src/components/PushNotificationHandler.js` - 알림 핸들러
- `mobile/src/screens/settings/NotificationSettings.js` - 알림 설정 화면

### 프로필 사진
- `mobile/src/components/ProfileImagePicker.js` - 프로필 사진 선택기
- `mobile/src/components/ImageCropper.js` - 이미지 크롭 컴포넌트
- `mobile/src/utils/imageUtils.js` - 이미지 유틸리티 함수

---

## 기술 스택

- **프레임워크**: React Native 0.73+
- **네비게이션**: React Navigation 6+
- **상태 관리**: Context API + Hooks (기존 웹과 동일)
- **스타일링**: StyleSheet (CSS 변수 → JavaScript 상수)
- **API**: Axios (기존 API 그대로 사용)
- **저장소**: AsyncStorage
- **푸시 알림**: React Native Firebase
- **이미지 처리**: react-native-image-picker, react-native-image-crop-picker, react-native-image-resizer

---

## 주의사항

1. **세션 관리**: 웹은 쿠키 기반, 모바일은 토큰 기반으로 전환 필요
2. **OAuth2**: 모바일 앱 내 브라우저 (WebView 또는 외부 브라우저) 사용
3. **파일 업로드**: React Native의 파일 선택기 사용
4. **캘린더**: 웹 FullCalendar 대신 react-native-calendars 사용
5. **차트**: 웹 Chart.js 대신 react-native-chart-kit 사용
6. **CSS 변환**: 모든 CSS를 React Native StyleSheet로 수동 변환 필요
7. **하이브리드 컴포넌트**: 웹 전용 컴포넌트(@radix-ui 등)는 네이티브 대안 필요
8. **푸시 알림**: 백엔드에 푸시 알림 토큰 등록/관리 API 필요
9. **프로필 사진**: Base64 인코딩 또는 멀티파트 업로드 지원 필요

---

## 예상 기간

총 **약 13주** (3개월 + 1주)
- Phase 1-2: 2주 (기반 구축)
- Phase 3-6: 7주 (주요 기능 구현)
- Phase 7: 2주 (네이티브 기능)
- Phase 8: 1주 (테스트 및 최적화)
- Phase 9: 1주 (배포 준비)

---

## 백엔드 API 추가 필요 사항

### 푸시 알림 관련 API
- `POST /api/mobile/push-token/register` - 푸시 토큰 등록
- `DELETE /api/mobile/push-token/unregister` - 푸시 토큰 삭제
- `GET /api/mobile/push-settings` - 푸시 알림 설정 조회
- `PUT /api/mobile/push-settings` - 푸시 알림 설정 업데이트

### 프로필 사진 관련 API
- 기존 `/api/user/profile/update` API 유지 (Base64 또는 FormData 지원)

---

## 다음 단계

1. **[상세 구현 가이드](./DETAILED_IMPLEMENTATION_GUIDE.md)** 참조 - Phase별 상세 작업 단계 및 코드 예시
2. Phase 1 시작: React Native 프로젝트 초기화
3. 진행 상황 추적: `PROGRESS_TRACKER.md` 문서 참조
4. 이슈 발생 시: GitHub Issues 또는 팀 커뮤니케이션 채널 활용

---

## 관련 문서

- **[상세 구현 가이드](./DETAILED_IMPLEMENTATION_GUIDE.md)** ⭐ - Phase별 구체적인 구현 방법 및 코드 예시
- **[진행 상황 추적](./PROGRESS_TRACKER.md)** - 실시간 진행 상태 확인

