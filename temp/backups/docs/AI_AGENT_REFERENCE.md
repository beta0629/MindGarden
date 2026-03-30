# AI Agent Reference - 통합 상담관리 시스템

## 📋 핵심 문서 목록

### **필수 준수 문서**
- `docs/SYSTEM_DESIGN.md` - 시스템 아키텍처 및 설계 원칙
- `docs/API_DESIGN.md` - API 설계 및 엔드포인트 정의
- `docs/DESIGN_GUIDE.md` - UI/UX 디자인 가이드라인
- `docs/DEVELOPMENT_GUIDE.md` - 개발 가이드라인 및 코딩 표준
- `docs/FOLDER_STRUCTURE.md` - 프로젝트 폴더 구조 및 파일 정리

### **구현 우선순위**
1. **Phase 1**: 핵심 엔티티 및 상수 클래스 ✅
2. **Phase 2**: 기본 Repository 및 Service 계층 ✅
3. **Phase 3**: Spring Security 및 JWT 인증 ✅
4. **Phase 4**: Thymeleaf 템플릿 및 레이아웃 ✅
5. **Phase 5**: 상담관리 및 상담사 서비스 계층 ✅
6. **Phase 6**: 인증 및 사용자 관리 API ✅
7. **Phase 7**: 공통 JavaScript 모듈 및 AJAX 통신
8. **Phase 8**: SNS 로그인 통합
9. **Phase 9**: 대시보드 컴포넌트 모듈화
10. **Phase 10**: 알림 및 오류 메시지 시스템 완성
11. **Phase 11**: 테스트 및 배포

### **핵심 클래스 및 인터페이스**

#### **Base Classes (공통 기반 클래스)**
- `BaseEntity` - 모든 엔티티의 기본 클래스 ✅
- `BaseRepository<T, ID>` - 모든 Repository의 기본 인터페이스 ✅
- `BaseService<T, ID>` - 모든 Service의 기본 인터페이스 ✅
- `BaseServiceImpl<T, ID>` - BaseService의 기본 구현체 ✅
- `BaseController<T, ID>` - 모든 Controller의 기본 인터페이스 ✅

#### **Exception Classes (예외 처리)**
- `EntityNotFoundException` - 엔티티를 찾을 수 없을 때 ✅
- `ValidationException` - 데이터 검증 실패 시 ✅

#### **Constant Classes (상수 정의)**
- `UserRole` / `UserRoles` - 사용자 역할 상수 ✅
- `UserGrade` / `UserGrades` - 사용자 등급 상수 ✅
- `Gender` - 성별 상수 ✅
- `AgeGroup` - 연령대 상수 ✅
- `AddressType` - 주소 타입 상수 ✅
- `AlertType` - 알림 타입 상수 ✅
- `ConsultationStatus` - 상담 상태 상수 ✅
- `PaymentStatus` - 결제 상태 상수 ✅
- `FileType` - 파일 타입 상수 ✅

#### **Entity Classes (엔티티)**
- `User` - 사용자 기본 엔티티 ✅
- `Client` - 내담자 상세 엔티티 ✅
- `Consultant` - 상담사 상세 엔티티 ✅
- `UserAddress` - 통합 주소 관리 엔티티 ✅
- `Consultation` - 상담 엔티티 ✅
- `ConsultationRecord` - 상담 기록 엔티티 ✅
- `Schedule` - 스케줄 엔티티 ✅
- `ClientConsultantMapping` - 내담자-상담사 매핑 엔티티 ✅
- `UserSocialAccount` - SNS 계정 연동 엔티티 ✅
- `Alert` - 알림 엔티티 ✅
- `ErrorMessage` - 오류 메시지 엔티티 ✅

#### **Repository Interfaces**
- `UserRepository` - 사용자 데이터 접근 ✅
- `ConsultationRepository` - 상담 데이터 접근 ✅
- `ConsultantRepository` - 상담사 데이터 접근 ✅
- `AlertRepository` - 알림 데이터 접근 ✅

#### **Service Interfaces & Implementations**
- `UserService` / `UserServiceImpl` - 사용자 관리 서비스 ✅
- `AlertService` / `AlertServiceImpl` - 알림 관리 서비스 ✅
- `ConsultationService` / `ConsultationServiceImpl` - 상담 관리 서비스 ✅
- `ConsultantService` / `ConsultantServiceImpl` - 상담사 관리 서비스 ✅
- `AuthService` / `AuthServiceImpl` - 인증 관리 서비스 ✅
- `JwtService` - JWT 토큰 관리 서비스 ✅
- `CustomUserDetailsService` - 사용자 인증 정보 로드 ✅

#### **Controller Classes**
- `HomeController` - 홈페이지 및 공개 페이지 ✅
- `UserController` - 사용자 관리 API ✅
- `AuthController` - 인증 API ✅
- `ConsultationController` - 상담 관리 API ✅
- `ConsultantController` - 상담사 관리 API ✅
- `TabletController` - 태블릿 전용 API ✅

#### **Configuration Classes**
- `SecurityConfig` - Spring Security 설정 ✅
- `JwtAuthenticationFilter` - JWT 인증 필터 ✅
- `CustomAuthenticationEntryPoint` - 인증 실패 처리 ✅
- `CustomAccessDeniedHandler` - 접근 거부 처리 ✅
- `DevelopmentConfig` - 개발 환경 설정 ✅

#### **Utility Classes**
- `JwtService` - JWT 토큰 관리 ✅
- `CustomUserDetailsService` - 사용자 인증 정보 로드 ✅

#### **DTO Classes (데이터 전송 객체)**
- `AuthRequest` - 인증 요청 DTO ✅
- `AuthResponse` - 인증 응답 DTO ✅
- `RegisterRequest` - 회원가입 요청 DTO ✅
- `UserDto` - 사용자 데이터 DTO ✅
- `ErrorResponse` - 오류 응답 DTO ✅

#### **Exception Classes (예외 처리)**
- `EntityNotFoundException` - 엔티티를 찾을 수 없을 때 ✅
- `ValidationException` - 데이터 검증 실패 시 ✅
- `GlobalExceptionHandler` - 전역 예외 처리 핸들러 ✅

### **업데이트 완료 사항**
- `UserAddress` 엔티티로 `ClientAddress`와 `ConsultantAddress` 통합 완료 ✅
- 상속 구조에서 `Client`와 `Consultant`가 `User`를 상속하는 구조 ✅
- Hibernate `ddl-auto: create-drop` 설정으로 개발용 테이블 스키마 적용 ✅
- Hibernate 스키마 생성 오류 해결 완료 ✅

### **현재 구현 상태**
- ✅ 기본 엔티티 구조 완성 (12개 엔티티)
- ✅ Repository 계층 완성 (5개 Repository)
- ✅ Service 계층 완성 (7개 Service)
- ✅ Controller 계층 완성 (6개 Controller)
- ✅ Spring Security 설정 완성
- ✅ JWT 인증 시스템 완성
- ✅ 인증 및 사용자 관리 API 완성
- ✅ 상담 관리 및 상담사 관리 시스템 완성
- ✅ Thymeleaf 템플릿 구조 완성
- ✅ 예외 처리 클래스 완성
- ✅ 상수 클래스 완성 (9개 상수 클래스)
- ✅ DTO 클래스 완성 (5개 DTO)
- ⏳ 공통 JavaScript 모듈 구현 예정
- ⏳ SNS 로그인 통합 예정

### **다음 단계**
1. 공통 JavaScript 모듈 구현 (AJAX, Router, Components)
2. SNS 로그인 통합 (Kakao, Naver, Facebook)
3. 대시보드 컴포넌트 모듈화
4. 실시간 알림 시스템 완성
5. 테스트 코드 작성 및 배포 준비

---

## 📝 문서 업데이트 규칙

### **"Document-First Principle" 워크플로우**
1. **요구사항 분석** → 관련 문서 업데이트
2. **설계 검토** → 시스템 설계 문서 반영
3. **구현 계획** → 개발 가이드 문서 업데이트
4. **코드 구현** → 실제 코드 작성
5. **테스트 및 검증** → 문서와 코드 일치성 확인

### **문서 업데이트 체크리스트**
- [ ] 새로운 클래스/인터페이스 추가 시 문서 반영
- [ ] 기존 클래스 수정 시 관련 문서 업데이트
- [ ] API 변경 시 API 설계 문서 수정
- [ ] 디자인 변경 시 디자인 가이드 업데이트
- [ ] 폴더 구조 변경 시 구조 문서 수정

---

## 🚀 빠른 참조 체크리스트

### **개발 시작 전 확인사항**
- [ ] 모든 변수가 상수로 정의되었는가?
- [ ] Hibernate `ddl-auto: update` 설정이 적용되었는가?
- [ ] 공통화 및 캡슐화 원칙이 준수되었는가?
- [ ] 디바이스별 최적화가 적용되었는가?
- [ ] 데이터 무결성 원칙이 준수되었는가?

### **코드 품질 체크사항**
- [ ] 하드코딩이나 폴백 데이터가 없는가?
- [ ] 공통 알림/오류 시스템이 적용되었는가?
- [ ] 사용자 등급 시스템이 구현되었는가?
- [ ] 주소 관리가 `UserAddress`로 통합되었는가?
- [ ] 상담 관리 엔티티가 완성되었는가?

### **보안 체크사항**
- [ ] Spring Security가 올바르게 설정되었는가?
- [ ] JWT 인증이 구현되었는가?
- [ ] 개인정보 암호화가 적용되었는가?
- [ ] 권한 관리가 RBAC로 구현되었는가?
