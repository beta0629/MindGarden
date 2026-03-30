# 위젯 그룹화 및 자동 생성 시스템

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**목적**: 테넌트 생성 시 업종별 위젯 자동 생성 및 그룹화 전략

---

## 🎯 핵심 문제

> **"테넌트가 생성될 때 위젯이 생성되어야 하잖어"**

### 현재 프로세스

```
온보딩 신청
    ↓
비즈니스 타입 선택 (CONSULTATION/ACADEMY/HOSPITAL)
    ↓
온보딩 승인 (OnboardingServiceImpl)
    ↓
테넌트 생성
    ↓
역할별 대시보드 생성 (TenantDashboardServiceImpl)
    ├─ ADMIN 대시보드
    ├─ CONSULTANT 대시보드
    ├─ CLIENT 대시보드
    └─ STAFF 대시보드
    ↓
각 대시보드에 dashboard_config (JSON) 저장
    {
      "widgets": [
        {"id": "welcome", "type": "welcome", ...},
        {"id": "summary", "type": "summary-panels", ...},
        {"id": "statistics", "type": "statistics-grid", ...}
      ]
    }
```

---

## 📊 현재 구현 분석

### 1. 테넌트 생성 시 위젯 생성 로직

**파일**: `TenantDashboardServiceImpl.java`

```java
@Override
@Transactional(propagation = Propagation.REQUIRES_NEW)
public List<TenantDashboardResponse> createDefaultDashboards(
        String tenantId, 
        String businessType, 
        String createdBy, 
        Map<String, String> dashboardTemplates, 
        Map<String, List<String>> dashboardWidgets) {
    
    // 1. 업종별 역할 템플릿 조회
    List<RoleTemplate> templates = roleTemplateRepository
            .findByBusinessTypeAndActive(businessType);
    
    // 2. 각 역할별 대시보드 생성
    for (RoleTemplate template : templates) {
        // 3. 기본 위젯 설정 생성
        String defaultConfig = createDefaultDashboardConfig(roleCode);
        
        // 4. 대시보드 저장 (dashboard_config에 위젯 JSON 저장)
        TenantDashboard dashboard = TenantDashboard.builder()
                .dashboardConfig(defaultConfig)  // ← 위젯 정보 JSON
                .build();
        
        dashboardRepository.save(dashboard);
    }
}
```

### 2. 위젯 설정 생성 로직

**현재 방식**: `createDefaultDashboardConfig(roleCode)`

```java
private String createDefaultDashboardConfig(String roleCode) {
    List<Map<String, Object>> widgets = new ArrayList<>();
    
    // 역할별 기본 위젯 하드코딩
    if ("ADMIN".equals(roleCode)) {
        widgets.add(createWidget("welcome", "welcome"));
        widgets.add(createWidget("summary", "summary-panels"));
        widgets.add(createWidget("statistics", "statistics-grid"));
        widgets.add(createWidget("erp", "erp-management"));
        // ...
    } else if ("CONSULTANT".equals(roleCode)) {
        widgets.add(createWidget("welcome", "welcome"));
        widgets.add(createWidget("schedule", "schedule-calendar"));
        // ...
    }
    
    Map<String, Object> config = new HashMap<>();
    config.put("widgets", widgets);
    
    return objectMapper.writeValueAsString(config);
}
```

**문제점**:
- ❌ 하드코딩됨
- ❌ 업종별 분기 없음
- ❌ 위젯 그룹화 없음

---

## 💡 해결 방안: 위젯 그룹 시스템

### 1. 위젯 그룹 정의 (데이터베이스)

#### A. widget_groups 테이블 (신규)

```sql
CREATE TABLE widget_groups (
    group_id VARCHAR(50) PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    business_type VARCHAR(50) NOT NULL,  -- CONSULTATION, ACADEMY, HOSPITAL
    role_code VARCHAR(50) NOT NULL,      -- ADMIN, CONSULTANT, CLIENT
    display_order INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_business_type_role (business_type, role_code),
    INDEX idx_is_active (is_active)
);
```

#### B. widget_definitions 테이블 (신규)

```sql
CREATE TABLE widget_definitions (
    widget_id VARCHAR(50) PRIMARY KEY,
    widget_type VARCHAR(100) NOT NULL,   -- welcome, summary-panels, statistics-grid
    widget_name VARCHAR(100) NOT NULL,
    group_id VARCHAR(50) NOT NULL,       -- FK to widget_groups
    business_type VARCHAR(50) NOT NULL,
    role_code VARCHAR(50),               -- NULL이면 모든 역할
    default_config JSON,                 -- 기본 설정
    display_order INT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,   -- 필수 위젯 여부
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES widget_groups(group_id),
    INDEX idx_group_id (group_id),
    INDEX idx_business_type_role (business_type, role_code),
    INDEX idx_is_active (is_active)
);
```

---

### 2. 위젯 그룹 데이터 (초기 데이터)

#### 상담소 - ADMIN

```sql
-- 위젯 그룹
INSERT INTO widget_groups (group_id, group_name, business_type, role_code, display_order) VALUES
('consultation-admin-core', '핵심 위젯', 'CONSULTATION', 'ADMIN', 1),
('consultation-admin-management', '관리 위젯', 'CONSULTATION', 'ADMIN', 2),
('consultation-admin-statistics', '통계 위젯', 'CONSULTATION', 'ADMIN', 3),
('consultation-admin-system', '시스템 위젯', 'CONSULTATION', 'ADMIN', 4);

-- 위젯 정의
INSERT INTO widget_definitions (widget_id, widget_type, widget_name, group_id, business_type, role_code, default_config, display_order, is_required) VALUES
-- 핵심 위젯 그룹
('consultation-admin-welcome', 'welcome', '환영 위젯', 'consultation-admin-core', 'CONSULTATION', 'ADMIN', 
 '{"refreshInterval": 30000}', 1, TRUE),
('consultation-admin-summary', 'summary-panels', '요약 패널', 'consultation-admin-core', 'CONSULTATION', 'ADMIN',
 '{"refreshInterval": 60000}', 2, TRUE),

-- 관리 위젯 그룹
('consultation-admin-consultant-mgmt', 'consultant-management', '상담사 관리', 'consultation-admin-management', 'CONSULTATION', 'ADMIN',
 '{"showQuickActions": true}', 1, FALSE),
('consultation-admin-client-mgmt', 'client-management', '내담자 관리', 'consultation-admin-management', 'CONSULTATION', 'ADMIN',
 '{"showQuickActions": true}', 2, FALSE),
('consultation-admin-session-mgmt', 'session-management', '회기 관리', 'consultation-admin-management', 'CONSULTATION', 'ADMIN',
 '{"showProgress": true}', 3, FALSE),

-- 통계 위젯 그룹
('consultation-admin-statistics', 'statistics-grid', '통계 그리드', 'consultation-admin-statistics', 'CONSULTATION', 'ADMIN',
 '{"refreshInterval": 300000}', 1, FALSE),
('consultation-admin-consultation-summary', 'consultation-summary', '상담 요약', 'consultation-admin-statistics', 'CONSULTATION', 'ADMIN',
 '{"period": "month"}', 2, FALSE),

-- 시스템 위젯 그룹
('consultation-admin-erp', 'erp-management', 'ERP 관리', 'consultation-admin-system', 'CONSULTATION', 'ADMIN',
 '{"showBudget": true}', 1, FALSE),
('consultation-admin-activities', 'recent-activities', '최근 활동', 'consultation-admin-system', 'CONSULTATION', 'ADMIN',
 '{"limit": 10}', 2, FALSE);
```

#### 학원 - ADMIN

```sql
-- 위젯 그룹
INSERT INTO widget_groups (group_id, group_name, business_type, role_code, display_order) VALUES
('academy-admin-core', '핵심 위젯', 'ACADEMY', 'ADMIN', 1),
('academy-admin-management', '관리 위젯', 'ACADEMY', 'ADMIN', 2),
('academy-admin-academic', '학사 위젯', 'ACADEMY', 'ADMIN', 3),
('academy-admin-system', '시스템 위젯', 'ACADEMY', 'ADMIN', 4);

-- 위젯 정의
INSERT INTO widget_definitions (widget_id, widget_type, widget_name, group_id, business_type, role_code, default_config, display_order, is_required) VALUES
-- 핵심 위젯 그룹
('academy-admin-welcome', 'welcome', '환영 위젯', 'academy-admin-core', 'ACADEMY', 'ADMIN',
 '{"refreshInterval": 30000}', 1, TRUE),
('academy-admin-summary', 'summary-panels', '요약 패널', 'academy-admin-core', 'ACADEMY', 'ADMIN',
 '{"refreshInterval": 60000}', 2, TRUE),

-- 관리 위젯 그룹
('academy-admin-teacher-mgmt', 'teacher-management', '강사 관리', 'academy-admin-management', 'ACADEMY', 'ADMIN',
 '{"showQuickActions": true}', 1, FALSE),
('academy-admin-student-mgmt', 'student-management', '학생 관리', 'academy-admin-management', 'ACADEMY', 'ADMIN',
 '{"showQuickActions": true}', 2, FALSE),
('academy-admin-parent-mgmt', 'parent-management', '학부모 관리', 'academy-admin-management', 'ACADEMY', 'ADMIN',
 '{"showNotifications": true}', 3, FALSE),

-- 학사 위젯 그룹
('academy-admin-attendance', 'attendance-management', '출결 관리', 'academy-admin-academic', 'ACADEMY', 'ADMIN',
 '{"showQRCode": true}', 1, FALSE),
('academy-admin-grade', 'grade-management', '성적 관리', 'academy-admin-academic', 'ACADEMY', 'ADMIN',
 '{"showRanking": true}', 2, FALSE),
('academy-admin-class-summary', 'class-summary', '수업 요약', 'academy-admin-academic', 'ACADEMY', 'ADMIN',
 '{"period": "week"}', 3, FALSE),

-- 시스템 위젯 그룹
('academy-admin-billing', 'billing-management', '청구 관리', 'academy-admin-system', 'ACADEMY', 'ADMIN',
 '{"showPending": true}', 1, FALSE),
('academy-admin-activities', 'recent-activities', '최근 활동', 'academy-admin-system', 'ACADEMY', 'ADMIN',
 '{"limit": 10}', 2, FALSE);
```

---

### 3. 백엔드 구현

#### A. WidgetGroupService (신규)

```java
@Service
public class WidgetGroupService {
    
    @Autowired
    private WidgetGroupRepository widgetGroupRepository;
    
    @Autowired
    private WidgetDefinitionRepository widgetDefinitionRepository;
    
    /**
     * 업종 + 역할별 위젯 그룹 조회
     */
    public List<WidgetGroup> getWidgetGroups(String businessType, String roleCode) {
        return widgetGroupRepository.findByBusinessTypeAndRoleCodeAndIsActiveTrue(
                businessType, roleCode);
    }
    
    /**
     * 그룹별 위젯 정의 조회
     */
    public List<WidgetDefinition> getWidgetsByGroup(String groupId) {
        return widgetDefinitionRepository.findByGroupIdAndIsActiveTrueOrderByDisplayOrder(
                groupId);
    }
    
    /**
     * 업종 + 역할별 모든 위젯 조회 (그룹화됨)
     */
    public Map<String, List<WidgetDefinition>> getGroupedWidgets(
            String businessType, String roleCode) {
        
        List<WidgetGroup> groups = getWidgetGroups(businessType, roleCode);
        
        Map<String, List<WidgetDefinition>> result = new LinkedHashMap<>();
        
        for (WidgetGroup group : groups) {
            List<WidgetDefinition> widgets = getWidgetsByGroup(group.getGroupId());
            result.put(group.getGroupName(), widgets);
        }
        
        return result;
    }
}
```

#### B. TenantDashboardServiceImpl 수정

```java
@Service
public class TenantDashboardServiceImpl implements TenantDashboardService {
    
    @Autowired
    private WidgetGroupService widgetGroupService;
    
    /**
     * 기본 대시보드 설정 생성 (위젯 그룹 기반)
     */
    private String createDefaultDashboardConfig(String businessType, String roleCode) {
        // 1. 업종 + 역할별 위젯 그룹 조회
        Map<String, List<WidgetDefinition>> groupedWidgets = 
                widgetGroupService.getGroupedWidgets(businessType, roleCode);
        
        // 2. 위젯 설정 생성
        List<Map<String, Object>> widgets = new ArrayList<>();
        
        for (Map.Entry<String, List<WidgetDefinition>> entry : groupedWidgets.entrySet()) {
            String groupName = entry.getKey();
            List<WidgetDefinition> widgetDefs = entry.getValue();
            
            for (WidgetDefinition def : widgetDefs) {
                Map<String, Object> widget = new HashMap<>();
                widget.put("id", def.getWidgetId());
                widget.put("type", def.getWidgetType());
                widget.put("title", def.getWidgetName());
                widget.put("group", groupName);
                widget.put("config", parseJson(def.getDefaultConfig()));
                widget.put("required", def.getIsRequired());
                
                widgets.add(widget);
            }
        }
        
        // 3. 대시보드 설정 JSON 생성
        Map<String, Object> config = new HashMap<>();
        config.put("widgets", widgets);
        config.put("layout", "grid");  // 기본 레이아웃
        
        return objectMapper.writeValueAsString(config);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<TenantDashboardResponse> createDefaultDashboards(
            String tenantId, 
            String businessType, 
            String createdBy, 
            Map<String, String> dashboardTemplates, 
            Map<String, List<String>> dashboardWidgets) {
        
        // 업종별 역할 템플릿 조회
        List<RoleTemplate> templates = roleTemplateRepository
                .findByBusinessTypeAndActive(businessType);
        
        List<TenantDashboardResponse> createdDashboards = new ArrayList<>();
        
        for (RoleTemplate template : templates) {
            String roleCode = template.getRoleCode();
            
            // ✅ 위젯 그룹 기반으로 설정 생성
            String defaultConfig = createDefaultDashboardConfig(businessType, roleCode);
            
            TenantDashboard dashboard = TenantDashboard.builder()
                    .dashboardId(UUID.randomUUID().toString())
                    .tenantId(tenantId)
                    .tenantRoleId(tenantRole.getTenantRoleId())
                    .dashboardConfig(defaultConfig)  // ← 위젯 그룹 기반 설정
                    .build();
            
            TenantDashboard saved = dashboardRepository.save(dashboard);
            createdDashboards.add(toResponse(saved));
        }
        
        return createdDashboards;
    }
}
```

---

### 4. 프론트엔드 구현

#### A. 위젯 그룹 표시

```javascript
// DynamicDashboard.js

const DynamicDashboard = ({ user, dashboard }) => {
  const dashboardConfig = JSON.parse(dashboard.dashboardConfig);
  const widgets = dashboardConfig.widgets || [];
  
  // 위젯을 그룹별로 분류
  const groupedWidgets = widgets.reduce((acc, widget) => {
    const group = widget.group || '기타';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(widget);
    return acc;
  }, {});
  
  return (
    <div className="mg-dashboard">
      {Object.entries(groupedWidgets).map(([groupName, groupWidgets]) => (
        <DashboardSection
          key={groupName}
          title={groupName}
          icon={getGroupIcon(groupName)}
        >
          <div className="mg-widget-grid">
            {groupWidgets.map(widget => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                user={user}
              />
            ))}
          </div>
        </DashboardSection>
      ))}
    </div>
  );
};
```

#### B. 위젯 렌더러

```javascript
// WidgetRenderer.js

const WidgetRenderer = ({ widget, user }) => {
  const WidgetComponent = getWidgetComponent(widget.type);
  
  if (!WidgetComponent) {
    return <div>Unknown widget type: {widget.type}</div>;
  }
  
  return (
    <WidgetComponent
      widget={widget}
      user={user}
    />
  );
};

// 위젯 타입별 컴포넌트 매핑
const getWidgetComponent = (widgetType) => {
  const widgetMap = {
    'welcome': WelcomeWidget,
    'summary-panels': SummaryPanelsWidget,
    'statistics-grid': StatisticsGridWidget,
    'consultant-management': ConsultantManagementWidget,
    'session-management': SessionManagementWidget,
    'attendance-management': AttendanceManagementWidget,
    'grade-management': GradeManagementWidget,
    'erp-management': ErpManagementWidget,
    'recent-activities': RecentActivitiesWidget,
    // ... 더 많은 위젯
  };
  
  return widgetMap[widgetType];
};
```

---

## 📊 최종 구조

### 테넌트 생성 시 자동 생성되는 것

```
온보딩 승인
    ↓
테넌트 생성 (tenant_id: "tenant-001", business_type: "ACADEMY")
    ↓
역할별 대시보드 생성
    ├─ ADMIN 대시보드
    │   ├─ 핵심 위젯 그룹
    │   │   ├─ welcome (필수)
    │   │   └─ summary-panels (필수)
    │   ├─ 관리 위젯 그룹
    │   │   ├─ teacher-management
    │   │   ├─ student-management
    │   │   └─ parent-management
    │   ├─ 학사 위젯 그룹
    │   │   ├─ attendance-management
    │   │   ├─ grade-management
    │   │   └─ class-summary
    │   └─ 시스템 위젯 그룹
    │       ├─ billing-management
    │       └─ recent-activities
    │
    ├─ CONSULTANT (강사) 대시보드
    │   ├─ 핵심 위젯 그룹
    │   ├─ 수업 위젯 그룹
    │   └─ 학생 위젯 그룹
    │
    ├─ CLIENT (학생) 대시보드
    │   ├─ 핵심 위젯 그룹
    │   └─ 학습 위젯 그룹
    │
    └─ PARENT (학부모) 대시보드
        ├─ 핵심 위젯 그룹
        └─ 자녀 위젯 그룹
```

---

## 🎯 핵심 개선 사항

### Before (현재)

```java
// 하드코딩
private String createDefaultDashboardConfig(String roleCode) {
    if ("ADMIN".equals(roleCode)) {
        // 위젯 하드코딩
    } else if ("CONSULTANT".equals(roleCode)) {
        // 위젯 하드코딩
    }
}
```

**문제점**:
- ❌ 하드코딩
- ❌ 업종별 분기 없음
- ❌ 위젯 그룹화 없음
- ❌ 동적 추가/제거 불가

### After (개선)

```java
// 데이터베이스 기반
private String createDefaultDashboardConfig(String businessType, String roleCode) {
    // 1. DB에서 위젯 그룹 조회
    Map<String, List<WidgetDefinition>> groupedWidgets = 
            widgetGroupService.getGroupedWidgets(businessType, roleCode);
    
    // 2. JSON 생성
    return generateConfigJson(groupedWidgets);
}
```

**장점**:
- ✅ 데이터베이스 기반 (동적)
- ✅ 업종별 자동 분기
- ✅ 위젯 그룹화
- ✅ 동적 추가/제거 가능
- ✅ 필수 위젯 지정 가능

---

## 🔐 위젯 관리 권한 체계

### 위젯 분류

#### 1. 그룹화 위젯 (System-Managed Widgets)
**특징**:
- 테넌트 생성 시 자동 생성
- 업종별/역할별로 필수 위젯
- **관리자가 추가/삭제 불가** ❌
- 시스템에서만 관리

**예시**:
```json
{
  "id": "consultation-admin-welcome",
  "type": "welcome",
  "group": "핵심 위젯",
  "isSystemManaged": true,     // ← 시스템 관리
  "isRequired": true,           // ← 필수 위젯
  "isDeletable": false,         // ← 삭제 불가
  "isMovable": true             // ← 순서 변경만 가능
}
```

#### 2. 독립 위젯 (User-Managed Widgets)
**특징**:
- 관리자가 직접 추가/삭제 가능 ✅
- 선택적 위젯
- 커스터마이징 가능

**예시**:
```json
{
  "id": "custom-chart-001",
  "type": "custom-chart",
  "group": null,                // ← 그룹 없음
  "isSystemManaged": false,     // ← 사용자 관리
  "isRequired": false,          // ← 선택적
  "isDeletable": true,          // ← 삭제 가능
  "isMovable": true             // ← 이동 가능
}
```

---

### 위젯 권한 매트릭스

| 위젯 유형 | 추가 | 삭제 | 수정 | 이동 | 관리 주체 |
|---------|-----|-----|-----|-----|---------|
| **그룹화 위젯 (필수)** | ❌ | ❌ | ⚠️ 제한적 | ✅ | 시스템 |
| **그룹화 위젯 (선택)** | ❌ | ❌ | ✅ | ✅ | 시스템 |
| **독립 위젯** | ✅ | ✅ | ✅ | ✅ | 관리자 |

**⚠️ 제한적 수정**: 위젯 설정(config)만 변경 가능, 위젯 타입은 변경 불가

---

### 데이터베이스 구조 수정

#### widget_definitions 테이블 (필드 추가)

```sql
CREATE TABLE widget_definitions (
    widget_id VARCHAR(50) PRIMARY KEY,
    widget_type VARCHAR(100) NOT NULL,
    widget_name VARCHAR(100) NOT NULL,
    group_id VARCHAR(50),                -- NULL이면 독립 위젯
    business_type VARCHAR(50) NOT NULL,
    role_code VARCHAR(50),
    default_config JSON,
    display_order INT NOT NULL,
    
    -- ✅ 권한 관리 필드 추가
    is_system_managed BOOLEAN DEFAULT TRUE,   -- 시스템 관리 여부
    is_required BOOLEAN DEFAULT FALSE,        -- 필수 위젯 여부
    is_deletable BOOLEAN DEFAULT FALSE,       -- 삭제 가능 여부
    is_movable BOOLEAN DEFAULT TRUE,          -- 이동 가능 여부
    is_configurable BOOLEAN DEFAULT TRUE,     -- 설정 변경 가능 여부
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES widget_groups(group_id),
    INDEX idx_group_id (group_id),
    INDEX idx_business_type_role (business_type, role_code),
    INDEX idx_is_system_managed (is_system_managed)
);
```

---

### 초기 데이터 예시 (권한 포함)

```sql
-- 상담소 - ADMIN - 그룹화 위젯 (필수)
INSERT INTO widget_definitions (
    widget_id, widget_type, widget_name, group_id, 
    business_type, role_code, default_config, display_order,
    is_system_managed, is_required, is_deletable, is_movable, is_configurable
) VALUES
-- 핵심 위젯 (필수, 삭제 불가)
('consultation-admin-welcome', 'welcome', '환영 위젯', 'consultation-admin-core',
 'CONSULTATION', 'ADMIN', '{"refreshInterval": 30000}', 1,
 TRUE, TRUE, FALSE, TRUE, TRUE),  -- ← 시스템 관리, 필수, 삭제 불가

('consultation-admin-summary', 'summary-panels', '요약 패널', 'consultation-admin-core',
 'CONSULTATION', 'ADMIN', '{"refreshInterval": 60000}', 2,
 TRUE, TRUE, FALSE, TRUE, TRUE),  -- ← 시스템 관리, 필수, 삭제 불가

-- 관리 위젯 (선택, 삭제 불가)
('consultation-admin-consultant-mgmt', 'consultant-management', '상담사 관리', 'consultation-admin-management',
 'CONSULTATION', 'ADMIN', '{"showQuickActions": true}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE),  -- ← 시스템 관리, 선택적, 삭제 불가

-- 독립 위젯 (사용자 추가 가능한 위젯 풀)
('custom-chart-template', 'custom-chart', '커스텀 차트', NULL,
 'CONSULTATION', NULL, '{"chartType": "line"}', 999,
 FALSE, FALSE, TRUE, TRUE, TRUE),  -- ← 사용자 관리, 삭제 가능

('custom-table-template', 'custom-table', '커스텀 테이블', NULL,
 'CONSULTATION', NULL, '{"columns": []}', 999,
 FALSE, FALSE, TRUE, TRUE, TRUE);  -- ← 사용자 관리, 삭제 가능
```

---

### 백엔드 구현

#### WidgetPermissionService (신규)

```java
@Service
public class WidgetPermissionService {
    
    /**
     * 위젯 삭제 가능 여부 확인
     */
    public boolean canDeleteWidget(String widgetId, String userId) {
        WidgetDefinition widget = widgetDefinitionRepository.findById(widgetId)
                .orElseThrow(() -> new IllegalArgumentException("위젯을 찾을 수 없습니다"));
        
        // 시스템 관리 위젯은 삭제 불가
        if (widget.getIsSystemManaged()) {
            return false;
        }
        
        // 삭제 가능 플래그 확인
        return widget.getIsDeletable();
    }
    
    /**
     * 위젯 추가 가능 여부 확인
     */
    public boolean canAddWidget(String widgetType, String businessType, String roleCode) {
        // 독립 위젯만 추가 가능
        List<WidgetDefinition> templates = widgetDefinitionRepository
                .findByWidgetTypeAndBusinessTypeAndIsSystemManagedFalse(
                        widgetType, businessType);
        
        return !templates.isEmpty();
    }
    
    /**
     * 위젯 수정 가능 여부 확인
     */
    public boolean canConfigureWidget(String widgetId) {
        WidgetDefinition widget = widgetDefinitionRepository.findById(widgetId)
                .orElseThrow(() -> new IllegalArgumentException("위젯을 찾을 수 없습니다"));
        
        return widget.getIsConfigurable();
    }
}
```

#### TenantDashboardController (API 수정)

```java
@RestController
@RequestMapping("/api/v1/dashboards")
public class TenantDashboardController {
    
    @Autowired
    private WidgetPermissionService widgetPermissionService;
    
    /**
     * 위젯 추가 (독립 위젯만)
     */
    @PostMapping("/{dashboardId}/widgets")
    public ResponseEntity<?> addWidget(
            @PathVariable String dashboardId,
            @RequestBody AddWidgetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 권한 확인
        if (!widgetPermissionService.canAddWidget(
                request.getWidgetType(), 
                request.getBusinessType(), 
                request.getRoleCode())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("이 위젯은 추가할 수 없습니다 (시스템 관리 위젯)");
        }
        
        // 위젯 추가 로직
        // ...
        
        return ResponseEntity.ok("위젯이 추가되었습니다");
    }
    
    /**
     * 위젯 삭제 (독립 위젯만)
     */
    @DeleteMapping("/{dashboardId}/widgets/{widgetId}")
    public ResponseEntity<?> deleteWidget(
            @PathVariable String dashboardId,
            @PathVariable String widgetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 권한 확인
        if (!widgetPermissionService.canDeleteWidget(widgetId, userDetails.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("이 위젯은 삭제할 수 없습니다 (시스템 관리 위젯)");
        }
        
        // 위젯 삭제 로직
        // ...
        
        return ResponseEntity.ok("위젯이 삭제되었습니다");
    }
    
    /**
     * 독립 위젯 목록 조회 (추가 가능한 위젯)
     */
    @GetMapping("/available-widgets")
    public ResponseEntity<?> getAvailableWidgets(
            @RequestParam String businessType,
            @RequestParam String roleCode) {
        
        List<WidgetDefinition> widgets = widgetDefinitionRepository
                .findByBusinessTypeAndIsSystemManagedFalseAndIsActiveTrue(businessType);
        
        return ResponseEntity.ok(widgets);
    }
}
```

---

### 프론트엔드 구현

#### DashboardWidgetManager.js (위젯 관리 UI)

```javascript
import React, { useState } from 'react';
import { Plus, Trash2, Settings, Lock } from 'lucide-react';

const DashboardWidgetManager = ({ dashboard, user }) => {
  const [widgets, setWidgets] = useState(dashboard.widgets || []);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  
  // 독립 위젯 목록 조회
  const fetchAvailableWidgets = async () => {
    const response = await fetch(
      `/api/v1/dashboards/available-widgets?businessType=${user.businessType}&roleCode=${user.roleCode}`
    );
    const data = await response.json();
    setAvailableWidgets(data);
  };
  
  // 위젯 추가
  const handleAddWidget = async (widgetType) => {
    try {
      const response = await fetch(`/api/v1/dashboards/${dashboard.id}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetType,
          businessType: user.businessType,
          roleCode: user.roleCode
        })
      });
      
      if (response.ok) {
        alert('위젯이 추가되었습니다');
        // 대시보드 새로고침
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (error) {
      console.error('위젯 추가 실패:', error);
    }
  };
  
  // 위젯 삭제
  const handleDeleteWidget = async (widgetId) => {
    try {
      const response = await fetch(
        `/api/v1/dashboards/${dashboard.id}/widgets/${widgetId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        alert('위젯이 삭제되었습니다');
        // 대시보드 새로고침
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (error) {
      console.error('위젯 삭제 실패:', error);
    }
  };
  
  return (
    <div className="mg-dashboard-widget-manager">
      {/* 위젯 목록 */}
      <div className="mg-widget-list">
        {widgets.map(widget => (
          <div key={widget.id} className="mg-widget-item">
            <div className="mg-widget-header">
              <h4>{widget.title}</h4>
              
              {/* 시스템 관리 위젯 표시 */}
              {widget.isSystemManaged && (
                <span className="mg-badge mg-badge-system">
                  <Lock size={14} /> 시스템 위젯
                </span>
              )}
              
              {/* 필수 위젯 표시 */}
              {widget.isRequired && (
                <span className="mg-badge mg-badge-required">필수</span>
              )}
            </div>
            
            <div className="mg-widget-actions">
              {/* 설정 버튼 (모든 위젯) */}
              {widget.isConfigurable && (
                <button
                  onClick={() => handleConfigureWidget(widget.id)}
                  className="mg-btn mg-btn-sm mg-btn-secondary"
                >
                  <Settings size={16} /> 설정
                </button>
              )}
              
              {/* 삭제 버튼 (독립 위젯만) */}
              {widget.isDeletable && (
                <button
                  onClick={() => handleDeleteWidget(widget.id)}
                  className="mg-btn mg-btn-sm mg-btn-danger"
                >
                  <Trash2 size={16} /> 삭제
                </button>
              )}
              
              {/* 삭제 불가 표시 */}
              {!widget.isDeletable && (
                <span className="mg-text-muted">
                  <Lock size={14} /> 삭제 불가
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 위젯 추가 버튼 */}
      <div className="mg-widget-add-section">
        <h4>위젯 추가</h4>
        <div className="mg-available-widgets">
          {availableWidgets.map(widget => (
            <button
              key={widget.widgetId}
              onClick={() => handleAddWidget(widget.widgetType)}
              className="mg-btn mg-btn-outline"
            >
              <Plus size={16} /> {widget.widgetName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardWidgetManager;
```

---

## 📈 구현 계획

### Phase 1: 데이터베이스 설계 (1일)
- [ ] `widget_groups` 테이블 생성
- [ ] `widget_definitions` 테이블 생성 (권한 필드 포함)
- [ ] 초기 데이터 삽입 (상담소, 학원)
- [ ] **권한 체계 데이터 정의**

### Phase 2: 백엔드 구현 (2일)
- [ ] `WidgetGroup`, `WidgetDefinition` 엔티티 (권한 필드 포함)
- [ ] `WidgetGroupService` 구현
- [ ] **`WidgetPermissionService` 구현**
- [ ] `TenantDashboardServiceImpl` 수정
- [ ] **위젯 추가/삭제 API (권한 검증 포함)**

### Phase 3: 프론트엔드 구현 (2일)
- [ ] 위젯 그룹별 렌더링
- [ ] `WidgetRenderer` 컴포넌트
- [ ] 위젯 타입별 매핑
- [ ] **`DashboardWidgetManager` 구현 (권한 UI)**
- [ ] **시스템 위젯 잠금 표시**

### Phase 4: 테스트 (1일)
- [ ] 테넌트 생성 테스트
- [ ] 위젯 자동 생성 확인
- [ ] 업종별 위젯 확인
- [ ] **권한 체계 테스트 (추가/삭제 제한)**

**총 소요 시간**: 약 6일 (1주)

---

## 🎯 결론

### 핵심 인사이트

> **"테넌트가 생성될 때 위젯이 생성되어야 하잖어"** → 정확합니다!
> 
> **"관리자에서는 그룹화 위젯은 추가 삭제 안되고, 독립된 위젯만 추가 제거 가능"** → 완벽합니다!

### 해결 방안

1. ✅ **위젯 그룹 시스템** (데이터베이스 기반)
2. ✅ **업종 + 역할별 자동 생성**
3. ✅ **그룹화된 위젯 표시**
4. ✅ **권한 기반 위젯 관리**
   - 그룹화 위젯: 시스템 관리 (추가/삭제 불가)
   - 독립 위젯: 관리자 관리 (추가/삭제 가능)

### 위젯 관리 규칙

| 위젯 유형 | 생성 시점 | 추가 | 삭제 | 수정 | 이동 |
|---------|---------|-----|-----|-----|-----|
| **그룹화 위젯 (필수)** | 테넌트 생성 시 | ❌ | ❌ | ⚠️ 제한적 | ✅ |
| **그룹화 위젯 (선택)** | 테넌트 생성 시 | ❌ | ❌ | ✅ | ✅ |
| **독립 위젯** | 관리자 추가 시 | ✅ | ✅ | ✅ | ✅ |

### 기대 효과

- ✅ **하드코딩 제거**: 100%
- ✅ **동적 관리**: 위젯 추가/제거 DB에서 가능
- ✅ **업종별 자동 분기**: 코드 수정 없음
- ✅ **그룹화**: 사용자 경험 개선
- ✅ **확장성**: 새 위젯 추가 용이
- ✅ **권한 체계**: 시스템 위젯 보호, 사용자 커스터마이징 지원

---

**최종 업데이트**: 2025-12-02  
**작성자**: CoreSolution Team  
**상태**: ✅ 설계 완료

---

## 📎 관련 문서

1. [상담소 위젯 의존성 분석](./CONSULTATION_CENTER_WIDGET_DEPENDENCY_ANALYSIS.md)
2. [멀티 비즈니스 타입 시스템 재설계](./MULTI_BUSINESS_TYPE_SYSTEM_REDESIGN.md)
3. [업종별 특화 서비스 아키텍처](./BUSINESS_SPECIFIC_SERVICES_ARCHITECTURE.md)
4. [통합 개선 계획서](./INTEGRATED_IMPROVEMENT_PLAN.md)

