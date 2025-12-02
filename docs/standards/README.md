# MindGarden 표준 문서

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 표준 문서 목록

### 1. [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

MindGarden 프로젝트의 **핵심 표준 문서**입니다.

**주요 내용**:
- ✅ 테넌트 기반 역할 관리
- ✅ 기본 4-5개 역할 + 무제한 커스텀
- ✅ 업종별 역할 자동 생성
- ✅ 비즈니스 타입별 대시보드
- ✅ 권한 시스템 구현
- ✅ 테넌트 삭제 정책

**적용 범위**: 전체 시스템

---

### 2. [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

데이터베이스 설계 및 관리 표준입니다.

**주요 내용**:
- ✅ 테넌트 격리 전략
- ✅ 필수 컬럼 정의 (tenant_id, 감사 필드, 소프트 삭제)
- ✅ 명명 규칙
- ✅ 인덱스 전략
- ✅ 개인정보 암호화
- ❌ 브랜치 컬럼 사용 금지

**적용 범위**: 모든 테이블 설계

---

### 3. [API 설계 표준](./API_DESIGN_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

RESTful API 설계 및 구현 표준입니다.

**주요 내용**:
- ✅ `/api/v1/` 버전 관리
- ✅ RESTful 설계 원칙
- ✅ 테넌트 ID 헤더 전달
- ✅ 표준 응답 구조
- ✅ 에러 코드 체계
- ✅ 페이징/정렬/필터링
- ✅ 보안 고려사항

**적용 범위**: 모든 API 개발

---

### 4. [마이그레이션 가이드](./MIGRATION_GUIDE.md)
**우선순위**: ⭐⭐⭐⭐ (높음)

브랜치 시스템에서 테넌트 시스템으로 마이그레이션 가이드입니다.

**주요 내용**:
- ✅ 9주 마이그레이션 계획
- ✅ 데이터베이스 변환 SQL
- ✅ 백엔드 코드 마이그레이션
- ✅ 프론트엔드 마이그레이션
- ✅ 검증 및 테스트
- ✅ 롤백 계획

**적용 범위**: 기존 코드 마이그레이션

---

### 5. [테넌트 ID 생성 표준](./TENANT_ID_GENERATION_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

테넌트 ID 생성 규칙 및 전략을 정의합니다.

**주요 내용**:
- ✅ 3가지 생성 전략 (업종+지역, 테넌트명, UUID)
- ✅ 업종 코드 정규화 (consultation, academy, hospital 등)
- ✅ 지역 코드 정규화 (seoul, busan, gyeonggi 등)
- ✅ 순번 자동 생성 (001, 002, 003...)
- ✅ 중복 방지 로직
- ✅ 형식 검증 규칙
- ✅ 유틸리티 메서드

**생성 예시**:
```
tenant-seoul-consultation-001
tenant-busan-academy-002
tenant-gyeonggi-hospital-003
```

**적용 범위**: 모든 테넌트 생성

---

### 6. [권한 시스템 표준](./PERMISSION_SYSTEM_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

동적 권한 관리 시스템 설계 및 구현 표준입니다.

**주요 내용**:
- ✅ 2단계 권한 시스템 (ADMIN 자동 / 일반 사용자 동적)
- ✅ 권한 체크 흐름
- ✅ 권한 코드 목록 (CONSULTANT_MANAGE, CLIENT_MANAGE 등)
- ✅ Controller 구현 가이드
- ✅ role_permissions 테이블 구조
- ✅ 프론트엔드 권한 체크
- ✅ 테스트 가이드

**권한 체크 API**:
```
GET  /api/v1/permissions/my-permissions
POST /api/v1/permissions/check-permission
GET  /api/v1/permissions/role/{roleName}
POST /api/v1/permissions/role-permissions
```

**적용 범위**: 모든 권한 관리

---

### 7. [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

에러 처리 및 예외 관리 표준입니다.

**주요 내용**:
- ✅ GlobalExceptionHandler 중앙 집중식 처리
- ✅ 커스텀 예외 클래스 (EntityNotFoundException, ValidationException 등)
- ✅ 표준 에러 응답 형식
- ✅ HTTP 상태 코드 매핑
- ✅ 에러 코드 목록

**적용 범위**: 모든 예외 처리

---

### 8. [로깅 표준](./LOGGING_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐ (높음)

로깅 패턴 및 관리 표준입니다.

**주요 내용**:
- ✅ @Slf4j 어노테이션 사용
- ✅ 구조화된 로깅 (키-값 쌍)
- ✅ 로그 레벨 (DEBUG, INFO, WARN, ERROR)
- ✅ 민감한 정보 보호 (마스킹)
- ✅ 로그 레벨 설정

**적용 범위**: 모든 로깅

---

### 9. [DTO 네이밍 표준](./DTO_NAMING_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐ (높음)

DTO 네이밍 규칙 및 구조 표준입니다.

**주요 내용**:
- ✅ Request DTO ({Entity}CreateRequest, {Entity}UpdateRequest)
- ✅ Response DTO ({Entity}Response, {Entity}ListResponse)
- ✅ 검증 어노테이션 (@NotBlank, @Email 등)
- ✅ 정적 팩토리 메서드 (from(), fromList())
- ✅ 레거시 DTO 마이그레이션

**적용 범위**: 모든 DTO

---

### 10. [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

디자인 시스템 중앙화 및 표준화 가이드입니다.

**주요 내용**:
- ✅ CSS 변수 시스템 (1,026개 변수)
- ✅ BEM 네이밍 규칙 (mg-{component}-{element}--{modifier})
- ✅ 색상/간격/타이포그래피/레이아웃 토큰
- ✅ 컴포넌트 표준 (버튼, 카드, 모달)
- ✅ 테넌트 브랜딩 시스템

**적용 범위**: 모든 프론트엔드 디자인

---

### 11. [Stored Procedure 표준](./STORED_PROCEDURE_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐ (높음)

Stored Procedure 작성 및 관리 표준입니다.

**주요 내용**:
- ✅ 프로시저 네이밍 규칙 ({Action}{Entity})
- ✅ 파라미터 규칙 (p_{name}, v_{name})
- ✅ 에러 핸들러 구현
- ✅ 트랜잭션 관리
- ✅ Soft Delete 원칙
- ✅ 프로시저 유형별 템플릿

**적용 범위**: 모든 Stored Procedure

---

### 12. [공통 알림 시스템 표준](./NOTIFICATION_SYSTEM_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

통합 알림 시스템 표준입니다.

**주요 내용**:
- ✅ UnifiedNotification 컴포넌트
- ✅ NotificationManager 유틸리티
- ✅ 알림 타입 (toast, modal, banner)
- ✅ 알림 변형 (success, error, warning, info)
- ✅ 백엔드 알림 서비스 (카카오, SMS, 이메일)
- ✅ 시스템 내 알림 (Alert 테이블)
- ✅ **모바일 푸시 알림 (앱 개발용)**
  * FCM/APNs 통합
  * 푸시 알림 타입 및 우선순위
  * 토큰 관리 및 토픽 구독
  * 딥링크 규칙
  * 사용자 푸시 설정

**적용 범위**: 모든 알림 (웹, 모바일)

---

### 13. [공통코드 시스템 표준](./COMMON_CODE_SYSTEM_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

시스템 공통코드와 테넌트 공통코드 관리 표준입니다.

**주요 내용**:
- ✅ 단일 테이블 전략 (tenant_id 구분)
- ✅ CORE 코드 (시스템 전역, tenant_id = NULL)
- ✅ TENANT 코드 (테넌트별, tenant_id = UUID)
- ✅ CommonCode 엔티티 구조
- ✅ CodeGroupMetadata 엔티티
- ✅ 공통코드 조회 로직 (테넌트 우선)
- ✅ 테넌트 생성 시 기본 코드 복사
- ✅ 백엔드 하드코딩 금지 원칙
- ✅ 프론트엔드 API 유틸리티

**적용 범위**: 모든 공통코드 관리

---

### 14. [시스템 명칭 통일 표준](./SYSTEM_NAMING_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

CoreSolution 플랫폼의 시스템 명칭 통일 표준입니다.

**주요 내용**:
- ✅ MindGarden → CoreSolution 명칭 변경
- ✅ Core System vs Ops System 구분
- ✅ 온보딩 시스템 명칭 표준
  * Onboarding Request (온보딩 요청)
  * Onboarding Approval (온보딩 승인)
  * Onboarding Process (온보딩 프로세스)
- ✅ Ops 시스템 명칭 표준
  * Backend Ops (백엔드 운영 도구)
  * Frontend Ops (프론트엔드 운영 도구)
  * Trinity (트리니티 홈페이지)
- ✅ 폴더 구조 표준
- ✅ 패키지 구조 표준
- ✅ 네이밍 규칙 (DB, API, 환경변수)

**적용 범위**: 전체 프로젝트

---

### 15. [ERP 고도화 표준](./ERP_ADVANCEMENT_STANDARD.md)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

CoreSolution 플랫폼의 ERP 시스템 고도화 표준입니다.

**주요 내용**:
- ✅ **테넌트별 ERP 완전 독립** ⭐ 핵심
  * 각 테넌트는 독립적인 ERP 시스템
  * 회계 계정 체계 테넌트별 독립
  * 분개 번호 체계 테넌트별 독립
  * 크로스 테넌트 접근 절대 금지
- ✅ 분개 시스템 완성 (차변/대변 검증)
- ✅ 원장 시스템 (계정별 원장 자동 생성)
- ✅ 재무제표 자동 생성 (손익계산서, 재무상태표)
- ✅ 정산 자동화 (업종별 정산 규칙 엔진)
- ✅ 부가세 관리 (자동 계산 및 신고서 생성)
- ✅ 인사 관리 (직원 정보, 근태, 휴가)
- ✅ 4단계 구현 일정 (5주)

**적용 범위**: 모든 ERP 기능

---

## 🎯 표준 준수 원칙

### 필수 준수 사항
1. **테넌트 기반 개발** - 모든 데이터는 테넌트별로 격리
2. **브랜치 개념 금지** - `branchCode`, `branchId` 사용 금지
3. **역할 동적 관리** - 테넌트별 역할 생성/수정/삭제
4. **소프트 삭제 원칙** - 하드 삭제 금지
5. **API 버전 관리** - `/api/v1/` 필수

### 금지 사항
- ❌ `branchCode`, `branchId` 변수 사용
- ❌ 지점별 필터링 로직
- ❌ 전역 역할 (테넌트 무관)
- ❌ 비즈니스 타입 변경
- ❌ 하드 삭제 (법적 요구 시 제외)
- ❌ URL에 테넌트 ID 노출
- ❌ 버전 없는 API (`/api/users`)

---

## 📖 문서 사용 가이드

### 신규 개발자
1. **필독**: [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
2. **참조**: [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
3. **참조**: [API 설계 표준](./API_DESIGN_STANDARD.md)

### 기존 코드 수정
1. **확인**: [마이그레이션 가이드](./MIGRATION_GUIDE.md)
2. **적용**: 표준 문서 기준으로 리팩토링

### 새 기능 개발
1. **설계**: 표준 문서 기준으로 설계
2. **구현**: 표준 준수 확인
3. **리뷰**: 체크리스트 확인

---

## ✅ 개발 체크리스트

### 데이터베이스
- [ ] `tenant_id` 컬럼 추가
- [ ] 감사 필드 추가 (created_at, updated_at, created_by, updated_by)
- [ ] 소프트 삭제 필드 추가 (is_deleted, deleted_at)
- [ ] 브랜치 관련 컬럼 없음 확인
- [ ] 테넌트 포함 유니크 키 생성

### API
- [ ] `/api/v1/` 접두사 사용
- [ ] 테넌트 ID 헤더 검증
- [ ] 표준 응답 구조 사용
- [ ] 에러 처리 구현
- [ ] 페이징 구현 (목록 API)
- [ ] API 문서화 (Swagger)

### 백엔드
- [ ] 테넌트 컨텍스트 사용
- [ ] 브랜치 로직 제거
- [ ] 권한 체크 구현
- [ ] 소프트 삭제 구현
- [ ] 단위 테스트 작성

### 프론트엔드
- [ ] 테넌트 컨텍스트 사용
- [ ] 브랜치 UI 제거
- [ ] API 호출 시 헤더 포함
- [ ] 에러 처리 구현

---

## 🔄 표준 문서 업데이트

### 업데이트 절차
1. **제안**: 변경 사유 및 영향 범위 분석
2. **리뷰**: 팀 리뷰 및 아키텍처 검토
3. **승인**: 프로젝트 관리자 승인
4. **적용**: 문서 업데이트 및 버전 관리

### 변경 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-02 | 1.0.0 | 초기 표준 문서 작성 | 아키텍처 팀 |

---

## 📞 문의

표준 문서 관련 문의:
- 프로젝트 관리자
- 아키텍처 팀

**최종 업데이트**: 2025-12-02

