# MindGarden 프로젝트 표준 문서

## 🎯 공식 표준

### 표준 문서 위치
모든 표준 문서는 **`docs/standards/`** 폴더에 있습니다.

📁 **[표준 문서 폴더로 이동](./standards/)**

### 핵심 표준 문서 (4개)

1. **[테넌트 역할 시스템 표준](./standards/TENANT_ROLE_SYSTEM_STANDARD.md)** ⭐⭐⭐⭐⭐
   - 테넌트 기반 역할 관리
   - 업종별 대시보드 자동 생성
   - 권한 시스템 구현

2. **[데이터베이스 스키마 표준](./standards/DATABASE_SCHEMA_STANDARD.md)** ⭐⭐⭐⭐⭐
   - 테넌트 격리 전략
   - 필수 컬럼 정의
   - 소프트 삭제 구현

3. **[API 설계 표준](./standards/API_DESIGN_STANDARD.md)** ⭐⭐⭐⭐⭐
   - RESTful API 설계
   - 버전 관리 (/api/v1/)
   - 표준 응답 구조

4. **[마이그레이션 가이드](./standards/MIGRATION_GUIDE.md)** ⭐⭐⭐⭐
   - 브랜치 → 테넌트 변환
   - 9주 마이그레이션 계획
   - 롤백 절차

5. **[테넌트 ID 생성 표준](./standards/TENANT_ID_GENERATION_STANDARD.md)** ⭐⭐⭐⭐⭐
   - 업종 + 지역 기반 생성
   - 자동 순번 관리
   - 형식 검증 규칙

6. **[권한 시스템 표준](./standards/PERMISSION_SYSTEM_STANDARD.md)** ⭐⭐⭐⭐⭐
   - 동적 권한 관리
   - ADMIN 자동 권한 부여
   - 일반 사용자 DB 기반 권한

7. **[에러 처리 표준](./standards/ERROR_HANDLING_STANDARD.md)** ⭐⭐⭐⭐⭐
   - GlobalExceptionHandler
   - 커스텀 예외 클래스
   - 표준 에러 응답

8. **[로깅 표준](./standards/LOGGING_STANDARD.md)** ⭐⭐⭐⭐
   - @Slf4j 어노테이션
   - 구조화된 로깅
   - 민감한 정보 보호

9. **[DTO 네이밍 표준](./standards/DTO_NAMING_STANDARD.md)** ⭐⭐⭐⭐
   - Request/Response DTO
   - 검증 어노테이션
   - 정적 팩토리 메서드

10. **[디자인 중앙화 표준](./standards/DESIGN_CENTRALIZATION_STANDARD.md)** ⭐⭐⭐⭐⭐
    - CSS 변수 시스템
    - BEM 네이밍 규칙
    - 테넌트 브랜딩

11. **[Stored Procedure 표준](./standards/STORED_PROCEDURE_STANDARD.md)** ⭐⭐⭐⭐
    - 프로시저 네이밍
    - 에러 핸들러
    - 트랜잭션 관리

12. **[공통 알림 시스템 표준](./standards/NOTIFICATION_SYSTEM_STANDARD.md)** ⭐⭐⭐⭐⭐
    - UnifiedNotification 컴포넌트
    - 백엔드 알림 서비스
    - 모바일 푸시 알림 (FCM/APNs)

13. **[공통코드 시스템 표준](./standards/COMMON_CODE_SYSTEM_STANDARD.md)** ⭐⭐⭐⭐⭐
    - CORE/TENANT 코드 구분
    - 단일 테이블 전략
    - 하드코딩 금지 원칙

14. **[시스템 명칭 통일 표준](./standards/SYSTEM_NAMING_STANDARD.md)** ⭐⭐⭐⭐⭐
    - MindGarden → CoreSolution
    - 온보딩 시스템 명칭
    - Ops 시스템 명칭

15. **[ERP 고도화 표준](./standards/ERP_ADVANCEMENT_STANDARD.md)** ⭐⭐⭐⭐⭐ ⭐ 신규
    - 테넌트별 ERP 완전 독립
    - 분개/원장/재무제표 시스템
    - 정산 자동화
    - 부가세/인사 관리

---

## 📋 핵심 원칙

### 1. 테넌트 기반 아키텍처
- ✅ 모든 데이터는 테넌트별로 격리
- ✅ 역할은 테넌트별로 관리
- ❌ 브랜치(지점) 개념 사용 금지

### 2. 역할 관리
- 기본 4-5개 역할 자동 생성
- 커스텀 역할 무제한 생성 가능
- 역할별 권한 동적 관리

### 3. 비즈니스 타입
- 온보딩 시 선택 (CONSULTATION, ACADEMY, HOSPITAL)
- 생성 후 변경 불가
- 업종별 자동 대시보드 생성

### 4. 데이터 관리
- 소프트 삭제 원칙
- 법적 보존 의무 준수
- 90일 이내 복구 가능

---

## 🚫 금지 사항

### 절대 사용 금지
1. ❌ `branchCode`, `branchId` 변수
2. ❌ 지점별 필터링 로직
3. ❌ 전역 역할 (테넌트 무관)
4. ❌ 하드코딩된 역할/권한
5. ❌ 비즈니스 타입 변경 로직
6. ❌ 하드 삭제 (법적 요구 시 제외)

---

## ✅ 필수 사항

### 모든 개발 시
1. ✅ 테넌트 ID 기반 데이터 조회
2. ✅ 역할은 동적 조회 (DB 기반)
3. ✅ 권한은 동적 체크
4. ✅ 소프트 삭제 구현
5. ✅ 감사 로그 기록

---

## 📖 참조 문서

### 필수 참조
- [테넌트 역할 시스템 표준](./architecture/TENANT_ROLE_SYSTEM_STANDARD.md)
- [아키텍처 README](./architecture/README.md)

### 참고 문서
- [비즈니스 타입 시스템](./architecture/BUSINESS_TYPE_SYSTEM.md)
- [디자인 시스템](./design-system/)

---

## 🔄 표준 문서 업데이트 절차

### 1. 제안
- 변경 사유 명시
- 영향 범위 분석
- 대안 검토

### 2. 리뷰
- 팀 리뷰 필수
- 아키텍처 검토
- 보안 검토

### 3. 승인
- 프로젝트 관리자 승인
- 버전 업데이트
- 변경 이력 기록

### 4. 적용
- 문서 업데이트
- 기존 코드 마이그레이션 계획
- 팀 공지

---

## 📞 문의

표준 문서 관련 문의:
- 프로젝트 관리자
- 아키텍처 팀

**최종 업데이트**: 2025-12-02
