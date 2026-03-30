# 대시보드 생성 기능 테스트 가이드

**작성일**: 2025-11-24  
**목적**: 대시보드 생성 버튼이 실제로 작동하는지 확인

---

## 🔍 확인 사항

### 1. 프론트엔드 코드 확인

**파일**: `frontend/src/components/admin/DashboardFormModal.js`

**주요 기능**:
- ✅ `handleSubmit` 함수에서 `/api/v1/tenant/dashboards`로 POST 요청
- ✅ `csrfTokenManager.post()` 메서드 사용
- ✅ 요청 데이터를 백엔드 DTO에 맞게 구성
- ✅ 에러 처리 및 사용자 피드백

**요청 데이터 구조**:
```javascript
{
  tenantRoleId: string,
  dashboardName: string,
  dashboardNameKo: string,
  dashboardNameEn: string,
  description: string,
  dashboardType: string,
  isActive: boolean,
  displayOrder: number,
  dashboardConfig: string (JSON)
}
```

---

### 2. 백엔드 엔드포인트 확인

**파일**: `src/main/java/com/coresolution/core/controller/TenantDashboardController.java`

**엔드포인트**:
```
POST /api/v1/tenant/dashboards
```

**컨트롤러 메서드**:
```java
@PostMapping
public ResponseEntity<ApiResponse<TenantDashboardResponse>> createDashboard(
    @RequestBody TenantDashboardRequest request, 
    HttpSession session)
```

**서비스 메서드**:
```java
TenantDashboardResponse createDashboard(String tenantId, TenantDashboardRequest request, String createdBy)
```

---

### 3. 백엔드 검증 로직

**파일**: `src/main/java/com/coresolution/core/service/impl/TenantDashboardServiceImpl.java`

**검증 항목**:
1. ✅ 테넌트 접근 권한 확인
2. ✅ 역할 존재 확인 (`tenantRoleId`)
3. ✅ 역할이 해당 테넌트에 속하는지 확인
4. ⚠️ **중복 확인**: 같은 역할에 대시보드가 이미 있으면 에러
5. ✅ `dashboardConfig` JSON 유효성 검증

**중복 확인 로직**:
```java
dashboardRepository.findByTenantIdAndTenantRoleId(tenantId, request.getTenantRoleId())
    .ifPresent(existing -> {
        throw new RuntimeException(DashboardConstants.ERROR_DASHBOARD_ALREADY_EXISTS);
    });
```

**에러 메시지**: `"해당 역할에 이미 대시보드가 존재합니다."`

---

## 🧪 테스트 방법

### 테스트 1: 정상 생성

1. **대시보드 관리 페이지 접속**
   - URL: `https://dev.core-solution.co.kr/admin/dashboards`
   - 로그인 필요

2. **"대시보드 생성" 버튼 클릭**

3. **필수 정보 입력**:
   - 역할 선택 (예: "학생")
   - 대시보드 이름 (한글): "테스트 대시보드"
   - 대시보드 타입: "STUDENT"
   - 대시보드 설정 (JSON): 기본값 또는 예시 사용

4. **"생성" 버튼 클릭**

5. **확인 사항**:
   - ✅ 성공 메시지 표시: "대시보드가 생성되었습니다."
   - ✅ 모달 닫힘
   - ✅ 대시보드 목록에 새 대시보드 표시
   - ✅ 브라우저 콘솔에 로그 확인:
     ```
     📤 대시보드 생성 요청: { url, method, data }
     📥 대시보드 생성 응답: { status: 200, ok: true }
     📥 대시보드 생성 결과: { success: true, data: {...} }
     ```

---

### 테스트 2: 중복 생성 시도

1. **이미 존재하는 역할로 대시보드 생성 시도**

2. **예상 결과**:
   - ❌ 에러 메시지: "해당 역할에 이미 대시보드가 존재합니다."
   - ✅ HTTP 상태 코드: 500 (RuntimeException)
   - ✅ 브라우저 콘솔에 에러 로그

---

### 테스트 3: 유효성 검사

1. **필수 필드 미입력**:
   - 역할 미선택
   - 대시보드 이름 미입력
   - 대시보드 타입 미선택

2. **예상 결과**:
   - ❌ "입력한 정보를 확인해주세요." 메시지
   - ❌ 폼 제출 안 됨

3. **잘못된 JSON 입력**:
   - 대시보드 설정에 잘못된 JSON 입력

4. **예상 결과**:
   - ❌ "올바른 JSON 형식이 아닙니다." 메시지
   - ❌ 폼 제출 안 됨

---

## 🔧 디버깅

### 브라우저 콘솔 확인

**정상 케이스**:
```javascript
📤 대시보드 생성 요청: {
  url: "/api/v1/tenant/dashboards",
  method: "POST",
  data: {
    tenantRoleId: "...",
    dashboardName: "...",
    ...
  }
}
📥 대시보드 생성 응답: { status: 200, ok: true }
📥 대시보드 생성 결과: { success: true, data: {...} }
```

**에러 케이스**:
```javascript
📤 대시보드 생성 요청: {...}
📥 대시보드 생성 응답: { status: 500, ok: false }
❌ 대시보드 저장 HTTP 에러: { status: 500, errorData: {...} }
❌ 대시보드 저장 실패: Error: 해당 역할에 이미 대시보드가 존재합니다.
```

---

### 네트워크 탭 확인

1. **개발자 도구 열기** (F12)
2. **Network 탭 선택**
3. **대시보드 생성 버튼 클릭**
4. **요청 확인**:
   - **URL**: `/api/v1/tenant/dashboards`
   - **Method**: `POST`
   - **Status**: `200 OK` (성공) 또는 `500 Internal Server Error` (중복)
   - **Request Payload**: JSON 데이터 확인
   - **Response**: JSON 응답 확인

---

## ⚠️ 알려진 제약사항

### 1. 역할당 하나의 대시보드만 생성 가능

**제약**: 같은 `tenantRoleId`에 대해 대시보드가 이미 있으면 새로 생성할 수 없습니다.

**해결 방법**:
- 기존 대시보드를 수정하거나
- 기존 대시보드를 삭제한 후 새로 생성

**향후 개선**:
- 역할당 여러 대시보드 생성 허용 옵션 추가
- 또는 중복 생성 시 자동으로 기존 대시보드 수정

---

## ✅ 체크리스트

- [x] 프론트엔드 `handleSubmit` 함수 구현 확인
- [x] 백엔드 `@PostMapping` 엔드포인트 확인
- [x] 요청 데이터 구조 확인
- [x] 에러 처리 로직 확인
- [x] 중복 확인 로직 확인
- [x] JSON 유효성 검증 확인
- [ ] 실제 브라우저에서 테스트
- [ ] 네트워크 요청/응답 확인
- [ ] 에러 케이스 테스트

---

## 📝 개선 사항

### 완료된 개선

1. ✅ 요청 데이터를 명시적으로 구성하여 백엔드 DTO와 일치시킴
2. ✅ 디버깅을 위한 콘솔 로그 추가
3. ✅ 에러 메시지 처리 개선 (HTTP 상태 코드별 메시지)
4. ✅ 중복 대시보드 생성 시 명확한 에러 메시지 표시

### 향후 개선

1. ⏳ 역할당 여러 대시보드 생성 허용 옵션
2. ⏳ 중복 생성 시 자동 수정 옵션
3. ⏳ 대시보드 생성 전 중복 여부 확인 (프론트엔드)
4. ⏳ 대시보드 생성 후 목록 자동 새로고침

---

**최종 업데이트**: 2025-11-24

