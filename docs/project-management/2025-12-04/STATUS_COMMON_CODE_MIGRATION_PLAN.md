# 상태값 공통코드 전환 계획

**작성일**: 2025-12-04  
**버전**: 2.0.0  
**상태**: 진행 중

---

## 📌 개요

상태값을 상수 클래스 대신 **데이터베이스 공통코드에서 동적으로 조회**하도록 전환합니다.

**⚠️ 중요**: [공통코드 시스템 표준](../standards/COMMON_CODE_SYSTEM_STANDARD.md)에 따라 **모든 코드값은 공통코드에서 조회**해야 합니다.
- 하드코딩 완전 금지
- 상수 클래스 사용 금지
- Enum 하드코딩 금지

### 개선 효과
1. ✅ 코드 재배포 없이 상태값 추가/수정 가능
2. ✅ 테넌트별로 다른 상태값 정의 가능
3. ✅ 하드코딩 완전 제거 (표준화 원칙 준수)
4. ✅ 코드 간소화 및 유지보수성 향상

---

## 🔍 현재 상황

### Backend
- 상수 클래스 사용: `MappingStatusConstants`, `ConsultationStatus`, `PaymentStatus`
- 하드코딩된 문자열 비교: `"ACTIVE"`, `"COMPLETED"` 등

### Frontend
- 하드코딩된 상태 옵션 배열
- 하드코딩된 문자열 비교

### 공통코드 현황
- ✅ `PAYMENT_STATUS`: DB에 등록됨
- ✅ `CONSULTATION_STATUS`: DB에 등록됨
- ✅ `USER_STATUS`: DB에 등록됨
- ❓ `SCHEDULE_STATUS`: 확인 필요
- ❓ `MAPPING_STATUS`: 확인 필요

---

## 🎯 작업 목표

1. **Backend**: 공통코드 서비스를 통한 상태값 조회
2. **Frontend**: 공통코드 API를 통한 동적 상태값 로드
3. **캐싱**: 성능 최적화를 위한 캐싱 적용
4. **유틸리티**: 상태값 조회 헬퍼 메서드 생성

---

## 📋 작업 계획

### Phase 1: 공통코드 데이터 확인 및 추가

**작업 항목**:
1. 필요한 상태값 공통코드 그룹 확인
   - `SCHEDULE_STATUS`: 스케줄 상태
   - `MAPPING_STATUS`: 매핑 상태
   - `CONSULTATION_STATUS`: 상담 상태 (확인)
   - `PAYMENT_STATUS`: 결제 상태 (확인)
   - `USER_STATUS`: 사용자 상태 (확인)

2. 누락된 공통코드 추가
   - 마이그레이션 파일 생성
   - 기본 상태값 등록

**체크리스트**:
- [ ] `SCHEDULE_STATUS` 공통코드 확인/추가
- [ ] `MAPPING_STATUS` 공통코드 확인/추가
- [ ] 모든 상태값이 DB에 등록되어 있는지 확인

---

### Phase 2: Backend 유틸리티 클래스 생성

**작업 항목**:
1. `StatusCodeHelper` 유틸리티 클래스 생성
   - 공통코드 서비스를 통한 상태값 조회
   - 캐싱 적용
   - 편의 메서드 제공

2. 상태값 비교 헬퍼 메서드
   - `isStatus(String codeGroup, String codeValue, String status)`
   - `getStatusCodes(String codeGroup)`
   - `getStatusCodeValue(String codeGroup, String codeValue)`

**예시 코드**:
```java
@Service
@RequiredArgsConstructor
public class StatusCodeHelper {
    private final CommonCodeService commonCodeService;
    private final Map<String, List<CommonCode>> statusCache = new ConcurrentHashMap<>();
    
    public boolean isStatus(String codeGroup, String codeValue, String status) {
        List<CommonCode> codes = getStatusCodes(codeGroup);
        return codes.stream()
            .anyMatch(code -> code.getCodeValue().equals(status));
    }
    
    public List<CommonCode> getStatusCodes(String codeGroup) {
        return statusCache.computeIfAbsent(codeGroup, 
            group -> commonCodeService.getActiveCommonCodesByGroup(group));
    }
    
    public String getStatusCodeValue(String codeGroup, String codeValue) {
        return commonCodeService.getCommonCodeByGroupAndValue(codeGroup, codeValue)
            .getCodeValue();
    }
}
```

**체크리스트**:
- [ ] `StatusCodeHelper` 클래스 생성
- [ ] 캐싱 로직 구현
- [ ] 편의 메서드 구현

---

### Phase 3: Backend 코드 수정

**작업 항목**:
1. `AdminController.java` 수정
   - 상수 클래스 대신 `StatusCodeHelper` 사용
   - 하드코딩된 문자열 비교 제거

2. `ConsultationServiceImpl.java` 수정
   - `ConsultationStatus` 상수 대신 공통코드 조회

3. `TestDataController.java` 수정
   - 테스트 데이터 생성 시 공통코드 사용

**Before**:
```java
.filter(m -> MappingStatusConstants.ACTIVE.equals(m.getStatus()))
consultation.setStatus(ConsultationStatus.COMPLETED);
```

**After**:
```java
.filter(m -> statusCodeHelper.isStatus("MAPPING_STATUS", m.getStatus(), "ACTIVE"))
consultation.setStatus(statusCodeHelper.getStatusCodeValue("CONSULTATION_STATUS", "COMPLETED"));
```

**체크리스트**:
- [ ] `AdminController.java` 수정
- [ ] `ConsultationServiceImpl.java` 수정
- [ ] `TestDataController.java` 수정
- [ ] 컴파일 오류 확인

---

### Phase 4: Frontend 코드 수정

**작업 항목**:
1. 공통코드 API를 통한 상태값 조회
   - `commonCodeApi.getCodesByGroup('SCHEDULE_STATUS')`
   - `commonCodeApi.getCodesByGroup('CONSULTATION_STATUS')`

2. 하드코딩된 상태 옵션 배열 제거
   - `UnifiedScheduleComponent.js`: 동적 로드
   - `ScheduleDetailModal.js`: 동적 로드

3. 상태 비교 로직 수정
   - 하드코딩된 문자열 비교 제거
   - 공통코드 기반 비교

**Before**:
```javascript
const statusOptions = [
  { value: 'BOOKED', label: '예약됨' },
  { value: 'CONFIRMED', label: '확정됨' }
];
if (status === 'BOOKED') { ... }
```

**After**:
```javascript
const [statusOptions, setStatusOptions] = useState([]);

useEffect(() => {
  commonCodeApi.getCodesByGroup('SCHEDULE_STATUS').then(codes => {
    setStatusOptions(codes.map(code => ({
      value: code.codeValue,
      label: code.koreanName || code.codeLabel
    })));
  });
}, []);

const isBooked = statusOptions.find(s => s.value === 'BOOKED')?.value === status;
```

**체크리스트**:
- [ ] `UnifiedScheduleComponent.js` 수정
- [ ] `ScheduleDetailModal.js` 수정
- [ ] 공통코드 API 통합
- [ ] 기능 테스트

---

### Phase 5: 통합 테스트 및 검증

**작업 항목**:
1. 전체 시스템 테스트
   - 상태값 조회 테스트
   - 상태값 비교 테스트
   - 상태값 변경 테스트

2. 성능 테스트
   - 캐싱 효과 확인
   - DB 조회 최소화 확인

3. 문서화 업데이트
   - 상태값 사용 가이드 작성
   - 공통코드 그룹 목록 업데이트

**체크리스트**:
- [ ] 전체 기능 테스트
- [ ] 성능 테스트
- [ ] 문서화 업데이트

---

## 📊 예상 결과

### 장점
1. **유연성**: DB만 수정하면 상태값 변경 가능
2. **확장성**: 테넌트별 상태값 정의 가능
3. **표준화**: 하드코딩 완전 제거
4. **유지보수성**: 코드 간소화

### 주의사항
1. **캐싱**: 성능을 위한 캐싱 필수
2. **에러 처리**: 공통코드가 없을 경우 처리
3. **하위 호환성**: 기존 데이터와의 호환성 유지

---

## 🔗 참조 문서

- [공통코드 시스템 표준](../standards/COMMON_CODE_SYSTEM_STANDARD.md)
- [공통코드 드롭다운 자동화 표준](../standards/COMMON_CODE_DROPDOWN_STANDARD.md)

---

**최종 업데이트**: 2025-12-04

