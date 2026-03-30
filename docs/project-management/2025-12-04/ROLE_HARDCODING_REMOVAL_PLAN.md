# 역할 이름 하드코딩 제거 계획

**작성일**: 2025-12-04  
**우선순위**: Priority 3.1  
**예상 기간**: 3일

---

## 📌 개요

모든 역할 이름을 공통코드로 조회하도록 변경하여 하드코딩을 제거합니다.

---

## 📊 발견된 하드코딩 현황

### Backend
- **총 매치**: 244개
- **파일 수**: 62개

### Frontend
- **총 매치**: 383개 (백업 파일 포함)
- **파일 수**: 161개 (백업 파일 포함)

---

## 🎯 작업 계획

### Day 1: Backend 역할 문자열 제거

#### 우선순위 파일 (하드코딩 분석 보고서 기준)

1. **ConsultationMessageController.java** (Line 124)
   - 문제: `message.getSenderType().equals("CONSULTANT") ? "CLIENT" : "CONSULTANT"`
   - 해결: `UserRole` enum 활용

2. **AdminController.java** (Line 403)
   - 문제: `currentUser.getRole().name().equals("BRANCH_SUPER_ADMIN")`
   - 해결: enum 활용

3. **BranchManagementController.java** (Line 147-148)
   - 문제: `.filter(u -> u.getRole().name().equals("CLIENT"))`
   - 해결: enum 리스트 활용

4. **SystemConfigController.java** (Line 47-53)
   - 문제: 여러 역할을 하드코딩된 문자열로 체크
   - 해결: 관리자 역할 리스트를 상수로 정의

5. **BranchServiceImpl.java** (Line 405-407)
   - 문제: 역할별 로직 분기 시 하드코딩
   - 해결: enum switch 문 사용

#### 추가 우선순위 파일 (grep 결과 기준)

6. **TenantDashboardServiceImpl.java**
   - 문제: `roleCode.equals("ADMIN")` 등
   - 해결: enum 또는 공통코드 활용

7. **TestDataController.java**
   - 문제: `.filter(user -> user.getRole().name().equals("CONSULTANT"))`
   - 해결: enum 활용

---

### Day 2: Frontend 역할 문자열 제거

#### 우선순위 파일

1. **CommonCodeManagement.js**
   - 문제: 14개 권한 체크 함수에서 역할 하드코딩
   - 해결: 권한 시스템 API 활용

2. **AdminDashboard.js**
   - 문제: 2개 하드코딩
   - 해결: 권한 Hook 사용

3. **SessionContext.js**
   - 문제: 3개 하드코딩
   - 해결: 권한 Hook 사용

4. **CommonDashboard.js**
   - 문제: 16개 하드코딩
   - 해결: 권한 Hook 사용

---

### Day 3: 공통코드 조회 로직 적용

1. 공통코드 조회 유틸리티 생성
2. 권한 Hook 생성 (`usePermissions.js`)
3. 통합 테스트

---

## ✅ 체크리스트

### Day 1: Backend
- [ ] ConsultationMessageController.java 수정
- [ ] AdminController.java 수정
- [ ] BranchManagementController.java 수정
- [ ] SystemConfigController.java 수정
- [ ] BranchServiceImpl.java 수정
- [ ] TenantDashboardServiceImpl.java 수정
- [ ] TestDataController.java 수정
- [ ] 문법 검사 실행

### Day 2: Frontend
- [ ] CommonCodeManagement.js 수정
- [ ] AdminDashboard.js 수정
- [ ] SessionContext.js 수정
- [ ] CommonDashboard.js 수정
- [ ] 기타 파일 수정

### Day 3: 통합
- [ ] 공통코드 조회 유틸리티 생성
- [ ] 권한 Hook 생성
- [ ] 통합 테스트
- [ ] 문서 업데이트

---

## 📝 참조 문서

- `docs/project-management/analysis/HARDCODING_ANALYSIS_REPORT.md`
- `docs/standards/COMMON_CODE_SYSTEM_STANDARD.md`
- `docs/standards/COMMON_CODE_DROPDOWN_STANDARD.md`

---

---

## 🛠️ Python 스크립트 자동화

### 스크립트 위치
- `scripts/standardization/remove_role_hardcoding.py`

### 사용 방법

#### DRY RUN (실제 변경 없이 확인)
```bash
python3 scripts/standardization/remove_role_hardcoding.py --project-root .
```

#### 실제 실행 (백업 후 변경)
```bash
python3 scripts/standardization/remove_role_hardcoding.py --project-root . --execute
```

### 스크립트 기능
1. **Backend Java 파일 처리**
   - `.equals("ROLE_NAME")` → `== UserRole.ROLE_NAME`
   - `.name().equals("ROLE_NAME")` → `== UserRole.ROLE_NAME`
   - `roleCode.equals("ROLE")` → `UserRole.ROLE.name().equals(roleCode)`
   - 여러 역할 체크 패턴 처리

2. **자동 백업**
   - 실행 모드에서 자동으로 백업 생성
   - 백업 디렉토리: `backup-role-hardcoding-removal-{timestamp}/`

3. **결과 보고서**
   - 변경된 파일 및 변경 사항 목록
   - JSON 형식으로 결과 저장

### 주의 사항
- 스크립트 실행 전 반드시 DRY RUN으로 확인
- 백업 파일은 자동 생성되지만, Git 커밋 권장
- 변경 후 문법 검사 필수

---

**최종 업데이트**: 2025-12-04

