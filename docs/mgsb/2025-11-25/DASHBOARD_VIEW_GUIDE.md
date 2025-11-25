# 대시보드 확인 방법 가이드

대시보드를 생성한 후 실제로 확인하는 방법을 안내합니다.

## 📋 목차
1. [대시보드 확인 방법](#대시보드-확인-방법)
2. [자동 역할 할당 기능](#자동-역할-할당-기능)
3. [수동 역할 할당](#수동-역할-할당)
4. [문제 해결](#문제-해결)

---

## 대시보드 확인 방법

### 방법 1: 로그인 후 자동 리다이렉트 (권장)

1. **대시보드 생성 시 역할 자동 할당 옵션 체크**
   - 대시보드 생성 모달에서 "대시보드 생성 후 현재 계정에 이 역할 자동 할당" 체크박스 선택
   - 대시보드 생성 완료

2. **로그아웃 후 다시 로그인**
   - 현재 세션에서 역할 정보가 갱신되도록 로그아웃
   - 다시 로그인하면 역할에 맞는 대시보드로 자동 리다이렉트됩니다

3. **대시보드 확인**
   - 로그인 후 `/dashboard` 경로로 자동 이동
   - `DynamicDashboard` 컴포넌트가 역할에 맞는 대시보드를 자동으로 로드합니다

### 방법 2: 직접 URL 접근

1. **로그인 상태 확인**
   - 이미 로그인되어 있어야 합니다

2. **대시보드 URL 접근**
   - 브라우저에서 직접 접근: `http://localhost:3000/dashboard`
   - 또는 역할별 경로:
     - `/client/dashboard` (내담자)
     - `/consultant/dashboard` (상담사)
     - `/admin/dashboard` (관리자)
     - `/academy` (학생/선생님)

3. **대시보드 자동 로드**
   - `DynamicDashboard` 컴포넌트가 현재 사용자의 역할을 확인
   - 역할에 맞는 대시보드를 백엔드에서 조회하여 표시

### 방법 3: 대시보드 관리 페이지에서 확인

1. **대시보드 관리 페이지 접근**
   - 관리자 메뉴에서 "대시보드 관리" 선택
   - 또는 직접 URL: `/admin/dashboards` (라우팅이 설정되어 있다면)

2. **대시보드 목록 확인**
   - 생성한 대시보드가 목록에 표시됩니다
   - 대시보드 이름, 역할, 상태 등을 확인할 수 있습니다

---

## 자동 역할 할당 기능

### 기능 설명

대시보드 생성 시 현재 로그인한 사용자에게 해당 역할을 자동으로 할당하는 기능입니다.

### 사용 방법

1. **대시보드 생성 모달 열기**
   - 관리자 메뉴에서 "대시보드 생성" 클릭

2. **역할 선택**
   - 대시보드에 연결할 역할 선택

3. **자동 할당 옵션 체크**
   - 역할 선택 필드 아래에 나타나는 체크박스:
     - ✅ "대시보드 생성 후 현재 계정에 이 역할 자동 할당"
   - 이 옵션을 체크하면 대시보드 생성 후 자동으로 역할이 할당됩니다

4. **대시보드 생성**
   - 대시보드 생성 버튼 클릭
   - 성공 메시지: "대시보드가 생성되었고, 현재 계정에 역할이 할당되었습니다. 대시보드를 바로 확인할 수 있습니다."

### 동작 원리

```javascript
// 대시보드 생성 성공 후
if (assignRoleToCurrentUser && formData.tenantRoleId) {
  // 현재 사용자에게 역할 할당 API 호출
  POST /api/users/{userId}/roles
  {
    "tenantId": "테넌트ID",
    "tenantRoleId": "역할ID",
    "branchId": null,
    "effectiveFrom": "2025-11-25",
    "effectiveTo": null,
    "assignmentReason": "대시보드 생성 시 자동 할당"
  }
}
```

---

## 수동 역할 할당

자동 할당 옵션을 사용하지 않은 경우, 수동으로 역할을 할당해야 합니다.

### 방법 1: 사용자 관리 페이지에서 할당

1. **사용자 관리 페이지 접근**
   - 관리자 메뉴에서 "사용자 관리" 선택

2. **사용자 선택**
   - 역할을 할당할 사용자 선택

3. **역할 할당**
   - 사용자 상세 페이지에서 "역할 할당" 버튼 클릭
   - 대시보드에 연결된 역할 선택
   - 저장

### 방법 2: API를 통한 직접 할당

```bash
# 사용자에게 역할 할당
curl -X POST http://localhost:8080/api/users/{userId}/roles \
  -H "Content-Type: application/json" \
  -H "Cookie: JSESSIONID=..." \
  -d '{
    "tenantId": "테넌트ID",
    "tenantRoleId": "역할ID",
    "branchId": null,
    "effectiveFrom": "2025-11-25",
    "effectiveTo": null,
    "assignmentReason": "대시보드 확인을 위한 역할 할당"
  }'
```

---

## 문제 해결

### 문제 1: 대시보드가 표시되지 않음

**원인:**
- 역할이 할당되지 않았거나
- 역할에 연결된 대시보드가 없거나
- 세션 정보가 갱신되지 않음

**해결 방법:**
1. 로그아웃 후 다시 로그인
2. 역할 할당 상태 확인
3. 브라우저 개발자 도구에서 네트워크 탭 확인:
   - `GET /api/v1/tenant/dashboards/current` 요청 확인
   - 응답 상태 코드 확인 (200이어야 함)

### 문제 2: 역할 할당이 실패함

**원인:**
- 이미 같은 역할이 할당되어 있거나
- 권한이 없거나
- 역할이 존재하지 않음

**해결 방법:**
1. 콘솔 로그 확인:
   ```javascript
   console.error('❌ 역할 할당 실패:', error);
   ```
2. 중복 할당 확인:
   - 같은 역할이 이미 할당되어 있는지 확인
3. 수동으로 역할 할당 시도

### 문제 3: 로그인 후 대시보드로 이동하지 않음

**원인:**
- 역할 정보가 세션에 없거나
- 대시보드 조회 API가 실패함

**해결 방법:**
1. 브라우저 개발자 도구 콘솔 확인:
   ```javascript
   // 다음 로그들이 나타나는지 확인
   console.log('✅ 동적 대시보드 라우팅:', dashboardPath);
   ```
2. 수동으로 `/dashboard` 경로 접근
3. 세션 정보 확인:
   ```javascript
   const user = sessionManager.getUser();
   console.log('사용자 정보:', user);
   console.log('현재 역할:', user.currentTenantRoleId);
   ```

---

## 대시보드 조회 API

### 현재 사용자 대시보드 조회

```http
GET /api/v1/tenant/dashboards/current
```

**응답:**
```json
{
  "success": true,
  "data": {
    "dashboardId": "dashboard-001",
    "dashboardNameKo": "원장 대시보드",
    "dashboardType": "PRINCIPAL",
    "dashboardConfig": "{...}",
    "tenantRoleId": "role-001",
    "roleNameKo": "원장"
  }
}
```

### 역할별 대시보드 조회

```http
GET /api/v1/tenant/dashboards/by-role/{tenantRoleId}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "dashboardId": "dashboard-001",
    "dashboardNameKo": "원장 대시보드",
    "dashboardType": "PRINCIPAL",
    "dashboardConfig": "{...}",
    "tenantRoleId": "role-001",
    "roleNameKo": "원장"
  }
}
```

---

## 요약

1. **대시보드 생성 시**: "자동 역할 할당" 옵션 체크
2. **로그인**: 로그아웃 후 다시 로그인
3. **자동 리다이렉트**: `/dashboard` 경로로 자동 이동
4. **대시보드 확인**: 역할에 맞는 대시보드가 자동으로 표시됩니다

문제가 발생하면 브라우저 개발자 도구의 콘솔과 네트워크 탭을 확인하세요.


