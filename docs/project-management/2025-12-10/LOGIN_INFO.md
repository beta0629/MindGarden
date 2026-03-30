# 온보딩 승인 후 로그인 정보

**테넌트**: tenant-incheon-consultation-003  
**테넌트명**: 탁구와마음  
**승인 시간**: 2025-12-10 13:35:35

---

## 로그인 정보

### 관리자 계정
- **이메일**: `beta0629@gmail.com`
- **비밀번호**: `godgod826!` ✅ **온보딩 요청 시 입력한 비밀번호 그대로 사용**
- **user_id**: `beta0629`
- **역할**: ADMIN
- **할당된 역할**: 원장 (Principal)

### 비밀번호 확인
- ✅ 온보딩 요청 시 `checklistJson`에 저장된 `adminPassword` 값입니다.
- ✅ 백엔드에서 BCrypt로 해시화하여 저장하지만, 로그인 시에는 **원본 비밀번호를 입력**하면 됩니다.
- ✅ 비밀번호는 온보딩 폼에서 입력한 값 그대로 사용하시면 됩니다.

### 계정 상태
- ✅ 활성 상태: TRUE
- ✅ 이메일 인증: TRUE
- ✅ 역할 할당: 완료

---

## 로그인 방법

### 1. Ops Portal 로그인
- **URL**: `http://localhost:4300/auth/login` (로컬 개발 환경)
- **입력값**:
  - Username: `beta0629@gmail.com`
  - Password: `godgod826!`

### 2. CoreSolution 로그인
- **URL**: `http://localhost:3000/login` (로컬 개발 환경)
- **입력값**:
  - Email: `beta0629@gmail.com`
  - Password: `godgod826!`

---

## 주의사항

1. **비밀번호**: 온보딩 요청 시 `checklistJson`에 저장된 `adminPassword` 값입니다.
2. **테넌트**: 로그인 시 자동으로 `tenant-incheon-consultation-003` 테넌트에 연결됩니다.
3. **권한**: 원장(Principal) 역할이 할당되어 있어 해당 테넌트의 관리 기능을 사용할 수 있습니다.

---

**작성일**: 2025-12-10 13:36

