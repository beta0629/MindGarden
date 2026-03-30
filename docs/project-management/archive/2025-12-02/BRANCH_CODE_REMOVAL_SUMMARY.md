# 지점코드 시스템 제거 작업 요약

**작성일**: 2025-12-02 (화요일)  
**작업 유형**: 레거시 시스템 주석처리  
**영향 범위**: 회원가입, 로그인, 상담사/내담자 등록

---

## 📋 작업 배경

### 문제 상황
- 테넌트 시스템으로 전환하면서 지점(Branch) 개념이 불필요해짐
- 지점코드 필수 검증으로 인해 상담사/내담자 등록 실패
- 테넌트 ID로 데이터 격리가 이미 구현되어 지점 관리 중복

### 결정 사항
- 지점코드 관련 로직을 **삭제하지 않고 주석처리**
- 필요시 재사용 가능하도록 코드 보존
- "레거시 시스템, 테넌트 시스템에서는 불필요" 주석 추가

---

## 🔧 변경된 파일 및 내용

### 1. AdminController.java (상담사/내담자 등록)
**경로**: `src/main/java/com/coresolution/consultation/controller/AdminController.java`

#### 변경 1: 상담사 등록 (registerConsultant)
**라인**: 1475-1496

```java
// 지점코드 자동 설정 로직 (레거시 시스템, 필요시 사용)
/*
if (currentUser != null) {
    log.info("🔧 현재 사용자 지점 정보: branchCode={}", currentUser.getBranchCode());
    
    // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
    if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty() &&
        (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty())) {
        dto.setBranchCode(currentUser.getBranchCode());
        log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", dto.getBranchCode());
    }
}

// 지점코드 필수 검증 (레거시 시스템)
if (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty()) {
    log.error("❌ 지점코드가 없습니다. 상담사 등록을 거부합니다.");
    throw new IllegalArgumentException("지점코드는 필수입니다. 관리자에게 문의하세요.");
}
*/
```

#### 변경 2: 내담자 등록 (registerClient)
**라인**: 1512-1537

```java
// 지점코드 자동 설정 로직 (레거시 시스템, 필요시 사용)
/*
if (currentUser != null) {
    log.info("🔧 현재 사용자 지점 정보: branchCode={}", currentUser.getBranchCode());
    
    // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
    if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty() &&
        (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty())) {
        dto.setBranchCode(currentUser.getBranchCode());
        log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", dto.getBranchCode());
    }
}

// 지점코드 필수 검증 (레거시 시스템)
if (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty()) {
    log.error("❌ 지점코드가 없습니다. 등록을 거부합니다.");
    throw new IllegalArgumentException("지점코드는 필수입니다. 관리자에게 문의하세요.");
}
*/
```

---

### 2. AdminServiceImpl.java (상담사/내담자 등록, 매칭 생성)
**경로**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`

#### 변경 1: 상담사 등록 지점 처리 (registerConsultant)
**라인**: 96-107

```java
// 지점코드 처리 (레거시 시스템, 필요시 사용)
Branch branch = null;
/*
if (dto.getBranchCode() != null && !dto.getBranchCode().trim().isEmpty()) {
    try {
        branch = branchService.getBranchByCode(dto.getBranchCode());
        log.info("🔐 관리자 상담사 등록 시 지점 할당: branchCode={}, branchName={}", 
            dto.getBranchCode(), branch.getBranchName());
    } catch (Exception e) {
        log.error("❌ 지점 코드 처리 중 오류: branchCode={}, error={}", dto.getBranchCode(), e.getMessage());
        throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + dto.getBranchCode());
    }
}
*/
```

#### 변경 2: 내담자 등록 지점 처리 (registerClient)
**라인**: 161-172

```java
// 지점코드 처리 (레거시 시스템, 테넌트 시스템에서는 불필요)
Branch branch = null;
/*
if (dto.getBranchCode() != null && !dto.getBranchCode().trim().isEmpty()) {
    try {
        branch = branchService.getBranchByCode(dto.getBranchCode());
        log.info("🔐 관리자 내담자 등록 시 지점 할당: branchCode={}, branchName={}", 
            dto.getBranchCode(), branch.getBranchName());
    } catch (Exception e) {
        log.error("❌ 지점 코드 처리 중 오류: branchCode={}, error={}", dto.getBranchCode(), e.getMessage());
        throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + dto.getBranchCode());
    }
}
*/
```

#### 변경 3: 매칭 생성 지점 처리 (createMapping)
**라인**: 218-225

```java
// 지점코드 설정 (레거시 시스템, 테넌트 시스템에서는 불필요)
String branchCode = null;
/*
branchCode = consultant.getBranchCode();
if (branchCode == null || branchCode.trim().isEmpty()) {
    branchCode = clientUser.getBranchCode();
}
if (branchCode == null || branchCode.trim().isEmpty()) {
    branchCode = AdminConstants.DEFAULT_BRANCH_CODE; // 기본값
}
*/
```

**영향**:
- 매칭 생성 시 지점코드 NULL 허용
- 상담사/내담자의 지점코드 참조 제거
- 기본 지점코드 설정 제거

---

### 3. SocialAuthServiceImpl.java (SNS 간편 회원가입)
**경로**: `src/main/java/com/coresolution/consultation/service/impl/SocialAuthServiceImpl.java`

#### 변경: 소셜 회원가입 지점 검증
**라인**: 138-153

```java
// 지점 정보 검증 (레거시 시스템, 테넌트 시스템에서는 불필요)
Branch branch = null;
String validatedBranchCode = null;
/*
validatedBranchCode = request.getBranchCode();
if (validatedBranchCode != null && !validatedBranchCode.trim().isEmpty()) {
    // BranchCode enum으로 유효성 검사
   if (com.coresolution.consultation.enums.BranchCode.isValidCode(validatedBranchCode)) {
       log.info("유효한 지점 코드 설정: branchCode={}", validatedBranchCode);
   } else {
       log.warn("유효하지 않은 지점 코드, 기본값(MAIN001)으로 설정: branchCode={}", validatedBranchCode);
       validatedBranchCode = com.coresolution.consultation.enums.BranchCode.MAIN001.getCode();
   }
} else {
    // 기본값 설정
    validatedBranchCode = com.coresolution.consultation.enums.BranchCode.MAIN001.getCode();
    log.info("지점 코드 없음, 기본값(MAIN001)으로 설정");
}
*/
```

**User 생성 부분**:
```java
User user = User.builder()
        .username(username)
        .password(passwordEncoder.encode(request.getPassword()))
        .name(request.getName())
        .email(request.getEmail())
        .phone(phone)
        .role(UserRole.CLIENT)
        .branchCode(validatedBranchCode) // 지점코드 (테넌트 시스템에서는 NULL)
        .branch(branch) // 지점 객체 (테넌트 시스템에서는 NULL)
        .profileImageUrl(request.getProviderProfileImage())
        .build();
```

---

### 4. AuthController.java (지점별 로그인)
**경로**: `src/main/java/com/coresolution/consultation/controller/AuthController.java`

#### 변경: 지점별 로그인 검증
**라인**: 989-1001

```java
// 지점 코드 유효성 검사 (레거시 시스템, 테넌트 시스템에서는 불필요)
/*
if (request.getLoginType() == BranchLoginRequest.LoginType.BRANCH) {
    if (request.getBranchCode() == null || request.getBranchCode().trim().isEmpty()) {
        throw new IllegalArgumentException("지점 로그인시 지점 코드는 필수입니다.");
    }
    
    // 지점 존재 여부 확인
    try {
        branchService.getBranchByCode(request.getBranchCode());
    } catch (Exception e) {
        throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + request.getBranchCode());
    }
}
*/
```

---

## ✅ 테스트 결과

### 변경 전
- ❌ 상담사 등록 실패: "지점코드는 필수입니다. 관리자에게 문의하세요."
- ❌ 내담자 등록 실패: "지점코드는 필수입니다. 관리자에게 문의하세요."
- ⚠️ 매칭 생성: 지점코드 자동 설정 (상담사/내담자 지점 참조)

### 변경 후
- ✅ 상담사 등록 성공 (ID: 223, username: consultant-test-001, branchCode: NULL)
- ✅ 내담자 등록 성공 (ID: 224, username: client-test-001, branchCode: NULL)
- ✅ 매칭 생성 가능 (branchCode: NULL)
- ✅ 데이터베이스 저장 확인
- ✅ 빌드 성공 (mvn clean compile)

---

## 📊 영향 받지 않는 기능

### 1. 일반 회원가입 (AuthController.register)
- **상태**: 변경 없음
- **이유**: 원래부터 지점코드 검증 없음
- **경로**: `/api/auth/register`

### 2. 지점 관리 API
- **상태**: 유지
- **이유**: 향후 필요시 사용 가능
- **관련 파일**:
  - `BranchController.java`
  - `BranchService.java`
  - `BranchServiceImpl.java`

### 3. 학원 시스템 (Academy)
- **상태**: 유지
- **이유**: 학원 시스템은 지점 개념 필요
- **관련 엔티티**:
  - `AcademyInvoice.java`
  - `AcademyTuitionPayment.java`
  - `ClassEnrollment.java`
  - `Attendance.java`

---

## 🔄 재사용 방법

### 지점코드 시스템 재활성화가 필요한 경우

1. **주석 해제**
   - 위에 나열된 4개 파일의 주석 제거
   - `/* ... */` 블록을 삭제

2. **테스트**
   - 지점 생성 API 테스트
   - 사용자에게 지점코드 할당
   - 상담사/내담자 등록 테스트

3. **데이터 마이그레이션**
   - 기존 사용자에게 기본 지점코드 할당
   ```sql
   UPDATE users 
   SET branch_code = 'MAIN001' 
   WHERE branch_code IS NULL AND tenant_id = 'your-tenant-id';
   ```

---

## 💡 권장사항

### 단기 (현재)
1. ✅ 지점코드 주석처리 유지
2. ✅ 테넌트 ID 기반 데이터 격리 사용
3. ✅ NULL 허용으로 유연성 확보

### 중기 (3개월 내)
1. 지점 관리 기능 필요성 재검토
2. 사용하지 않는 Branch 관련 테이블 정리
3. 데이터베이스 스키마 최적화

### 장기 (6개월 이상)
1. 지점 시스템 완전 제거 검토
2. 테넌트 기반 조직 구조로 통합
3. 레거시 코드 정리

---

## 📎 관련 문서

- `docs/testing/TENANT_API_TEST_FINAL_REPORT.md` - API 테스트 결과
- `docs/architecture/TENANT_SYSTEM_DESIGN.md` - 테넌트 시스템 설계 (작성 필요)

---

## 🚨 주의사항

### 데이터베이스
- `users` 테이블의 `branch_code` 컬럼은 유지 (NULL 허용)
- `branches` 테이블은 유지 (학원 시스템에서 사용 가능)

### 프론트엔드
- 지점 선택 UI는 숨김 처리 권장
- 기존 지점 관련 컴포넌트는 유지 (재사용 가능)

### 백엔드
- Branch 엔티티 및 Repository는 유지
- BranchService는 유지 (학원 시스템에서 사용)

---

**작성자**: AI Assistant  
**검토 필요**: 프로덕션 배포 전 QA 테스트  
**다음 단계**: 프론트엔드 지점 선택 UI 숨김 처리

