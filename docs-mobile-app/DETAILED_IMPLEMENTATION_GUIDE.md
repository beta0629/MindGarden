# MindGarden 네이티브 앱 상세 구현 가이드

**작성일**: 2025-01-XX  
**버전**: 1.0  
**상태**: 계획 단계

---

## 목차

1. [Phase 1 상세 작업 가이드](#phase-1-상세-작업-가이드)
2. [Phase 2 상세 작업 가이드](#phase-2-상세-작업-가이드)
3. [Phase 3 상세 작업 가이드 elle](#phase-3-상세-작업-가이드)
4. [Phase 4 상세 작업 가이드](#phase-4-상세-작업-가이드)
5. [Phase 5 상세 작업 가이드](#phase-5-상세-작업-가이드)
6. [Phase 6 상세 작업 가이드](#phase-6-상세-작업-가이드)
7. [Phase 7 상세 작업 가이드](#phase-7-상세-작업-가이드)
8. [Phase 8 상세 작업 가이드](#phase-8-상세-작업-가이드)
9. [Phase 9 상세 작업 가이드](#phase-9-상세-작업-가이드)
10. [공통화 및 재사용 전략](#공통화-및-재사용-전략)
11. [효율적인 리소스 관리](#효율적인-리소스-관리)
12. [통합 에러 처리 시스템](#통합-에러-처리-시스템)
13. [추가 네이티브 기능 적용](#추가-네이티브-기능-적용)
14. [웹-모바일 컴포넌트 매핑표](#웹-모바일-컴포넌트-매핑표)
15. [API 엔드포인트 목록](#api-엔드포인트-목록)

---

## Phase 1: 프로젝트 초기 설정 및 기반 구축

### 1.1 React Native 프로젝트 초기화

#### Step 1.1.1: React Native CLI 설치
```bash
cd /Users/mind/mindGarden
npm install -g @react-native-community/cli
# 또는 npx 사용: npx @react-native-community/cli init
```

#### Step 1.1.2: 프로젝트 생성
```bash
npx @react-native-community/cli@latest init MindGardenMobile --directory mobile --skip-install
cd mobile
```

#### Step 1.1.3: 필수 패키지 설치
```bash
# 네비게이션
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-safe-area-context react-native-screens react-native-gesture-handler

# API 및 저장소
npm install axios
npm install @react-native-async-storage/async-storage

# 네이티브 기능
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-image-picker
npm install react-native-image-crop-picker
npm install react-native-image-resizer

# UI 컴포넌트
npm install react-native-keyboard-aware-scroll-view
npm install react-native-calendars
npm install react-native-chart-kit react-native-svg

# 유틸리티
npm install react-native-permissions
npm install react-native-avatar

# iOS 설정 (iOS 개발 환경에서만)
cd ios && pod install && cd ..
```

#### Step 1.1.4: 프로젝트 구조 생성
```bash
mkdir -p src/{api,components,screens/{auth,client,consultant,admin,hq},navigation,contexts,utils,constants,styles,services}
```

#### Step 1.1.5: 기본 설정 파일 생성
- `src/config/api.js` - API Base URL 설정
- `src/config/constants.js` - 앱 상수 정의
- `.env` - 환경 변수 (선택사항)

### 1.2 API 레이어 구축

#### Step 1.2.1: API 클라이언트 생성

**파일**: `mobile/src/api/client.js`

**참조 웹 파일**: `frontend/src/utils/ajax.js`

**주요 변경사항**:
- `localStorage` → `AsyncStorage`
- `window.location.href` → React Navigation
- 쿠키 기반 세션 → 토큰 기반 인증

**구현 내용**:
```javascript
// 1. AsyncStorage에서 토큰 가져오기
import AsyncStorage from '@react-native-async-storage/async-storage';

// 2. Axios 인스턴스 생성
import axios from 'axios';
const apiClient = axios.create({
  baseURL: 'https://m-garden.co.kr',
  timeout: 10000,
});

// 3. 요청 인터셉터 (토큰 추가)
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. 응답 인터셉터 (에러 처리, 토큰 갱신)
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // 로그아웃 처리 및 로그인 화면으로 이동
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      // NavigationService.navigate('Login');
    }
    return Promise.reject(error);
  }
);

// 5. API 메서드 export
export const apiGet = (endpoint, params = {}) => apiClient.get(endpoint, { params });
export const apiPost = (endpoint, data = {}) => apiClient.post(endpoint, data);
export const apiPut = (endpoint, data = {}) => apiClient.put(endpoint, data);
export const apiDelete = (endpoint) => apiClient.delete(endpoint);
```

#### Step 1.2.2: API 엔드포인트 상수 정의

**파일**: `mobile/src/api/endpoints.js`

**참조 웹 파일**: `frontend/src/constants/api.js`

**구현 내용**:
- 모든 API 엔드포인트를 상수로 정의
- 역할별 API 그룹화
- 웹과 동일한 엔드포인트 사용

#### Step 1.2.3: 에러 처리 유틸리티

**파일**: `mobile/src/utils/errorHandler.js`

**구현 내용**:
- 네트워크 에러 처리
- API 에러 메시지 변환
- 토스트 알림 표시

### 1.3 세션 관리 Context

#### Step 1.3.1: SessionContext 생성

**파일**: `mobile/src/contexts/SessionContext.js`

**참조 웹 파일**: `frontend/src/contexts/SessionContext.js`

**주요 변경사항**:
- `localStorage` → `AsyncStorage`
- `window.location` → React Navigation
- 쿠키 세션 체크 → 토큰 기반 세션 체크

**구현 내용**:
```javascript
// 1. AsyncStorage에서 세션 정보 불러오기
const loadSession = async () => {
  const [user, token, refreshToken] = await AsyncStorage.multiGet([
    'user',
    'accessToken',
    'refreshToken',
  ]);
  // ...
};

// 2. 로그인 처리
const login = async (loginData) => {
  // API 호출
  const response = await authAPI.login(loginData);
  // 토큰 저장
  await AsyncStorage.multiSet([
    ['accessToken', response.accessToken],
    ['refreshToken', response.refreshToken],
    ['user', JSON.stringify(response.user)],
  ]);
  // Context 업데이트
  dispatch({ type: 'SET_USER', payload: response.user });
};

// 3. 로그아웃 처리
const logout = async () => {
  await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
  dispatch({ type: 'CLEAR_SESSION' });
  // 로그인 화면으로 이동
};
```

### 1.4 인증 화면 구현

#### Step 1.4.1: 로그인 화면

**파일**: `mobile/src/screens/auth/LoginScreen.js`

**참조 웹 파일**: 
- `frontend/src/components/auth/BranchLogin.js`
- `frontend/src/components/auth/HeadquartersLogin.js`
- `frontend/src/components/auth/TabletLogin.js`

**구현 내용**:
1. 이메일/비밀번호 입력 폼
2. 지점 선택 (Branch 로그인인 경우)
3. 로그인 타입 선택 (Branch/Headquarters)
4. 로그인 버튼
5. OAuth2 버튼 (카카오, 네이버)
6. 에러 메시지 표시
7. 로딩 상태 표시

**주요 기능**:
- 폼 검증
- 지점 목록 API 호출 (`/api/branches`)
- 로그인 API 호출 (`/api/auth/login`)
- 세션 Context 업데이트
- 역할별 대시보드로 네비게이션

### 1.5 네비게이션 기본 구조

#### Step 1.5.1: NavigationService 설정

**파일**: `mobile/src/navigation/NavigationService.js`

**구현 내용**:
```javascript
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const NavigationService = {
  navigate: (name, params) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    }
  },
  // ...
};
```

#### Step 1.5.2: 메인 네비게이션 구조

**파일**: `mobile/src/navigation/AppNavigator.js`

**구조**:
```
- AuthStack (로그인 전)
  - LoginScreen
  - RegisterScreen (선택사항)
  
- MainStack (로그인 후)
  - RoleTabNavigator (역할별 탭 네비게이터)
    - ClientTabNavigator
    - ConsultantTabNavigator
    - AdminTabNavigator
    - HQTabNavigator
```

---

## Phase 2: 공통 컴포넌트 및 디자인 시스템

### 2.1 디자인 시스템 포팅

#### Step 2.1.1: 색상 상수 정의

**파일**: `mobile/src/constants/colors.js`

**참조 웹 파일**: `frontend/src/styles/mindgarden-design-system.css`

**구현 내용**:
```javascript
// CSS Variables를 JavaScript 상수로 변환
export const COLORS = {
  // Primary
  primary: '#4A90E2',
  primaryLight: '#6BA3E8',
  primaryDark: '#357ABD',
  
  // Status
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#F5222D',
  info: '#1890FF',
  
  // Grays
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  // ... 기존 CSS 변수 전체 변환
};
```

#### Step 2.1.2: 타이포그래피 설정

**파일**: `mobile/src/constants/typography.js`

**구현 내용**:
```javascript
export const TYPOGRAPHY = {
  // Font Family
  fontFamily: {
    regular: 'System', // iOS: San Francisco, Android: Roboto
    medium: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  
  // Line Heights
  lineHeight: {
    // ...
  },
};
```

#### Step 2.1.3: 스페이싱 상수

**파일**: `mobile/src/constants/spacing.js`

**구현 내용**:
```javascript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};
```

### 2.2 공통 컴포넌트 포팅

#### Step 2.2.1: MGButton 컴포넌트

**파일**: `mobile/src/components/MGButton.js`

**참조 웹 파일**: `frontend/src/components/common/MGButton.js`

**주요 변경사항**:
- `<button>` → `<TouchableOpacity>` 또는 `<Pressable>`
- `className` → `style`
- CSS 클래스 → StyleSheet 객체

**구현 내용**:
```javascript
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants';

const MGButton = ({ 
  variant = 'primary', 
  size = 'medium', 
  loading = false,
  disabled = false,
  onPress,
  children,
  ...props 
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
  ];
  
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={styles.text}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  // ... 기타 스타일
});

export default MGButton;
```

#### Step 2.2.2: StatCard 컴포넌트

**파일**: `mobile/src/components/StatCard.js`

**참조 웹 파일**: `frontend/src/components/ui/Card/StatCard.js`

**구현 내용**:
- 아이콘 표시
- 값 표시
- 레이블 표시
- 변경사항 표시 (선택사항)

#### Step 2.2.3: DashboardSection 컴포넌트

**파일**: `mobile/src/components/DashboardSection.js`

**참조 웹 파일**: `frontend/src/components/layout/DashboardSection.js`

**구현 내용**:
- 섹션 헤더 (제목, 아이콘, 액션 버튼)
- 섹션 컨텐츠
- 빈 상태 표시

#### Step 2.2.4: ConfirmModal 컴포넌트

**파일**: `mobile/src/components/ConfirmModal.js`

**참조 웹 파일**: `frontend/src/components/common/ConfirmModal.js`

**구현 내용**:
- React Native의 `Modal` 컴포넌트 사용
- 확인/취소 버튼
- 타입별 스타일 (danger, warning 등)

#### Step 2.2.5: Notification 컴포넌트 (Toast)

**파일**: `mobile/src/components/Notification.js`

**참조 웹 파일**: `frontend/src/components/common/UnifiedNotification.js`

**구현 내용**:
- Toast 라이브러리 사용 (react-native-toast-message 또는 자체 구현)
- 성공/에러/경고/정보 타입별 표시
- 자동 사라짐

### 2.3 레이아웃 컴포넌트

#### Step 2.3.1: SimpleLayout 컴포넌트

**파일**: `mobile/src/components/layout/SimpleLayout.js`

**참조 웹 파일**: `frontend/src/components/layout/SimpleLayout.js`

**구현 내용**:
- SafeAreaView 적용
- 헤더 (제목, 뒤로가기 버튼)
- 컨텐츠 영역
- 하단 네비게이션 바 (선택사항)

---

## Phase 3: 내담자(Client) 기능 구현

### 3.1 내담자 대시보드

**파일**: `mobile/src/screens/client/ClientDashboard.js`

**참조 웹 파일**: `frontend/src/components/client/ClientDashboard.js`

**주요 화면 구성**:
1. 환영 메시지
2. 통계 카드 (StatCard 사용)
   - 전체 상담 수
   - 진행 중 상담 수
   - 완료된 상담 수
   - 예약된 상담 수
3. 최근 상담 내역 (FlatList)
4. 빠른 액션 버튼
5. 웰니스 알림 섹션

**API 호출**:
- `GET /api/dashboard/client` - 대시보드 데이터
- `GET /api/consultations/client/{userId}` - 상담 내역

### 3.2 상담 관리

**파일**: `mobile/src/screens/client/ClientSessionManagement.js`

**참조 웹 파일**: `frontend/src/components/client/ClientSessionManagement.js`

**주요 기능**:
1. 스케줄 조회 (캘린더 뷰)
2. 예약하기
3. 회기 관리
4. 상담 상태별 필터링

**API 호출**:
- `GET /api/schedules/client/{userId}` - 스케줄 조회
- `POST /api/schedules` - 예약 생성
- `GET /api/consultations/client/{userId}` - 상담 내역

### 3.3 메시지 기능

**파일**: `mobile/src/screens/client/ClientMessageScreen.js`

**참조 웹 파일**: `frontend/src/components/client/ClientMessageScreen.js`

**주요 기능**:
1. 대화방 목록
2. 메시지 목록 (FlatList, 역순 스크롤)
3. 메시지 입력 (KeyboardAvoidingView 사용)
4. 이미지 첨부
5. 실시간 메시지 (Polling 또는 WebSocket)

**API 호출**:
- `GET /api/consultation-messages/conversations/{userId}` - 대화방 목록
- `GET /api/consultation-messages/{conversationId}` - 메시지 목록
- `POST /api/consultation-messages` - 메시지 발송

### 3.4 결제 내역

**파일**: `mobile/src/screens/client/ClientPaymentHistory.js`

**참조 웹 파일**: `frontend/src/components/client/ClientPaymentHistory.js`

**주요 기능**:
1. 결제 내역 목록 (FlatList)
2. 필터링 (날짜, 상태)
3. 결제 상세 내역

**API 호출**:
- `GET /api/payments/client/{userId}` - 결제 내역

### 3.5 설정

**파일**: `mobile/src/screens/client/ClientSettings.js`

**참조 웹 파일**: `frontend/src/components/client/ClientSettings.js`

**주요 기능**:
1. 프로필 정보 표시
2. 프로필 사진 변경 (프로필 사진 촬영 기능 포함)
3. 프로필 수정
4. 비밀번호 변경
5. 알림 설정
6. 로그아웃

---

## Phase 4: 상담사(Consultant) 기능 구현

### 4.1 상담사 대시보드

**파일**: `mobile/src/screens/consultant/ConsultantDashboard.js`

**참조 웹 파일**: `frontend/src/components/dashboard/CommonDashboard.js` (Consultant 부분)

**주요 화면 구성**:
1. 환영 메시지
2. 통계 카드
   - 오늘의 상담 수
   - 이번 주 상담 수
   - 내담자 수
   - 평균 평점
3. 내담자 목록
4. 오늘의 스케줄

**API 호출**:
- `GET /api/dashboard/consultant` - 대시보드 데이터

### 4.2 스케줄 관리

**파일**: `mobile/src/screens/consultant/ConsultantSchedule.js`

**참조 웹 파일**: `frontend/src/components/schedule/UnifiedScheduleComponent.js`

**주요 기능**:
1. 캘린더 뷰 (react-native-calendars)
2. 스케줄 등록 (모달)
3. 스케줄 수정
4. 스케줄 삭제
5. 날짜별 스케줄 조회

**API 호출**:
- `GET /api/schedules/consultant/{consultantId}` - 스케줄 조회
- `POST /api/schedules` - 스케줄 등록
- `PUT /api/schedules/{id}` - 스케줄 수정
- `DELETE /api/schedules/{id}` - 스케줄 삭제

### 4.3 상담 일지

**파일**: `mobile/src/screens/consultant/ConsultationRecordScreen.js`

**참조 웹 파일**: `frontend/src/components/consultant/ConsultationRecordScreen.js`

**주요 기능**:
1. 상담 일지 작성 폼
2. 파일 첨부 (이미지, 문서)
3. 템플릿 선택
4. 일지 저장
5. 일지 목록 조회

**API 호출**:
- `POST /api/consultation-records` - 일지 작성
- `GET /api/consultation-records/consultant/{consultantId}` - 일지 목록

### 4.4 메시지 기능

**파일**: `mobile/src/screens/consultant/ConsultantMessageScreen.js`

**구현 내용**: Client와 유사하지만 상담사 전용 UI

### 4.5 통계

**파일**: `mobile/src/screens/consultant/ConsultantStatistics.js`

**주요 기능**:
1. 상담 통계 (차트)
2. 월별/주별 통계
3. 평점 통계

**API 호출**:
- `GET /api/statistics/consultant/{consultantId}` - 통계 데이터

---

## Phase 5: 관리자(Admin) 기능 구현

### 5.1 관리자 대시보드

**파일**: `mobile/src/screens/admin/AdminDashboard.js`

**참조 웹 파일**: `frontend/src/components/admin/AdminDashboard.js`

**주요 화면 구성**:
1. 환영 메시지
2. 통계 카드 (여러 개)
   - 전체 사용자 수
   - 활성 상담사 수
   - 활성 내담자 수
   - 오늘의 예약 수
   - 이번 달 매출
3. 빠른 액션
4. 최근 활동

**API 호출**:
- `GET /api/admin/dashboard` - 대시보드 데이터

### 5.2 사용자 관리

#### 5.2.1 사용자 목록

**파일**: `mobile/src/screens/admin/UserManagement.js`

**참조 웹 파일**: `frontend/src/components/admin/UserManagement.js`

**주요 기능**:
1. 사용자 목록 (FlatList, 검색, 필터)
2. 사용자 상세 보기
3. 사용자 수정
4. 사용자 삭제

#### 5.2.2 상담사 관리

**파일**: `mobile/src/screens/admin/ConsultantManagement.js`

**참조 웹 파일**: `frontend/src/components/admin/ConsultantManagement.js`

#### 5.2.3 내담자 종합 관리

**파일**: `mobile/src/screens/admin/ClientComprehensiveManagement.js`

**참조 웹 파일**: `frontend/src/components/admin/ClientComprehensiveManagement.js`

**주요 기능**:
- 탭 네비게이션 (목록, 통계분석, 매칭관리 등)
- 각 탭별 상세 기능

### 5.3 매칭 관리

**파일**: `mobile/src/screens/admin/MappingManagement.js`

**참조 웹 파일**: `frontend/src/components/admin/MappingManagement.js`

**주요 기능**:
1. 매칭 목록 (필터, 검색)
2. 매칭 생성
3. 매칭 수정
4. 매칭 삭제
5. 매칭 상세 보기

**API 호출**:
- `GET /api/admin/mappings` - 매칭 목록
- `POST /api/admin/mappings` - 매칭 생성
- `PUT /api/admin/mappings/{id}` - 매칭 수정
- `DELETE /api/admin/mappings/{id}` - 매칭 삭제

### 5.4 세션 관리

**파일**: `mobile/src/screens/admin/SessionManagement.js`

**참조 웹 파일**: `frontend/src/components/admin/SessionManagement.js`

### 5.5 통계 분석

**파일**: `mobile/src/screens/admin/StatisticsDashboard.js`

**참조 웹 파일**: `frontend/src/components/admin/StatisticsDashboard.js`

**주요 기능**:
1. 다양한 차트 (react-native-chart-kit)
2. 날짜 범위 선택
3. 필터링

### 5.6 ERP 관리

#### 5.6.1 ERP 대시보드

**파일**: `mobile/src/screens/admin/erp/ErpDashboard.js`

**참조 웹 파일**: `frontend/src/components/erp/ErpDashboard.js`

#### 5.6.2 재무 관리

**파일**: `mobile/src/screens/admin/erp/FinancialManagement.js`

**참조 웹 파일**: `frontend/src/components/erp/FinancialManagement.js`

#### 5.6.3 급여 관리

**파일**: `mobile/src/screens/admin/erp/SalaryManagement.js`

**참조 웹 파일**: `frontend/src/components/erp/SalaryManagement.js`

---

## Phase 6: 본사(HQ) 기능 구현

### 6.1 본사 대시보드

**파일**: `mobile/src/screens/hq/HQDashboard.js`

**참조 웹 파일**: `frontend/src/components/hq/HQDashboard.js`

**주요 화면 구성**:
1. 전사 통계 카드
2. 지점 현황
3. 빠른 액션

### 6.2 지점 관리

**파일**: `mobile/src/screens/hq/BranchManagement.js`

**참조 웹 파일**: `frontend/src/components/admin/BranchManagement.js`

---

## Phase 7: 네이티브 기능 구현

### 7.1 푸시 알림 시스템

#### Step 7.1.1: Firebase 설정

**파일**: 
- `mobile/android/app/google-services.json` (Android)
- `mobile/ios/GoogleService-Info.plist` (iOS)

**작업 내용**:
1. Firebase 콘솔에서 프로젝트 생성
2. iOS/Android 앱 등록
3. 설정 파일 다운로드 및 추가

#### Step 7.1.2: 푸시 알림 서비스

**파일**: `mobile/src/services/PushNotificationService.js`

**구현 내용**:
```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '../api/client';

class PushNotificationService {
  // 토큰 요청 및 등록
  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    // ...
  }
  
  // 토큰 가져오기 및 서버에 등록
  async registerToken() {
    const token = await messaging().getToken();
 harvester
    await AsyncStorage.setItem('pushToken', token);
    await apiPost('/api/mobile/push-token/register', { token });
  }
  
  // 알림 핸들러 설정
  setupHandlers() {
    // 백그라운드 알림
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      // ...
    });
    
    // 포그라운드 알림
    messaging().onMessage(async (remoteMessage) => {
      // 로컬 알림 표시
    });
    
    // 알림 클릭
    messaging().onNotificationOpenedApp((remoteMessage) => {
      // 딥링크 처리
    });
  }
}

export default new PushNotificationService();
```

#### Step 7.1.3: 알림 설정 화면

**파일**: `mobile/src/screens/settings/NotificationSettings.js`

**주요 기능**:
1. 알림 타입별 on/off 토글
2. 알림 소리/진동 설정
3. 알림 수신 시간대 설정

### 7.2 프로필 사진 촬영 기능

#### Step 7.2.1: 프로필 사진 선택기 컴포넌트

**파일**: `mobile/src/components/ProfileImagePicker.js`

**구현 내용**:
```javascript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImagePicker from 'react-native-image-crop-picker';

const ProfileImagePicker = ({ onImageSelected }) => {
  const handleCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });
    
    if (result.assets?.[0]) {
      // 크롭 화면으로 이동
      const cropped = await ImagePicker.openCropper({
        path: result.assets[0].uri,
        width: 800,
        height: 800,
        cropping: true,
        cropperCircleOverlay: true,
      });
      
      onImageSelected(cropped.path);
    }
  };
  
  const handleGallery = async () => {
    // 갤러리에서 선택
  };
  
  // ...
};
```

#### Step 7.2.2: 이미지 업로드 유틸리티

**파일**: `mobile/src/utils/imageUtils.js`

**구현 내용**:
- Base64 변환
- 이미지 압축
- FormData 생성
- 업로드 진행률 추적

---

## Phase 8: 테스트 및 최적화

### 8.1 테스트 작성

#### 8.1.1: 단위 테스트

**프레임워크**: Jest + React Native Testing Library

**테스트 대상**:
- API 클라이언트
- 유틸리티 함수
- 컴포넌트 렌더링

#### 8.1.2: E2E 테스트

**프레임워크**: Detox

**테스트 시나리오**:
- 로그인 플로우
- 주요 기능 사용 플로우

### 8.2 성능 최적화

- 이미지 최적화 (리사이즈, 압축)
- FlatList 최적화 (getItemLayout, keyExtractor)
- 메모이제이션 (React.memo, useMemo, useCallback)
- 번들 크기 최적화

---

## Phase 9: 배포 준비

### 9.1 iOS 배포

1. Xcode 프로젝트 설정
2. App Store Connect 계정 설정
3. 인증서 및 프로비저닝 프로파일
4. 앱 아이콘 및 스플래시 스크린
5. 빌드 및 업로드

### 9.2 Android 배포

1. 키스토어 생성
2. Google Play Console 설정
3. 앱 서명 설정
4. 앱 아이콘 및 스플래시 스크린
5. 빌드 및 업로드

---

## 공통화 및 재사용 전략

### 공통 유틸리티 함수

#### Step: 공통 유틸리티 모듈 생성

**파일**: `mobile/src/utils/common.js`

**참조 웹 파일**: `frontend/src/utils/common.js`

**구현 내용**:
- 날짜 포맷팅 함수
- 문자열 유틸리티
- 숫자 포맷팅 함수
- 배열/객체 유틸리티

#### Step: 코드 헬퍼 유틸리티

**파일**: `mobile/src/utils/codeHelper.js`

**참조 웹 파일**: `frontend/src/utils/codeHelper.js`

**구현 내용**:
- 공통 코드 한글 변환
- 상태값 한글 변환
- 역할명 한글 변환
- 모든 코드 매핑 함수

#### Step: 세션 유틸리티

**파일**: `mobile/src/utils/sessionManager.js`

**참조 웹 파일**: `frontend/src/utils/sessionManager.js`

**구현 내용**:
- 세션 체크
- 토큰 갱신
- 자동 로그아웃 처리

### 공통 훅 (Custom Hooks)

#### useApi Hook

**파일**: `mobile/src/hooks/useApi.js`

**구현 내용**:
```javascript
const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, dependencies);
  
  return { data, loading, error, refetch: fetchData };
};
```

#### usePermissions Hook

**파일**: `mobile/src/hooks/usePermissions.js`

**구현 내용**:
- 권한 체크
- 권한 요청
- 권한 상태 관리

#### useDebounce Hook

**파일**: `mobile/src/hooks/useDebounce.js`

**구현 내용**:
- 검색 입력 디바운싱
- API 호출 최적화

### 공통 컴포넌트 패턴

#### 데이터 로딩 패턴

**공통 컴포넌트**: `LoadingWrapper.js`

**구현 내용**:
```javascript
const LoadingWrapper = ({ loading, error, children, onRetry }) => {
  if (loading) return <UnifiedLoading />;
  if配 error) return <ErrorView error={error} onRetry={onRetry} />;
  return children;
};
```

#### 빈 상태 패턴

**공통 컴포넌트**: `EmptyState.js`

**구현 내용**:
- 아이콘
- 메시지
- 액션 버튼 (선택사항)

---

## 효율적인 리소스 관리

### 이미지 리소스 관리

#### Step: 이미지 최적화 전략

**파일**: `mobile/src/utils/imageOptimization.js`

**구현 내용**:
1. **이미지 캐싱**
   - `react-native-fast-image` 라이브러리 사용
   - 자동 캐싱 및 디스크 저장
   
2. **이미지 리사이징**
   - 업로드 전 자동 리사이즈
   - 썸네일 생성
   - Progressive Loading

3. **이미지 로딩 최적화**
   - Lazy Loading
   - Placeholder 표시
   - 에러 이미지 처리

**구현 예시**:
```javascript
import FastImage from 'react-native-fast-image';

// 이미지 컴포넌트
<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  resizeMode={FastImage.resizeMode.cover}
  onLoadStart={() => setLoading(true)}
  onLoadEnd={() => setLoading(false)}
  onError={() => setError(true)}
/>
```

### API 호출 최적화

#### Step: API 캐싱 전략

**파일**: `mobile/src/utils/apiCache.js`

**참조 웹 파일**: `frontend/src/utils/apiCache.js`

**구현 내용**:
1. **메모리 캐시**
   - 자주 사용되는 데이터 메모리에 저장
   - TTL(Time To Live) 설정
   
2. **디스크 캐시**
   - AsyncStorage에 캐싱
   - 오프라인 모드 지원
   
3. **캐시 무효화**
   - 데이터 변경 시 캐시 삭제
   - 타임스탬프 기반 유효성 검사

#### Step: API 호출 최적화

**구현 전략**:
1. **Request Deduplication**
   - 동일한 요청 중복 호출 방지
   
2. **Batch Request**
   - 여러 요청을 하나로 묶기 (가능한 경우)
   
3. **Pagination**
   - FlatList의 `onEndReached` 활용
   - Infinite Scroll 구현

### 메모리 관리

#### Step: 메모리 최적화 전략

**구현 내용**:
1. **이미지 메모리 관리**
   - 사용하지 않는 이미지 언마운트
   - 메모리 경고 모니터링
   
2. **리스트 최적화**
   - FlatList의 `removeClippedSubviews` 사용
   - `getItemLayout` 제공 (고정 높이인 경우)
   - `initialNumToRender` 조정
   
3. **컴포넌트 최적화**
   - React.memo 활용
   - useMemo, useCallback 적절히 사용
   - 불필요한 리렌더링 방지

**FlatList 최적화 예시**:
```javascript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 네트워크 최적화

#### Step: 네트워크 상태 모니터링

**파일**: `mobile/src/utils/networkMonitor.js`

**구현 내용**:
```javascript
import NetInfo from '@react-native-community/netinfo';

class NetworkMonitor {
  static async isConnected() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }
  
  static onNetworkChange(callback) {
    return NetInfo.addEventListener(callback);
  }
}
```

**활용**:
- 오프라인 모드 감지
- 네트워크 상태에 따른 UI 변경
- 오프라인 큐 관리

---

## 통합 에러 처리 시스템

### 에러 처리 아키텍처

#### Step: 전역 에러 핸들러

**파일**: `mobile/src/utils/errorHandler.js`

**구현 내용**:
```javascript
class ErrorHandler {
  // 에러 타입 분류
  static classifyError(error) {
    if (error.response) {
      // API 에러
      switch (error.response.status) {
        case 401:
          return { type: 'UNAUTHORIZED', message: '로그인이 필요합니다.' };
        case 403:
          return { type: 'FORBIDDEN', message: '권한이 없습니다.' };
        case 404:
          return { type: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다.' };
        case 500:
          return { type: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' };
        default:
          return { type: 'API_ERROR', message: error.response.data?.message || '오류가 발생했습니다.' };
      }
    } else if (error.request) {
      // 네트워크 에러
      return { type: 'NETWORK_ERROR', message: '네트워크 연결을 확인해주세요.' };
    } else {
      // 기타 에러
      return { type: 'UNKNOWN_ERROR', message: error.message || '알 수 없는 오류가 발생했습니다.' };
    }
  }
  
  // 에러 처리 및 사용자에게 표시
  static handleError(error, context = {}) {
    const classified = this.classifyError(error);
    
    // 에러 로깅
    console.error(`[${classified.type}] ${context.screen || 'Unknown'}:`, error);
    
    // 사용자에게 알림
    NotificationService.show(classified.message, 'error');
    
    // 특정 에러 타입별 처리
    if (classified.type === 'UNAUTHORIZED') {
      // 로그아웃 처리
      SessionService.logout();
    }
    
    return classified;
  }
}
```

#### Step: API 에러 인터셉터

**파일**: `mobile/src/api/interceptors.js`

**구현 내용**:
```javascript
// Axios 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const classified = ErrorHandler.classifyError(error);
    
    // 401 에러 시 토큰 갱신 시도
    if (error.response?.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // 원래 요청 재시도
        return apiClient.request(error.config);
      } else {
        // 토큰 갱신 실패 시 로그아웃
        await SessionService.logout();
      }
    }
    
    // 에러 처리
    ErrorHandler.handleError(error, {
      endpoint: error.config?.url,
      method: error.config?.method,
    });
    
    return Promise.reject(classified);
  }
);
```

### 화면별 에러 처리

#### Step: 에러 바운더리 컴포넌트

**파일**: `mobile/src/components/ErrorBoundary.js`

**구현 내용**:
```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // 에러 로깅 (Crashlytics 등)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### Step: 화면별 에러 뷰

**파일**: `mobile/src/components/ErrorView.js`

**구현 내용**:
- 에러 메시지 표시
- 재시도 버튼
- 홈으로 돌아가기 버튼
- 에러 타입별 맞춤 메시지

### 사용자 피드백 시스템

#### Step: 통합 알림 시스템

**파일**: `mobile/src/services/NotificationService.js`

**구현 내용**:
```javascript
import Toast from 'react-native-toast-message';

class NotificationService {
  static show(message, type = 'info', options = {}) {
    Toast.show({
      type, // 'success' | 'error' | 'info' | 'warning'
      text1: options.title || this.getTitle(type),
      text2: message,
      position: 'top',
      visibilityTime: options.duration || 3000,
      ...options,
    });
  }
  
  static success(message, options) {
    this.show(message, 'success', options);
  }
  
  static error(message, options) {
    this.show(message, 'error', options);
  }
  
  static info(message, options) {
    this.show(message, 'info', options);
  }
  
  static warning(message, options) {
    this.show(message, 'warning', options);
  }
}
```

---

## 추가 네이티브 기능 적용

### 디바이스 하드웨어 기능 활용

#### 1. 바이오메트릭 인증

**목적**: 보안 강화 및 사용자 편의성

**구현 내용**:
- Touch ID / Face ID (iOS)
- Fingerprint / Face Recognition (Android)
- 앱 잠금 해제
- 결제 확인 시 인증

**필요 라이브러리**:
- `react-native-biometrics` 또는 `react-native-touch-id`

**파일**: `mobile/src/services/BiometricService.js`

**적용 위치**:
- 앱 시작 시 자동 로그인 대체
- 민감한 정보 접근 시
- 결제/승인 액션 시

#### 2. 진동 및 햅틱 피드백

**목적**: 사용자 경험 향상

**구현 내용**:
- 버튼 클릭 시 피드백
- 에러 발생 시 진동
- 알림 수신 시 진동

**필요 라이브러리**:
- `react-native-haptic-feedback` (iOS)
- `react-native-vibration` (Android)

**적용 위치**:
- 모든 버튼 클릭
- 알림 수신
- 에러 발생 시

#### 3. 디바이스 방향 감지

**목적**: 화면 회전 대응

**구현 내용**:
- 세로/가로 모드 전환
- 특정 화면 고정 (예: 캘린더는 가로 모드)

**필요 라이브러리**:
- `react-native-orientation-locker`

**적용 위치**:
- 캘린더 화면
- 차트 화면
- 이미지 뷰어

#### 4. 백그라운드 작업

**목적**: 백그라운드에서 작업 수행

**구현 내용**:
- 위치 기반 알림
- 백그라운드 동기화
- 주기적 데이터 업데이트

**필요 라이브러리**:
- `react-native-background-job` 또는 `@react-native-community/background-task`

**적용 위치**:
- 메시지 동기화
- 알림 체크
- 데이터 백업

#### 5. 파일 시스템 접근

**목적**: 파일 다운로드 및 관리

**구현 내용**:
- 파일 다운로드
- 파일 저장 (문서, 이미지)
- 파일 공유

**필요 라이브러리**:
- `react-native-fs`
- `react-native-share`

**적용 위치**:
- 상담 일지 다운로드
- 리포트 다운로드
- 파일 첨부

#### 6. 연락처 연동

**목적**: 내담자/상담사 정보 연동

**구현 내용**:
- 연락처 조회 (권한 필요)
- 전화 걸기
- 문자 보내기

**필요 라이브러리**:
- `react-native-contacts`
- `react-native-communications`

**적용 위치**:
- 내담자/상담사 상세 정보
- 긴급 연락

#### 7. 캘린더 연동

**목적**: 외부 캘린더와 동기화

**구현 내용**:
- 일정을 디바이스 캘린더에 추가
- 캘린더 이벤트 조회

**필요 라이브러리**:
- `react-native-calendar-events`

**적용 위치**:
- 스케줄 관리
- 상담 예약

#### 8. 위치 서비스 (선택사항)

**목적**: 지점 위치 확인, 출석 체크 등

**구현 내용**:
- 현재 위치 조회
- 지점 위치 표시 (지도)
- 출석 체크 (위치 기반)

**필요 라이브러리**:
- `react-native-geolocation-service`
- `react-native-maps`

**적용 위치**:
- 지점 관리 화면
- 출석 체크 기능 (향후 추가 가능)

#### 9. QR 코드 스캐너

**목적**: 빠른 정보 입력, 인증

**구현 내용**:
- QR 코드 스캔
- 바코드 스캔

**필요 라이브러리**:
- `react-native-qrcode-scanner`

**적용 위치**:
- 지점 코드 스캔
- 빠른 로그인 (선택사항)

#### 10. 음성 녹음

**목적**: 상담 내용 기록 (향후 기능)

**구현 내용**:
- 음성 녹음
- 음성 재생
- 음성을 텍스트로 변환 (STT)

**필요 라이브러리**:
- `react-native-audio-recorder-player`
- `@react-native-community/audio-toolkit`

**적용 위치**:
- 상담 일지 작성 (향후)
- 메모 기능

### 디바이스 설정 활용

#### Step: 시스템 설정 연동

**파일**: `mobile/src/utils/deviceSettings.js`

**구현 내용**:
1. **다크 모드 감지**
   - 시스템 다크 모드 설정 읽기
   - 앱 다크 모드 적용

2. **폰트 크기 감지**
   - 시스템 폰트 크기 설정 읽기
   - 접근성 향상

3. **언어 설정**
   - 시스템 언어 감지
   - 다국어 지원 (향후)

---

## 성능 모니터링 및 분석

### Step: 크래시 리포팅

**도구**: Firebase Crashlytics

**구현 내용**:
- 자동 크래시 리포팅
- 에러 로그 수집
- 사용자 경로 추적

### Step: 성능 모니터링

**도구**: Firebase Performance Monitoring

**구현 내용**:
- 화면 렌더링 시간
- API 응답 시간
- 네트워크 요청 추적

### Step: 사용자 분석

**도구**: Firebase Analytics 또는 자체 분석

**구현 내용**:
- 화면 조회 수
- 기능 사용 통계
- 사용자 행동 분석

---

## 보안 강화

### Step: 코드 난독화

**구현 내용**:
- Android: ProGuard 설정
- iOS: 코드 난독화 도구 사용

### Step: SSL Pinning

**구현 내용**:
- 공개 키 고정
- 중간자 공격 방지

### Step: 로컬 데이터 암호화

**구현 내용**:
- 민감한 정보 암호화 저장
- 키체인/키스토어 활용

---

## 공통화 우선순위 및 적용 전략

### 1단계: 필수 공통 컴포넌트 (Phase 2)
- MGButton (가장 많이 사용)
- StatCard (모든 대시보드에서 사용)
- DashboardSection (모든 대시보드에서 사용)
- LoadingWrapper (데이터 로딩 패턴)
- EmptyState (빈 상태 표시)

### 2단계: 공통 유틸리티 (Phase 1-2)
- API 클라이언트 (모든 API 호출의 기반)
- 에러 핸들러 (통합 에러 처리)
- 알림 서비스 (모든 알림의 기반)
- 세션 관리 (인증/권한의 기반)

### 3단계: 공통 훅 (Phase 2-3)
- useApi (API 호출 패턴)
- usePermissions (권한 체크)
- useDebounce (검색 최적화)

### 4단계: 화면별 공통 패턴 (Phase 3-6)
- 리스트 화면 패턴 (FlatList + 검색 + 필터)
- 폼 화면 패턴 (검증 + 제출 + 에러)
- 상세 화면 패턴 (헤더 + 컨텐츠 + 액션)

## 효율적인 리소스 관리 우선순위

### Critical (즉시 적용 필수)
1. **이미지 최적화**
   - 모든 이미지에 `react-native-fast-image` 사용
   - 업로드 전 리사이즈 및 압축
   - Progressive Loading 적용

2. **FlatList 최적화**
   - 모든 리스트에 최적화 옵션 적용
   - `getItemLayout` 제공 (가능한 경우)
   - Infinite Scroll 구현

3. **API 캐싱**
   - 공통 코드는 무조건 캐싱
   - 대시보드 데이터는 짧은 TTL로 캐싱
   - 사용자 정보는 세션 동안 캐싱

### High Priority (Phase 3-5 적용)
4. **메모리 관리**
   - 이미지 메모리 모니터링
   - 불필요한 리렌더링 방지

5. **네트워크 최적화**
   - Request Deduplication
   - 오프라인 큐 구현

### Medium Priority (Phase 6-7 적용)
6. **성능 모니터링**
   - Firebase Performance Monitoring
   - 크래시 리포팅

## 에러 처리 우선순위

### 1단계: 전역 에러 처리 (Phase 1)
- API 인터셉터에서 기본 에러 처리
- 401 에러 시 자동 로그아웃
- 네트워크 에러 감지 및 알림

### 2단계: 화면별 에러 처리 (Phase 2-3)
- ErrorBoundary 적용
- 로딩/에러/빈 상태 공통 컴포넌트
- 재시도 메커니즘

### 3단계: 사용자 친화적 에러 메시지 (Phase 4-5)
- 에러 타입별 맞춤 메시지
- 해결 방법 안내
- 에러 로깅 및 분석

## 네이티브 기능 적용 우선순위

### 필수 기능 (Phase 7에 구현)
1. **푸시 알림** (Critical)
   - 모든 알림을 푸시로 대체
   - 백그라운드/포그라운드 처리
   - 알림 설정 화면

2. **프로필 사진 촬영** (Critical)
   - 카메라/갤러리 접근
   - 이미지 크롭 및 업로드

### High Priority (Phase 7-8)
3. **바이오메트릭 인증**
   - 보안 강화
   - 사용자 편의성

4. **진동/햅틱 피드백**
   - UX 향상
   - 모든 버튼 클릭에 적용

5. **파일 시스템 접근**
   - 파일 다운로드
   - 파일 공유

### Medium Priority (Phase 9 또는 향후)
6. **캘린더 연동**
   - 외부 캘린더 동기화
   - 일정 관리 편의성

7. **연락처 연동**
   - 전화/문자 기능
   - 내담자/상담사 연락

8. **QR 코드 스캐너**
   - 빠른 정보 입력

### Low Priority (향후 기능 확장 시)
9. **위치 서비스**
   - 지도 표시
   - 출석 체크 (향후)

10. **음성 녹음**
    - 상담 내용 기록 (향후)
    - STT 기능

---

## 웹-모바일 컴포넌트 매핑표

| 웹 컴포넌트 | 모바일 컴포넌트 | 파일 경로 | 우선순위 | 상태 |
|------------|---------------|----------|---------|------|
| MGButton | MGButton | `mobile/src/components/MGButton.js` | Critical | TODO |
| StatCard | StatCard | `mobile/src/components/StatCard.js` | Critical | TODO |
| DashboardSection | DashboardSection | `mobile/src/components/DashboardSection.js` | Critical | TODO |
| UnifiedNotification | Notification | `mobile/src/components/Notification.js` | Critical | TODO |
| ConfirmModal | ConfirmModal | `mobile/src/components/ConfirmModal.js` | High | TODO |
| SimpleLayout | SimpleLayout | `mobile/src/components/layout/SimpleLayout.js` | Critical | TODO |
| UnifiedLoading | UnifiedLoading | `mobile/src/components/UnifiedLoading.js` | Critical | TODO |
| ClientDashboard | ClientDashboard | `mobile/src/screens/client/ClientDashboard.js` | High | TODO |
| ConsultantDashboard | ConsultantDashboard | `mobile/src/screens/consultant/ConsultantDashboard.js` | High | TODO |
| AdminDashboard | AdminDashboard | `mobile/src/screens/admin/AdminDashboard.js` | High | TODO |
| HQDashboard | HQDashboard | `mobile/src/screens/hq/HQDashboard.js` | Medium | TODO |

---

## API 엔드포인트 목록

### 인증 관련
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/current-user` - 현재 사용자 정보
- `POST /api/auth/refresh-token` - 토큰 갱신

### 대시보드
- `GET /api/dashboard/client` - 내담자 대시보드
- `GET /api/dashboard/consultant` - 상담사 대시보드
- `GET /api/admin/dashboard` - 관리자 대시보드
- `GET /api/hq/dashboard` - 본사 대시보드

### 사용자 관리
- `GET /api/admin/users` - 사용자 목록
- `GET /api/admin/users/{id}` - 사용자 상세
- `PUT /api/admin/users/{id}` - 사용자 수정
- `DELETE /api/admin/users/{id}` - 사용자 삭제

### 스케줄 관리
- `GET /api/schedules` - 스케줄 목록
- `POST /api/schedules` - 스케줄 생성
- `PUT /api/schedules/{id}` - 스케줄 수정
- `DELETE /api/schedules/{id}` - 스케줄 삭제

### 메시지
- `GET /api/consultation-messages/conversations/{userId}` - 대화방 목록
- `GET /api/consultation-messages/{conversationId}` - 메시지 목록
- `POST /api/consultation-messages` - 메시지 발송

### 매칭 관리
- `GET /api/admin/mappings` - 매칭 목록
- `POST /api/admin/mappings` - 매칭 생성
- `PUT /api/admin/mappings/{id}` - 매칭 수정
- `DELETE /api/admin/mappings/{id}` - 매칭 삭제

### 푸시 알림 (새로 추가 필요)
- `POST /api/mobile/push-token/register` - 토큰 등록
- `DELETE /api/mobile/push-token/unregister` - 토큰 삭제
- `GET /api/mobile/push-settings` - 알림 설정 조회
- `PUT /api/mobile/push-settings` - 알림 설정 업데이트

---

## 주요 의존성 관계

### 컴포넌트 의존성
```
SimpleLayout
  └── 모든 화면 컴포넌트
      
DashboardSection
  └── 모든 대시보드
  
StatCard
  └── 모든 대시보드
  
MGButton
  └── 모든 화면 컴포넌트
```

### API 의존성
```
api/client.js
  └── 모든 API 호출
  
SessionContext
  └── 모든 화면 컴포넌트
  
PushNotificationService
  └── App.js (루트 컴포넌트)
```

---

## 단계별 체크리스트 템플릿

각 Phase를 시작할 때:

- [ ] Phase 시작 전 코드 리뷰
- [ ] 필요한 API 확인
- [ ] 참조할 웹 컴포넌트 분석
- [ ] 모바일 컴포넌트 초안 작성
- [ ] 스타일 포팅 (CSS → StyleSheet)
- [ ] 기능 테스트
- [ ] 네비게이션 테스트
- [ ] 에러 처리 확인
- [ ] Phase 완료 후 문서 업데이트

---

## 다음 단계

1. 이 문서를 기반으로 Phase 1부터 순차적으로 진행
2. 각 작업 완료 시 `PROGRESS_TRACKER.md` 업데이트
3. 이슈 발생 시 즉시 기록 및 해결 방안 수립

