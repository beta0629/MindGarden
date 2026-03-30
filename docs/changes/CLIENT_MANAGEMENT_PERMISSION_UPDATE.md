# 내담자 관리 권한 제한 업데이트

**작성일**: 2026-03-09  
**작성자**: Core Solution  
**상태**: 완료

---

## 📌 개요

상담사의 내담자 관리 권한을 제거하고, 관리자(ADMIN)와 스태프(STAFF)만 내담자를 관리할 수 있도록 시스템을 수정했습니다.

---

## 🎯 변경 목적

- **보안 강화**: 내담자 개인정보 관리를 관리자와 스태프로 제한
- **역할 명확화**: 상담사는 본인 담당 내담자 조회만 가능 (읽기 전용)
- **권한 체계 정리**: 내담자 생성/수정/삭제는 관리 권한이 필요한 작업으로 분류

---

## 🔧 변경 사항

### 1. 백엔드 권한 체크 추가

**파일**: `src/main/java/com/coresolution/consultation/controller/AdminController.java`

다음 엔드포인트에 `@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")` 추가:

- `POST /api/v1/admin/clients` - 내담자 등록
- `PUT /api/v1/admin/clients/{id}` - 내담자 정보 수정
- `DELETE /api/v1/admin/clients/{id}` - 내담자 삭제
- `GET /api/v1/admin/clients` - 내담자 목록 조회
- `GET /api/v1/admin/clients/with-stats` - 내담자 통계 조회
- `GET /api/v1/admin/clients/with-stats/{id}` - 개별 내담자 통계 조회
- `GET /api/v1/admin/clients/with-mapping-info` - 통합 내담자 데이터 조회
- `GET /api/v1/admin/clients/{id}/deletion-status` - 내담자 삭제 가능 여부 확인

**결과**: 상담사(CONSULTANT) 역할로 위 API 호출 시 403 Forbidden 응답

### 2. 프론트엔드 메뉴 수정

#### 2.1 상담사 메뉴 레이블 변경

**파일**: `frontend/src/constants/menu.js`

```javascript
// 변경 전
CLIENT_MGMT: {
  id: 'client_mgmt',
  label: '내담자 관리',
  icon: 'bi-people'
}

// 변경 후
CLIENT_VIEW: {
  id: 'client_view',
  label: '내담자 조회',
  icon: 'bi-people'
}
```

#### 2.2 사용자 관리 페이지 권한 체크

**파일**: `frontend/src/components/admin/UserManagementPage.js`

- `useSession` 훅을 사용하여 `hasRole` 함수로 권한 확인
- 내담자 관리 탭은 ADMIN, STAFF만 표시
- 상담사가 URL로 직접 접근 시 자동으로 상담사 관리 탭으로 리다이렉트

#### 2.3 라우팅 보호

**파일**: `frontend/src/App.js`

```javascript
<Route path="/admin/user-management" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'STAFF']}>
    <UserManagementPage />
  </ProtectedRoute>
} />
```

#### 2.4 대시보드 메뉴 숨김

**파일**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`

- 내담자 관리 카드는 `canManageClients` 조건 추가
- 상담사 역할일 때 내담자 관리 카드 미노출

#### 2.5 상담사 내담자 목록 페이지 안내

**파일**: `frontend/src/components/consultant/ConsultantClientList.js`

- 페이지 상단에 읽기 전용 안내 메시지 추가
- "내담자 생성, 수정, 삭제는 관리자와 스태프만 가능합니다." 알림 표시

#### 2.6 빠른 액션 바 레이블 변경

**파일**: `frontend/src/components/dashboard-v2/consultant/QuickActionBar.js`

- "내담자 관리" → "내담자 조회"로 변경

---

## ✅ 테스트 체크리스트

### 백엔드 테스트

- [ ] 관리자로 내담자 생성 API 호출 → 200 OK
- [ ] 스태프로 내담자 수정 API 호출 → 200 OK
- [ ] 상담사로 내담자 삭제 API 호출 → 403 Forbidden
- [ ] 상담사로 내담자 목록 조회 API 호출 → 403 Forbidden
- [ ] 상담사로 본인 담당 내담자 조회 API 호출 → 200 OK (읽기 전용)

### 프론트엔드 테스트

- [ ] 관리자 로그인 → 사용자 관리 페이지에서 내담자 탭 표시 확인
- [ ] 스태프 로그인 → 사용자 관리 페이지에서 내담자 탭 표시 확인
- [ ] 상담사 로그인 → 사용자 관리 페이지에서 내담자 탭 미노출 확인
- [ ] 상담사 로그인 → `/admin/user-management?type=client` URL 직접 접근 시 리다이렉트 확인
- [ ] 상담사 로그인 → 대시보드에서 내담자 관리 카드 미노출 확인
- [ ] 상담사 로그인 → 내 내담자 목록 페이지에서 읽기 전용 안내 메시지 표시 확인
- [ ] 상담사 로그인 → 상담사 메뉴에서 "내담자 조회" 레이블 확인

---

## 📝 권한 정의

| 역할 | 내담자 생성 | 내담자 수정 | 내담자 삭제 | 내담자 조회 (전체) | 본인 담당 내담자 조회 |
|------|------------|------------|------------|-------------------|---------------------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| STAFF | ✅ | ✅ | ✅ | ✅ | ✅ |
| CONSULTANT | ❌ | ❌ | ❌ | ❌ | ✅ (읽기 전용) |
| CLIENT | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔍 관련 파일

### 백엔드
- `src/main/java/com/coresolution/consultation/controller/AdminController.java`

### 프론트엔드
- `frontend/src/constants/menu.js`
- `frontend/src/components/admin/UserManagementPage.js`
- `frontend/src/components/consultant/ConsultantClientList.js`
- `frontend/src/components/dashboard-v2/AdminDashboardV2.js`
- `frontend/src/components/dashboard-v2/consultant/QuickActionBar.js`
- `frontend/src/components/dashboard-v2/constants/menuItems.js`
- `frontend/src/App.js`

---

## 🚀 배포 시 주의사항

1. **Spring Security 설정 확인**: `@EnableMethodSecurity(prePostEnabled = true)` 활성화 상태 확인
2. **세션 권한 확인**: 기존 로그인 세션의 역할 정보가 올바르게 설정되어 있는지 확인
3. **캐시 초기화**: 프론트엔드 빌드 후 브라우저 캐시 초기화 권장
4. **사용자 안내**: 상담사 사용자에게 권한 변경 사항 사전 공지

---

## 📚 참고 문서

- [백엔드 코딩 표준](../standards/BACKEND_CODING_STANDARD.md)
- [프론트엔드 개발 표준](../standards/FRONTEND_DEVELOPMENT_STANDARD.md)
- [API 호출 표준](../standards/API_CALL_STANDARD.md)
