# 내담자 등록(create) 시 주민번호 저장 누락 수정 결과

**작성일**: 2025-03-16  
**참조**: docs/debug/RESIDENT_NUMBER_CREATE_OMISSION_ANALYSIS.md

## 수정 내용

### 대상 파일
- `frontend/src/components/admin/ClientComprehensiveManagement.js`

### 변경 사항
1. **주민번호·주소 필드 payload 포함 (create/edit 공통)**  
   - 기존: `modalType === 'edit'`일 때만 payload에 `rrnFirst6`, `rrnLast1`, `address`, `addressDetail`, `postalCode` 할당.  
   - 수정: 위 필드 할당을 edit 전용 블록 밖으로 이동하여, create/edit 구분 없이 값이 있으면 trim 후 payload에 포함.

2. **create 시 주민번호 유효성 검사**  
   - 기존: edit일 때만 주민번호 형식 검사(앞 6자리 숫자, 뒤 1자리 1~4) 적용.  
   - 수정: create일 때도 동일 조건으로 검사하고, 실패 시 동일 메시지로 `showError` 호출.

### 그 외 검토
- **상담사(Consultant)**: create 시 `...data` 스프레드로 rrn 포함됨 → 수정 불필요.  
- **스태프(Staff)**: create 시 이미 `rrnFirst6`/`rrnLast1` payload 포함 → 수정 불필요.  
- 다른 주민번호 사용 create API에서 동일 누락 패턴 없음.

## 확인 체크리스트
- [ ] 내담자 **등록(create)** 시 주민번호 앞 6자리·뒤 1자리 입력 후 저장 시, 해당 내담자 카드/상세에서 **성별** 표시 확인.
- [ ] 내담자 **수정(edit)** 시 주민번호·주소 입력·저장 동작 기존과 동일한지 확인.
- [ ] create 시 `POST /api/v1/admin/clients` 요청 body에 `rrnFirst6`, `rrnLast1`(및 주소 필드) 포함 여부 확인.
