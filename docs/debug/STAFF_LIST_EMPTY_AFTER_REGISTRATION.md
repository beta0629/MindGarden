# 스태프 등록 후 목록에 안 나오는 현상 (코어 디버거 분석)

## 현상
- 스태프 관리 화면: "등록된 스태프가 없습니다" 표시
- 스태프를 방금 등록했는데 목록에 0명으로 나옴

## 재현 절차
1. 관리자 로그인 → 사용자 관리 → 스태프 탭
2. "새 스태프 등록"으로 스태프 한 명 등록
3. 등록 성공 토스트 후 목록 새로고침(또는 자동 재조회)
4. **결과: 총 스태프 0명, "등록된 스태프가 없습니다"**

## 원인 (근본 원인)

**AdminUserController `GET /api/v1/admin/user-management`** 에서  
`includeInactive=true` 일 때 **테넌트 필터 없이** `userService.getRepository().findAll()` 을 사용하고 있었음.

- `includeInactive=false` → `userService.findAllActive()`  
  → **현재 테넌트** + 활성만 조회 (`findAllActiveByTenantId(tenantId)`) ✅
- `includeInactive=true` → `getRepository().findAll()`  
  → **전 테넌트** 조회 (JPA `findAll()`) ❌

스태프 목록은 프론트에서 `includeInactive: true`, `role: STAFF` 로 요청함.  
백엔드에서 `findAll()` 은 테넌트 조건이 없어, 환경에 따라:
- 멀티테넌트/필터 적용 시: 현재 테넌트 사용자만 노출되도록 다른 레이어에서 걸러질 수 있고,
- 또는 **현재 테넌트 컨텍스트와 다른 결과**가 나와 목록이 비어 보일 수 있음.

또한 **테넌트 스코프를 지키지 않으면** 다른 테넌트 사용자 노출 위험이 있음.

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
