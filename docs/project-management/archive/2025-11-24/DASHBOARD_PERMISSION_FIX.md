# 대시보드 상세 페이지 권한 문제 해결

**작성일**: 2025-11-24  
**목적**: 대시보드 상세 페이지 접근 시 "테넌트 정보가 없습니다" 오류 해결

---

## 문제 분석

### 증상
- 대시보드 목록 조회 시 `{"success":false,"message":"테넌트 정보가 없습니다."}` 오류 발생
- 대시보드 상세 조회 시 동일한 오류 발생

### 원인
- `TenantContextHolder.getTenantId()`가 `null`을 반환
- `TenantContextFilter`가 세션의 User 정보에서 tenantId를 추출하지 못함
- 세션에 저장된 User 객체에 tenantId가 없을 수 있음

---

## 해결 방법

### 1. TenantDashboardController 수정

**변경 사항:**
- `UserRepository` 주입 추가
- `TenantContextHolder`에 tenantId가 없을 때 세션의 User 정보에서 가져오기
- 데이터베이스에서 최신 사용자 정보 조회하여 tenantId 확인

**수정된 메서드:**
- `getDashboards()` - 대시보드 목록 조회
- `getDashboard()` - 대시보드 상세 조회
- `getCurrentUserDashboard()` - 현재 사용자 대시보드 조회
- `getDashboardByRole()` - 역할별 대시보드 조회

**코드 예시:**
```java
String tenantId = TenantContextHolder.getTenantId();

// TenantContextHolder에 tenantId가 없으면 세션의 User 정보에서 가져오기
if (tenantId == null) {
    User currentUser = SessionUtils.getCurrentUser(session);
    if (currentUser != null) {
        // 데이터베이스에서 최신 사용자 정보 조회 (tenantId 포함)
        User dbUser = userRepository.findById(currentUser.getId()).orElse(currentUser);
        if (dbUser.getTenantId() != null) {
            tenantId = dbUser.getTenantId();
            TenantContext.setTenantId(tenantId);
            log.debug("Tenant ID set from user database: {}", tenantId);
        } else {
            throw new IllegalArgumentException("사용자의 테넌트 정보가 없습니다.");
        }
    } else {
        throw new IllegalArgumentException("로그인이 필요합니다.");
    }
}
```

---

## 테스트 결과

### 현재 상태
- 코드 수정 완료
- 서버 재시작 대기 중 (GitHub Actions 자동 배포)
- 배포 후 테스트 필요

### 예상 결과
- ✅ 대시보드 목록 조회 성공
- ✅ 대시보드 상세 조회 성공
- ✅ 현재 사용자 대시보드 조회 성공
- ✅ 역할별 대시보드 조회 성공

---

## 다음 단계

1. ⏳ 서버 재시작 대기 (GitHub Actions 자동 배포)
2. ⏳ 배포 후 테스트 재실행
3. ⏳ 프론트엔드에서 대시보드 접근 확인

---

## 참고

- `TenantContextFilter`가 세션의 User 정보에서 tenantId를 추출하지만, User 객체에 tenantId가 없을 수 있음
- 데이터베이스에서 최신 사용자 정보를 조회하여 tenantId를 확인하는 것이 안전함
- 모든 대시보드 조회 메서드에 동일한 로직 적용

