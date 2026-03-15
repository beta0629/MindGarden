# 스태프 등록 후 목록에 안 나오는 현상 (코어 디버거 분석)

## 현상
- 스태프 관리 화면: "등록된 스태프가 없습니다" 표시
- 스태프를 방금 등록했는데 목록에 0명으로 나옴

## 재현 절차
1. 관리자 로그인 → 사용자 관리 → 스태프 탭
2. "새 스태프 등록"으로 스태프 한 명 등록
3. 등록 성공 토스트 후 목록 새로고침(또는 자동 재조회)
4. **결과: 총 스태프 0명, "등록된 스태프가 없습니다"**

## 원인 (근본 원인) — 2가지

### 1) 백엔드: 테넌트 미적용 (이미 수정됨)
**AdminUserController `GET /api/v1/admin/user-management`** 에서  
`includeInactive=true` 일 때 **테넌트 필터 없이** `userService.getRepository().findAll()` 을 사용하고 있었음.  
→ 수정: `userService.findAllByCurrentTenant()` 사용.

### 2) 프론트: 응답 파싱 오류 (추가 수정)
**ajax.js** 의 `apiGet` 은 백엔드가 `{ success, data }` 형태로 주면 **`data`만 반환**함.  
그런데 **StaffManagement** 에서는 `response.data` 를 배열로 기대하고 있어,  
실제로는 `response` 자체가 배열인데 `response.data` 를 쓰면서 항상 `undefined` → **목록이 항상 []** 이 됨.

- 기대한 코드: `response = { data: [ ... ] }` → `response.data` 사용
- 실제 동작: `response = [ ... ]` (apiGet이 이미 unwrap) → `response.data` 는 undefined → list = []

## 수정 내용

1. **UserService**
   - `List<User> findAllByCurrentTenant()` 추가  
     → 현재 테넌트의 **전체 사용자**(비활성 포함, `isDeleted=false`) 조회

2. **UserServiceImpl**
   - `findAllByCurrentTenant()` 구현  
     → `userRepository.findByTenantId(tenantId)` + 복호화

3. **AdminUserController**
   - `includeInactive=true` 일 때  
     `userService.getRepository().findAll()` 대신  
     **`userService.findAllByCurrentTenant()`** 사용하도록 변경

이제 스태프 목록은 항상 **현재 테넌트** 기준으로만 조회되며, 방금 등록한 스태프도 목록에 표시됨.

### 4) StaffManagement.js (프론트 응답 파싱)
- `loadUsers` / `openAddStaffModal` 에서  
  `response` 가 이미 배열인 경우를 처리:  
  `list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);`

## 개발 서버 로그로 확인하는 방법 (코어 쉘)

백엔드 로그에서 다음을 확인할 수 있음:

```bash
# 스태프 등록 직후 로그 (성공 시)
grep -E "스태프 등록 완료|registerStaff" logs/coresolution.log

# 사용자 목록 조회 요청 (역할 필터 STAFF)
grep -E "전체 사용자 목록 조회|역할 필터|SUCCESS_USERS_RETRIEVED" logs/coresolution.log
```

- 수정 전: `includeInactive=true` 인데도 테넌트가 아닌 전역 조회로 인해 0건이 나올 수 있음.
- 수정 후: 동일 요청에 대해 "SUCCESS_USERS_RETRIEVED: N명" 에서 N이 1 이상으로 나와야 함.

## 체크리스트 (수정 검증)

- [x] `includeInactive=true` 시 테넌트 스코프 조회로 변경
- [x] UserService/UserServiceImpl 에 `findAllByCurrentTenant()` 추가
- [x] Maven compile 성공
- [ ] 실제 환경에서 스태프 등록 → 목록에 1명 이상 노출 확인
- [ ] (선택) 로그에서 "전체 사용자 목록 조회 요청 - 비활성 포함: true, 역할 필터: STAFF" 후 "N명" 확인
