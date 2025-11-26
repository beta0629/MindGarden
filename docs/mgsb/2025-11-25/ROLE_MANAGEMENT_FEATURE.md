# 역할 추가/제거 기능 구현

**작성일**: 2025-11-25  
**상태**: ✅ 완료

---

## 🎯 구현 목표

대시보드 생성/수정 모달에서 역할을 추가하고 제거할 수 있는 기능 구현

---

## 📋 구현 내용

### 1. 백엔드: 역할 템플릿 목록 API 추가

#### 1.1 API 엔드포인트
- **위치**: `src/main/java/com/coresolution/core/controller/TenantRoleManagementController.java`
- **엔드포인트**: `GET /api/v1/tenant/roles/templates`
- **기능**: 업종별 역할 템플릿 목록 조회

```java
@GetMapping("/templates")
public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRoleTemplates(HttpSession session) {
    // 활성화된 모든 템플릿 조회
    List<RoleTemplate> templates = roleTemplateRepository.findAllActive();
    
    // 템플릿 정보를 Map으로 변환하여 반환
    // roleTemplateId, templateCode, name, nameKo, businessType, defaultWidgetsJson 등 포함
}
```

### 2. 프론트엔드: 역할 추가/제거 UI

#### 2.1 역할 추가 기능
- **위치**: `frontend/src/components/admin/DashboardFormModal.js`
- **기능**:
  - 역할 추가 버튼 클릭 시 템플릿 선택 모달 표시
  - 업종별 템플릿 필터링
  - 템플릿 선택 후 역할 생성
  - 역할 생성 후 역할 목록 자동 새로고침

#### 2.2 역할 제거 기능
- **기능**:
  - 역할 목록 하단에 "역할 관리" 접기/펼치기 섹션 추가
  - 각 역할 옆에 삭제 버튼 표시
  - 삭제 확인 다이얼로그
  - 역할 삭제 후 역할 목록 자동 새로고침

---

## 🔧 기술적 세부사항

### 역할 추가 프로세스

1. **템플릿 목록 로드**
   ```javascript
   const templatesResponse = await apiGet(`/api/v1/tenant/roles/templates`);
   // 업종별 필터링
   const filteredTemplates = businessType 
     ? templatesResponse.filter(t => t.businessType === businessType)
     : templatesResponse;
   ```

2. **템플릿 선택**
   - 사용자가 템플릿 선택
   - 템플릿 정보 표시 (이름, 업종, 설명)

3. **역할 생성**
   ```javascript
   const response = await csrfTokenManager.post(
     `/api/v1/tenant/roles/from-template/${selectedTemplateId}`,
     {}
   );
   ```

4. **역할 목록 새로고침**
   ```javascript
   await loadTenantRoles();
   ```

### 역할 제거 프로세스

1. **삭제 확인**
   ```javascript
   if (!window.confirm(`"${roleName}" 역할을 삭제하시겠습니까?`)) {
     return;
   }
   ```

2. **역할 삭제**
   ```javascript
   const response = await csrfTokenManager.delete(`/api/v1/tenant/roles/${tenantRoleId}`);
   ```

3. **역할 목록 새로고침**
   ```javascript
   await loadTenantRoles();
   ```

---

## 🎨 UI 구성

### 역할 선택 섹션
```
┌─────────────────────────────────────┐
│ 역할 *                    [역할 추가] │
├─────────────────────────────────────┤
│ [역할 선택 드롭다운]                  │
│                                     │
│ ▼ 역할 관리                          │
│   ┌─────────────────────────────┐   │
│   │ 원장              [삭제]    │   │
│   │ 상담사            [삭제]    │   │
│   │ 내담자            [삭제]    │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 역할 추가 모달
```
┌─────────────────────────────────────┐
│ 역할 추가                      [X]   │
├─────────────────────────────────────┤
│ 역할 템플릿 선택 *                    │
│ [템플릿 선택 드롭다운]                │
│                                     │
│ 템플릿을 선택하면 해당 템플릿의       │
│ 권한과 기본 위젯 설정이 자동으로     │
│ 적용됩니다.                          │
│                                     │
│ [취소]              [역할 추가]      │
└─────────────────────────────────────┘
```

---

## ✅ 완료된 작업

- [x] 역할 템플릿 목록 조회 API 추가
- [x] 역할 추가 기능 (템플릿 기반)
- [x] 역할 제거 기능
- [x] 역할 추가/제거 후 역할 목록 자동 새로고침
- [x] 역할 관리 UI (접기/펼치기)
- [x] 업종별 템플릿 필터링

---

## 📝 사용 방법

### 역할 추가
1. 대시보드 생성 모달 열기
2. "역할 추가" 버튼 클릭
3. 템플릿 선택 모달에서 원하는 템플릿 선택
4. "역할 추가" 버튼 클릭
5. 역할이 추가되고 목록에 자동 반영

### 역할 제거
1. 대시보드 생성 모달 열기
2. 역할 선택 드롭다운 하단의 "역할 관리" 클릭
3. 제거할 역할 옆의 "삭제" 버튼 클릭
4. 확인 다이얼로그에서 확인
5. 역할이 삭제되고 목록에서 자동 제거

---

## 🔗 관련 API

### 역할 템플릿 목록 조회
- **엔드포인트**: `GET /api/v1/tenant/roles/templates`
- **응답**: 역할 템플릿 목록 (업종별 필터링 가능)

### 템플릿 기반 역할 생성
- **엔드포인트**: `POST /api/v1/tenant/roles/from-template/{roleTemplateId}`
- **응답**: 생성된 역할 정보

### 역할 삭제
- **엔드포인트**: `DELETE /api/v1/tenant/roles/{tenantRoleId}`
- **응답**: 삭제 성공 메시지

---

## 🎉 결과

**이제 대시보드 생성 모달에서 역할을 추가하고 제거할 수 있습니다:**

- ✅ 역할 추가: 템플릿 기반으로 간편하게 역할 추가
- ✅ 역할 제거: 불필요한 역할 삭제
- ✅ 자동 새로고침: 역할 추가/제거 후 목록 자동 업데이트
- ✅ 업종별 필터링: 해당 업종의 템플릿만 표시


