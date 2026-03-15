# 스태프 목록 + 이메일 폼 이슈 — 기획/수정 요약 (코어 디버거 → 기획)

## 1. 스태프 목록 "0명" 이슈

### 기획 관점
- **목표**: 스태프 등록 후 목록에서 해당 테넌트의 스태프만 즉시 노출.
- **동작**: 관리자 → 사용자 관리 → 스태프 탭에서 "총 스태프 N명", 목록 표시.

### 원인 (디버거)
1. **백엔드**: `includeInactive=true` 시 테넌트 없이 전역 조회 → 이미 수정됨 (`findAllByCurrentTenant()`).
2. **프론트**: `apiGet` 이 `{ success, data }` 응답에서 **data만 반환**하는데, 목록 코드는 `response.data` 를 참조 → 항상 `[]`.

### 수정 (기획 반영)
- **StaffManagement.js**  
  - `loadUsers`: `list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : [])`  
  - `openAddStaffModal`: 동일한 파싱으로 목록/비스태프 사용자 처리.

---

## 2. 이메일 폼 "이상해짐" 이슈

### 기획 관점
- **목표**: 내담자/상담사/스태프 등록·수정 모달에서 이메일 행이 **한 줄에 입력란 + 중복확인**으로 일관되게 표시.
- **동작**: "이메일 *" 레이블 아래 입력 필드가 보이고, 오른쪽에 "중복확인" 버튼.

### 원인 (디버거)
- 이메일 행은 `.mg-v2-form-email-row` + `.mg-v2-form-email-row__input-wrap` + input 구조.
- 래퍼에 `min-width: 0` 만 있어 flex 계산 시 너비가 0이 되는 경우가 있음 → 입력란이 안 보임.

### 수정 (기획 반영)
- **AdminDashboardB0KlA.css**  
  `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` 에 **min-width: 12rem** 추가 → 입력란 최소 너비 보장.

---

## 3. 적용된 파일

| 구분 | 파일 | 내용 |
|------|------|------|
| 스태프 목록 | `StaffManagement.js` | user-management 응답을 배열/객체 모두 처리하도록 파싱 수정 |
| 이메일 폼 | `AdminDashboardB0KlA.css` | 이메일 행 input-wrap 에 min-width: 12rem 추가 |
| 문서 | `docs/debug/STAFF_LIST_EMPTY_AFTER_REGISTRATION.md` | 스태프 목록 원인·수정 보강 |
| 문서 | `docs/debug/EMAIL_FORM_LAYOUT_STAFF_MODAL.md` | 이메일 폼 깨짐 원인·수정 |
| 문서 | `docs/debug/STAFF_AND_EMAIL_PLAN_SUMMARY.md` | 본 기획/수정 요약 |

---

## 4. 검증 체크리스트

- [ ] 스태프 등록 후 "총 스태프 N명"에 1명 이상 표시
- [ ] "스태프로 지정" 모달에서 비스태프 사용자 목록 표시
- [ ] 새 스태프 등록 모달에서 이메일 입력란 보이고, 중복확인 버튼과 한 줄 배치
- [ ] 내담자/상담사 등록 모달에서도 이메일 행 동일하게 표시
