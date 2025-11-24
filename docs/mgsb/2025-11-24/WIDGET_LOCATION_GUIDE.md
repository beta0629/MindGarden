# 위젯 위치 및 접근 가이드

**작성일**: 2025-11-24  
**목적**: 위젯 편집 UI 접근 방법 및 위젯 파일 위치 안내

---

## 📍 위젯 편집 UI 접근 경로

### 1. 대시보드 관리 페이지

**URL**: `https://dev.core-solution.co.kr/admin/dashboards`

**접근 방법**:
1. 로그인: `https://dev.core-solution.co.kr/login`
2. 관리자 계정으로 로그인
3. 메뉴에서 "대시보드 관리" 클릭 또는 직접 URL 접근

**기능**:
- 대시보드 목록 조회
- 대시보드 생성/수정/삭제
- 위젯 편집 (대시보드 생성/수정 모달 내)

---

## 🎨 위젯 편집 UI 사용 방법

### Step 1: 대시보드 생성 또는 수정

1. `/admin/dashboards` 페이지 접속
2. "대시보드 생성" 버튼 클릭 (또는 기존 대시보드 "수정" 버튼)
3. `DashboardFormModal` 모달이 열림

### Step 2: 위젯 편집 탭 선택

1. 모달에서 "위젯 편집" 탭 클릭
2. 두 가지 편집 모드 선택 가능:
   - **시각적 편집 모드** (기본): 드래그 앤 드롭으로 위젯 추가/배치
   - **JSON 편집 모드**: JSON 직접 입력

### Step 3: 위젯 추가 및 편집

**시각적 편집 모드**:
- 위젯 목록에서 위젯 선택
- 드래그 앤 드롭으로 레이아웃 배치
- 위젯 설정 버튼으로 상세 설정

**JSON 편집 모드**:
- JSON 형식으로 직접 입력
- `dashboardConfig` 필드에 위젯 설정 입력

---

## 📂 위젯 파일 위치

### 1. 위젯 컴포넌트 파일

**기본 경로**: `frontend/src/components/dashboard/widgets/`

**구조**:
```
frontend/src/components/dashboard/widgets/
├── WidgetRegistry.js          # 위젯 레지스트리 (위젯 타입별 컴포넌트 매핑)
├── Widget.css                 # 위젯 공통 스타일
│
├── [공통 위젯]
├── WelcomeWidget.js           # 환영 위젯
├── StatisticsWidget.js        # 통계 위젯
├── ChartWidget.js             # 차트 위젯
├── TableWidget.js             # 테이블 위젯
├── CalendarWidget.js          # 캘린더 위젯
├── FormWidget.js              # 폼 위젯
├── SummaryStatisticsWidget.js # 요약 통계
├── ActivityListWidget.js      # 활동 목록
├── QuickActionsWidget.js      # 빠른 작업
├── NavigationMenuWidget.js    # 네비게이션 메뉴
├── MessageWidget.js           # 메시지 위젯
├── NotificationWidget.js      # 알림 위젯
├── ScheduleWidget.js          # 일정 위젯
├── RatingWidget.js            # 평점 위젯
├── PaymentWidget.js            # 결제 위젯
├── HealingCardWidget.js       # 힐링 카드
├── PurchaseRequestWidget.js   # 구매 요청
├── PersonalizedMessageWidget.js # 개인화 메시지
├── CustomWidget.js            # 커스텀 위젯
│
├── common/                    # 공통 컴포넌트 기반 위젯
│   ├── HeaderWidget.js
│   └── ErpCardWidget.js
│
├── erp/                       # ERP 위젯
│   ├── ErpStatsGridWidget.js
│   └── ErpManagementGridWidget.js
│
├── consultation/              # 상담소 특화 위젯
│   ├── ConsultationSummaryWidget.js
│   ├── ConsultationScheduleWidget.js
│   ├── ConsultationStatsWidget.js
│   ├── ConsultationRecordWidget.js
│   ├── ConsultantClientWidget.js
│   ├── MappingManagementWidget.js
│   ├── SessionManagementWidget.js
│   ├── ScheduleRegistrationWidget.js
│   └── PendingDepositWidget.js
│
└── admin/                     # 관리자 위젯
    ├── SystemStatusWidget.js
    ├── SystemToolsWidget.js
    ├── PermissionWidget.js
    ├── StatisticsGridWidget.js
    └── ManagementGridWidget.js
```

---

### 2. 위젯 편집기 컴포넌트

**경로**: `frontend/src/components/admin/`

**파일**:
- `DashboardWidgetEditor.js` - 위젯 추가/삭제/설정 편집기
- `DashboardLayoutEditor.js` - 드래그 앤 드롭 레이아웃 편집기
- `DashboardFormModal.js` - 대시보드 생성/수정 모달 (위젯 편집기 통합)
- `WidgetConfigModal.js` - 위젯 상세 설정 모달

---

### 3. 대시보드 관리 컴포넌트

**경로**: `frontend/src/components/admin/`

**파일**:
- `DashboardManagement.js` - 대시보드 목록 및 관리 페이지

---

## 🔧 위젯 레지스트리

**파일**: `frontend/src/components/dashboard/widgets/WidgetRegistry.js`

**기능**:
- 위젯 타입별 컴포넌트 매핑
- 위젯 타입 지원 여부 확인
- 업종별 위젯 필터링
- 위젯 목록 조회

**주요 함수**:
- `getWidgetComponent(widgetType, businessType)` - 위젯 컴포넌트 가져오기
- `isWidgetTypeSupported(widgetType)` - 위젯 타입 지원 여부 확인
- `getSupportedWidgetTypes(businessType)` - 지원되는 위젯 타입 목록
- `registerWidget(widgetType, component)` - 커스텀 위젯 등록

---

## 📋 위젯 타입 목록

### 공통 위젯 (모든 업종)
- `welcome` - 환영 위젯
- `statistics` - 통계 위젯
- `summary-statistics` - 요약 통계
- `chart` - 차트 위젯
- `table` - 테이블 위젯
- `calendar` - 캘린더 위젯
- `form` - 폼 위젯
- `activity-list` - 활동 목록
- `quick-actions` - 빠른 작업
- `navigation-menu` - 네비게이션 메뉴
- `message` - 메시지 위젯
- `notification` - 알림 위젯
- `schedule` - 일정 위젯
- `rating` - 평점 위젯
- `payment` - 결제 위젯
- `healing-card` - 힐링 카드
- `purchase-request` - 구매 요청
- `personalized-message` - 개인화 메시지
- `header` - 헤더 위젯
- `erp-card` - ERP 카드
- `custom` - 커스텀 위젯

### 상담소 특화 위젯
- `consultation-summary` - 상담 요약
- `consultation-schedule` - 상담 일정
- `consultation-stats` - 상담 통계
- `consultation-record` - 상담 기록
- `consultant-client` - 상담사-고객
- `mapping-management` - 매핑 관리
- `session-management` - 세션 관리
- `schedule-registration` - 일정 등록
- `pending-deposit` - 대기 입금

### 학원 특화 위젯
- (현재 구현 중)

### 관리자 위젯
- `system-status` - 시스템 상태
- `system-tools` - 시스템 도구
- `permission` - 권한 관리
- `statistics-grid` - 통계 그리드
- `management-grid` - 관리 그리드

---

## 🚀 위젯 테스트 방법

### 1. 로그인
```
URL: https://dev.core-solution.co.kr/login
이메일: test-consultation-1763988242@example.com (또는 test-academy-1763988263@example.com)
비밀번호: Test1234!@#
```

### 2. 대시보드 관리 페이지 접속
```
URL: https://dev.core-solution.co.kr/admin/dashboards
```

### 3. 대시보드 생성
- "대시보드 생성" 버튼 클릭
- 기본 정보 입력 (이름, 역할, 타입 등)
- "위젯 편집" 탭 선택

### 4. 위젯 추가
- 위젯 목록에서 위젯 선택
- 드래그 앤 드롭으로 레이아웃에 배치
- 위젯 설정 버튼으로 상세 설정

### 5. 대시보드 저장
- "저장" 버튼 클릭
- 대시보드 목록에서 확인

---

## 🔗 관련 파일

### 프론트엔드
- `frontend/src/components/admin/DashboardManagement.js` - 대시보드 관리 페이지
- `frontend/src/components/admin/DashboardFormModal.js` - 대시보드 생성/수정 모달
- `frontend/src/components/admin/DashboardWidgetEditor.js` - 위젯 편집기
- `frontend/src/components/admin/DashboardLayoutEditor.js` - 레이아웃 편집기
- `frontend/src/components/dashboard/widgets/WidgetRegistry.js` - 위젯 레지스트리

### 백엔드
- `src/main/java/com/coresolution/core/controller/TenantDashboardController.java` - 대시보드 API
- `src/main/java/com/coresolution/core/service/TenantDashboardService.java` - 대시보드 서비스

---

**최종 업데이트**: 2025-11-24

