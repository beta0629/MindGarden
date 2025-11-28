# DTO 표준화 분석 및 마이그레이션 계획

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 분석 완료, 마이그레이션 계획 수립 중

---

## 📊 DTO 파일 현황

### 1. *Dto.java 파일 (14개) - 레거시 패턴

**위치**: `com.coresolution.consultation.dto`

1. `ScheduleDto.java`
2. `PrivacyConsentDto.java`
3. `ClientRegistrationDto.java`
4. `BranchDto.java` ⚠️ **우선순위 높음**
5. `CommonCodeDto.java` ⚠️ **이미 표준화됨 (CommonCodeResponse 사용)**
6. `UserDto.java` ⚠️ **우선순위 높음**
7. `UserAddressDto.java`
8. `ScheduleResponseDto.java` ⚠️ **ResponseDto 혼재**
9. `ConsultantRegistrationDto.java`
10. `ScheduleCreateDto.java` ⚠️ **CreateDto 혼재**
11. `ConsultantAvailabilityDto.java`
12. `ConsultantClientMappingDto.java`
13. `UserTransferDto.java`
14. `BranchStatisticsDto.java`

**문제점**:
- `*Dto` 패턴이 표준이 아님 (표준: `*Request`/`*Response`)
- `ScheduleResponseDto`, `ScheduleCreateDto`처럼 혼재된 패턴
- 일부는 이미 표준화됨 (`CommonCodeDto`는 `CommonCodeResponse`로 대체됨)

---

### 2. *Request.java 파일 (52개) - 표준 패턴 ✅

**표준 패턴 (이미 올바름)**:
- `CommonCodeCreateRequest.java` ✅
- `CommonCodeUpdateRequest.java` ✅
- `TenantDashboardRequest.java` ✅
- `UserRoleAssignmentRequest.java` ✅
- `TenantRoleRequest.java` ✅

**혼재된 패턴 (개선 필요)**:
- `PaymentRequest.java` - 이미 Request이지만 `PaymentCreateRequest`로 명확화 가능
- `EmailRequest.java` - 이미 Request이지만 `EmailSendRequest`로 명확화 가능
- `AuthRequest.java` - 이미 Request이지만 `LoginRequest`로 명확화 가능

**분류**:
- **Core DTOs** (core.dto): 10개
- **Consultation DTOs** (consultation.dto): 35개
- **User DTOs** (user.dto): 1개
- **Controller DTOs** (controller.dto): 6개

---

### 3. *Response.java 파일 (42개) - 표준 패턴 ✅

**표준 패턴 (이미 올바름)**:
- `CommonCodeResponse.java` ✅
- `CommonCodeListResponse.java` ✅
- `TenantDashboardResponse.java` ✅
- `UserRoleAssignmentResponse.java` ✅
- `TenantRoleResponse.java` ✅

**혼재된 패턴**:
- `ErrorResponse.java` (2개 존재)
  - `com.coresolution.core.dto.ErrorResponse` ✅ (표준)
  - `com.coresolution.consultation.dto.ErrorResponse` ⚠️ (레거시, 제거 예정)

**분류**:
- **Core DTOs** (core.dto): 15개
- **Consultation DTOs** (consultation.dto): 25개
- **User DTOs** (user.dto): 1개
- **Controller DTOs** (controller.dto): 1개

---

## 🔍 네이밍 규칙 불일치 분석

### 문제점 1: Dto vs Request/Response 혼재

**현재 상태**:
```
❌ BranchDto → ✅ BranchResponse, BranchCreateRequest, BranchUpdateRequest
❌ UserDto → ✅ UserResponse, UserCreateRequest, UserUpdateRequest
❌ ScheduleDto → ✅ ScheduleResponse, ScheduleCreateRequest
```

### 문제점 2: CreateDto, ResponseDto 혼재

**현재 상태**:
```
❌ ScheduleCreateDto → ✅ ScheduleCreateRequest
❌ ScheduleResponseDto → ✅ ScheduleResponse
```

### 문제점 3: Request 명확성 부족

**개선 가능**:
```
PaymentRequest → PaymentCreateRequest (더 명확)
EmailRequest → EmailSendRequest (더 명확)
AuthRequest → LoginRequest (더 명확)
```

---

## 🎯 마이그레이션 우선순위

### Phase 2.1: 핵심 DTO 마이그레이션 (P0) ✅ 완료

**우선순위 1**: 가장 많이 사용되는 DTO
1. ✅ `BranchDto` → `BranchResponse`, `BranchCreateRequest`, `BranchUpdateRequest`
   - **상태**: 이미 표준 DTO로 마이그레이션 완료, BranchDto Deprecated 표시
   - **완료일**: 2025-11-20

2. ✅ `UserDto` → `UserResponse`
   - **상태**: UserResponse 생성 및 AuthServiceImpl 마이그레이션 완료
   - **완료일**: 2025-11-20

### Phase 2.2: 일관성 개선 (P1) ✅ 완료

**우선순위 2**: 혼재된 패턴 정리
3. ✅ `ScheduleCreateDto` → `ScheduleCreateRequest`
4. ✅ `ScheduleResponseDto` → `ScheduleResponse`
5. ✅ `ScheduleDto` → `ScheduleResponse` (조회용)
   - **상태**: 표준 DTO 생성 완료, 기존 DTO Deprecated 표시
   - **완료일**: 2025-11-20
   - **하위 호환성**: 변환 메서드 제공

### Phase 2.3: 명확성 개선 (P2) - 선택적

**우선순위 3**: Request 명확화 (선택적)
- `PaymentRequest` → `PaymentCreateRequest` (선택적)
- `EmailRequest` → `EmailSendRequest` (선택적)
- `AuthRequest` → `LoginRequest` (선택적)

**예상 시간**: 1-2시간

### Phase 2.4: 나머지 DTO (P3) ✅ 완료 (2025-11-20)

**우선순위 4**: 나머지 DTO들
- [x] `PrivacyConsentDto` → `PrivacyConsentResponse`, `PrivacyConsentCreateRequest` ✅
- [x] `ClientRegistrationDto` → `ClientRegistrationRequest` ✅
- [x] `ConsultantRegistrationDto` → `ConsultantRegistrationRequest` ✅
- [x] `ConsultantAvailabilityDto` → `ConsultantAvailabilityResponse`, `ConsultantAvailabilityCreateRequest`, `ConsultantAvailabilityUpdateRequest` ✅
- [x] `ConsultantClientMappingDto` → `ConsultantClientMappingResponse`, `ConsultantClientMappingCreateRequest` ✅
- [x] `UserTransferDto` → `UserTransferRequest` ✅
- [x] `BranchStatisticsDto` → `BranchStatisticsResponse` ✅
- [x] `UserAddressDto` → `UserAddressResponse`, `UserAddressCreateRequest`, `UserAddressUpdateRequest` ✅

**완료 시간**: 전체 8개 DTO 완료 (약 1.5시간)

---

## 📋 마이그레이션 계획

### 단계별 마이그레이션 전략

#### 1. 새 DTO 생성 (하위 호환성 유지)

```java
// 1단계: 새 DTO 생성
public class BranchResponse {
    // BranchDto와 동일한 필드
}

public class BranchCreateRequest {
    // 생성에 필요한 필드만
}

public class BranchUpdateRequest {
    // 수정에 필요한 필드만
}
```

#### 2. 기존 DTO Deprecated 표시

```java
/**
 * @deprecated Use BranchResponse instead
 * This class will be removed in version 2.0.0
 */
@Deprecated
public class BranchDto {
    // ...
}
```

#### 3. 점진적 마이그레이션

- 새로운 코드는 새 DTO 사용
- 기존 코드는 점진적으로 마이그레이션
- Controller부터 시작하여 Service, Repository 순으로

#### 4. 레거시 DTO 제거 (최종 단계)

- 모든 사용처 마이그레이션 완료 후
- Deprecated DTO 제거

---

## ✅ 체크리스트

### Phase 2.1: 핵심 DTO 마이그레이션 ✅ 완료
- [x] BranchDto 분석 및 새 DTO 설계
- [x] BranchResponse 생성 (이미 존재)
- [x] BranchCreateRequest 생성 (이미 존재)
- [x] BranchUpdateRequest 생성 (이미 존재)
- [x] BranchDto Deprecated 표시 ✅

- [x] UserDto 분석 및 새 DTO 설계
- [x] UserResponse 생성 ✅
- [x] UserDto 사용처 조사
- [x] AuthServiceImpl 마이그레이션 ✅
- [x] UserDto Deprecated 표시 ✅

### Phase 2.2: 일관성 개선 ✅ 완료
- [x] ScheduleCreateDto → ScheduleCreateRequest ✅
- [x] ScheduleResponseDto → ScheduleResponse ✅
- [x] ScheduleDto → ScheduleResponse (조회용) ✅
- [x] 하위 호환성 변환 메서드 제공 ✅

### Phase 2.3: 명확성 개선 (선택적)
- [ ] PaymentRequest → PaymentCreateRequest (선택적)
- [ ] EmailRequest → EmailSendRequest (선택적)
- [ ] AuthRequest → LoginRequest (선택적)

### Phase 2.4: 나머지 DTO
- [ ] 나머지 DTO들 점진적 마이그레이션

---

## 📊 진행 상황

```
Phase 2.1: ████████████████████ 100% ✅ (BranchDto, UserDto)
Phase 2.2: ████████████████████ 100% ✅ (ScheduleDto 관련)
Phase 2.3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (선택적)
Phase 2.4: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (나머지 DTO)
```

---

## 🔗 관련 문서

- [표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)
- [오늘 할 일 체크리스트](./TODAY_TODO_CHECKLIST.md)

---

**마지막 업데이트**: 2025-11-20

