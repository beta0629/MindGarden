# 위젯으로 복잡한 비즈니스 로직 처리 가능 여부

**작성일**: 2025-11-25  
**목적**: MindGarden의 복잡한 비즈니스 로직(매칭, 결제, 회기 수, 스케줄 관리)이 위젯으로 가능한지 설명

---

## ✅ 핵심 답변: **가능합니다!**

위젯은 **UI 레이어**이고, 실제 복잡한 비즈니스 로직은 **백엔드 서비스와 프로시저**에서 처리됩니다.

---

## 🏗️ MindGarden 비즈니스 로직 아키텍처

### 전체 흐름도

```
┌─────────────────────────────────────────────────────────────┐
│                    대시보드 위젯 (UI 레이어)                    │
│  - 매칭 위젯, 스케줄 위젯, 결제 위젯, 회기 관리 위젯              │
│  - 사용자 입력만 받고 API 호출                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │ API 호출
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              백엔드 서비스 레이어 (Java Service)                │
│  - ScheduleServiceImpl                                        │
│  - MappingService                                            │
│  - PaymentService                                            │
│  - 비즈니스 로직 검증 및 프로시저 호출                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ 프로시저 호출
                        ↓
┌─────────────────────────────────────────────────────────────┐
│          데이터베이스 프로시저 (PL/SQL) - 트랜잭션 보장          │
│  - UseSessionForMapping (회기 사용)                          │
│  - ValidateMappingIntegrity (매칭 검증)                       │
│  - CheckTimeConflict (시간 충돌 검사)                         │
│  - ProcessIntegratedSalaryCalculation (급여 계산)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 실제 처리 흐름 예시

### 예시 1: 스케줄 생성 (관리자가 상담사 일정 설정)

#### 위젯 코드 (UI만 담당)
```javascript
// ScheduleRegistrationWidget.js
const handleCreateSchedule = async () => {
  const scheduleData = {
    consultantId: selectedConsultant.id,
    clientId: selectedClient.id,
    date: selectedDate,
    startTime: startTime,
    endTime: endTime,
    title: title
  };
  
  // API 호출만 함
  const response = await apiPost('/api/schedules', scheduleData);
};
```

#### 백엔드 서비스 (비즈니스 로직 검증)
```java
// ScheduleServiceImpl.java
public Schedule createConsultantSchedule(
    Long consultantId, Long clientId, 
    LocalDate date, LocalTime startTime, LocalTime endTime, ...) {
    
    // 1. 매칭 상태 검증
    if (!validateMappingForSchedule(consultantId, clientId)) {
        throw new RuntimeException("유효한 매칭이 없습니다.");
    }
    
    // 2. 회기 수 검증
    if (!validateRemainingSessions(consultantId, clientId)) {
        throw new RuntimeException("사용 가능한 회기가 없습니다.");
    }
    
    // 3. 시간 충돌 검사 (중요!)
    if (hasTimeConflict(consultantId, date, startTime, endTime, null)) {
        throw new RuntimeException("해당 시간대에 이미 스케줄이 존재합니다.");
    }
    
    // 4. 스케줄 생성
    Schedule schedule = new Schedule();
    // ... 스케줄 데이터 설정
    Schedule savedSchedule = scheduleRepository.save(schedule);
    
    // 5. 회기 사용 처리 (프로시저 호출)
    useSessionForMapping(consultantId, clientId);
    
    return savedSchedule;
}
```

#### 프로시저 (데이터 무결성 보장)
```sql
-- UseSessionForMapping 프로시저
START TRANSACTION;

-- 1. 활성 매칭 조회
SELECT id, remaining_sessions, status, payment_status
INTO v_mapping_id, v_remaining_sessions, v_mapping_status, v_payment_status
FROM consultant_client_mappings 
WHERE consultant_id = p_consultant_id 
  AND client_id = p_client_id 
  AND status = 'ACTIVE'
LIMIT 1;

-- 2. 검증
IF v_mapping_id IS NULL THEN
    ROLLBACK;
    RETURN '활성 매칭을 찾을 수 없습니다';
END IF;

IF v_remaining_sessions <= 0 THEN
    ROLLBACK;
    RETURN '사용 가능한 회기가 없습니다';
END IF;

-- 3. 회기 사용 처리 (원자적 연산)
UPDATE consultant_client_mappings 
SET 
    remaining_sessions = remaining_sessions - 1,
    used_sessions = used_sessions + 1,
    updated_at = NOW()
WHERE id = v_mapping_id;

-- 4. 로그 기록
INSERT INTO session_usage_logs (...) VALUES (...);

COMMIT;
```

---

## 🛡️ 복잡한 로직 처리 보장 메커니즘

### 1. 시간 충돌 검사

**문제**: 관리자가 상담사 일정을 설정할 때, 같은 날짜/시간에 중복 스케줄이 생성되면 안 됨

**해결**: `hasTimeConflict()` 메서드로 검증

```java
// ScheduleServiceImpl.java
private boolean hasTimeConflict(Long consultantId, LocalDate date, 
                                LocalTime startTime, LocalTime endTime, Long excludeScheduleId) {
    // 해당 날짜의 모든 스케줄 조회
    List<Schedule> existingSchedules = scheduleRepository
        .findByConsultantIdAndDate(consultantId, date);
    
    for (Schedule existing : existingSchedules) {
        if (excludeScheduleId != null && existing.getId().equals(excludeScheduleId)) {
            continue; // 수정 시 자기 자신은 제외
        }
        
        // 시간 겹침 검사
        if (isTimeOverlapping(startTime, endTime, 
                             existing.getStartTime(), existing.getEndTime())) {
            return true; // 충돌 발견
        }
    }
    
    return false; // 충돌 없음
}

private boolean isTimeOverlapping(LocalTime start1, LocalTime end1,
                                  LocalTime start2, LocalTime end2) {
    // 시간 겹침 로직
    return start1.isBefore(end2) && start2.isBefore(end1);
}
```

**위젯은 이 검증 로직을 몰라도 됨** - API가 자동으로 검증하고 오류 반환

### 2. 회기 수 카운트

**문제**: 스케줄 생성 시 회기 수가 정확히 차감되어야 함

**해결**: 프로시저로 트랜잭션 보장

```sql
-- UseSessionForMapping 프로시저 내부
START TRANSACTION;

-- 원자적 연산 (동시성 문제 해결)
UPDATE consultant_client_mappings 
SET 
    remaining_sessions = remaining_sessions - 1,  -- 정확히 1 감소
    used_sessions = used_sessions + 1              -- 정확히 1 증가
WHERE id = v_mapping_id;

-- 회기 소진 시 자동 상태 변경
IF (v_remaining_sessions - 1) = 0 THEN
    UPDATE consultant_client_mappings 
    SET status = 'COMPLETED', end_date = NOW()
    WHERE id = v_mapping_id;
END IF;

COMMIT;
```

**위젯은 이 로직을 몰라도 됨** - 프로시저가 자동으로 처리

### 3. 매칭 및 결제 검증

**문제**: 결제가 완료되지 않은 매칭에서는 스케줄 생성 불가

**해결**: 프로시저에서 결제 상태 검증

```sql
-- UseSessionForMapping 프로시저 내부
IF v_payment_status != 'CONFIRMED' THEN
    ROLLBACK;
    RETURN '결제가 확인되지 않은 매칭입니다';
END IF;
```

**위젯은 이 검증을 몰라도 됨** - 프로시저가 자동으로 검증

### 4. 날짜별 시간 정확성

**문제**: 관리자가 설정한 날짜/시간이 정확해야 함

**해결**: 
- 위젯에서 날짜/시간 입력 받음 (UI)
- 백엔드에서 형식 검증 및 저장
- 프로시저에서 트랜잭션 보장

```java
// ScheduleServiceImpl.java
schedule.setDate(date);           // 날짜 저장
schedule.setStartTime(startTime); // 시작 시간 저장
schedule.setEndTime(endTime);     // 종료 시간 저장
schedule.setBranchCode(branchCode); // 지점코드 저장
```

---

## 📊 위젯의 역할 vs 백엔드의 역할

### 위젯 (UI 레이어)
- ✅ 사용자 입력 받기
- ✅ 데이터 표시
- ✅ API 호출
- ❌ 비즈니스 로직 없음
- ❌ 데이터 검증 없음 (최소한의 UI 검증만)

### 백엔드 서비스 (비즈니스 로직 레이어)
- ✅ 비즈니스 규칙 검증
- ✅ 시간 충돌 검사
- ✅ 매칭 상태 검증
- ✅ 회기 수 검증
- ✅ 프로시저 호출

### 프로시저 (데이터 무결성 레이어)
- ✅ 트랜잭션 보장
- ✅ 원자적 연산
- ✅ 동시성 제어
- ✅ 데이터 무결성 검증
- ✅ 자동 상태 변경

---

## 🎯 실제 위젯 예시

### 스케줄 등록 위젯

```javascript
// ScheduleRegistrationWidget.js
const ScheduleRegistrationWidget = ({ widget, user }) => {
  const [formData, setFormData] = useState({
    consultantId: '',
    clientId: '',
    date: '',
    startTime: '',
    endTime: '',
    title: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // API 호출만 함 - 모든 검증은 백엔드에서
      const response = await apiPost('/api/schedules', formData);
      
      if (response) {
        notificationManager.show('스케줄이 생성되었습니다.', 'success');
        // 폼 초기화
      }
    } catch (error) {
      // 백엔드에서 반환한 오류 메시지 표시
      notificationManager.show(error.message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 날짜/시간 입력 UI만 제공 */}
      <input type="date" value={formData.date} ... />
      <input type="time" value={formData.startTime} ... />
      <input type="time" value={formData.endTime} ... />
      <button type="submit">등록</button>
    </form>
  );
};
```

**위젯은 단순히 입력만 받고, 모든 복잡한 로직은 백엔드에서 처리됩니다.**

---

## ✅ 결론

### 위젯으로 복잡한 비즈니스 로직이 가능한 이유:

1. **위젯 = UI만 담당**
   - 사용자 입력 받기
   - 데이터 표시
   - API 호출

2. **백엔드 = 비즈니스 로직 담당**
   - 시간 충돌 검사
   - 매칭 검증
   - 회기 수 검증
   - 프로시저 호출

3. **프로시저 = 데이터 무결성 담당**
   - 트랜잭션 보장
   - 원자적 연산
   - 동시성 제어

### 따라서:

- ✅ **매칭 위젯**: 매칭 정보 표시만, 실제 매칭 로직은 프로시저
- ✅ **결제 위젯**: 결제 정보 입력만, 실제 결제 검증은 프로시저
- ✅ **회기 관리 위젯**: 회기 수 표시만, 실제 카운트는 프로시저
- ✅ **스케줄 위젯**: 날짜/시간 입력만, 실제 충돌 검사는 백엔드

**위젯을 동적으로 추가/삭제/변경해도 데이터 무결성은 보장됩니다!** ✅

---

## 📝 참고 파일

- 프로시저: `src/main/resources/sql/procedures/mapping_session_integration.sql`
- 스케줄 서비스: `src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java`
- 데이터 무결성 문서: `docs/mgsb/2025-11-25/DASHBOARD_WIDGET_DATA_INTEGRITY.md`


