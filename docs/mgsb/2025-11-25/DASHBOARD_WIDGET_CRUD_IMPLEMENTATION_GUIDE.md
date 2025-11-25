# 대시보드 위젯 CRUD 구현 가이드

대시보드 위젯에서 데이터의 등록, 수정, 삭제, 조회 기능을 구현하는 방법을 안내합니다.

## 📋 목차
1. [개요](#개요)
2. [위젯 데이터 소스 설정](#위젯-데이터-소스-설정)
3. [조회(Read) 구현](#조회read-구현)
4. [생성(Create) 구현](#생성create-구현)
5. [수정(Update) 구현](#수정update-구현)
6. [삭제(Delete) 구현](#삭제delete-구현)
7. [실제 예제](#실제-예제)
8. [백엔드 API 구현](#백엔드-api-구현)

---

## 개요

대시보드 위젯은 백엔드 API를 통해 데이터를 조회하고, 필요에 따라 생성/수정/삭제 작업을 수행합니다.

### 위젯 데이터 흐름

```
위젯 컴포넌트
  ↓
위젯 Config (dataSource 설정)
  ↓
API 호출 (apiGet, apiPost, apiPut, apiDelete)
  ↓
백엔드 Controller
  ↓
Service → Repository
  ↓
데이터베이스
```

---

## 위젯 데이터 소스 설정

위젯의 `config`에 `dataSource`를 설정하여 API 연결을 정의합니다.

### 기본 구조

```javascript
{
  "id": "widget-001",
  "type": "table",
  "config": {
    "title": "사용자 목록",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/users",
      "method": "GET",
      "params": {
        "page": 0,
        "size": 10
      },
      "refreshInterval": 30000  // 30초마다 자동 새로고침 (선택)
    },
    "columns": [
      { "key": "name", "label": "이름" },
      { "key": "email", "label": "이메일" }
    ],
    "actions": {
      "create": {
        "url": "/api/v1/users",
        "method": "POST"
      },
      "update": {
        "url": "/api/v1/users/{id}",
        "method": "PUT"
      },
      "delete": {
        "url": "/api/v1/users/{id}",
        "method": "DELETE"
      }
    }
  }
}
```

---

## 조회(Read) 구현

### 1. 위젯에서 데이터 조회

```javascript
// frontend/src/components/dashboard/widgets/TableWidget.js
import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/ajax';

const TableWidget = ({ widget, user }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadData();
      
      // 자동 새로고침
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadData, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = dataSource.params || {};
      const response = await apiGet(dataSource.url, params);
      
      // 응답 구조에 따라 데이터 추출
      const items = Array.isArray(response) 
        ? response 
        : (response.data || response.items || []);
      
      setData(items);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // ... 렌더링
};
```

### 2. 백엔드 API 구현

```java
// src/main/java/com/coresolution/.../controller/UserController.java
@RestController
@RequestMapping("/api/v1/users")
public class UserController extends BaseApiController {
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String tenantId = TenantContextHolder.getTenantId();
        List<UserResponse> users = userService.getUsers(tenantId, page, size);
        
        return success(users);
    }
}
```

---

## 생성(Create) 구현

### 1. 위젯에서 폼 제출

```javascript
// frontend/src/components/dashboard/widgets/FormWidget.js
import { apiPost } from '../../../utils/ajax';
import csrfTokenManager from '../../../utils/csrfTokenManager';

const FormWidget = ({ widget, user }) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const config = widget.config || {};
  const submit = config.submit || {};
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const url = submit.url || config.dataSource?.url;
      const method = submit.method || 'POST';
      
      // CSRF 토큰 포함하여 POST 요청
      const response = await csrfTokenManager.post(url, formData);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show('생성되었습니다.', 'success');
          setFormData({}); // 폼 초기화
          
          // 목록 위젯이 있으면 새로고침
          if (config.onSuccess) {
            config.onSuccess();
          }
        }
      }
    } catch (err) {
      console.error('생성 실패:', err);
      notificationManager.show('생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  
  // ... 폼 렌더링
};
```

### 2. 백엔드 API 구현

```java
@PostMapping
public ResponseEntity<ApiResponse<UserResponse>> createUser(
        @RequestBody UserRequest request,
        HttpSession session) {
    
    String tenantId = TenantContextHolder.getTenantId();
    User currentUser = SessionUtils.getCurrentUser(session);
    String createdBy = currentUser != null ? currentUser.getId().toString() : "system";
    
    UserResponse user = userService.createUser(tenantId, request, createdBy);
    
    return created("사용자가 생성되었습니다.", user);
}
```

---

## 수정(Update) 구현

### 1. 위젯에서 수정 폼

```javascript
// TableWidget에 수정 기능 추가
const TableWidget = ({ widget, user }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  
  const config = widget.config || {};
  const actions = config.actions || {};
  
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };
  
  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      const url = actions.update?.url?.replace('{id}', editingId);
      const method = actions.update?.method || 'PUT';
      
      const response = await csrfTokenManager.put(url, editData);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show('수정되었습니다.', 'success');
          setEditingId(null);
          loadData(); // 목록 새로고침
        }
      }
    } catch (err) {
      console.error('수정 실패:', err);
      notificationManager.show('수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // ... 렌더링
};
```

### 2. 백엔드 API 구현

```java
@PutMapping("/{userId}")
public ResponseEntity<ApiResponse<UserResponse>> updateUser(
        @PathVariable Long userId,
        @RequestBody UserRequest request,
        HttpSession session) {
    
    String tenantId = TenantContextHolder.getTenantId();
    User currentUser = SessionUtils.getCurrentUser(session);
    String updatedBy = currentUser != null ? currentUser.getId().toString() : "system";
    
    UserResponse user = userService.updateUser(tenantId, userId, request, updatedBy);
    
    return updated("사용자가 수정되었습니다.", user);
}
```

---

## 삭제(Delete) 구현

### 1. 위젯에서 삭제

```javascript
const TableWidget = ({ widget, user }) => {
  const config = widget.config || {};
  const actions = config.actions || {};
  
  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const url = actions.delete?.url?.replace('{id}', item.id);
      
      const response = await csrfTokenManager.delete(url);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          notificationManager.show('삭제되었습니다.', 'success');
          loadData(); // 목록 새로고침
        }
      }
    } catch (err) {
      console.error('삭제 실패:', err);
      notificationManager.show('삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // ... 렌더링
};
```

### 2. 백엔드 API 구현

```java
@DeleteMapping("/{userId}")
public ResponseEntity<ApiResponse<Void>> deleteUser(
        @PathVariable Long userId,
        HttpSession session) {
    
    String tenantId = TenantContextHolder.getTenantId();
    User currentUser = SessionUtils.getCurrentUser(session);
    String deletedBy = currentUser != null ? currentUser.getId().toString() : "system";
    
    userService.deleteUser(tenantId, userId, deletedBy);
    
    return deleted("사용자가 삭제되었습니다.");
}
```

---

## 실제 예제

### 예제 1: 통계 위젯 (조회만)

```javascript
// 위젯 Config
{
  "type": "statistics",
  "config": {
    "title": "총 사용자 수",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/users/count"
    },
    "color": "primary"
  }
}

// 위젯 컴포넌트
const StatisticsWidget = ({ widget, user }) => {
  const [value, setValue] = useState(0);
  
  useEffect(() => {
    const loadData = async () => {
      const response = await apiGet(widget.config.dataSource.url);
      setValue(response.count || 0);
    };
    loadData();
  }, []);
  
  return <div>{value.toLocaleString()}명</div>;
};
```

### 예제 2: 테이블 위젯 (CRUD 전체)

```javascript
// 위젯 Config
{
  "type": "table",
  "config": {
    "title": "사용자 관리",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/users",
      "params": { "page": 0, "size": 10 }
    },
    "columns": [
      { "key": "name", "label": "이름", "editable": true },
      { "key": "email", "label": "이메일", "editable": true }
    ],
    "actions": {
      "create": {
        "url": "/api/v1/users",
        "method": "POST"
      },
      "update": {
        "url": "/api/v1/users/{id}",
        "method": "PUT"
      },
      "delete": {
        "url": "/api/v1/users/{id}",
        "method": "DELETE"
      }
    },
    "showCreateButton": true,
    "showEditButton": true,
    "showDeleteButton": true
  }
}
```

### 예제 3: 폼 위젯 (생성/수정)

```javascript
// 위젯 Config
{
  "type": "form",
  "config": {
    "title": "사용자 등록",
    "fields": [
      { "name": "name", "type": "text", "label": "이름", "required": true },
      { "name": "email", "type": "email", "label": "이메일", "required": true }
    ],
    "submit": {
      "url": "/api/v1/users",
      "method": "POST"
    }
  }
}
```

---

## 백엔드 API 구현

### 표준 패턴

```java
@RestController
@RequestMapping("/api/v1/{resource}")
@RequiredArgsConstructor
public class ResourceController extends BaseApiController {
    
    private final ResourceService resourceService;
    
    /**
     * 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> getResources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String tenantId = TenantContextHolder.getTenantId();
        List<ResourceResponse> resources = resourceService.getResources(tenantId, page, size);
        
        return success(resources);
    }
    
    /**
     * 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> getResource(
            @PathVariable Long id) {
        
        String tenantId = TenantContextHolder.getTenantId();
        ResourceResponse resource = resourceService.getResource(tenantId, id);
        
        return success(resource);
    }
    
    /**
     * 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ResourceResponse>> createResource(
            @RequestBody ResourceRequest request,
            HttpSession session) {
        
        String tenantId = TenantContextHolder.getTenantId();
        User currentUser = SessionUtils.getCurrentUser(session);
        String createdBy = currentUser != null ? currentUser.getId().toString() : "system";
        
        ResourceResponse resource = resourceService.createResource(tenantId, request, createdBy);
        
        return created("리소스가 생성되었습니다.", resource);
    }
    
    /**
     * 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> updateResource(
            @PathVariable Long id,
            @RequestBody ResourceRequest request,
            HttpSession session) {
        
        String tenantId = TenantContextHolder.getTenantId();
        User currentUser = SessionUtils.getCurrentUser(session);
        String updatedBy = currentUser != null ? currentUser.getId().toString() : "system";
        
        ResourceResponse resource = resourceService.updateResource(tenantId, id, request, updatedBy);
        
        return updated("리소스가 수정되었습니다.", resource);
    }
    
    /**
     * 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @PathVariable Long id,
            HttpSession session) {
        
        String tenantId = TenantContextHolder.getTenantId();
        User currentUser = SessionUtils.getCurrentUser(session);
        String deletedBy = currentUser != null ? currentUser.getId().toString() : "system";
        
        resourceService.deleteResource(tenantId, id, deletedBy);
        
        return deleted("리소스가 삭제되었습니다.");
    }
}
```

---

## 위젯 Config 설정 가이드

### 완전한 CRUD 위젯 Config 예제

```json
{
  "id": "widget-user-management",
  "type": "table",
  "config": {
    "title": "사용자 관리",
    "dataSource": {
      "type": "api",
      "url": "/api/v1/users",
      "method": "GET",
      "params": {
        "page": 0,
        "size": 10
      },
      "refreshInterval": 60000
    },
    "columns": [
      {
        "key": "id",
        "label": "ID",
        "sortable": true
      },
      {
        "key": "name",
        "label": "이름",
        "editable": true,
        "required": true
      },
      {
        "key": "email",
        "label": "이메일",
        "editable": true,
        "required": true,
        "format": "email"
      },
      {
        "key": "createdAt",
        "label": "생성일",
        "format": "date"
      }
    ],
    "pagination": {
      "enabled": true,
      "pageSize": 10
    },
    "actions": {
      "create": {
        "url": "/api/v1/users",
        "method": "POST",
        "modal": true
      },
      "update": {
        "url": "/api/v1/users/{id}",
        "method": "PUT",
        "modal": true
      },
      "delete": {
        "url": "/api/v1/users/{id}",
        "method": "DELETE",
        "confirm": true
      }
    },
    "permissions": {
      "create": "USER_CREATE",
      "update": "USER_UPDATE",
      "delete": "USER_DELETE"
    }
  }
}
```

---

## 요약

1. **조회(Read)**: `apiGet` 사용, `dataSource.url` 설정
2. **생성(Create)**: `csrfTokenManager.post` 사용, `actions.create` 설정
3. **수정(Update)**: `csrfTokenManager.put` 사용, `actions.update` 설정
4. **삭제(Delete)**: `csrfTokenManager.delete` 사용, `actions.delete` 설정

모든 CRUD 작업은 위젯의 `config`에서 설정하고, 백엔드 API는 표준 패턴을 따릅니다.


