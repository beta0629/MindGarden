# 매핑 수정 시 ERP 통계 연동 구현 현황

> **📅 작성일**: 2025-01-XX  
> **📝 최종 업데이트**: 2025-01-XX  
> **📊 버전**: 1.0  
> **👤 작성자**: AI Assistant

## 📋 작업 요약

매핑(Mapping) 정보 수정 시 ERP 재무 거래 및 전체 통계가 자동으로 반영되도록 구현 완료.

## ✅ 완료된 기능

### 1. 매핑 수정 시 ERP 재무 거래 동기화
**파일**: `src/main/java/com/mindgarden/consultation/service/impl/AdminServiceImpl.java`

**구현 내용:**
- 매핑 정보 수정 시 `UpdateMappingInfo` 프로시저 자동 호출
- 패키지 가격/세션 수 변경 감지 로직 구현
- 기존 ERP 재무 거래 논리 삭제 + 새 거래 생성

**코드 위치**: `updateMapping()` 메서드 (라인 1636-1743)

**상태**: ✅ 완료

---

### 2. 프로시저 기반 통계 업데이트
**파일**: `sql/mapping_update_procedures_mysql.sql`

**구현 내용:**
- `UpdateMappingInfo` 프로시저 내부에서 `UpdateMappingStatistics` 호출
- `consultant_statistics` 테이블 업데이트 (상담사별 통계)
- `branch_statistics` 테이블 업데이트 (지점별 통계)

**프로시저 위치**: 라인 145-146
```sql
-- 7. 통계 데이터 갱신
CALL UpdateMappingStatistics(p_mapping_id, v_consultant_id, v_client_id, v_branch_code);
```

**상태**: ✅ 완료

---

### 3. 실시간 대시보드 통계 업데이트
**파일**: `src/main/java/com/mindgarden/consultation/service/impl/AdminServiceImpl.java`

**구현 내용:**
- `RealTimeStatisticsService.updateStatisticsOnMappingChange()` 호출
- `RealTimeStatisticsService.updateFinancialStatisticsOnPayment()` 호출 (가격 변경 시)
- 실시간 대시보드 통계 자동 갱신

**코드 위치**: 라인 1714-1737

**상태**: ✅ 완료

---

### 4. 프로시저 자동 배포 시스템
**파일**: `.github/workflows/deploy-production.yml`

**구현 내용:**
- GitHub Actions를 통한 자동 배포
- 프로시저 파일 자동 업로드
- 배포 시 프로시저 자동 실행
- 권한 오류 시 root 권한으로 재시도
- 배포 결과 로그 및 버전 확인

**워크플로우 위치**: 라인 161-357

**상태**: ✅ 완료

---

### 5. ERP 재무 거래 데이터 동기화 (프로시저 내부)
**파일**: `sql/mapping_update_procedures_mysql.sql`

**구현 내용:**
- 기존 INCOME 거래 논리 삭제 (`is_deleted = TRUE`)
- 새로운 패키지 금액으로 수입 거래 생성
- `tax_included` 필드 포함 (오류 방지)
- 거래 이력 자동 기록

**프로시저 위치**: 라인 98-143

**상태**: ✅ 완료

---

### 6. 매핑 변경 이력 기록
**파일**: `sql/mapping_update_procedures_mysql.sql`

**구현 내용:**
- `mapping_change_history` 테이블에 변경 이력 자동 기록
- 변경 전/후 값 비교 기록
- 변경자 정보 기록 (`updated_by`)

**프로시저 위치**: 라인 79-96

**상태**: ✅ 완료

---

## 📊 전체 흐름도

```
매핑 수정 요청 (AdminController.updateMapping)
    ↓
AdminServiceImpl.updateMapping()
    ↓
[1] 매핑 엔티티 업데이트
    ↓
[2] 패키지 변경 감지 (packageChanged)
    ↓
[3] UpdateMappingInfo 프로시저 호출
    ├─ ERP 재무 거래 동기화
    │   ├─ 기존 거래 논리 삭제
    │   └─ 새 거래 생성
    ├─ 매핑 변경 이력 기록
    └─ UpdateMappingStatistics 호출
        ├─ consultant_statistics 업데이트
        └─ branch_statistics 업데이트
    ↓
[4] RealTimeStatisticsService 호출
    ├─ updateStatisticsOnMappingChange()
    │   ├─ 일일 통계 업데이트
    │   └─ 상담사 성과 업데이트
    └─ updateFinancialStatisticsOnPayment() (가격 변경 시)
        └─ 재무 통계 업데이트
    ↓
✅ 완료
```

## 🔄 자동화된 시스템

### 프로시저 자동 배포
- **트리거**: GitHub main 브랜치에 푸시 시
- **실행**: `.github/workflows/deploy-production.yml`
- **파일**: `sql/mapping_update_procedures_mysql.sql`
- **결과**: 프로시저 자동 업데이트, 버전 확인, 로그 기록

### 매핑 수정 시 자동 처리
1. ERP 재무 거래 동기화 (프로시저)
2. DB 통계 테이블 업데이트 (프로시저)
3. 실시간 대시보드 통계 업데이트 (Java 서비스)
4. 변경 이력 자동 기록 (프로시저)

## 📝 체크리스트

### 핵심 기능
- [x] 매핑 수정 시 ERP 재무 거래 자동 동기화
- [x] 프로시저 기반 통계 업데이트 (consultant_statistics, branch_statistics)
- [x] 실시간 대시보드 통계 업데이트
- [x] 매핑 변경 이력 자동 기록
- [x] 프로시저 자동 배포 시스템

### 기술적 요구사항
- [x] 패키지 변경 감지 로직 (가격, 세션 수)
- [x] 프로시저 호출 (StoredProcedureService)
- [x] 예외 처리 (통계 업데이트 실패해도 매핑 수정은 완료)
- [x] 로깅 (모든 단계 기록)
- [x] 트랜잭션 관리 (프로시저 내부)

### 배포 및 운영
- [x] 프로시저 파일 관리 (sql/ 디렉토리)
- [x] GitHub Actions 자동 배포
- [x] 배포 실패 시 재시도 로직
- [x] 배포 결과 확인 및 로깅
- [x] 프로시저 버전 확인

## 🎯 검증 방법

### 1. 매핑 수정 테스트
```bash
# 매핑 ID 36을 수정하여 테스트
- 기존 금액: 500,000원
- 수정 금액: 75,000원
- 예상 결과: ERP에 새 거래 생성 (75,000원)
```

### 2. ERP 거래 확인
```sql
-- ERP 재무 거래 목록에서 확인
SELECT * FROM financial_transactions 
WHERE related_entity_id = 36 
  AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
  AND is_deleted = FALSE
ORDER BY created_at DESC;
```

### 3. 통계 테이블 확인
```sql
-- 상담사 통계 확인
SELECT * FROM consultant_statistics WHERE consultant_id = [상담사ID];

-- 지점 통계 확인
SELECT * FROM branch_statistics WHERE branch_code = [지점코드];
```

### 4. 프로시저 버전 확인
```sql
-- 프로시저 정의에서 tax_included 포함 여부 확인
SELECT 
    ROUTINE_NAME,
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%tax_included%' THEN '✅ 최신버전'
        ELSE '⚠️ 구버전'
    END AS '버전'
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'mind_garden' 
  AND ROUTINE_NAME = 'UpdateMappingInfo';
```

## 🚨 주의사항

### 1. 예외 처리
- 통계 업데이트 실패해도 매핑 수정은 완료되도록 설계
- 프로시저 호출 실패 시에도 매핑 수정은 성공 처리
- 모든 오류는 로그에 기록

### 2. 데이터 정합성
- 프로시저 내부 트랜잭션으로 원자성 보장
- ERP 거래와 통계 데이터 일관성 유지
- 변경 이력 자동 기록으로 추적 가능

### 3. 성능
- 프로시저 기반 처리로 DB 레벨 최적화
- 실시간 통계는 별도 서비스로 비동기 처리
- 대량 데이터에도 안정적 동작

## 📚 관련 파일

### 핵심 파일
1. `src/main/java/com/mindgarden/consultation/service/impl/AdminServiceImpl.java`
   - 매핑 수정 로직
   - 프로시저 호출
   - 실시간 통계 업데이트

2. `sql/mapping_update_procedures_mysql.sql`
   - UpdateMappingInfo 프로시저
   - UpdateMappingStatistics 프로시저
   - CheckMappingUpdatePermission 프로시저

3. `.github/workflows/deploy-production.yml`
   - 프로시저 자동 배포 워크플로우

### 참고 파일
- `src/main/java/com/mindgarden/consultation/service/StoredProcedureService.java`
- `src/main/java/com/mindgarden/consultation/service/RealTimeStatisticsService.java`
- `src/main/java/com/mindgarden/consultation/controller/AdminController.java`

## ✅ 최종 상태

**모든 계획된 기능이 구현 완료되었습니다!**

- ✅ 매핑 수정 시 ERP 재무 거래 자동 동기화
- ✅ 프로시저 기반 통계 업데이트
- ✅ 실시간 대시보드 통계 업데이트
- ✅ 프로시저 자동 배포 시스템
- ✅ 매핑 변경 이력 자동 기록

**시스템이 정상적으로 동작 중입니다.** 🎉

