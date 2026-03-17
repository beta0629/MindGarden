# 내담자 상태 변경 후 로그 분석 (2026-03-17)

## 제공된 로그 요약

- **페이지**: `/admin/user-management` (mindgarden.dev.core-solution.co.kr)
- **테넌트**: tenant-incheon-consultation-006
- **내용**: 초기 로딩 ~ 내담자 목록·상담사·매칭·알림 로드까지의 콘솔 로그

### 로그에서 확인된 동작

| 시점 | 로그 | 의미 |
|------|------|------|
| 초기 로드 | `🔄 내담자 목록 로딩 시작 (통합 API)...` | loadClients() 호출됨 |
| API 호출 | `📤 API GET 요청: { url: '/api/v1/admin/clients/with-stats', ... }` | GET /clients/with-stats 정상 호출 |
| 응답 | `📊 통합 API 응답: (9) [{…}, ...]` | 내담자 9명 수신 |
| 완료 | `✅ 내담자 목록 설정 완료 (통합 API): 9 명` | setClients(9명) 완료 |

### 로그에서 확인되지 않은 것 (상태 변경 후)

제공된 로그에는 **다음이 없음**:

1. **PUT 요청 로그**  
   - `PUT /api/v1/admin/clients/{id}` 호출 기록 없음.  
   - 상태를 바꾼 뒤 "수정" 버튼을 눌렀을 때 실제로 수정 API가 호출되었는지 이 로그만으로는 확인 불가.

2. **수정 요청/응답 로그**  
   - 등록(create) 시에는 `🔧 내담자 등록 시작:`, `✅ 내담자 등록 응답:` 이 있으나, **수정(edit) 시에는 동일한 콘솔 로그가 없음.**  
   - 따라서 "상태 변경 → 저장" 직후에 payload에 `status`가 들어갔는지, 응답이 성공이었는지 콘솔만으로는 판단 불가.

3. **저장 후 목록 재조회**  
   - 수정 성공 시 `loadClients()`가 호출되면 `🔄 내담자 목록 로딩 시작 (통합 API)...` 와 `📤 API GET 요청: .../clients/with-stats` 가 한 번 더 찍혀야 함.  
   - 제공 로그에는 초기 로드 1회분만 있어, "저장 후 재조회"가 발생했는지 구분 불가.

---

## 결론

- **현재 로그만으로는** "상태 변경 후"에  
  - PUT이 나갔는지,  
  - payload에 `status`가 포함됐는지,  
  - 저장 성공 후 목록이 다시 조회됐는지  
  를 판단할 수 없음.

- **다음 확인을 권장**  
  1. **Network 탭**: 내담자 수정 모달에서 상태를 바꾼 뒤 "수정" 클릭 시  
     - `PUT /api/v1/admin/clients/{id}` 요청이 있는지  
     - Request Payload에 `"status": "INACTIVE"`(또는 변경한 값)가 있는지  
  2. **콘솔**: 수정 경로에 로그를 추가한 뒤, 동일하게 상태 변경 → 수정 클릭 후  
     - `🔧 내담자 수정 요청:` (payload 포함),  
     - `✅ 내담자 수정 응답:` (또는 에러 로그),  
     - 그 다음 `🔄 내담자 목록 로딩 시작...` / GET `/clients/with-stats`  
     가 순서대로 찍히는지 확인.

---

## 수정 제안 (코드)

- **파일**: `frontend/src/components/admin/ClientComprehensiveManagement.js`  
- **내용**: `modalType === 'edit'` 분기에서  
  - `apiPut` 호출 **직전**에 `console.log('🔧 내담자 수정 요청:', { id: editingClient.id, payload });`  
  - `apiPut` 호출 **직후**에 `console.log('✅ 내담자 수정 응답:', response);`  
  를 추가하면, 다음에 "상태 변경 후" 로그를 수집할 때 위 항목들을 확인하기 쉬움.

이렇게 추가한 뒤 다시 상태 변경 → 저장 → 콘솔/Network 캡처하면, 원인 분석이 훨씬 수월해짐.
