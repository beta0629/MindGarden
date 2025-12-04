# Git 워크플로우 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 Git 워크플로우 및 협업 표준입니다.  
브랜치 전략, 커밋 메시지 규칙, Pull Request 프로세스를 정의합니다.

### 참조 문서
- [배포 표준](./DEPLOYMENT_STANDARD.md)
- [코드 스타일 표준](./CODE_STYLE_STANDARD.md)

---

## 🎯 Git 워크플로우 원칙

### 1. 브랜치 보호
```
main 브랜치는 보호되어 직접 푸시 불가
```

**원칙**:
- ✅ `main` 브랜치는 Pull Request 통해서만 병합
- ✅ `develop` 브랜치는 개발 통합 브랜치
- ✅ 기능 개발은 `feature/*` 브랜치에서 진행
- ❌ `main` 브랜치에 직접 커밋 금지

### 2. 명확한 커밋 메시지
```
커밋 메시지는 변경 내용을 명확히 설명
```

**원칙**:
- ✅ Conventional Commits 형식 사용
- ✅ 타입과 범위 명시
- ✅ 변경 이유 명확히 설명
- ❌ 모호한 메시지 금지

### 3. 코드 리뷰 필수
```
모든 코드 변경은 Pull Request를 통한 리뷰 필수
```

**원칙**:
- ✅ PR 생성 후 리뷰 요청
- ✅ 최소 1명 이상 승인 후 병합
- ✅ 리뷰 코멘트 반영 필수
- ❌ 승인 없이 자동 병합 금지

---

## 🌳 브랜치 전략

### 1. 브랜치 구조

```
main (운영)
  └─ develop (개발)
      ├─ feature/{기능명} (기능 개발)
      ├─ bugfix/{버그명} (버그 수정)
      └─ hotfix/{긴급수정명} (긴급 수정)
```

### 2. 브랜치 유형

#### main (운영)
- **용도**: 운영 환경 배포용
- **보호**: Protected (직접 푸시 금지)
- **병합**: Pull Request 통해서만 병합
- **배포**: 운영 서버 자동 배포 (수동 실행)

#### develop (개발)
- **용도**: 개발 통합 브랜치
- **보호**: 일반 보호 (권장)
- **병합**: Pull Request 또는 직접 푸시 가능
- **배포**: 개발 서버 자동 배포

#### feature/{기능명} (기능 개발)
- **용도**: 새로운 기능 개발
- **생성**: `develop` 브랜치에서 분기
- **병합**: `develop` 브랜치로 Pull Request
- **삭제**: 병합 후 삭제

#### bugfix/{버그명} (버그 수정)
- **용도**: 버그 수정
- **생성**: `develop` 브랜치에서 분기
- **병합**: `develop` 브랜치로 Pull Request
- **삭제**: 병합 후 삭제

#### hotfix/{긴급수정명} (긴급 수정)
- **용도**: 운영 환경 긴급 수정
- **생성**: `main` 브랜치에서 분기
- **병합**: `main`과 `develop` 브랜치 모두로 병합
- **삭제**: 병합 후 삭제

### 3. 브랜치 명명 규칙

#### 형식
```
{유형}/{설명}
```

#### 예시
```
feature/user-authentication
feature/dashboard-widget-system
bugfix/login-error-handling
hotfix/critical-security-patch
```

#### 명명 규칙
- **언어**: 영어 (소문자)
- **구분자**: 하이픈 (`-`)
- **형식**: 명사-명사 또는 동사-명사
- **길이**: 최대 50자

---

## 📝 커밋 메시지 규칙

### 1. Conventional Commits 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 2. 타입 (Type)

#### 필수 타입
- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 수정
- **style**: 코드 포맷팅 (기능 변경 없음)
- **refactor**: 코드 리팩토링 (버그 수정 또는 기능 추가 없음)
- **test**: 테스트 추가/수정
- **chore**: 빌드, 설정 변경 (기능 변경 없음)

#### 선택 타입
- **perf**: 성능 개선
- **ci**: CI/CD 설정 변경
- **build**: 빌드 시스템 변경

### 3. 범위 (Scope)

#### 예시
- `auth`: 인증 관련
- `user`: 사용자 관리
- `dashboard`: 대시보드
- `api`: API 변경
- `ui`: UI 변경
- `db`: 데이터베이스 변경

#### 규칙
- 선택 사항 (필수 아님)
- 소문자로 작성
- 명확하고 간결하게

### 4. 제목 (Subject)

#### 규칙
- 첫 글자는 소문자
- 마침표(.) 사용 금지
- 명령형으로 작성 (예: "Add", "Fix", "Update")
- 50자 이내

#### 예시
```
feat(auth): add JWT token refresh functionality
fix(user): resolve null pointer exception in user service
docs(api): update API documentation for user endpoints
```

### 5. 본문 (Body)

#### 작성 시기
- 제목으로 설명이 부족한 경우
- 변경 이유를 설명해야 하는 경우
- Breaking Changes가 있는 경우

#### 형식
- 빈 줄로 제목과 구분
- 각 줄 72자 이내
- 무엇을, 왜 변경했는지 설명

#### 예시
```
feat(dashboard): add widget customization feature

- Add widget drag-and-drop functionality
- Implement widget configuration modal
- Store widget layout in database

This feature allows users to customize their dashboard
layout by dragging and dropping widgets.
```

### 6. 푸터 (Footer)

#### Breaking Changes
```
BREAKING CHANGE: description of breaking change
```

#### 이슈 참조
```
Closes #123
Fixes #456
Refs #789
```

### 7. 커밋 메시지 예시

#### 예시 1: 기능 추가
```
feat(dashboard): add widget system

- Create widget definitions table
- Implement widget rendering logic
- Add widget configuration API

Closes #123
```

#### 예시 2: 버그 수정
```
fix(auth): resolve session timeout issue

- Fix session expiration check logic
- Add proper error handling for expired sessions
- Update session refresh mechanism

Fixes #456
```

#### 예시 3: 문서 수정
```
docs(api): update API documentation

- Add authentication endpoints documentation
- Update response examples
- Fix typos in parameter descriptions
```

#### 예시 4: 리팩토링
```
refactor(user): improve user service structure

- Extract user validation logic to separate method
- Simplify user creation flow
- Remove duplicate code
```

#### 예시 5: Breaking Changes
```
feat(api): change user endpoint structure

BREAKING CHANGE: User endpoint URL changed from 
/api/users/{id} to /api/v1/users/{id}

- Update API versioning structure
- Migrate existing endpoints to v1
- Update client SDK accordingly
```

---

## 🔄 Pull Request 프로세스

### 1. PR 생성 전 체크리스트

- [ ] 로컬 테스트 통과
- [ ] 코드 스타일 검증 통과 (ESLint/Checkstyle)
- [ ] 하드코딩 검사 통과
- [ ] 커밋 메시지 규칙 준수
- [ ] 브랜치 최신화 (`develop` 브랜치와 동기화)

### 2. PR 제목 규칙

#### 형식
```
<type>(<scope>): <description>
```

#### 예시
```
feat(dashboard): Add widget customization feature
fix(auth): Resolve session timeout issue
docs(api): Update API documentation
```

### 3. PR 본문 템플릿

```markdown
## 변경 사항
- [ ] 기능 추가
- [ ] 버그 수정
- [ ] 리팩토링
- [ ] 문서화
- [ ] 성능 개선
- [ ] 기타: ________________

## 변경 내용 설명
<!-- 변경 사항을 자세히 설명해주세요 -->

## 테스트
- [ ] 단위 테스트 작성/수정
- [ ] 통합 테스트 작성/수정
- [ ] 수동 테스트 완료

## 코드 품질 검증
- [ ] ESLint/Checkstyle 통과
- [ ] 하드코딩 검사 통과
- [ ] 테스트 커버리지 유지
- [ ] 타입 검사 통과 (TypeScript)

## 체크리스트
- [ ] 상수 사용 확인 (하드코딩 없음)
- [ ] 에러 처리 확인
- [ ] 보안 검토 완료
- [ ] 성능 영향 검토 완료
- [ ] 문서 업데이트 완료

## 관련 이슈
- Closes #123
- Related to #456

## 스크린샷 (UI 변경 시)
<!-- UI 변경 사항이 있는 경우 스크린샷을 첨부해주세요 -->
```

### 4. PR 리뷰 프로세스

#### 리뷰 요청
1. PR 생성
2. 리뷰어 지정 (최소 1명)
3. 라벨 추가 (필요 시)

#### 리뷰 체크리스트
- [ ] 코드 스타일 준수
- [ ] 하드코딩 없음
- [ ] 테스트 작성/수정
- [ ] 에러 처리 적절함
- [ ] 보안 취약점 없음
- [ ] 성능 영향 검토
- [ ] 문서 업데이트 확인

#### 리뷰 피드백 처리
1. 리뷰 코멘트 확인
2. 필요한 변경사항 적용
3. 커밋 및 푸시
4. 리뷰어에게 알림

#### 승인 및 병합
1. 최소 1명 이상 승인
2. 모든 CI/CD 검증 통과
3. 충돌 해결 완료
4. 병합 실행

### 5. PR 병합 전략

#### Squash and Merge (권장)
- 여러 커밋을 하나로 합침
- 깔끔한 커밋 히스토리 유지
- PR 제목이 커밋 메시지로 사용

#### Merge Commit
- PR 브랜치의 모든 커밋 보존
- 상세한 히스토리 유지

#### Rebase and Merge
- 선형 히스토리 유지
- PR 브랜치의 커밋을 재배치

---

## 🚫 금지 사항

### 1. 커밋 메시지 금지 사항

```bash
# ❌ 금지: 모호한 메시지
git commit -m "fix bug"
git commit -m "update"
git commit -m "changes"

# ✅ 권장: 명확한 메시지
git commit -m "fix(auth): resolve session timeout issue"
git commit -m "feat(dashboard): add widget customization"
```

### 2. 브랜치 명명 금지 사항

```bash
# ❌ 금지: 잘못된 명명
feature/userAuth          # 대문자 사용
feature/user_auth         # 언더스코어 사용
fix/bug                   # 모호함
hotfix/수정                # 한글 사용

# ✅ 권장: 올바른 명명
feature/user-authentication
fix/login-error-handling
hotfix/critical-security-patch
```

### 3. 직접 푸시 금지

```bash
# ❌ 금지: main 브랜치에 직접 푸시
git checkout main
git push origin main

# ✅ 권장: Pull Request를 통한 병합
git checkout develop
git checkout -b feature/new-feature
# ... 작업 ...
git push origin feature/new-feature
# Pull Request 생성
```

### 4. 큰 커밋 금지

```bash
# ❌ 금지: 여러 변경사항을 한 커밋에 포함
git commit -m "feat: add multiple features and fix bugs"

# ✅ 권장: 논리적으로 분리된 커밋
git commit -m "feat(dashboard): add widget system"
git commit -m "fix(auth): resolve session timeout"
git commit -m "docs(api): update API documentation"
```

---

## ✅ 개발 워크플로우 체크리스트

### 기능 개발 시

#### 1. 브랜치 생성
- [ ] `develop` 브랜치 최신화 (`git pull origin develop`)
- [ ] 기능 브랜치 생성 (`git checkout -b feature/feature-name`)

#### 2. 개발
- [ ] 기능 구현
- [ ] 테스트 작성/수정
- [ ] 코드 스타일 검증
- [ ] 하드코딩 검사

#### 3. 커밋
- [ ] 변경사항 스테이징 (`git add .`)
- [ ] 커밋 메시지 규칙 준수
- [ ] 커밋 생성 (`git commit -m "..."`)

#### 4. 푸시 및 PR
- [ ] 브랜치 푸시 (`git push origin feature/feature-name`)
- [ ] Pull Request 생성
- [ ] 리뷰 요청

#### 5. 병합 후
- [ ] 브랜치 삭제 (로컬 및 원격)
- [ ] `develop` 브랜치 최신화

---

## 📞 문의

Git 워크플로우 표준 관련 문의:
- 개발 팀
- DevOps 팀

**최종 업데이트**: 2025-12-03

