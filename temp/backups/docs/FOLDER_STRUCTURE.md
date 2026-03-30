# 프로젝트 폴더 구조

## 📁 전체 프로젝트 구조

```
mindGarden/
├── docs/                                    # 📚 프로젝트 문서
│   ├── SYSTEM_DESIGN.md                    # 시스템 설계 문서
│   ├── API_DESIGN.md                       # API 설계 문서
│   ├── DESIGN_GUIDE.md                     # 디자인 가이드
│   ├── DEVELOPMENT_GUIDE.md                # 개발 가이드
│   ├── ENVIRONMENT_SETUP.md                # 환경 설정 가이드
│   ├── FOLDER_STRUCTURE.md                 # 폴더 구조 문서 (현재 문서)
│   └── AI_AGENT_REFERENCE.md               # AI 에이전트 참조 문서
├── src/                                     # 📝 소스 코드
│   ├── main/                               # 메인 소스
│   │   ├── java/                           # Java 소스 코드
│   │   │   └── com/mindgarden/consultation/
│   │   │       ├── ConsultationManagementApplication.java  # 🚀 메인 애플리케이션
│   │   │       ├── constant/               # 🔧 상수 정의
│   │   │       │   ├── UserRole.java       # 사용자 역할 상수
│   │   │       │   ├── UserGrade.java      # 사용자 등급 상수
│   │   │       │   ├── Gender.java         # 성별 상수
│   │   │       │   ├── AgeGroup.java       # 연령대 상수
│   │   │       │   └── AddressType.java    # 주소 타입 상수
│   │   │       ├── entity/                 # 🗄️ 엔티티 클래스
│   │   │       │   ├── BaseEntity.java     # 🔰 모든 엔티티의 기본 클래스
│   │   │       │   ├── User.java           # 사용자 기본 엔티티 ✅
│   │   │       │   ├── Client.java         # 내담자 상세 엔티티 ✅
│   │   │       │   ├── Consultant.java     # 상담사 상세 엔티티 ✅
│   │   │       │   ├── UserAddress.java    # 통합 주소 관리 엔티티
│   │   │       │   ├── Consultation.java   # 상담 엔티티
│   │   │       │   ├── ConsultationRecord.java  # 상담 기록 엔티티
│   │   │       │   ├── Schedule.java       # 스케줄 엔티티
│   │   │       │   ├── ClientConsultantMapping.java  # 내담자-상담사 매핑
│   │   │       │   ├── UserSocialAccount.java  # 소셜 계정 연동 엔티티 ✅
│   │   │       │   ├── Alert.java          # 알림 엔티티
│   │   │       └── ErrorMessage.java       # 오류 메시지 엔티티
│   │   │       ├── dto/                    # 📦 데이터 전송 객체
│   │   │       │   ├── SocialLoginResponse.java  # 소셜 로그인 응답 DTO ✅
│   │   │       │   ├── SocialSignupRequest.java  # 소셜 회원가입 요청 DTO ✅
│   │   │       │   ├── SocialSignupResponse.java # 소셜 회원가입 응답 DTO ✅
│   │   │       │   └── UserProfileUpdateRequest.java  # 사용자 프로필 업데이트 DTO ✅
│   │   │       ├── repository/             # 📚 데이터 접근 계층
│   │   │       │   ├── BaseRepository.java # 🔰 모든 Repository의 기본 인터페이스
│   │   │       │   ├── UserRepository.java # 사용자 데이터 접근
│   │   │       │   ├── ConsultationRepository.java  # 상담 데이터 접근
│   │   │       │   └── AlertRepository.java # 알림 데이터 접근
│   │   │       ├── service/                # ⚙️ 비즈니스 로직 계층
│   │   │       │   ├── BaseService.java    # 🔰 모든 Service의 기본 인터페이스
│   │   │       │   ├── UserService.java    # 사용자 관리 서비스 인터페이스
│   │   │       │   ├── AlertService.java   # 알림 관리 서비스 인터페이스
│   │   │       │   ├── OAuth2Service.java  # OAuth2 서비스 인터페이스 ✅
│   │   │       │   ├── SocialAuthService.java  # 소셜 회원가입 서비스 ✅
│   │   │       │   └── impl/               # 서비스 구현체
│   │   │       │       ├── BaseServiceImpl.java  # 🔰 BaseService의 기본 구현체
│   │   │       │       ├── UserServiceImpl.java  # 사용자 관리 서비스 구현체
│   │   │       │       ├── AlertServiceImpl.java # 알림 관리 서비스 구현체
│   │   │       │       ├── AbstractOAuth2Service.java  # OAuth2 추상 서비스 ✅
│   │   │       │       ├── KakaoOAuth2Service.java     # 카카오 OAuth2 서비스 ✅
│   │   │       │       ├── NaverOAuth2Service.java     # 네이버 OAuth2 서비스 ✅
│   │   │       │       ├── OAuth2FactoryService.java   # OAuth2 팩토리 서비스 ✅
│   │   │       └── SocialAuthServiceImpl.java          # 소셜 회원가입 서비스 구현체 ✅
│   │   │       ├── controller/             # 🌐 웹 계층
│   │   │       │   ├── BaseController.java # 🔰 모든 Controller의 기본 인터페이스
│   │   │       │   ├── HomeController.java # 홈페이지 및 공개 페이지
│   │   │       │   ├── UserController.java # 사용자 관리 API
│   │   │       ├── ClientDashboardController.java      # 내담자 대시보드 컨트롤러 ✅
│   │   │       ├── KakaoOAuth2Controller.java          # 카카오 OAuth2 컨트롤러 ✅
│   │   │       ├── NaverOAuth2Controller.java          # 네이버 OAuth2 컨트롤러 ✅
│   │   │       └── SocialAuthController.java           # 소셜 회원가입 컨트롤러 ✅
│   │   │       ├── config/                 # ⚙️ 설정 클래스
│   │   │       │   ├── SecurityConfig.java # Spring Security 설정
│   │   │       │   ├── JwtAuthenticationFilter.java  # JWT 인증 필터
│   │   │       │   ├── CustomAuthenticationEntryPoint.java  # 인증 실패 처리
│   │   │       │   └── CustomAccessDeniedHandler.java  # 접근 거부 처리
│   │   │       ├── exception/              # 🚨 예외 처리 클래스
│   │   │       │   ├── EntityNotFoundException.java  # 엔티티를 찾을 수 없을 때
│   │   │       │   └── ValidationException.java      # 데이터 검증 실패 시
│   │   │       └── util/                   # 🛠️ 유틸리티 클래스
│   │   │           ├── JwtService.java     # JWT 토큰 관리 ✅
│   │   │           ├── CustomUserDetailsService.java  # 사용자 인증 정보 로드
│   │   │           ├── EncryptionUtil.java # 개인정보 암호화 유틸 ✅
│   │   │           └── SessionUtil.java    # 세션 관리 유틸 ✅
│   │   └── resources/                      # 📦 리소스 파일
│   │       ├── application.yml             # 기본 애플리케이션 설정
│   │       ├── application-local.yml       # 로컬 환경 설정
│   │       ├── application-prod.yml        # 운영 환경 설정
│   │       ├── templates/                  # 🎨 Thymeleaf 템플릿
│   │       │   ├── layout/                 # 공통 레이아웃
│   │       │   │   ├── base.html           # 기본 레이아웃 템플릿
│   │       │   │   ├── header.html         # 헤더 프래그먼트
│   │       │   │   ├── navigation.html     # 네비게이션 프래그먼트
│   │       │   │   └── footer.html         # 푸터 프래그먼트
│   │       │   ├── index.html              # 홈페이지 메인
│   │       │   ├── common/                 # 공통 컴포넌트
│   │       │   │   ├── layout/             # 레이아웃 관련
│   │       │   │   ├── components/         # 재사용 가능한 컴포넌트
│   │       │   │   │   ├── social-signup-modal.html  # 소셜 회원가입 모달 ✅
│   │       │   │   │   └── notification.html         # 알림 컴포넌트 ✅
│   │       │   │   └── scripts/            # 공통 스크립트
│   │       │   ├── tablet/                 # 태블릿 전용 화면
│   │       │   │   ├── login.html          # 태블릿 로그인 페이지 ✅
│   │       │   │   ├── register.html       # 태블릿 회원가입 페이지 ✅
│   │       │   │   ├── home.html           # 태블릿 홈페이지 ✅
│   │       │   │   ├── client-dashboard.html  # 내담자 대시보드 ✅
│   │       │   │   ├── consultation/       # 상담 관리 화면
│   │       │   │   │   ├── calendar.html   # 풀 캘린더 화면
│   │       │   │   │   └── record.html     # 상담일지 화면
│   │       │   │   └── client/             # 내담자 관리 화면
│   │       │   │       └── dashboard.html  # 내담자 대시보드 (일반) ✅
│   │       │   └── homepage/               # 홈페이지 전용 화면
│   │       │       ├── main.html           # 메인 홈페이지
│   │       │       └── marketing/          # 마케팅 콘텐츠
│   │       ├── static/                     # 🎨 정적 리소스
│   │       │   ├── css/                    # 스타일시트
│   │       │   │   ├── common/             # 공통 스타일
│   │       │   │   │   ├── base.css        # 기본 스타일
│   │       │   │   │   ├── variables.css   # CSS 변수 ✅
│   │       │   │   │   ├── common.css      # 공통 스타일 ✅
│   │       │   │   │   └── components.css  # 컴포넌트 스타일 ✅
│   │       │   │   ├── components/         # 컴포넌트별 스타일
│   │       │   │   │   ├── header.css      # 헤더 스타일
│   │       │   │   │   ├── navigation.css  # 네비게이션 스타일
│   │       │   │   │   ├── forms.css       # 폼 스타일
│   │       │   │   ├── devices/            # 디바이스별 스타일
│   │       │   │   │   ├── tablet.css      # 태블릿 전용 스타일 ✅
│   │       │   │   │   └── mobile.css      # 모바일 전용 스타일
│   │       │   │   ├── pages/              # 페이지별 스타일
│   │       │   │   │   ├── homepage.css    # 홈페이지 스타일 ✅
│   │       │   │   │   └── dashboard.css   # 대시보드 스타일
│   │       │   │   │   └── buttons.css     # 버튼 스타일
│   │       │   │   ├── responsive/         # 반응형 디자인
│   │       │   │   │   ├── breakpoints.css # 브레이크포인트 정의
│   │       │   │   │   ├── tablet.css      # 태블릿 전용 스타일
│   │       │   │   │   └── mobile.css      # 모바일 전용 스타일
│   │       │   │   └── themes/             # 테마별 스타일
│   │       │   │       ├── light.css       # 라이트 테마
│   │       │   │       └── dark.css        # 다크 테마
│   │       │   ├── js/                     # 자바스크립트
│   │       │   │   ├── common/             # 공통 모듈
│   │       │   │   │   ├── utils.js        # 유틸리티 함수 ✅
│   │       │   │   │   ├── components.js   # 컴포넌트 관리 ✅
│   │       │   │   │   ├── ajax.js         # AJAX 통신 모듈 ✅
│   │       │   │   │   ├── router.js       # 라우팅 모듈 ✅
│   │       │   │   │   ├── main.js         # 메인 애플리케이션 ✅
│   │       │   │   │   ├── device-detection.js  # 디바이스 감지
│   │       │   │   │   ├── responsive-utils.js  # 반응형 유틸리티
│   │       │   │   │   ├── notification.js # 알림 시스템
│   │       │   │   │   ├── error-handler.js # 오류 처리
│   │       │   │   │   └── validation.js   # 폼 검증
│   │       │   │   ├── components/         # 컴포넌트별 스크립트
│   │       │   │   │   ├── header.js       # 헤더 기능
│   │       │   │   │   ├── navigation.js   # 네비게이션 기능
│   │       │   │   │   ├── forms.js        # 폼 기능
│   │       │   │   │   └── calendar.js     # 캘린더 기능
│   │       │   │   ├── tablet/             # 태블릿 전용 스크립트
│   │       │   │   │   ├── tablet-dashboard.js  # 태블릿 대시보드
│   │       │   │   │   ├── consultation-calendar.js  # 상담 캘린더
│   │       │   │   │   └── client-management.js  # 내담자 관리
│   │       │   │   └── homepage/           # 홈페이지 전용 스크립트
│   │       │   │       ├── homepage-main.js # 홈페이지 메인
│   │       │   │       └── marketing.js    # 마케팅 기능
│   │       │   ├── images/                 # 이미지 파일
│   │       │   │   ├── logo/               # 로고 이미지
│   │       │   │   ├── icons/              # 아이콘 이미지
│   │       │   │   ├── backgrounds/        # 배경 이미지
│   │       │   │   └── content/            # 콘텐츠 이미지
│   │       │   └── fonts/                  # 폰트 파일
│   │       │       ├── primary/            # 주요 폰트
│   │       │       └── secondary/          # 보조 폰트
│   └── test/                               # 🧪 테스트 코드
│       ├── java/                           # Java 테스트 코드
│       │   └── com/mindgarden/consultation/
│       │       ├── entity/                 # 엔티티 테스트
│       │       ├── service/                # 서비스 테스트
│       │       ├── controller/             # 컨트롤러 테스트
│       │       └── integration/            # 통합 테스트
│       └── resources/                      # 테스트 리소스
│           ├── test-data/                  # 테스트 데이터
│           └── test-config/                # 테스트 설정
├── target/                                 # 🎯 빌드 결과물
├── logs/                                   # 📝 로그 파일
├── .gitignore                              # Git 무시 파일
├── pom.xml                                 # Maven 프로젝트 설정
└── README.md                               # 프로젝트 설명서
```

## 🔧 핵심 Base 클래스 구조

### **BaseEntity 상속 구조**
```
BaseEntity (추상 클래스)
├── User (사용자 기본 정보)
│   ├── Client (내담자 상세 정보)
│   └── Consultant (상담사 상세 정보)
├── UserAddress (주소 정보)
├── Consultation (상담 정보)
├── ConsultationRecord (상담 기록)
├── Schedule (스케줄 정보)
├── ClientConsultantMapping (매핑 정보)
├── UserSocialAccount (SNS 계정)
├── Alert (알림 정보)
└── ErrorMessage (오류 메시지)
```

### **BaseRepository 상속 구조** ✅
```
BaseRepository<T, ID> (제네릭 인터페이스)
├── UserRepository (사용자 데이터 접근)
├── ConsultationRepository (상담 데이터 접근)
├── ConsultantRepository (상담사 데이터 접근)
└── AlertRepository (알림 데이터 접근)
```

### **BaseService 상속 구조** ✅
```
BaseService<T, ID> (제네릭 인터페이스)
├── UserService (사용자 관리 서비스)
├── AlertService (알림 관리 서비스)
├── ConsultationService (상담 관리 서비스)
├── ConsultantService (상담사 관리 서비스)
└── AuthService (인증 관리 서비스)

BaseServiceImpl<T, ID> (추상 구현체)
├── UserServiceImpl (사용자 관리 서비스 구현체)
├── AlertServiceImpl (알림 관리 서비스 구현체)
├── ConsultationServiceImpl (상담 관리 서비스 구현체)
├── ConsultantServiceImpl (상담사 관리 서비스 구현체)
├── AuthServiceImpl (인증 관리 서비스 구현체)
├── JwtService (JWT 토큰 관리 서비스)
└── CustomUserDetailsService (사용자 인증 정보 로드)
```

### **BaseController 상속 구조** ✅
```
BaseController<T, ID> (제네릭 인터페이스)
└── UserController (사용자 관리 API - BaseController 상속)

독립 Controller 클래스
├── HomeController (홈페이지 및 공개 페이지)
├── AuthController (인증 API)
├── ConsultationController (상담 관리 API)
├── ConsultantController (상담사 관리 API)
└── TabletController (태블릿 전용 API)
```

## 📱 디바이스별 화면 구조

### **태블릿 전용 화면**
- **대시보드**: 상담사 전용 통합 대시보드
- **상담 관리**: 풀 캘린더 기반 스케줄 관리
- **상담일지**: 상담별 상세 기록 관리
- **내담자 관리**: 내담자 정보 및 상담 이력

### **홈페이지 전용 화면**
- **메인 페이지**: 마케팅 및 소개 콘텐츠
- **서비스 소개**: 상담 서비스 안내
- **상담사 소개**: 전문 상담사 프로필
- **문의 및 예약**: 상담 신청 및 문의

### **공통 화면**
- **로그인/회원가입**: 사용자 인증
- **프로필 관리**: 개인정보 수정
- **알림 센터**: 시스템 알림 및 메시지

## 🎨 스타일 및 스크립트 분리

### **CSS 구조**
```
common/
├── base.css           # 기본 스타일
├── variables.css      # CSS 변수 (색상, 폰트, 간격)
├── utilities.css      # 유틸리티 클래스
└── components/        # 컴포넌트별 스타일

responsive/
├── breakpoints.css    # 반응형 브레이크포인트
├── tablet.css         # 태블릿 전용 스타일
└── mobile.css         # 모바일 전용 스타일

themes/
├── light.css          # 라이트 테마
└── dark.css           # 다크 테마
```

### **JavaScript 구조**
```
common/
├── ajax-common.js     # AJAX 공통 모듈
├── device-detection.js # 디바이스 감지
├── responsive-utils.js # 반응형 유틸리티
├── notification.js     # 알림 시스템
├── error-handler.js   # 오류 처리
└── validation.js      # 폼 검증

tablet/                # 태블릿 전용 기능
├── tablet-dashboard.js
├── consultation-calendar.js
└── client-management.js

homepage/              # 홈페이지 전용 기능
├── homepage-main.js
└── marketing.js
```

## 🔐 보안 및 인증 구조

### **Spring Security 설정**
```
config/
├── SecurityConfig.java              # 메인 보안 설정
├── JwtAuthenticationFilter.java     # JWT 인증 필터
├── CustomAuthenticationEntryPoint.java  # 인증 실패 처리
└── CustomAccessDeniedHandler.java   # 접근 거부 처리
```

### **JWT 인증 시스템**
```
util/
├── JwtService.java                  # JWT 토큰 관리
└── CustomUserDetailsService.java    # 사용자 인증 정보 로드
```

## 📊 데이터베이스 구조

### **테이블 관계**
```
users (사용자 기본 정보)
├── clients (내담자 상세 정보)
├── consultants (상담사 상세 정보)
└── user_addresses (통합 주소 정보)

consultations (상담 정보)
├── consultation_records (상담 기록)
└── schedules (스케줄 정보)

client_consultant_mappings (내담자-상담사 매핑)
user_social_accounts (SNS 계정 연동)
alerts (알림 정보)
error_messages (오류 메시지)
```

## 🚀 배포 및 운영 구조

### **환경별 설정**
```
resources/
├── application.yml              # 기본 설정
├── application-local.yml        # 로컬 개발 환경
└── application-prod.yml         # 운영 환경
```

### **프로파일별 설정**
- **local**: 개발용 설정 (MySQL, H2, 디버그 로깅)
- **prod**: 운영용 설정 (외부 MySQL, 프로덕션 로깅, 캐싱)

## 📝 문서화 구조

### **개발 문서**
- **SYSTEM_DESIGN.md**: 시스템 아키텍처 및 설계 원칙
- **API_DESIGN.md**: API 설계 및 엔드포인트 정의
- **DESIGN_GUIDE.md**: UI/UX 디자인 가이드라인
- **DEVELOPMENT_GUIDE.md**: 개발 가이드라인 및 코딩 표준
- **ENVIRONMENT_SETUP.md**: 환경 설정 및 설치 가이드

### **참조 문서**
- **AI_AGENT_REFERENCE.md**: AI 에이전트 참조 가이드
- **FOLDER_STRUCTURE.md**: 프로젝트 구조 및 파일 정리 (현재 문서)

## 🎯 현재 개발 상태 (업데이트: 2025년 1월) ✅

### **Backend 구현 완료** ✅
- **엔티티 계층**: 12개 엔티티 완성 (100%)
- **Repository 계층**: 5개 Repository 완성 (100%) 
- **Service 계층**: 7개 Service 완성 (100%)
- **Controller 계층**: 6개 Controller 완성 (100%)
- **인증 시스템**: JWT 기반 완성 (100%)
- **상수/DTO/예외**: 모든 클래스 완성 (100%)

### **Frontend 진행 상태** 🔄
- **Thymeleaf 템플릿**: 기본 구조 (70%)
- **JavaScript 모듈**: 구현 필요 (0%)
- **CSS 디자인**: 부분 적용 (30%)

### **다음 단계** ⏳
1. JavaScript 모듈 시스템 구축
2. SNS 로그인 통합
3. 반응형 디자인 완성
4. 실시간 알림 시스템

## 🔄 개발 워크플로우

### **1. 문서 우선 원칙**
1. 요구사항 분석 및 문서 검토
2. 관련 문서 업데이트/생성
3. 구현 계획 수립 및 문서화
4. 코드 구현
5. 문서 검증 및 업데이트

### **2. Base 클래스 활용**
1. 새로운 엔티티 생성 시 `BaseEntity` 상속
2. 새로운 Repository 생성 시 `BaseRepository` 상속
3. 새로운 Service 생성 시 `BaseService` 상속
4. 새로운 Controller 생성 시 `BaseController` 상속

### **3. 공통 기능 활용**
1. 공통 CRUD 메서드는 Base 클래스에서 자동 제공
2. 커스텀 로직은 하위 클래스에서 구현
3. 생명주기 훅을 활용한 비즈니스 로직 구현
4. 예외 처리 및 검증 로직 표준화

이 구조를 통해 일관성 있고 유지보수가 용이한 코드를 작성할 수 있습니다.
