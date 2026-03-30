# 위젯 그룹화 시스템 테스트 계획

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**상태**: 📋 계획

---

## 📌 테스트 개요

위젯 그룹화 및 자동 생성 시스템의 전체 플로우를 검증합니다.

### 테스트 목표
1. ✅ 테넌트 생성 시 위젯 자동 생성 확인
2. ✅ 위젯 그룹 조회 API 검증
3. ✅ 위젯 추가/삭제 API 검증
4. ✅ 위젯 권한 시스템 검증
5. ✅ 프론트엔드 통합 검증

---

## 🎯 테스트 시나리오

### Test 1: 테넌트 생성 및 위젯 자동 생성 ⭐

**목적**: 테넌트 생성 시 위젯이 자동으로 생성되는지 확인

#### 1.1 상담소 테넌트 생성
```bash
# 1. 테넌트 생성 API 호출
curl -X POST http://localhost:8080/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "테스트 상담소",
    "businessType": "CONSULTATION",
    "adminEmail": "admin@test.com",
    "adminPassword": "Test1234!",
    "adminName": "관리자"
  }'

# 예상 결과:
# - 테넌트 생성 성공
# - 테넌트 ID 반환 (예: tenant_id = 123)
```

#### 1.2 데이터베이스 확인
```sql
-- 1. 테넌트 확인
SELECT * FROM tenant WHERE tenant_id = 123;

-- 2. 위젯 그룹 생성 확인
SELECT * FROM widget_groups WHERE tenant_id = 123;
-- 예상 결과: 3개 그룹 (ADMIN, MANAGER, CONSULTANT)

-- 3. 위젯 정의 생성 확인
SELECT 
    wg.group_name_ko,
    wd.widget_type,
    wd.widget_name_ko,
    wd.is_system_managed,
    wd.is_required,
    wd.is_deletable
FROM widget_definitions wd
JOIN widget_groups wg ON wd.group_id = wg.group_id
WHERE wd.tenant_id = 123
ORDER BY wg.group_name_ko, wd.display_order;

-- 예상 결과:
-- ADMIN 그룹: WELCOME, SUMMARY, STATISTICS, SYSTEM_STATUS 등
-- MANAGER 그룹: WELCOME, SUMMARY, SESSION_MANAGEMENT 등
-- CONSULTANT 그룹: WELCOME, MY_SCHEDULE, MY_CLIENTS 등
```

#### 1.3 대시보드 생성 확인
```sql
-- 대시보드 생성 확인
SELECT * FROM dashboard WHERE tenant_id = 123;
-- 예상 결과: 3개 대시보드 (ADMIN, MANAGER, CONSULTANT)

-- 대시보드 위젯 매핑 확인
SELECT 
    d.dashboard_name,
    dw.widget_id,
    wd.widget_type,
    wd.widget_name_ko,
    dw.display_order
FROM dashboard_widget dw
JOIN dashboard d ON dw.dashboard_id = d.dashboard_id
JOIN widget_definitions wd ON dw.widget_id = wd.widget_id
WHERE d.tenant_id = 123
ORDER BY d.dashboard_name, dw.display_order;
```

#### 1.4 검증 항목
- [ ] 테넌트가 성공적으로 생성되었는가?
- [ ] 위젯 그룹이 3개 생성되었는가? (ADMIN, MANAGER, CONSULTANT)
- [ ] 각 그룹별로 위젯 정의가 생성되었는가?
- [ ] 대시보드가 3개 생성되었는가?
- [ ] 대시보드-위젯 매핑이 생성되었는가?
- [ ] 시스템 위젯은 `is_system_managed = true`인가?
- [ ] 필수 위젯은 `is_required = true`인가?

---

### Test 2: 위젯 그룹 조회 API

**목적**: 위젯 그룹 및 정의 조회 API 검증

#### 2.1 모든 위젯 그룹 조회
```bash
curl -X GET "http://localhost:8080/api/v1/widgets/groups" \
  -H "X-Tenant-ID: 123" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
{
  "success": true,
  "message": "위젯 그룹 목록을 조회했습니다",
  "data": [
    {
      "groupId": 1,
      "groupCode": "ADMIN",
      "groupNameKo": "관리자 대시보드",
      "businessType": "CONSULTATION",
      "roleCode": "ADMIN"
    },
    {
      "groupId": 2,
      "groupCode": "MANAGER",
      "groupNameKo": "매니저 대시보드",
      "businessType": "CONSULTATION",
      "roleCode": "MANAGER"
    },
    {
      "groupId": 3,
      "groupCode": "CONSULTANT",
      "groupNameKo": "상담사 대시보드",
      "businessType": "CONSULTATION",
      "roleCode": "CONSULTANT"
    }
  ]
}
```

#### 2.2 그룹별 위젯 조회
```bash
curl -X GET "http://localhost:8080/api/v1/widgets/groups/1/widgets" \
  -H "X-Tenant-ID: 123" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
{
  "success": true,
  "message": "그룹별 위젯 목록을 조회했습니다",
  "data": [
    {
      "widgetId": 1,
      "widgetType": "WELCOME",
      "widgetNameKo": "환영 메시지",
      "isSystemManaged": true,
      "isRequired": true,
      "isDeletable": false,
      "isMovable": false,
      "isConfigurable": false
    },
    {
      "widgetId": 2,
      "widgetType": "SUMMARY",
      "widgetNameKo": "요약 통계",
      "isSystemManaged": true,
      "isRequired": true,
      "isDeletable": false,
      "isMovable": true,
      "isConfigurable": true
    }
  ]
}
```

#### 2.3 그룹화된 위젯 조회
```bash
curl -X GET "http://localhost:8080/api/v1/widgets/grouped?businessType=CONSULTATION&roleCode=ADMIN" \
  -H "X-Tenant-ID: 123" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
{
  "success": true,
  "message": "그룹화된 위젯 목록을 조회했습니다",
  "data": {
    "관리자 대시보드": [
      {
        "widgetId": 1,
        "widgetType": "WELCOME",
        "widgetNameKo": "환영 메시지",
        "isSystemManaged": true,
        "isRequired": true,
        "isDeletable": false
      },
      {
        "widgetId": 2,
        "widgetType": "SUMMARY",
        "widgetNameKo": "요약 통계",
        "isSystemManaged": true,
        "isRequired": true,
        "isDeletable": false
      }
    ]
  }
}
```

#### 2.4 독립 위젯 조회 (추가 가능한 위젯)
```bash
curl -X GET "http://localhost:8080/api/v1/widgets/available?businessType=CONSULTATION" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
{
  "success": true,
  "message": "추가 가능한 위젯 목록을 조회했습니다",
  "data": [
    {
      "widgetId": 10,
      "widgetType": "CUSTOM_CHART",
      "widgetNameKo": "사용자 정의 차트",
      "isSystemManaged": false,
      "isRequired": false,
      "isDeletable": true,
      "isMovable": true,
      "isConfigurable": true
    }
  ]
}
```

#### 2.5 검증 항목
- [ ] 모든 위젯 그룹이 조회되는가?
- [ ] 그룹별 위젯이 올바르게 조회되는가?
- [ ] 그룹화된 위젯이 올바른 형식으로 반환되는가?
- [ ] 독립 위젯만 조회되는가? (is_system_managed = false)
- [ ] 권한 필드가 올바르게 반환되는가?

---

### Test 3: 위젯 추가/삭제 API

**목적**: 위젯 추가 및 삭제 기능 검증

#### 3.1 독립 위젯 추가 (성공 케이스)
```bash
# 1. 독립 위젯 추가
curl -X POST "http://localhost:8080/api/v1/widgets/dashboards/1/widgets" \
  -H "X-Tenant-ID: 123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "widgetType": "CUSTOM_CHART",
    "businessType": "CONSULTATION",
    "roleCode": "ADMIN",
    "displayOrder": 10
  }'

# 예상 응답:
{
  "success": true,
  "message": "위젯이 추가되었습니다",  # 공통코드에서 조회
  "data": {
    "widgetId": 20,
    "widgetType": "CUSTOM_CHART",
    "widgetNameKo": "사용자 정의 차트"
  }
}
```

#### 3.2 시스템 위젯 추가 시도 (실패 케이스)
```bash
curl -X POST "http://localhost:8080/api/v1/widgets/dashboards/1/widgets" \
  -H "X-Tenant-ID: 123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "widgetType": "WELCOME",
    "businessType": "CONSULTATION",
    "roleCode": "ADMIN",
    "displayOrder": 10
  }'

# 예상 응답:
{
  "success": false,
  "message": "이 위젯은 추가할 수 없습니다",  # 공통코드에서 조회
  "data": null
}
```

#### 3.3 독립 위젯 삭제 (성공 케이스)
```bash
curl -X DELETE "http://localhost:8080/api/v1/widgets/dashboards/1/widgets/20" \
  -H "X-Tenant-ID: 123" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
{
  "success": true,
  "message": "위젯이 삭제되었습니다",  # 공통코드에서 조회
  "data": null
}
```

#### 3.4 시스템 위젯 삭제 시도 (실패 케이스)
```bash
curl -X DELETE "http://localhost:8080/api/v1/widgets/dashboards/1/widgets/1" \
  -H "X-Tenant-ID: 123" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답:
{
  "success": false,
  "message": "이 위젯은 삭제할 수 없습니다",  # 공통코드에서 조회
  "data": null
}
```

#### 3.5 검증 항목
- [ ] 독립 위젯이 성공적으로 추가되는가?
- [ ] 시스템 위젯 추가가 거부되는가?
- [ ] 독립 위젯이 성공적으로 삭제되는가?
- [ ] 시스템 위젯 삭제가 거부되는가?
- [ ] 에러 메시지가 공통코드에서 조회되는가?

---

### Test 4: 위젯 권한 확인

**목적**: 위젯 권한 시스템 검증

#### 4.1 위젯 권한 조회
```bash
curl -X GET "http://localhost:8080/api/v1/widgets/1/permissions" \
  -H "X-Tenant-ID: 123" \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 예상 응답 (시스템 위젯):
{
  "success": true,
  "message": "위젯 권한을 조회했습니다",
  "data": {
    "widgetId": 1,
    "canAdd": false,
    "canDelete": false,
    "canMove": false,
    "canConfigure": false,
    "isSystemManaged": true,
    "isRequired": true
  }
}

# 예상 응답 (독립 위젯):
{
  "success": true,
  "message": "위젯 권한을 조회했습니다",
  "data": {
    "widgetId": 20,
    "canAdd": true,
    "canDelete": true,
    "canMove": true,
    "canConfigure": true,
    "isSystemManaged": false,
    "isRequired": false
  }
}
```

#### 4.2 검증 항목
- [ ] 시스템 위젯의 권한이 올바른가?
  - canAdd: false
  - canDelete: false
  - isSystemManaged: true
- [ ] 독립 위젯의 권한이 올바른가?
  - canAdd: true
  - canDelete: true
  - isSystemManaged: false

---

### Test 5: 프론트엔드 통합 테스트

**목적**: 프론트엔드 컴포넌트와 백엔드 API 통합 검증

#### 5.1 서버 실행
```bash
# 백엔드 서버 실행
cd /Users/mind/mindGarden
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 프론트엔드 서버 실행 (별도 터미널)
cd /Users/mind/mindGarden/frontend
npm start
```

#### 5.2 브라우저 테스트 시나리오

**Step 1: 로그인**
1. http://localhost:3000 접속
2. 관리자 계정으로 로그인
3. 대시보드로 이동

**Step 2: 위젯 관리자 열기**
1. 대시보드에서 "위젯 관리" 버튼 클릭
2. DashboardWidgetManager 컴포넌트 렌더링 확인

**Step 3: 그룹화된 위젯 표시 확인**
1. 위젯이 그룹별로 표시되는지 확인
2. 각 위젯에 배지가 올바르게 표시되는지 확인
   - 시스템 위젯: "시스템 위젯" 배지
   - 필수 위젯: "필수" 배지

**Step 4: 위젯 추가**
1. "위젯 추가" 버튼 클릭
2. 추가 가능한 위젯 목록 표시 확인
3. 독립 위젯 선택 및 추가
4. 위젯이 대시보드에 추가되는지 확인

**Step 5: 위젯 삭제**
1. 독립 위젯의 삭제 버튼 클릭
2. 확인 다이얼로그 표시 확인
3. 삭제 확인
4. 위젯이 대시보드에서 제거되는지 확인

**Step 6: 시스템 위젯 삭제 시도**
1. 시스템 위젯의 잠금 아이콘 확인
2. 삭제 버튼이 비활성화되어 있는지 확인

#### 5.3 검증 항목
- [ ] 위젯 관리자가 올바르게 렌더링되는가?
- [ ] 그룹화된 위젯이 올바르게 표시되는가?
- [ ] 배지가 올바르게 표시되는가?
- [ ] 위젯 추가가 정상 작동하는가?
- [ ] 위젯 삭제가 정상 작동하는가?
- [ ] 시스템 위젯 삭제가 차단되는가?
- [ ] 에러 메시지가 올바르게 표시되는가?
- [ ] 반응형 디자인이 작동하는가?

---

## 📊 테스트 체크리스트

### 백엔드 테스트
- [ ] Test 1: 테넌트 생성 및 위젯 자동 생성
  - [ ] 1.1 상담소 테넌트 생성
  - [ ] 1.2 데이터베이스 확인
  - [ ] 1.3 대시보드 생성 확인
  - [ ] 1.4 검증 항목 확인

- [ ] Test 2: 위젯 그룹 조회 API
  - [ ] 2.1 모든 위젯 그룹 조회
  - [ ] 2.2 그룹별 위젯 조회
  - [ ] 2.3 그룹화된 위젯 조회
  - [ ] 2.4 독립 위젯 조회
  - [ ] 2.5 검증 항목 확인

- [ ] Test 3: 위젯 추가/삭제 API
  - [ ] 3.1 독립 위젯 추가 (성공)
  - [ ] 3.2 시스템 위젯 추가 (실패)
  - [ ] 3.3 독립 위젯 삭제 (성공)
  - [ ] 3.4 시스템 위젯 삭제 (실패)
  - [ ] 3.5 검증 항목 확인

- [ ] Test 4: 위젯 권한 확인
  - [ ] 4.1 위젯 권한 조회
  - [ ] 4.2 검증 항목 확인

### 프론트엔드 테스트
- [ ] Test 5: 프론트엔드 통합 테스트
  - [ ] 5.1 서버 실행
  - [ ] 5.2 브라우저 테스트
    - [ ] Step 1: 로그인
    - [ ] Step 2: 위젯 관리자 열기
    - [ ] Step 3: 그룹화된 위젯 표시
    - [ ] Step 4: 위젯 추가
    - [ ] Step 5: 위젯 삭제
    - [ ] Step 6: 시스템 위젯 삭제 시도
  - [ ] 5.3 검증 항목 확인

---

## 🐛 예상 이슈 및 해결 방법

### Issue 1: 테넌트 생성 시 위젯이 생성되지 않음
**원인**: `TenantDashboardServiceImpl`에서 `WidgetGroupService` 호출 누락

**해결**:
```java
@Transactional
public void createDefaultDashboard(Long tenantId, String businessType) {
    // 위젯 그룹 및 정의 생성
    widgetGroupService.createDefaultWidgetConfigurations(tenantId, businessType);
    
    // 대시보드 생성
    // ...
}
```

### Issue 2: API 호출 시 404 에러
**원인**: 컨트롤러 경로 불일치

**해결**:
- 컨트롤러: `@RequestMapping("/api/v1/widgets")`
- 프론트엔드: `/api/v1/widgets/grouped`

### Issue 3: 공통코드 메시지가 null
**원인**: 공통코드가 데이터베이스에 없음

**해결**:
```sql
-- V20251202_013 마이그레이션 실행 확인
SELECT * FROM common_code 
WHERE code_type IN ('ERROR_CODE', 'SUCCESS_MESSAGE');
```

### Issue 4: 프론트엔드에서 위젯이 표시되지 않음
**원인**: API 응답 형식 불일치

**해결**:
- 백엔드 응답: `ApiResponse<Map<String, List<WidgetDefinitionResponse>>>`
- 프론트엔드 기대: `{ success, message, data: { "그룹명": [...] } }`

---

## 📝 테스트 실행 순서

1. **데이터베이스 마이그레이션 확인**
   ```bash
   # Flyway 마이그레이션 상태 확인
   mvn flyway:info
   ```

2. **서버 실행**
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=local
   ```

3. **Test 1: 테넌트 생성**
   - API 호출 또는 관리자 페이지에서 테넌트 생성
   - 데이터베이스 확인

4. **Test 2-4: API 테스트**
   - curl 또는 Postman으로 API 호출
   - 응답 확인

5. **Test 5: 프론트엔드 테스트**
   - 프론트엔드 서버 실행
   - 브라우저에서 수동 테스트

---

## 🎯 성공 기준

### 필수 조건
- [ ] 테넌트 생성 시 위젯이 자동으로 생성됨
- [ ] 모든 API가 정상 작동함
- [ ] 공통코드 기반 메시지가 올바르게 표시됨
- [ ] 위젯 권한이 올바르게 작동함
- [ ] 프론트엔드가 정상 작동함

### 추가 조건
- [ ] 에러 처리가 올바름
- [ ] 로깅이 올바르게 작동함
- [ ] 성능이 허용 범위 내임
- [ ] 반응형 디자인이 작동함

---

**작성자**: CoreSolution Team  
**최종 업데이트**: 2025-12-02  
**문서 버전**: 1.0.0  
**다음 단계**: 테스트 실행

