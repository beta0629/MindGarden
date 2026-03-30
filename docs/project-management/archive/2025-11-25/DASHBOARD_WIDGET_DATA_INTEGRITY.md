# 대시보드 위젯과 데이터 무결성 보장

**작성일**: 2025-11-25  
**목적**: 대시보드 위젯이 동적으로 변경되어도 데이터 무결성이 보장되는 이유 설명

---

## ✅ 핵심 원칙

**대시보드 위젯 = 읽기 전용 UI 컴포넌트**  
**비즈니스 로직 = 프로시저로 관리**

---

## 🔒 데이터 무결성 보장 메커니즘

### 1. 프로시저 기반 비즈니스 로직

상담소 관련 모든 필수 비즈니스 로직은 **데이터베이스 프로시저**로 관리됩니다:

#### 주요 프로시저 목록

1. **`UseSessionForMapping`** - 회기 사용 처리
   - 스케줄 생성 시 자동 호출
   - 매핑 상태 검증
   - 회기 수 차감
   - 트랜잭션 보장

2. **`ValidateConsultationRecordBeforeCompletion`** - 상담일지 검증
   - 스케줄 완료 전 상담일지 작성 여부 확인
   - 데이터 무결성 검증

3. **`CheckTimeConflict`** - 시간 충돌 검사
   - 스케줄 생성 시 시간 충돌 방지
   - 업무 시간 검증

4. **`ProcessIntegratedSalaryCalculation`** - 급여 계산 및 ERP 동기화
   - 급여 계산
   - 세금 계산
   - ERP 동기화

5. **`ValidateMappingIntegrity`** - 매핑 무결성 검증
   - 매핑 데이터 일관성 검증
   - 금액 일치 검증

### 2. 대시보드 위젯의 역할

대시보드 위젯은 **단순히 데이터를 표시**하는 역할만 합니다:

```javascript
// 위젯 예시: StatisticsWidget.js
const loadData = async () => {
  const response = await apiGet(dataSource.url, dataSource.params || {});
  setData(response); // ✅ 읽기만 함
};
```

**위젯의 특징:**
- ✅ API를 통한 데이터 읽기만 수행
- ✅ 데이터 표시 및 시각화
- ❌ 데이터 생성/수정/삭제 없음
- ❌ 비즈니스 로직 없음

### 3. 실제 데이터 처리 흐름

#### 스케줄 생성 예시

```
1. 사용자가 위젯에서 "스케줄 생성" 버튼 클릭
   ↓
2. 위젯은 API 호출: POST /api/schedules
   ↓
3. ScheduleServiceImpl.createSchedule()
   ↓
4. 프로시저 호출: CALL UseSessionForMapping(...)
   ↓
5. 프로시저 내부:
   - 트랜잭션 시작
   - 매핑 상태 검증
   - 회기 수 차감
   - 로그 기록
   - 트랜잭션 커밋
   ↓
6. 위젯은 결과를 표시만 함
```

**중요**: 위젯은 프로시저를 직접 호출하지 않습니다.  
**서비스 레이어**가 프로시저를 호출하고, 위젯은 서비스 API만 사용합니다.

---

## 🛡️ 데이터 무결성 보장 이유

### 1. 프로시저의 트랜잭션 보장

```sql
-- UseSessionForMapping 프로시저 예시
START TRANSACTION;

-- 검증
IF v_remaining_sessions <= 0 THEN
    ROLLBACK;
    RETURN;
END IF;

-- 데이터 수정
UPDATE consultant_client_mappings 
SET remaining_sessions = remaining_sessions - 1
WHERE id = v_mapping_id;

COMMIT;
```

### 2. 위젯 변경이 데이터에 영향 없음

**시나리오**: 대시보드 위젯을 추가/삭제/이동

- ✅ 위젯 추가: 새로운 데이터 표시만 추가
- ✅ 위젯 삭제: 표시만 제거, 데이터는 그대로
- ✅ 위젯 이동: 레이아웃만 변경, 데이터는 그대로
- ✅ 위젯 설정 변경: 표시 방식만 변경, 데이터는 그대로

**데이터 처리 로직은 프로시저에 있으므로 영향 없음**

### 3. 프로시저 자동 초기화

`PlSqlInitializer`가 애플리케이션 시작 시 프로시저를 자동으로 생성/업데이트합니다:

```java
@PostConstruct
public void init() {
    initializeCreateOrActivateTenantProcedure();
    initializeConsultationRecordAlertProcedures();
    initializeConsultationRecordValidationProcedures();
}
```

---

## 📊 실제 예시

### 예시 1: 스케줄 생성 위젯

**위젯 코드** (`ScheduleRegistrationWidget.js`):
```javascript
const handleCreateSchedule = () => {
  // API 호출만 함
  apiPost('/api/schedules', scheduleData);
};
```

**실제 처리** (`ScheduleServiceImpl.java`):
```java
Schedule savedSchedule = scheduleRepository.save(schedule);

// 프로시저 호출 (데이터 무결성 보장)
useSessionForMapping(consultantId, clientId);
```

**프로시저** (`UseSessionForMapping`):
```sql
-- 트랜잭션으로 안전하게 처리
START TRANSACTION;
-- 검증 및 데이터 수정
COMMIT;
```

### 예시 2: 통계 위젯

**위젯 코드** (`StatisticsWidget.js`):
```javascript
const loadData = async () => {
  const response = await apiGet('/api/statistics/overall');
  setData(response); // ✅ 읽기만 함
};
```

**실제 처리** (`StatisticsServiceImpl.java`):
- 프로시저를 통해 통계 계산
- 위젯은 계산된 결과만 표시

---

## ✅ 결론

1. **대시보드 위젯 = UI 레이어**
   - 데이터 표시만 담당
   - 비즈니스 로직 없음

2. **프로시저 = 비즈니스 로직 레이어**
   - 모든 필수 비즈니스 로직 관리
   - 트랜잭션 보장
   - 데이터 무결성 보장

3. **데이터 무결성 보장**
   - 위젯 변경은 UI만 변경
   - 프로시저는 변경되지 않음
   - 데이터 처리 로직은 프로시저에 있음

**따라서 대시보드를 동적으로 변경해도 데이터에는 이상이 없습니다!** ✅

---

## 📝 참고사항

- 프로시저 목록: `src/main/resources/sql/procedures/`
- 프로시저 초기화: `PlSqlInitializer.java`
- 위젯 코드: `frontend/src/components/dashboard/widgets/`


