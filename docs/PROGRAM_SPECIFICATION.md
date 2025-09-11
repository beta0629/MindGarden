# MindGarden 프로그램 명세서

## 개요

MindGarden 상담 관리 시스템은 Spring Boot 기반의 백엔드 API와 React 기반의 프론트엔드로 구성된 통합 상담 관리 플랫폼입니다.

## 시스템 아키텍처

### 백엔드 (Spring Boot)
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** (OAuth2 + 세션 기반 인증)
- **Spring Data JPA/Hibernate**
- **MySQL** (데이터베이스)
- **Maven** (빌드 도구)

### 프론트엔드 (React)
- **React 19.1.1**
- **JavaScript ES6+**
- **CSS3** (인라인 스타일)
- **Axios** (HTTP 클라이언트)

## 데이터베이스 스키마

### 주요 엔티티

#### 1. 사용자 관리
- **User**: 기본 사용자 정보
- **UserAddress**: 사용자 주소 정보
- **UserSocialAccount**: 소셜 계정 연동 정보
- **UserSession**: 사용자 세션 관리

#### 2. 상담 관리
- **Consultant**: 상담사 정보
- **Client**: 내담자 정보
- **ConsultantClientMapping**: 상담사-내담자 매핑
- **Consultation**: 상담 정보
- **ConsultationMessage**: 상담 메시지
- **ConsultationRecord**: 상담 기록
- **Schedule**: 스케줄 관리

#### 3. 급여 관리
- **ConsultantSalaryProfile**: 상담사 급여 프로필
- **ConsultantSalaryOption**: 급여 옵션
- **SalaryCalculation**: 급여 계산 내역
- **SalaryTaxCalculation**: 세금 계산 내역

#### 4. ERP 시스템
- **Item**: 아이템 관리
- **PurchaseRequest**: 구매 요청
- **PurchaseOrder**: 구매 주문
- **Budget**: 예산 관리

#### 5. 결제 관리
- **Payment**: 결제 정보
- **Discount**: 할인 정보

#### 6. 시스템 관리
- **CommonCode**: 공통 코드
- **Alert**: 알림 관리
- **Vacation**: 휴가 관리
- **QualityEvaluation**: 품질 평가
- **Review**: 리뷰 관리

## API 명세서

### 1. 인증 및 사용자 관리

#### AuthController (`/api/auth`)
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/session` - 세션 확인
- `POST /api/auth/refresh` - 세션 갱신

#### OAuth2Controller (`/api/oauth2`)
- `GET /api/oauth2/authorization/{provider}` - OAuth2 인증 시작
- `GET /api/oauth2/callback/{provider}` - OAuth2 콜백 처리
- `POST /api/oauth2/register` - OAuth2 회원가입

#### UserController (`/api/users`)
- `GET /api/users/profile` - 사용자 프로필 조회
- `PUT /api/users/profile` - 사용자 프로필 수정
- `GET /api/users/addresses` - 사용자 주소 목록
- `POST /api/users/addresses` - 주소 추가
- `PUT /api/users/addresses/{id}` - 주소 수정
- `DELETE /api/users/addresses/{id}` - 주소 삭제

### 2. 관리자 기능

#### AdminController (`/api/admin`)
- `GET /api/admin/consultants` - 상담사 목록 조회
- `POST /api/admin/consultants` - 상담사 등록
- `PUT /api/admin/consultants/{id}` - 상담사 정보 수정
- `DELETE /api/admin/consultants/{id}` - 상담사 삭제
- `GET /api/admin/clients` - 내담자 목록 조회
- `POST /api/admin/clients` - 내담자 등록
- `PUT /api/admin/clients/{id}` - 내담자 정보 수정
- `DELETE /api/admin/clients/{id}` - 내담자 삭제
- `POST /api/admin/mapping` - 상담사-내담자 매핑
- `DELETE /api/admin/mapping/{id}` - 매핑 삭제
- `GET /api/admin/statistics` - 통계 조회

#### AdminUserController (`/api/admin/users`)
- `GET /api/admin/users` - 사용자 목록 조회
- `PUT /api/admin/users/{id}/role` - 사용자 역할 변경
- `PUT /api/admin/users/{id}/grade` - 사용자 등급 변경
- `PUT /api/admin/users/{id}/status` - 사용자 상태 변경

#### SuperAdminController (`/api/super-admin`)
- `GET /api/super-admin/users` - 모든 사용자 조회
- `POST /api/super-admin/users` - 사용자 생성
- `PUT /api/super-admin/users/{id}` - 사용자 수정
- `DELETE /api/super-admin/users/{id}` - 사용자 삭제
- `GET /api/super-admin/statistics` - 시스템 통계

### 3. 상담 관리

#### ConsultantController (`/api/consultants`)
- `GET /api/consultants/profile` - 상담사 프로필 조회
- `PUT /api/consultants/profile` - 상담사 프로필 수정
- `GET /api/consultants/availability` - 상담사 가용성 조회
- `PUT /api/consultants/availability` - 상담사 가용성 수정

#### ConsultationController (`/api/consultations`)
- `GET /api/consultations` - 상담 목록 조회
- `POST /api/consultations` - 상담 생성
- `GET /api/consultations/{id}` - 상담 상세 조회
- `PUT /api/consultations/{id}` - 상담 수정
- `DELETE /api/consultations/{id}` - 상담 삭제

#### ScheduleController (`/api/schedules`)
- `GET /api/schedules` - 스케줄 목록 조회
- `POST /api/schedules` - 스케줄 생성
- `PUT /api/schedules/{id}` - 스케줄 수정
- `DELETE /api/schedules/{id}` - 스케줄 삭제
- `GET /api/schedules/availability` - 가용 시간 조회

### 4. 급여 관리

#### SalaryManagementController (`/api/admin/salary`)
- `GET /api/admin/salary/profiles/{consultantId}` - 급여 프로필 조회
- `POST /api/admin/salary/profiles` - 급여 프로필 생성
- `PUT /api/admin/salary/profiles/{id}` - 급여 프로필 수정
- `DELETE /api/admin/salary/profiles/{id}` - 급여 프로필 삭제
- `GET /api/admin/salary/grades` - 등급 목록 조회
- `GET /api/admin/salary/option-types` - 옵션 유형 조회
- `POST /api/admin/salary/calculate/freelance` - 프리랜서 급여 계산
- `POST /api/admin/salary/calculate/regular` - 정규직 급여 계산
- `GET /api/admin/salary/calculations/{consultantId}` - 급여 계산 내역
- `GET /api/admin/salary/export/pdf/{calculationId}` - PDF 급여 계산서
- `GET /api/admin/salary/export/excel/{calculationId}` - Excel 급여 계산서
- `POST /api/admin/salary/send-email/{calculationId}` - 급여 계산서 이메일 전송

### 5. ERP 시스템

#### ErpController (`/api/erp`)
- `GET /api/erp/items` - 아이템 목록 조회
- `POST /api/erp/items` - 아이템 생성
- `PUT /api/erp/items/{id}` - 아이템 수정
- `DELETE /api/erp/items/{id}` - 아이템 삭제
- `GET /api/erp/purchase-requests` - 구매 요청 목록
- `POST /api/erp/purchase-requests` - 구매 요청 생성
- `PUT /api/erp/purchase-requests/{id}` - 구매 요청 수정
- `GET /api/erp/purchase-orders` - 구매 주문 목록
- `POST /api/erp/purchase-orders` - 구매 주문 생성
- `GET /api/erp/budgets` - 예산 목록 조회
- `POST /api/erp/budgets` - 예산 생성

### 6. 결제 관리

#### PaymentController (`/api/payments`)
- `GET /api/payments` - 결제 목록 조회
- `POST /api/payments` - 결제 생성
- `PUT /api/payments/{id}` - 결제 수정
- `GET /api/payments/{id}` - 결제 상세 조회

### 7. 공통 기능

#### CommonCodeController (`/api/common-codes`)
- `GET /api/common-codes` - 공통 코드 목록 조회
- `GET /api/common-codes/{group}` - 그룹별 공통 코드 조회
- `POST /api/common-codes` - 공통 코드 생성
- `PUT /api/common-codes/{id}` - 공통 코드 수정
- `DELETE /api/common-codes/{id}` - 공통 코드 삭제

#### HomeController (`/api/home`)
- `GET /api/home/dashboard` - 대시보드 데이터
- `GET /api/home/statistics` - 통계 데이터

## 서비스 레이어

### 주요 서비스 클래스

#### 1. 사용자 관리 서비스
- **UserService**: 사용자 CRUD, 프로필 관리
- **AuthService**: 인증 및 권한 관리
- **OAuth2Service**: 소셜 로그인 처리

#### 2. 상담 관리 서비스
- **ConsultationService**: 상담 CRUD, 상태 관리
- **ScheduleService**: 스케줄 관리, 가용성 체크
- **ConsultantService**: 상담사 관리

#### 3. 급여 관리 서비스
- **SalaryCalculationService**: 급여 계산 로직
- **TaxCalculationService**: 세금 계산 로직
- **EmailService**: 이메일 전송

#### 4. ERP 서비스
- **ErpService**: ERP 관련 비즈니스 로직
- **ItemService**: 아이템 관리
- **PurchaseService**: 구매 관리

#### 5. 시스템 관리 서비스
- **AdminService**: 관리자 기능
- **CommonCodeService**: 공통 코드 관리
- **NotificationService**: 알림 관리

## 리포지토리 레이어

### 주요 리포지토리 인터페이스

#### 1. 사용자 관련
- **UserRepository**: 사용자 데이터 접근
- **UserAddressRepository**: 주소 데이터 접근
- **UserSessionRepository**: 세션 데이터 접근

#### 2. 상담 관련
- **ConsultationRepository**: 상담 데이터 접근
- **ScheduleRepository**: 스케줄 데이터 접근
- **ConsultantRepository**: 상담사 데이터 접근

#### 3. 급여 관련
- **SalaryCalculationRepository**: 급여 계산 데이터 접근
- **ConsultantSalaryProfileRepository**: 급여 프로필 데이터 접근

#### 4. ERP 관련
- **ItemRepository**: 아이템 데이터 접근
- **PurchaseRequestRepository**: 구매 요청 데이터 접근

## 보안 설정

### Spring Security 구성
- **OAuth2 로그인**: 카카오, 네이버 지원
- **세션 기반 인증**: HttpSession 사용
- **CORS 설정**: 프론트엔드 도메인 허용
- **역할 기반 접근 제어**: ROLE_CLIENT, ROLE_CONSULTANT, ROLE_ADMIN, ROLE_SUPER_ADMIN

### 데이터 보안
- **개인정보 암호화**: AES 암호화
- **세션 관리**: 자동 만료 및 정리
- **SQL 인젝션 방지**: JPA 사용

## 설정 파일

### application.yml
- **데이터베이스 설정**: MySQL 연결 정보
- **OAuth2 설정**: 클라이언트 ID, 시크릿
- **이메일 설정**: SMTP 서버 정보
- **캐시 설정**: Redis 연결 정보

### 프로파일별 설정
- **local**: 개발 환경 설정
- **prod**: 운영 환경 설정

## 로깅 및 모니터링

### 로깅 설정
- **SLF4J + Logback** 사용
- **로그 레벨**: DEBUG (개발), INFO (운영)
- **로그 파일**: application.log

### 모니터링
- **시스템 상태 확인**: `/api/health`
- **세션 모니터링**: 자동 정리 스케줄러
- **에러 추적**: 글로벌 예외 처리

## 배포 및 운영

### 빌드
```bash
mvn clean package
```

### 실행
```bash
java -jar target/consultation-management-1.0.0.jar
```

### 데이터베이스 마이그레이션
- **JPA 자동 DDL**: 개발 환경
- **수동 스크립트**: 운영 환경

## 버전 정보

- **현재 버전**: 1.0.0
- **Java 버전**: 17
- **Spring Boot 버전**: 3.2.0
- **React 버전**: 19.1.1
- **MySQL 버전**: 8.0+

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
