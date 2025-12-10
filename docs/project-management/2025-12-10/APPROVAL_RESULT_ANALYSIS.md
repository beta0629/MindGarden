# 온보딩 승인 결과 분석

**테스트 일시**: 2025-12-10  
**테넌트 ID**: `tenant-incheon-consultation-002`  
**요청자**: `beta0629@gmail.com`

---

## ✅ 생성 완료된 항목

### 1. 테넌트 생성
- **테넌트 ID**: `tenant-incheon-consultation-002`
- **테넌트명**: 탁구마음 심리상담 센터
- **업종**: CONSULTATION
- **상태**: ACTIVE
- **브랜딩 JSON**: `{"companyName": "탁구마음 심리상담 센터", "companyNameEn": "탁구마음 심리상담 센터"}`
- **생성 시간**: 2025-12-10 09:28:59 (KST)

### 2. 기본 역할 생성
- **원장** (tenant_role_id: `38cb3ba5-d55f-11f0-b5cc-00163ee63ca3`)
- **상담사** (tenant_role_id: `38cccfc1-d55f-11f0-b5cc-00163ee63ca3`)
- **내담자** (tenant_role_id: `38ccd42e-d55f-11f0-b5cc-00163ee63ca3`)
- **사무원** (tenant_role_id: `38ccd75b-d55f-11f0-b5cc-00163ee63ca3`)
- **생성 시간**: 2025-12-10 09:28:59 ~ 09:29:00 (KST)

---

## ❌ 생성되지 않은 항목

### 1. 관리자 계정
- **예상 이메일**: `beta0629@gmail.com`
- **상태**: ❌ users 테이블에 존재하지 않음
- **원인 분석 필요**: 프로시저에서 "관리자 계정 생성 및 역할 할당 완료"라고 했지만 실제로는 생성되지 않음

### 2. 역할 할당
- **상태**: ❌ user_role_assignments 테이블에 존재하지 않음
- **원인**: 관리자 계정이 생성되지 않아 역할 할당도 불가능

### 3. 대시보드
- **예상 대시보드 수**: 4개 (원장, 상담사, 내담자, 사무원)
- **상태**: ❌ tenant_dashboards 테이블에 존재하지 않음
- **원인 분석**:
  - `createDefaultDashboards` 메서드가 `OpsConstants.DEFAULT_BUSINESS_TYPE`을 사용하고 있음
  - 실제로는 `request.getBusinessType()`을 사용해야 함
  - 또는 `createDefaultDashboards` 메서드가 예외를 발생시켰을 가능성

---

## 🔍 원인 분석

### 문제 1: 관리자 계정 미생성
프로시저 로그에서는 "관리자 계정 생성 및 역할 할당 완료"라고 했지만, 실제 데이터베이스에는 사용자가 생성되지 않았습니다.

**가능한 원인**:
1. 프로시저 내부에서 사용자 생성 로직이 실패했지만 예외가 발생하지 않음
2. 트랜잭션 롤백이 발생했지만 프로시저는 성공으로 반환
3. 이메일 중복 체크 등으로 인한 생성 실패

### 문제 2: 대시보드 미생성
`OnboardingService.decide` 메서드의 433번 라인:
```java
createDefaultDashboards(tenantIdValue, OpsConstants.DEFAULT_BUSINESS_TYPE, actorId);
```

**문제점**:
- `OpsConstants.DEFAULT_BUSINESS_TYPE`을 하드코딩으로 사용
- 실제 온보딩 요청의 `businessType`을 사용해야 함
- `OnboardingRequest` 엔티티에 `getBusinessType()` 메서드가 있는지 확인 필요

---

## 📋 수정 필요 사항

### 1. `OnboardingService.decide` 메서드 수정
```java
// 현재 (433번 라인)
createDefaultDashboards(tenantIdValue, OpsConstants.DEFAULT_BUSINESS_TYPE, actorId);

// 수정 필요
String businessType = request.getBusinessType();
if (businessType == null || businessType.trim().isEmpty()) {
    businessType = OpsConstants.DEFAULT_BUSINESS_TYPE;
}
createDefaultDashboards(tenantIdValue, businessType, actorId);
```

### 2. 관리자 계정 생성 확인
- 프로시저 `CreateOrActivateTenant` 내부 로직 확인
- 사용자 생성 실패 시 예외 처리 확인
- 서버 로그에서 실제 오류 메시지 확인

### 3. `OnboardingRequest` 엔티티 확인
- `businessType` 필드 존재 여부 확인
- `getBusinessType()` 메서드 존재 여부 확인

---

## 🔧 다음 단계

1. **서버 로그 확인**: 실제 오류 메시지 확인
2. **프로시저 로직 확인**: `CreateOrActivateTenant` 프로시저 내부 로직 검토
3. **코드 수정**: `OnboardingService.decide` 메서드에서 `request.getBusinessType()` 사용
4. **재테스트**: 수정 후 다시 승인 프로세스 테스트

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10

