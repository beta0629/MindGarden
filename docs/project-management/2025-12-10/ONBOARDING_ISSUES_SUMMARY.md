# 온보딩 프로세스 문제점 요약

**작성일**: 2025-12-10  
**상태**: 수정 진행 중

---

## 발견된 문제점

### 1. 관리자 계정 미생성
- **증상**: 프로시저에서 "관리자 계정 생성 및 역할 할당 완료" 메시지가 나오지만 실제로는 사용자가 생성되지 않음
- **원인**: 
  - 프로시저에서 `INSERT INTO users` 시 `user_id` 필드를 지정하지 않음
  - `users` 테이블의 `user_id`는 `VARCHAR(50) UNIQUE NOT NULL`이므로 반드시 값이 필요함
  - `user_id`가 NULL이 되어 UNIQUE 제약 조건 위반 또는 NOT NULL 제약 조건 위반 발생

### 2. 대시보드 미생성
- **증상**: 승인 후 대시보드가 생성되지 않음
- **원인**:
  - `OnboardingService.decide`에서 `OpsConstants.DEFAULT_BUSINESS_TYPE`을 하드코딩으로 사용
  - 실제 온보딩 요청의 `businessType`을 사용하지 않음
  - `OnboardingRequest` 엔티티에 `businessType` 필드가 없었음 (수정 완료)

### 3. businessType 하드코딩
- **증상**: 프로시저 호출 시 항상 `CONSULTATION`으로 전달됨
- **원인**: `OnboardingService.decide`에서 `request.getBusinessType()`을 사용하지 않고 상수 사용

---

## 수정 사항

### 1. OnboardingRequest 엔티티 수정 ✅
- `businessType` 필드 추가
- getter/setter 추가

### 2. OnboardingService.create 수정 ✅
- `businessType` 저장 로직 추가

### 3. OnboardingService.decide 수정 ✅
- `request.getBusinessType()` 사용하도록 수정
- 프로시저 호출 시 실제 `businessType` 전달

### 4. 프로시저 수정 필요 ⚠️
- `CreateOrActivateTenant` 프로시저에서 `user_id` 생성 로직 추가 필요
- 이메일 로컬 파트 기반으로 `user_id` 생성
- 테넌트별 중복 체크 및 순번 추가

---

## 다음 단계

1. 프로시저 수정 완료
2. 서버 재시작
3. 새로운 온보딩 요청으로 재테스트
4. 관리자 계정, 역할 할당, 대시보드 생성 확인

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10

