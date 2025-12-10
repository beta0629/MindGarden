# 대시보드 생성 전략

**작성일**: 2025-12-10  
**목적**: 온보딩 승인 시 기본 대시보드 생성 및 관리자 제어 전략

---

## 📋 전략 개요

### 핵심 원칙
1. **기본 대시보드 자동 생성**: 온보딩 승인 시 비즈니스 타입에 따라 기본 역할별 대시보드 자동 생성
2. **관리자 제어 가능**: 생성된 대시보드는 관리자가 나중에 수정하거나 추가할 수 있음
3. **비즈니스 타입별 차별화**: CONSULTATION, ACADEMY 등 비즈니스 타입에 따라 다른 역할 템플릿 사용

---

## 🔄 대시보드 생성 프로세스

### 1. 온보딩 승인 시 자동 생성

#### 생성 시점
- 테넌트 생성 및 관리자 계정 생성 후
- 기본 역할(tenant_roles) 생성 후

#### 생성 로직
```java
// OnboardingService.decide() 메서드 내
if (success) {
    // 테넌트 및 관리자 계정 생성 완료 후
    createDefaultDashboards(tenantIdValue, businessType, actorId);
}
```

#### 생성 기준
1. **비즈니스 타입별 역할 템플릿 조회**
   - `role_templates` 테이블에서 `business_type`으로 필터링
   - `display_order` 순서대로 정렬

2. **테넌트 역할 매핑**
   - 각 역할 템플릿에 대해 `tenant_roles` 테이블에서 매핑된 역할 찾기
   - `role_template_id`로 연결

3. **대시보드 생성**
   - 각 역할에 대해 기본 대시보드 생성
   - 기본 위젯 설정: 빈 배열 `{"widgets": []}`
   - `is_default = true`로 설정

#### 비즈니스 타입별 역할

**CONSULTATION (상담소) - 4개**
1. 원장 (Principal)
2. 상담사 (Consultant)
3. 내담자 (Client)
4. 사무원 (Staff)

**ACADEMY (학원) - 5개**
1. 원장 (Director)
2. 교사 (Teacher)
3. 학생 (Student)
4. 학부모 (Parent)
5. 사무원 (Staff)

---

## 🛠️ 관리자 제어 기능

### 1. 대시보드 수정
- **API**: `PUT /api/v1/tenant/dashboards/{dashboardId}`
- **기능**: 대시보드 이름, 설명, 위젯 설정 수정
- **권한**: 테넌트 관리자

### 2. 대시보드 추가
- **API**: `POST /api/v1/tenant/dashboards`
- **기능**: 새로운 역할별 대시보드 생성
- **권한**: 테넌트 관리자

### 3. 대시보드 삭제
- **API**: `DELETE /api/v1/tenant/dashboards/{dashboardId}`
- **기능**: 대시보드 삭제 (소프트 삭제)
- **권한**: 테넌트 관리자

### 4. 위젯 추가/수정
- **API**: `POST /api/v1/tenant/dashboards/{dashboardId}/widgets`
- **기능**: 대시보드에 위젯 추가 또는 수정
- **권한**: 테넌트 관리자

---

## 📊 구현 상세

### 대시보드 생성 SQL
```sql
INSERT INTO tenant_dashboards (
    dashboard_id,
    tenant_id,
    tenant_role_id,
    dashboard_name,
    dashboard_name_ko,
    dashboard_name_en,
    description,
    dashboard_type,
    is_default,
    is_active,
    display_order,
    dashboard_config,
    created_at,
    updated_at,
    is_deleted,
    version
) VALUES (
    UUID(),
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,  -- template_code 사용
    TRUE,  -- is_default
    TRUE,  -- is_active
    ?,  -- display_order (역할 템플릿의 display_order 사용)
    '{"widgets": []}',  -- 기본 빈 위젯 설정
    NOW(),
    NOW(),
    FALSE,
    0
)
```

### 역할 템플릿 조회
```sql
SELECT 
    rt.role_template_id,
    rt.template_code,
    rt.name_ko,
    rt.name_en,
    rt.display_order
FROM role_templates rt
WHERE rt.business_type = ?
  AND (rt.is_deleted IS NULL OR rt.is_deleted = FALSE)
  AND (rt.is_active IS NULL OR rt.is_active = TRUE)
ORDER BY rt.display_order ASC
```

### 테넌트 역할 매핑
```sql
SELECT 
    tenant_role_id,
    name,
    name_ko,
    name_en
FROM tenant_roles
WHERE tenant_id = ?
  AND role_template_id = ?
  AND (is_deleted IS NULL OR is_deleted = FALSE)
  AND (is_active IS NULL OR is_active = TRUE)
LIMIT 1
```

---

## ✅ 체크리스트

### 온보딩 승인 시
- [x] 비즈니스 타입에 맞는 역할 템플릿 조회
- [x] 각 역할 템플릿에 대해 테넌트 역할 매핑
- [x] 기본 대시보드 생성 (빈 위젯 설정)
- [x] 중복 생성 방지 (이미 존재하는 대시보드 건너뛰기)

### 관리자 제어
- [x] 대시보드 수정 API 제공
- [x] 대시보드 추가 API 제공
- [x] 대시보드 삭제 API 제공
- [x] 위젯 추가/수정 API 제공

---

## 🔍 향후 개선 사항

### 1. 대시보드 템플릿 시스템
- 온보딩 시 사용자가 대시보드 템플릿 선택 가능
- 선택한 템플릿에 따라 기본 위젯 설정 적용

### 2. 위젯 그룹 시스템
- 비즈니스 타입 및 역할별 위젯 그룹 자동 적용
- 관리자가 위젯 그룹 수정 가능

### 3. 대시보드 복사 기능
- 다른 테넌트의 대시보드 복사
- 역할별 대시보드 템플릿 복사

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10

