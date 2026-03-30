# 상태값 하드코딩 제거 계획

**작성일**: 2025-12-04  
**버전**: 1.0.0  
**상태**: 진행 중

---

## 📌 개요

Priority 3.3 작업: 모든 상태값 하드코딩을 공통코드 시스템으로 전환합니다.

---

## 🔍 발견된 하드코딩 현황

### Backend 하드코딩
1. **스케줄 상태**: `"BOOKED"`, `"CONFIRMED"`, `"COMPLETED"`, `"CANCELLED"`, `"AVAILABLE"`
   - 위치: `AdminController.java`, `ConsultationServiceImpl.java`, `TestDataController.java`
   
2. **사용자/매핑 상태**: `"ACTIVE"`, `"INACTIVE"`, `"PENDING"`, `"APPROVED"`, `"REJECTED"`
   - 위치: `AdminController.java`, `TestDataController.java`

3. **결제 상태**: `"PENDING"`, `"APPROVED"`, `"PROCESSING"`, `"COMPLETED"`, `"FAILED"`
   - 위치: `AdminController.java`

### Frontend 하드코딩
1. **스케줄 상태**: `'BOOKED'`, `'CONFIRMED'`, `'COMPLETED'`, `'CANCELLED'`, `'AVAILABLE'`
   - 위치: `UnifiedScheduleComponent.js`, `ScheduleDetailModal.js`

2. **상태 옵션 배열**: 하드코딩된 상태 옵션 배열
   - 위치: `ScheduleDetailModal.js`, `UnifiedScheduleComponent.js`

---

## 🎯 작업 목표

1. **Backend**: 공통코드 서비스를 통한 동적 조회로 전환 (상수 클래스 대신)
2. **Frontend**: 공통코드 API를 통한 동적 조회로 전환
3. **일관성**: 모든 상태값을 공통코드에서 조회
4. **유연성**: DB만 수정하면 상태값 변경 가능

**⚠️ 중요**: 상수 클래스 대신 공통코드 서비스를 사용하여 더 유연하고 확장 가능한 구조로 전환합니다.

**참조**: [상태값 공통코드 전환 계획](./STATUS_COMMON_CODE_MIGRATION_PLAN.md)

---

## 📋 작업 계획

### Day 1: Backend 상태값 하드코딩 제거

**작업 항목**:
1. 상수 클래스 확인 및 활용
   - `MappingStatusConstants.java` 확인
   - `PaymentStatus.java` 확인
   - `ConsultationStatus.java` 확인
   
2. 하드코딩된 문자열을 상수로 교체
   - `AdminController.java`: 스케줄 상태, 매핑 상태, 결제 상태
   - `ConsultationServiceImpl.java`: 상담 상태
   - `TestDataController.java`: 테스트 데이터 생성 시 상태값

3. 공통코드 조회 로직 적용 (필요 시)
   - 상수 클래스가 없는 경우 공통코드 조회로 전환

**체크리스트**:
- [ ] `AdminController.java` 하드코딩 제거
- [ ] `ConsultationServiceImpl.java` 하드코딩 제거
- [ ] `TestDataController.java` 하드코딩 제거
- [ ] 상수 클래스 활용 또는 공통코드 조회 적용
- [ ] 컴파일 오류 확인

---

### Day 2: Frontend 상태값 하드코딩 제거

**작업 항목**:
1. 공통코드 API를 통한 상태값 조회
   - `SCHEDULE_STATUS` 코드 그룹 조회
   - `USER_STATUS` 코드 그룹 조회
   - `PAYMENT_STATUS` 코드 그룹 조회

2. 하드코딩된 상태 옵션 배열 제거
   - `UnifiedScheduleComponent.js`: `scheduleStatusOptions` 동적 로드
   - `ScheduleDetailModal.js`: `scheduleStatusOptions` 동적 로드

3. 하드코딩된 상태 문자열 비교 제거
   - `ScheduleDetailModal.js`: `allowedStatuses` 배열 제거
   - 상태 비교 로직을 공통코드 기반으로 전환

**체크리스트**:
- [ ] `UnifiedScheduleComponent.js` 하드코딩 제거
- [ ] `ScheduleDetailModal.js` 하드코딩 제거
- [ ] 공통코드 API를 통한 동적 조회 적용
- [ ] 상태 비교 로직 수정
- [ ] 기능 테스트

---

### Day 3: 통합 테스트 및 검증

**작업 항목**:
1. 전체 시스템 테스트
   - 스케줄 상태 변경 테스트
   - 사용자 상태 변경 테스트
   - 결제 상태 변경 테스트

2. 공통코드 데이터 확인
   - 필요한 공통코드가 모두 등록되어 있는지 확인
   - 누락된 공통코드 추가

3. 문서화 업데이트
   - 상태값 사용 가이드 작성
   - 공통코드 그룹 목록 업데이트

**체크리스트**:
- [ ] 전체 기능 테스트
- [ ] 공통코드 데이터 검증
- [ ] 문서화 업데이트

---

## 📊 예상 결과

### Before
```java
// Backend
.filter(m -> "ACTIVE".equals(m.getStatus()))
consultation.setStatus("COMPLETED");
```

```javascript
// Frontend
const statusOptions = [
  { value: 'BOOKED', label: '예약됨' },
  { value: 'CONFIRMED', label: '확정됨' }
];
if (status === 'BOOKED') { ... }
```

### After
```java
// Backend
.filter(m -> MappingStatusConstants.ACTIVE.equals(m.getStatus()))
consultation.setStatus(ConsultationStatus.COMPLETED);
```

```javascript
// Frontend
const statusOptions = await commonCodeApi.getCodesByGroup('SCHEDULE_STATUS');
if (status === statusOptions.find(s => s.codeValue === 'BOOKED')?.codeValue) { ... }
```

---

## 🔗 참조 문서

- [공통코드 시스템 표준](../standards/COMMON_CODE_SYSTEM_STANDARD.md)
- [공통코드 드롭다운 자동화 표준](../standards/COMMON_CODE_DROPDOWN_STANDARD.md)

---

**최종 업데이트**: 2025-12-04

