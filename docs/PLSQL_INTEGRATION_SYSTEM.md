# PL/SQL 통합 시스템

## 개요

MindGarden 상담 관리 시스템은 복잡한 비즈니스 로직과 대용량 데이터 처리를 위해 PL/SQL 프로시저를 활용한 통합 시스템을 구축했습니다. 이를 통해 실시간 통계 업데이트, ERP 연동, 할인 처리, 급여 계산 등의 핵심 기능을 효율적으로 처리합니다.

## 구현된 PL/SQL 시스템들

### 1. 통계 관리 시스템 (Statistics Management)

#### 핵심 프로시저
- `UpdateDailyStatistics()` - 일별 통계 업데이트
- `UpdateAllBranchDailyStatistics()` - 전체 지점 일별 통계
- `UpdateConsultantPerformance()` - 상담사 성과 업데이트
- `UpdateAllConsultantPerformance()` - 전체 상담사 성과
- `DailyPerformanceMonitoring()` - 성과 모니터링

#### 관리 엔티티
- `DailyStatistics` - 일별 통계 데이터
- `ConsultantPerformance` - 상담사 성과 데이터
- `PerformanceAlert` - 성과 알림
- `ErpSyncLog` - ERP 동기화 로그

#### 자동화 기능
- **실시간 통계 업데이트**: 스케줄 완료, 결제 확인 시 자동 통계 업데이트
- **성과 알림**: 성과 기준 미달 시 자동 알림 생성
- **지점별 필터링**: 모든 통계는 지점별로 분리 관리

### 2. 급여 관리 시스템 (Salary Management)

#### 핵심 프로시저
- `ProcessIntegratedSalaryCalculation()` - 통합 급여 계산
- `ApproveSalaryWithErpSync()` - 급여 승인 및 ERP 동기화
- `ProcessSalaryPaymentWithErpSync()` - 급여 지급 및 ERP 동기화
- `GetIntegratedSalaryStatistics()` - 통합 급여 통계

#### 관리 엔티티
- `SalaryCalculation` - 급여 계산 내역
- `SalaryTaxCalculation` - 세금 계산 내역
- `ConsultantSalaryProfile` - 급여 프로필

#### 통합 기능
- **세금 자동 계산**: 프리랜서/정규직별 세금 차등 적용
- **ERP 실시간 동기화**: 급여 지급 시 회계 시스템 자동 업데이트
- **통계 연동**: 급여 지급 시 재무 통계 자동 업데이트

### 3. 할인 회계 시스템 (Discount Accounting)

#### 핵심 프로시저
- `ApplyDiscountAccounting()` - 할인 회계 처리
- `ProcessDiscountRefund()` - 할인 환불 처리
- `GetDiscountStatistics()` - 할인 통계 조회
- `ValidateDiscountIntegrity()` - 할인 무결성 검증

#### 관리 엔티티
- `PackageDiscount` - 패키지 할인 정보
- `DiscountAccountingTransaction` - 할인 회계 거래

#### 회계 처리
- **수익/할인 분리**: 원금과 할인액을 별도 회계 처리
- **환불 처리**: 부분/전체 환불 시 할인 비례 적용
- **무결성 검증**: 회계 데이터 일관성 자동 검증

### 4. 매핑-세션 통합 시스템 (Mapping-Session Integration)

#### 핵심 프로시저
- `UseSessionForMapping()` - 세션을 매핑에 활용
- `AddSessionsToMapping()` - 매핑에 세션 추가
- `ValidateMappingIntegrity()` - 매핑 무결성 검증
- `SyncAllMappings()` - 전체 매핑 동기화

#### 환불-세션 통합
- `ProcessRefundWithSessionAdjustment()` - 환불 시 세션 조정
- `ProcessPartialRefund()` - 부분 환불 처리
- `GetRefundableSessions()` - 환불 가능 세션 조회
- `GetRefundStatistics()` - 환불 통계

#### 데이터 일관성
- **세션-매핑 동기화**: 세션과 매핑 데이터 실시간 동기화
- **환불 시 세션 조정**: 환불 시 사용/미사용 세션 자동 계산

## Java-PL/SQL 연동 아키텍처

### 서비스 계층 구조

```
Java Service Layer
├── RealTimeStatisticsService
├── PlSqlStatisticsService
├── PlSqlSalaryManagementService
├── PlSqlDiscountAccountingService
└── PlSqlMappingSyncService
```

### 연동 방식
- **JdbcTemplate**: PL/SQL 프로시저 직접 호출
- **@Transactional**: 트랜잭션 관리
- **예외 처리**: MySQL 오류 메시지 한글 지원
- **Fallback 메커니즘**: PL/SQL 실패 시 Java 로직으로 대체

## 성능 최적화

### 1. 실시간 처리
- **이벤트 기반 업데이트**: 업무 이벤트 발생 시 즉시 통계 업데이트
- **배치 처리**: 대량 데이터는 스케줄러를 통한 배치 처리
- **캐싱**: 자주 조회되는 데이터는 메모리 캐싱

### 2. 데이터베이스 최적화
- **인덱스 최적화**: 자주 조회되는 컬럼에 인덱스 생성
- **파티셔닝**: 대용량 테이블은 날짜별 파티셔닝
- **통계 테이블**: 복잡한 집계는 별도 통계 테이블 활용

### 3. 모니터링
- **PL/SQL 실행 로그**: 모든 프로시저 실행 로그 기록
- **성능 메트릭**: 실행 시간, 처리 건수 모니터링
- **오류 추적**: PL/SQL 오류 발생 시 상세 로그 기록

## API 엔드포인트

### 통계 관리
- `GET /api/admin/statistics-management/plsql/status` - PL/SQL 상태 확인
- `POST /api/admin/statistics-management/update-yesterday` - 어제 통계 업데이트
- `POST /api/admin/statistics-management/update-date` - 특정일 통계 업데이트

### 급여 관리
- `POST /api/admin/salary/calculate-plsql` - PL/SQL 급여 계산
- `POST /api/admin/salary/approve-plsql` - PL/SQL 급여 승인
- `GET /api/admin/salary/statistics-plsql` - PL/SQL 급여 통계

### 할인 회계
- `POST /api/admin/plsql-discount/apply` - 할인 적용
- `POST /api/admin/plsql-discount/refund` - 할인 환불
- `GET /api/admin/plsql-discount/statistics` - 할인 통계

### 매핑 동기화
- `POST /api/admin/plsql-mapping-sync/use-session` - 세션 사용
- `POST /api/admin/plsql-mapping-sync/validate` - 무결성 검증
- `POST /api/admin/plsql-mapping-sync/sync-all` - 전체 동기화

## 설정 및 구성

### 데이터베이스 설정
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mind_garden?useUnicode=true&characterSetResults=utf8mb4&connectionCollation=utf8mb4_unicode_ci
    hikari:
      maximum-pool-size: 20
```

### PL/SQL 설정
- **UTF-8 인코딩**: 한글 처리를 위한 인코딩 설정
- **오류 처리**: MySQL 호환 오류 처리 구문
- **트랜잭션**: 자동 커밋/롤백 처리

## 트러블슈팅

### 1. PL/SQL 프로시저 오류
- **증상**: 프로시저 실행 실패
- **해결**: `GET DIAGNOSTICS` 구문으로 상세 오류 확인

### 2. 한글 인코딩 문제
- **증상**: 한글 데이터 깨짐
- **해결**: `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` 추가

### 3. 성능 저하
- **증상**: PL/SQL 실행 시간 증가
- **해결**: 실행 계획 분석, 인덱스 최적화

## 향후 개발 계획

### Phase 1: 확장성 개선
- 더 많은 비즈니스 로직의 PL/SQL 이전
- 성능 모니터링 시스템 고도화

### Phase 2: 고급 분석
- 머신러닝 기반 예측 분석
- 실시간 비즈니스 인텔리전스

### Phase 3: 완전 자동화
- 모든 업무 프로세스의 자동화
- AI 기반 의사결정 지원

## 버전 히스토리

### v1.0.0 (2025-01-11)
- 통계 관리 PL/SQL 시스템 구현
- 급여 관리 PL/SQL 연동
- 할인 회계 PL/SQL 처리
- 매핑-세션 통합 시스템
- 실시간 통계 업데이트
- ERP 시스템 연동

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
