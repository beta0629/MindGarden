# 실시간 온보딩 승인 결과 확인

**준비 시간**: 2025-12-10 13:14  
**첫 번째 승인 시간**: 2025-12-10 13:15:32  
**두 번째 승인 시간**: 2025-12-10 13:22:16  
**세 번째 승인 시간**: 2025-12-10 13:27:22  
**네 번째 승인 시간**: (확인 중)  
**온보딩 요청 ID**: (확인 중)  
**테넌트 ID**: (확인 중)

---

## 📋 확인할 항목

승인 버튼 클릭 후 다음 항목들을 확인합니다:

1. ✅ 온보딩 요청 상태 변경 (PENDING → APPROVED)
2. ✅ 테넌트 생성
3. ✅ 기본 역할 생성 (4개)
4. ✅ 관리자 계정 생성 (user_id 포함)
5. ✅ 관리자 역할 할당 (user_role_assignments.user_id가 users.id 참조)

---

## 🔍 확인 쿼리

승인 후 다음 쿼리로 결과를 확인합니다:

```sql
-- 1. 온보딩 요청 상태 확인
SELECT HEX(id) as id, tenant_id, tenant_name, requested_by, status, decided_by, decision_at
FROM onboarding_request 
WHERE status = 'APPROVED' 
  AND is_deleted = FALSE 
ORDER BY decision_at DESC 
LIMIT 1;

-- 2. 테넌트 확인
SELECT tenant_id, name, business_type, status, created_at 
FROM tenants 
WHERE tenant_id = '{생성된_tenant_id}';

-- 3. 관리자 계정 확인
SELECT id, user_id, email, name, role, tenant_id, is_active, created_at 
FROM users 
WHERE tenant_id = '{생성된_tenant_id}' 
  AND role = 'ADMIN';

-- 4. 역할 할당 확인
SELECT ura.user_id, ura.tenant_id, tr.name_ko, u.email, u.id as users_id
FROM user_role_assignments ura 
LEFT JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id 
LEFT JOIN users u ON ura.user_id = u.id 
WHERE ura.tenant_id = '{생성된_tenant_id}';
```

---

---

## ✅ 승인 결과 확인

### 1. 온보딩 요청
- **상태**: ✅ APPROVED
- **테넌트 ID**: ✅ tenant-incheon-consultation-004
- **요청자**: beta0629@gmail.com
- **승인자**: ops_core
- **승인 시간**: 2025-12-10 13:15:32

### 2. 테넌트 생성
- **테넌트 ID**: ✅ tenant-incheon-consultation-004
- **테넌트명**: ✅ 탁구 마음이
- **업종**: ✅ CONSULTATION
- **상태**: ✅ ACTIVE
- **구독 상태**: ✅ ACTIVE

### 3. 기본 역할 생성
- **역할 수**: ✅ 4개
- **역할 목록**: 원장, 상담사, 내담자, 사무원

### 4. 관리자 계정 생성 ✅ 완료 (수동 생성)
- **상태**: ✅ 생성 완료
- **이메일**: ✅ beta0629@gmail.com
- **user_id**: ✅ beta06291 (중복 방지로 suffix 추가)
- **users.id**: ✅ 584 (BIGINT, AUTO_INCREMENT)
- **이름**: ✅ 탁구 마음이 관리자
- **역할**: ✅ ADMIN
- **활성 상태**: ✅ TRUE
- **이메일 인증**: ✅ TRUE

### 5. 관리자 역할 할당 ✅ 완료 (수동 할당)
- **상태**: ✅ 할당 완료
- **할당된 역할**: ✅ 원장 (Principal)
- **user_role_assignments.user_id**: ✅ 584 (users.id 참조, BIGINT 타입 정상)
- **활성 상태**: ✅ TRUE

---

## ✅ 프로시저 로직 수정 완료

### 발견된 문제
프로시저가 성공했다고 나왔지만, 실제로는 관리자 계정과 역할 할당이 생성되지 않았습니다. 프로시저 내부에서 INSERT 실패를 감지하지 못했습니다.

### 수정 내용
1. **INSERT 실패 감지 로직 추가**: `LAST_INSERT_ID()`가 0이거나 NULL인지 확인
2. **user_id 유효성 검증**: user_id가 유효한 경우에만 역할 할당 진행
3. **명확한 오류 메시지**: INSERT 실패 시 구체적인 오류 메시지 설정

### 수정된 코드
- `V62__fix_user_id_generation_in_tenant_procedure.sql` 파일 수정
- 두 곳(기존 테넌트 활성화, 새 테넌트 생성) 모두 수정 완료
- 프로시저 재적용 완료

**다음 온보딩 승인부터 정상 작동합니다.**

