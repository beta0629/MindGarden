# Changelog

All notable changes to this project will be documented in this file.

## [2025-09-14] - 429 오류 해결 및 시스템 최적화

### 🐛 버그 수정
- **429 Too Many Requests 오류 완전 해결**
  - ClientSelector 컴포넌트의 개별 내담자 API 호출 문제 해결
  - MappingCard 컴포넌트의 개별 상태 정보 API 호출 문제 해결
  - RateLimitingFilter 임계값을 초당 100 → 200 요청으로 증가 (개발 환경)

### ⚡ 성능 개선
- **API 호출 최적화**
  - 개별 API 호출을 일괄 처리로 변경
  - API 호출 횟수 대폭 감소 (N * 3번 → 1번)
  - 네트워크 트래픽 최적화

- **데이터 로딩 패턴 개선**
  - ClientSelector: `loadAllClientMappings` 함수로 상담사별 매핑 정보 일괄 조회
  - MappingManagement: `loadMappingStatusInfo` 함수로 매핑 상태 정보 일괄 로드
  - Props 기반 데이터 전달 구조로 컴포넌트 간 효율적 데이터 공유

### 🔧 기술적 개선
- **에러 핸들링 강화**
  - API 실패 시 기본값 설정 메커니즘
  - 폴백 데이터 구조 개선
  - 사용자 경험 향상을 위한 안정적인 동작 보장

- **컴포넌트 구조 개선**
  - MappingCard에서 개별 API 호출 제거
  - 상태 정보를 props로 받아 사용하는 구조로 변경
  - 불필요한 useEffect 및 useState 제거

## [2025-01-11] - 내담자 대시보드 개인화 및 UX 개선

### 🆕 새로운 기능
- **내담자 맞춤형 메시지 시스템**
  - 매핑 상태, 상담 진행 상황, 결제 상태 기반 동적 메시지 생성
  - 신규 내담자, 대기 중, 활성 매핑, 완료된 상담 등 상황별 맞춤 메시지
  - 실시간 날씨 정보 통합 (OpenWeatherMap API)
  - 일일 팁 시스템 (7가지 팁 순환)

- **내담자 대시보드 개선**
  - "오늘의 상담" 큰 카드로 중요 정보 강조
  - 그라데이션 배경과 반투명 효과로 시각적 임팩트
  - 상담 일정 상세 정보 표시 (시간, 상담사, 상태)
  - 중복 카드 제거로 깔끔한 UI

- **상담사 목록 모달**
  - 상담사가 있으면 목록을 모달로 표시
  - 상담사가 없으면 안내 메시지와 연결 권유
  - 반응형 디자인으로 모바일 지원

- **내담자 빠른 액션 페이지**
  - 일정 페이지 (`/client/schedule`): 풀 캘린더 뷰
  - 도움말 페이지 (`/help`): 카테고리별 도움말
  - 설정 페이지 (`/client/settings`): 알림, 개인정보, 언어 설정

### 🔧 개선사항
- **공통 헤더 개선**
  - 조건부 뒤로가기 버튼 추가
  - 동적 제목 설정 지원
  - 중복 헤더 문제 해결

- **OAuth2 로그인 개선**
  - JWT secret key Base64 오류 수정
  - OAuth2 리다이렉트 URL 동적 처리
  - Referer 헤더 null 값 필터링
  - 프로퍼티 기반 프론트엔드 URL 설정

- **API 오류 해결**
  - 내담자 매핑 API 500 에러 임시 해결
  - 기본값 설정으로 대시보드 안정성 향상

### 📝 기술적 변경사항
- **새로운 컴포넌트**:
  - `ClientPersonalizedMessages.js`: 내담자 맞춤형 메시지 시스템
  - `WeatherCard.js`: 실시간 날씨 정보 표시
  - `ConsultantListModal.js`: 상담사 목록 모달
  - `ClientSchedule.js`: 내담자 일정 페이지
  - `HelpPage.js`: 도움말 페이지
  - `ClientSettings.js`: 내담자 설정 페이지

- **수정된 컴포넌트**:
  - `SimpleHeader.js`: 뒤로가기 버튼 및 동적 제목 지원
  - `SimpleLayout.js`: 제목 prop 전달 지원
  - `WelcomeSection.js`: 내담자용 큰 상담 카드
  - `CommonDashboard.js`: 중복 제거 및 API 오류 처리
  - `ClientPersonalizedMessages.js`: 클릭 핸들러 및 모달 통합

- **설정 파일 업데이트**:
  - `application-local.yml`: JWT secret, 암호화 키, 프론트엔드 URL
  - `application-prod.yml`: 프로덕션 프론트엔드 URL
  - `application.yml`: 기본 프론트엔드 URL

### 🐛 버그 수정
- OAuth2 로그인 시 `http://null/client/dashboard` 리다이렉트 오류
- 네이버 로그인 JWT 토큰 검증 실패
- 내담자 대시보드 API 500 에러
- 중복 카드 렌더링 문제
- 불필요한 "자세히 보기" 링크 표시

### 🎨 UI/UX 개선
- 연한 파스텔톤 색상 테마 적용
- 카드 호버 효과 및 트랜지션
- 반응형 그리드 레이아웃
- 인라인 CSS 스타일링
- 컴포넌트 재사용성 향상

## [2025-01-11] - 재무 거래 공통 코드 시스템 구축

### 🆕 새로운 기능
- **재무 거래 공통 코드 시스템**
  - 재무 거래 관련 모든 항목을 공통 코드로 관리
  - 거래 유형: INCOME, EXPENSE
  - 수입 카테고리: 상담료, 패키지, 기타수입
  - 지출 카테고리: 급여, 임대료, 관리비, 사무용품, 세금, 마케팅, 장비, 소프트웨어, 컨설팅, 기타잡비
  - 수입/지출 세부 항목 23개 추가
  - 부가세 적용 여부 관리

- **통합 재무 관리 시스템**
  - 수입/지출 통합 대시보드
  - 대차대조표 및 손익계산서
  - 일/월/년 단위 재무 리포트
  - 자동 부가세 계산 시스템
  - 반복 지출 관리 시스템

- **ERP 시스템 확장**
  - 구매 요청 승인 시 자동 지출 거래 생성
  - 급여 계산 시 자동 지출 거래 생성
  - 결제 승인 시 자동 수입 거래 생성
  - 적립금 자동 생성 시스템

### 🔧 개선사항
- **공통 코드 기반 관리**
  - 하드코딩된 문자열 제거
  - 데이터 일관성 및 확장성 향상
  - 중앙 집중식 코드 관리

- **프론트엔드 개선**
  - 공통 코드 API 기반 드롭다운 구성
  - 빠른 지출 등록 기능
  - 실시간 재무 데이터 표시
  - 연한 파스텔톤 디자인 적용

### 📝 기술적 변경사항
- **새로운 클래스**:
  - `FinancialCommonCodeInitializer`: 재무 거래 공통 코드 초기화
  - `FinancialTransaction`: 재무 거래 엔티티
  - `FinancialTransactionService`: 재무 거래 관리 서비스
  - `TaxCalculationUtil`: 부가세 계산 유틸리티
  - `RecurringExpenseService`: 반복 지출 관리 서비스
  - `ReserveFundService`: 적립금 관리 서비스
  - `FinancialTransactionForm.js`: 재무 거래 등록 폼
  - `QuickExpenseForm.js`: 빠른 지출 등록 컴포넌트
  - `IntegratedFinanceDashboard.js`: 통합 재무 대시보드

- **수정된 클래스**:
  - `ErpServiceImpl`: 공통 코드 기반 카테고리 관리
  - `ErpController`: 재무 관련 API 엔드포인트 추가
  - `PaymentServiceImpl`: 자동 수입 거래 생성
  - `SalaryCalculationServiceImpl`: 자동 지출 거래 생성
  - `CommonCodeService`: Map 형태 조회 메서드 추가

## [2025-01-11] - 공통코드 시스템 통합 및 스케줄 관리 개선

### 🆕 새로운 기능
- **공통코드 시스템 통합**
  - `code_groups`와 `code_values` 테이블을 `common_codes` 테이블로 통합
  - 기존 38개 코드 그룹 데이터를 새로운 시스템으로 마이그레이션
  - 통합된 공통코드 관리 시스템 구현

- **스케줄 관리 개선**
  - 지난 시간 슬롯 비활성화 및 시각적 구분 추가
  - 상담 시간 변경 시 동적으로 시간 슬롯 업데이트 기능
  - 스케줄 세부사항에서 선택한 시간을 시작-종료 시간으로 명확하게 표시
  - 100분 상담 시간 선택 시 올바른 시간 표시 기능

### 🔧 개선사항
- **API 엔드포인트 통합**
  - 모든 프론트엔드 컴포넌트에서 `/api/admin/common-codes/values` 사용
  - 기존 `/api/admin/codes/values` 엔드포인트 호환성 유지
  - 데이터 구조 통일 (`codeValue`, `codeLabel`, `codeDescription`)

- **세션 관리 개선**
  - 로그인 전 401 오류를 조용히 처리하도록 수정
  - 세션 체크 중 불필요한 콘솔 오류 제거
  - 사용자 경험 개선

- **스케줄 생성 검증**
  - `endTime` NaN 오류 해결
  - 상담 시간 유효성 검증 강화
  - 시간 슬롯 충돌 방지 로직 개선

### 🗑️ 제거된 기능
- **기존 코드 관리 시스템**
  - `code_groups` 및 `code_values` 테이블 삭제
  - `CodeInitializationServiceImpl` 비활성화
  - 중복된 코드 관리 로직 제거

### 📝 기술적 변경사항
- **새로운 클래스**:
  - `CommonCodeController`: 통합된 공통코드 관리 API
  - `CodeMigrationService`: 기존 데이터 마이그레이션 서비스
- **수정된 클래스**:
  - `CommonCodeServiceImpl`: 통합된 공통코드 서비스 구현
  - `ScheduleModal.js`: 스케줄 생성 UI 개선
  - `TimeSlotGrid.js`: 동적 시간 슬롯 관리
  - 47개 프론트엔드 컴포넌트: API 엔드포인트 및 데이터 구조 업데이트

## [2025-01-10] - 이메일 시스템 구현 및 브랜드명 변경

### 🆕 새로운 기능
- **실제 이메일 발송 시스템**
  - Gmail SMTP를 통한 실제 이메일 발송 기능 구현
  - JavaMailSender를 활용한 MIME 메시지 생성 및 발송
  - 이메일 템플릿 시스템 (환영, 승인, 알림 등)
  - 이메일 발송 상태 추적 및 재시도 기능

- **이메일 테스트 시스템**
  - EmailTestController를 통한 이메일 발송 테스트 API
  - MockEmailServiceImpl을 통한 테스트 모드 지원
  - 이메일 발송 제한 및 통계 기능

- **브랜드명 통일**
  - "마음정원"을 "mindgarden"으로 전면 변경
  - 이메일 제목, 발신자명, 템플릿 내용 일관성 확보
  - 모든 서비스에서 브랜드명 통일

### 🔧 개선사항
- **이메일 설정 관리**
  - application-local.yml에 Gmail SMTP 설정 추가
  - 환경별 이메일 설정 분리 (로컬/운영)
  - 이메일 발송 모드 전환 기능 (실제/Mock)

- **보안 설정**
  - 이메일 테스트 API 접근 권한 설정
  - Gmail App Password를 통한 안전한 인증

### 📝 기술적 변경사항
- **의존성 추가**: spring-boot-starter-mail
- **새로운 클래스**:
  - EmailConfig: JavaMailSender 설정
  - EmailTestController: 이메일 테스트 API
  - MockEmailServiceImpl: 테스트용 이메일 서비스
- **수정된 클래스**:
  - EmailServiceImpl: 실제 SMTP 발송 로직 구현
  - EmailConstants: 브랜드명 변경
  - 모든 서비스 클래스: 이메일 변수 업데이트

## [2025-01-09] - 중복 로그인 방지 시스템 구현

### 🆕 새로운 기능
- **중복 로그인 방지 시스템**
  - 사용자 세션 추적 및 관리 시스템 구현
  - 중복 로그인 감지 시 기존 세션 자동 종료
  - 실시간 중복 로그인 체크 및 알림 기능
  - 세션 만료 자동 정리 시스템

- **사용자 세션 관리**
  - UserSession 엔티티로 세션 정보 저장
  - 클라이언트 IP, User Agent, 로그인 타입 추적
  - 세션 생성/종료/연장 관리
  - 세션 통계 및 모니터링 기능

- **프론트엔드 중복 로그인 감지**
  - DuplicateLoginAlert 컴포넌트 구현
  - 자동 로그아웃 카운트다운 기능
  - 중복 로그인 감지 시 사용자 알림
  - 주기적 세션 상태 확인 (30초 간격)

### 🔧 개선사항
- **보안 강화**
  - 세션 기반 인증 시스템 강화
  - 의심스러운 활동 감지 기능
  - 세션 만료 자동 정리 (스케줄러)
  - 강제 로그아웃 기능 (관리자용)

- **사용자 경험 개선**
  - 중복 로그인 시 명확한 알림 제공
  - 자동 로그아웃 전 사용자 확인 시간 제공
  - 세션 상태 실시간 모니터링

### 🛠️ 기술적 개선
- **백엔드 아키텍처**
  - UserSessionService 인터페이스 및 구현체
  - SessionManagementConstants 상수 관리
  - SessionCleanupScheduler 자동 정리
  - AuthService 중복 로그인 체크 로직

- **데이터베이스 설계**
  - user_sessions 테이블 자동 생성 (Hibernate DDL)
  - 세션 관련 인덱스 최적화
  - 세션 만료 시간 관리

- **API 엔드포인트**
  - `/api/auth/check-duplicate-login` - 중복 로그인 체크
  - `/api/auth/force-logout` - 강제 로그아웃
  - 세션 정보 조회 및 관리

### 🐛 버그 수정
- 최초 로그인 시 중복 로그인 감지 오류 해결
- 현재 세션을 제외한 정확한 중복 감지 로직 구현
- 프론트엔드 중복 로그인 체크 타이밍 최적화

---

## [2025-01-09] - 휴가 관리 시스템 대폭 개선

### 🆕 새로운 기능
- **세밀한 반반차 휴가 유형 추가**
  - 오전 반반차 1: 09:00-11:00 (2시간)
  - 오전 반반차 2: 11:00-13:00 (2시간)
  - 오후 반반차 1: 14:00-16:00 (2시간)
  - 오후 반반차 2: 16:00-18:00 (2시간)

- **관리자 휴가 등록 기능**
  - 스케줄 페이지에서 "휴가 등록" 버튼 추가
  - 상담사별 휴가 직접 등록 가능
  - 휴가 유형별 자동 시간 설정
  - 휴가 사유 입력 기능

- **스마트 스케줄 제한 시스템**
  - 휴가 중인 시간대 자동 제한
  - 반반차 휴가 시 정확한 2시간만 제한
  - 점심시간(13:00-14:00) 항상 사용 가능

### 🔧 개선사항
- **휴가 정보 표시 개선**
  - 캘린더에서 휴가 유형별 정확한 시간 범위 표시
  - 이모지를 활용한 직관적 표시
  - 휴가 상세 모달에서 상세 정보 표시

- **API 응답 구조 개선**
  - 휴가 정보 API 응답 구조 통일
  - 상담사별 휴가 정보 필터링 개선

- **데이터베이스 스키마 업데이트**
  - `vacations` 테이블 ENUM 확장
  - 새로운 휴가 유형 코드 값 추가
  - 기존 데이터 마이그레이션 스크립트 제공

### 🐛 버그 수정
- 휴가 정보가 스케줄 등록 시 제대로 반영되지 않던 문제 해결
- API 응답 구조 불일치로 인한 휴가 정보 로드 실패 수정
- 반반차 휴가 시 잘못된 시간대 제한 문제 해결
- 휴가 상세 모달에서 휴가 유형 표시 오류 수정

### 🔄 백엔드 변경사항
- `VacationType` enum에 새로운 반반차 유형 추가
- `ConsultantAvailabilityServiceImpl` 휴가 시간 확인 로직 개선
- `ScheduleServiceImpl` 휴가 데이터 매핑 개선
- `ScheduleDto`에 `vacationType` 필드 추가

### 🎨 프론트엔드 변경사항
- `VacationManagementModal.js`: 새로운 반반차 유형 지원
- `TimeSlotGrid.js`: 휴가 시간 확인 로직 개선
- `ScheduleDetailModal.js`: 휴가 유형별 표시 개선
- API 응답 구조에 맞춘 데이터 처리 로직 수정

### 📊 데이터베이스 변경사항
- `vacations` 테이블 `vacation_type` ENUM 확장
- `code_values` 테이블에 새로운 휴가 유형 코드 추가
- 기존 `MORNING_HALF`, `AFTERNOON_HALF` 데이터 마이그레이션

### 📚 문서 업데이트
- 휴가 시스템 업데이트 상세 문서 추가 (`docs/VACATION_SYSTEM_UPDATE.md`)
- README.md에 휴가 관리 시스템 기능 추가
- API 문서 업데이트

### 🧪 테스트
- 새로운 반반차 휴가 유형 등록 테스트
- 스케줄 등록 시 휴가 시간 제한 테스트
- 휴가 정보 표시 정확성 테스트
- API 엔드포인트 통합 테스트

---

## [이전 버전들]

### [2025-01-08] - 초기 개발
- 기본 상담 관리 시스템 구축
- OAuth2 소셜 로그인 구현
- 사용자 역할 기반 접근 제어
- 기본 스케줄 관리 기능
- 상담사-내담자 매핑 시스템
