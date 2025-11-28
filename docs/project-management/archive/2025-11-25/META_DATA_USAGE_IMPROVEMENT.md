# 메타 데이터 활용 개선

**작성일**: 2025-11-25  
**상태**: ✅ 완료

---

## 🎯 개선 목표

대시보드 생성/수정 시 **메타 데이터(RoleTemplate의 default_widgets_json)를 우선적으로 활용**하도록 개선

---

## 📋 변경 사항

### 1. 프론트엔드: 메타 데이터 우선 사용 강화

#### 1.1 `getDefaultWidgetsForRole` 함수 개선
- **위치**: `frontend/src/components/admin/DashboardFormModal.js`
- **변경 사항**:
  - 메타 데이터 확인 로그 추가
  - 메타 데이터 파싱 실패 시 상세 에러 로그
  - 기본 구조 보장 (version, layout, widgets)
  - 위젯 ID 및 position 자동 생성 로직 개선

#### 1.2 역할 목록 로드 시 메타 데이터 확인
- **변경 사항**:
  - 역할 목록 로드 시 각 역할의 `defaultWidgetsJson` 존재 여부 확인
  - 메타 데이터 포함 역할 수 로그 출력
  - 메타 데이터가 없는 역할에 대한 경고 로그

---

## 🔧 기술적 세부사항

### 메타 데이터 우선순위

1. **RoleTemplate.default_widgets_json** (최우선)
   - 백엔드에서 `TenantRoleResponse`에 포함되어 전달됨
   - 프론트엔드에서 `role.defaultWidgetsJson`으로 접근
   - JSON 파싱 후 기본 구조 보장 및 위젯 ID 자동 생성

2. **Fallback: 역할 코드 기반 하드코딩**
   - 메타 데이터가 없을 때만 사용
   - 역할 코드나 이름에 따라 기본 위젯 설정

### 메타 데이터 구조

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 3,
    "gap": "md",
    "responsive": true
  },
  "widgets": [
    {
      "id": "welcome-1234567890",
      "type": "welcome",
      "title": "환영합니다",
      "position": {
        "row": 0,
        "col": 0,
        "span": 3
      },
      "config": {}
    }
  ]
}
```

### 백엔드 메타 데이터 전달

**위치**: `src/main/java/com/coresolution/core/service/impl/TenantRoleServiceImpl.java`

```java
// 템플릿 코드 및 기본 위젯 설정 조회 (템플릿 기반인 경우)
if (role.getRoleTemplateId() != null) {
    roleTemplateRepository.findByRoleTemplateIdAndIsDeletedFalse(role.getRoleTemplateId())
            .ifPresent(template -> {
                templateCode[0] = template.getTemplateCode();
                // 메타 시스템: 기본 위젯 설정도 함께 반환
                if (template.getDefaultWidgetsJson() != null && !template.getDefaultWidgetsJson().trim().isEmpty()) {
                    defaultWidgetsJson[0] = template.getDefaultWidgetsJson();
                }
            });
}

return TenantRoleResponse.builder()
        .defaultWidgetsJson(defaultWidgetsJson[0])  // 메타 데이터 포함
        // ... 기타 필드
        .build();
```

---

## 📊 로그 개선

### 역할 목록 로드 시
```
✅ 메타 데이터 확인: { roleName: "관리자", templateCode: "ADMIN", hasDefaultWidgetsJson: true, jsonLength: 1234 }
⚠️ 메타 데이터 없음: { roleName: "사용자", templateCode: "USER", hasDefaultWidgetsJson: false }
📊 메타 데이터 포함 역할: 3개
```

### 기본 위젯 설정 로드 시
```
🔍 역할별 기본 위젯 설정 가져오기: { roleName: "관리자", templateCode: "ADMIN", hasDefaultWidgetsJson: true }
✅ 메타 시스템: RoleTemplate에서 기본 위젯 설정 로드 성공: { templateCode: "ADMIN", widgetCount: 3 }
```

---

## ✅ 완료된 작업

- [x] 메타 데이터 우선 사용 로직 강화
- [x] 메타 데이터 확인 로그 추가
- [x] 기본 구조 보장 로직 추가
- [x] 위젯 ID 및 position 자동 생성 개선
- [x] 역할 목록 로드 시 메타 데이터 확인

---

## 🎉 결과

**이제 대시보드 생성 시 메타 데이터를 우선적으로 활용합니다:**

1. **메타 데이터가 있는 경우**: RoleTemplate의 `default_widgets_json` 사용
2. **메타 데이터가 없는 경우**: Fallback 로직으로 역할 코드 기반 기본 위젯 설정

**장점:**
- ✅ DB에서 위젯 설정 변경 가능 (코드 수정 불필요)
- ✅ 새로운 역할 추가 시 템플릿만 추가하면 자동 적용
- ✅ 관리자 UI에서 위젯 설정 변경 가능 (추후 구현)


