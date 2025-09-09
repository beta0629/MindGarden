# 시스템 설계 문서

## 📋 시스템 개요

통합 상담관리 시스템은 Spring Boot, Hibernate, Thymeleaf, MySQL을 기반으로 한 웹 애플리케이션입니다.

## 🏗️ 시스템 아키텍처

### **계층 구조**
```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│  (Thymeleaf + JavaScript + CSS)    │
├─────────────────────────────────────┤
│           Controller Layer          │
│      (REST API + Web Pages)        │
├─────────────────────────────────────┤
│            Service Layer            │
│        (Business Logic)            │
├─────────────────────────────────────┤
│           Repository Layer          │
│         (Data Access)              │
├─────────────────────────────────────┤
│           Entity Layer              │
│        (Domain Objects)            │
└─────────────────────────────────────┘
```

### **공통 기반 클래스 구조**

#### **BaseEntity**
- 모든 엔티티의 기본 클래스
- 공통 필드: ID, 생성일시, 수정일시, 생성자, 수정자, 삭제여부, 삭제일시, 버전
- JPA Auditing 지원
- 낙관적 락(Optimistic Locking) 지원

### **중복 로그인 방지 시스템 아키텍처**

#### **세션 관리 시스템 구조**
```
UserSessionService (인터페이스)
├── UserSessionServiceImpl (구현체)
├── UserSession (엔티티)
├── UserSessionRepository (데이터 접근)
└── SessionCleanupScheduler (자동 정리)

AuthService (인터페이스)
├── AuthServiceImpl (구현체)
└── 중복 로그인 체크 및 세션 관리

AuthController
├── /api/auth/check-duplicate-login (중복 로그인 체크)
├── /api/auth/force-logout (강제 로그아웃)
└── 중복 로그인 감지 및 처리
```

#### **프론트엔드 세션 관리**
```
duplicateLoginManager.js (유틸리티)
├── 중복 로그인 체크 시작/중지
├── 주기적 세션 상태 확인
└── 중복 로그인 감지 이벤트 발생

DuplicateLoginAlert.js (컴포넌트)
├── 중복 로그인 감지 모달
├── 자동 로그아웃 카운트다운
└── 사용자 알림 및 처리
```

### **소셜 로그인 시스템 아키텍처**

#### **OAuth2 통합 서비스 구조**
```
AbstractOAuth2Service (추상 클래스)
├── KakaoOAuth2Service (카카오 구현체)
├── NaverOAuth2Service (네이버 구현체)
├── GoogleOAuth2Service (구글 구현체 - 예정)
└── FacebookOAuth2Service (페이스북 구현체 - 예정)
```

#### **핵심 컴포넌트**

##### **OAuth2FactoryService**
- 소셜 로바이더별 서비스 인스턴스 생성
- 팩토리 패턴으로 확장 가능한 구조
- 새로운 소셜 로그인 추가 시 쉽게 확장

##### **AbstractOAuth2Service**
- 공통 OAuth2 로직 구현
- `authenticateWithCode()`: 인증 코드로 사용자 인증
- `createUserFromSocial()`: 소셜 정보로 사용자 생성
- `findExistingUserByProviderId()`: 소셜 ID로 기존 사용자 검색
- `findExistingUserByEmail()`: 이메일로 기존 사용자 검색
- `updateOrCreateSocialAccount()`: 소셜 계정 업데이트/생성

##### **SocialAuthService**
- 소셜 회원가입 처리
- 개인정보 암호화 (AES/CBC/PKCS5Padding)
- 소셜 계정과 사용자 계정 연결

#### **데이터 흐름**
1. **소셜 로그인 요청** → OAuth2 서비스로 리다이렉트
2. **인증 코드 수신** → `authenticateWithCode()` 호출
3. **사용자 검색** → `providerUserId` 또는 `email`로 기존 사용자 확인
4. **사용자 생성/연결** → 신규 사용자 생성 또는 기존 사용자와 소셜 계정 연결
5. **역할 기반 리다이렉트** → 사용자 역할에 따른 대시보드 이동

#### **보안 특징**
- **개인정보 암호화**: 이름, 닉네임, 전화번호, 성별 등 민감정보 암호화
- **소셜 ID 평문 저장**: `providerUserId`는 평문으로 저장하여 검색 성능 확보
- **JWT 토큰**: 로그인 성공 시 JWT 토큰 발급
- **세션 관리**: 로그인 세션과 비즈니스 로직 세션 분리

#### **BaseRepository<T, ID>**
- 모든 Repository의 기본 인터페이스
- 공통 데이터 접근 메서드 정의
- 활성/삭제된 엔티티 조회 메서드
- 기간별, 사용자별 조회 메서드
- 중복 검사 및 통계 메서드

#### **BaseService<T, ID>**
- 모든 Service의 기본 인터페이스
- 공통 비즈니스 로직 메서드 정의
- CRUD, 검증, 생명주기 훅 메서드
- 트랜잭션 관리

#### **BaseServiceImpl<T, ID>**
- BaseService의 기본 구현체
- 공통 비즈니스 로직 구현
- BeanUtils를 활용한 부분 업데이트
- 생명주기 훅 메서드 기본 구현

#### **BaseController<T, ID>**
- 모든 Controller의 기본 인터페이스
- 공통 REST API 엔드포인트 정의
- 기본 CRUD, 페이징, 검색 메서드
- Spring Data JPA와 연동

### **예외 처리 시스템**

#### **EntityNotFoundException**
- 엔티티를 찾을 수 없을 때 발생
- HTTP 404 상태 코드 반환

#### **ValidationException**
- 데이터 검증 실패 시 발생
- HTTP 400 상태 코드 반환

## 🗄️ 데이터베이스 설계

### **엔티티 관계**

#### **사용자 계층 구조**
```
User (기본 사용자 정보)
├── Client (내담자 상세 정보)
└── Consultant (상담사 상세 정보)
```

#### **소셜 로그인 시스템**
```
User (기본 사용자 정보)
├── UserSocialAccount (소셜 계정 정보)
│   ├── provider: KAKAO, NAVER, GOOGLE, FACEBOOK
│   ├── providerUserId: 소셜 서비스 고유 ID
│   ├── loginCount: 로그인 횟수
│   └── lastLoginAt: 마지막 로그인 시간
└── SocialLoginHistory (소셜 로그인 기록)
```

#### **주소 관리 통합**
- `UserAddress` 엔티티로 `ClientAddress`와 `ConsultantAddress` 통합
- 사용자별로 여러 주소 타입 관리 가능
- 주소 타입: HOME, WORK, EMERGENCY, OTHER

#### **상담 관리**
- `Consultation`: 상담 기본 정보
- `ConsultationRecord`: 상담 세부 기록
- `Schedule`: 상담사 스케줄 관리
- `ClientConsultantMapping`: 내담자-상담사 1:N 관계

### **상수 정의**

#### **사용자 역할 (UserRole)**
```java
public static final String CLIENT = "CLIENT";
public static final String CONSULTANT = "CONSULTANT";
public static final String ADMIN = "ADMIN";
public static final String SUPER_ADMIN = "SUPER_ADMIN";
```

#### **사용자 등급 (UserGrade)**
```java
// 내담자 등급
public static final String CLIENT_BRONZE = "CLIENT_BRONZE";
public static final String CLIENT_SILVER = "CLIENT_SILVER";
public static final String CLIENT_GOLD = "CLIENT_GOLD";
public static final String CLIENT_PLATINUM = "CLIENT_PLATINUM";

// 상담사 등급
public static final String CONSULTANT_JUNIOR = "CONSULTANT_JUNIOR";
public static final String CONSULTANT_SENIOR = "CONSULTANT_SENIOR";
public static final String CONSULTANT_EXPERT = "CONSULTANT_EXPERT";
public static final String CONSULTANT_MASTER = "CONSULTANT_MASTER";
```

#### **성별 (Gender)**
```java
public static final String MALE = "MALE";
public static final String FEMALE = "FEMALE";
public static final String OTHER = "OTHER";
public static final String PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY";
```

#### **연령대 (AgeGroup)**
```java
public static final String TEENAGER = "TEENAGER";
public static final String TWENTIES = "TWENTIES";
public static final String THIRTIES = "THIRTIES";
public static final String FORTIES = "FORTIES";
public static final String FIFTIES = "FIFTIES";
public static final String SIXTIES = "SIXTIES";
public static final String SEVENTIES_PLUS = "SEVENTIES_PLUS";
```

#### **주소 타입 (AddressType)**
```java
public static final String HOME = "HOME";
public static final String WORK = "WORK";
public static final String EMERGENCY = "EMERGENCY";
public static final String OTHER = "OTHER";
```

## 🔐 보안 및 인증

### **Spring Security 설정**
- JWT 기반 인증
- Role-Based Access Control (RBAC)
- CORS 설정
- 세션 관리

### **JWT 인증 시스템**
- Access Token: 24시간 유효
- Refresh Token: 7일 유효
- 토큰 검증 및 갱신

### **권한 관리**
- 사용자 역할별 접근 제어
- API 엔드포인트별 권한 검증
- 관리자 전용 기능 보호

## 📱 프론트엔드 설계

### **Thymeleaf 템플릿 구조**
- 공통 레이아웃 (`layout/base.html`)
- 헤더/푸터 분리
- 디바이스별 최적화

### **JavaScript 모듈화**
- 공통 AJAX 모듈
- 디바이스별 스크립트 분리
- 컴포넌트 기반 구조

### **반응형 디자인**
- 태블릿 전용 디자인
- 홈페이지 전용 디자인
- 공통 스타일 가이드

## 🔔 알림 및 오류 처리

### **공통 알림 시스템**
- `Alert` 엔티티를 통한 알림 관리
- 토스트 알림 방식
- 알림 우선순위 및 상태 관리

### **오류 메시지 시스템**
- `ErrorMessage` 엔티티를 통한 표준화된 오류 관리
- 다국어 지원
- 사용자 친화적 메시지

## 📊 데이터 무결성

### **원칙**
- 하드코딩 금지
- 폴백 데이터 금지
- 데이터가 없으면 "없음" 표기

### **구현 방법**
- 모든 비즈니스 로직 값은 상수 클래스에 정의
- 예외 상황 시 적절한 예외 발생
- 데이터 검증을 통한 무결성 보장

## 🔄 트랜잭션 관리

### **서비스 계층 트랜잭션**
- `@Transactional` 어노테이션 사용
- 읽기 전용 메서드에 `@Transactional(readOnly = true)` 적용
- 롤백 정책 정의

### **낙관적 락**
- `@Version` 어노테이션을 통한 버전 관리
- 동시 수정 충돌 방지

## 🚀 성능 최적화

### **데이터베이스 최적화**
- 인덱스 전략
- 쿼리 최적화
- 연결 풀 설정 (HikariCP)

### **캐싱 전략**
- 엔티티 캐싱
- 쿼리 결과 캐싱
- 세션 캐싱

## 📈 모니터링 및 로깅

### **로깅 전략**
- 구조화된 로깅
- 로그 레벨별 설정
- 성능 메트릭 수집

### **에러 추적**
- 예외 발생 시 상세 정보 기록
- 사용자 행동 추적
- 시스템 성능 모니터링

## 📊 현재 구현 상태 (업데이트: 2025년 1월)

### **Backend 구현 완료** ✅
- **엔티티 계층**: 12개 엔티티 완성 (100%)
  - BaseEntity, User, Client, Consultant
  - UserAddress, UserSocialAccount
  - Consultation, ConsultationRecord, Schedule
  - ClientConsultantMapping, Alert, ErrorMessage
- **Repository 계층**: 5개 Repository 완성 (100%)
  - BaseRepository, UserRepository, ConsultationRepository
  - ConsultantRepository, AlertRepository
- **Service 계층**: 7개 Service 완성 (100%)
  - BaseService/Impl, UserService/Impl, AlertService/Impl
  - ConsultationService/Impl, ConsultantService/Impl
  - AuthService/Impl, JwtService, CustomUserDetailsService
- **Controller 계층**: 6개 Controller 완성 (100%)
  - BaseController, HomeController, UserController
  - AuthController, ConsultationController, ConsultantController, TabletController
- **인증 및 보안**: JWT 기반 인증 시스템 완성 (100%)
  - SecurityConfig, JwtAuthenticationFilter
  - CustomAuthenticationEntryPoint, CustomAccessDeniedHandler
- **데이터 검증**: DTO 및 예외 처리 완성 (100%)
  - 5개 DTO 클래스, 3개 예외 처리 클래스
- **상수 관리**: 9개 상수 클래스 완성 (100%)
- **Hibernate 스키마**: 모든 엔티티 정상 생성 ✅

### **Frontend 구현 상태** 🔄
- **Thymeleaf 템플릿**: 기본 구조 완성 (70%)
- **JavaScript 모듈**: 공통 모듈 구현 필요 (0%)
- **CSS 디자인**: 디자인 시스템 적용 필요 (30%)
- **반응형 디자인**: 태블릿/데스크톱 대응 필요 (20%)

### **향후 구현 예정** ⏳
- 공통 JavaScript 모듈 (AJAX, Router, Components)
- SNS 로그인 통합 (Kakao, Naver, Facebook)
- 대시보드 컴포넌트 모듈화
- 실시간 알림 시스템
- 테스트 코드 작성
