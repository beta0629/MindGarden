# MindGarden 문서 구조 가이드

**작성일**: 2025년 10월 14일  
**버전**: 2.0  
**목적**: 프로젝트 문서 구조 및 관리 가이드

---

## 📋 개요

2025년 10월 14일부터 MindGarden 프로젝트의 모든 문서는 새로운 구조로 재편되었습니다.  
이전 문서들은 `archive/legacy-docs-backup-2025-10-14/` 폴더에 백업되어 있습니다.

---

## 📂 현재 문서 구조

```
docs/
│
├── README.md                           # 📚 문서 인덱스 (시작점)
├── DOCUMENT_STRUCTURE_GUIDE.md         # 이 파일
│
├── 🎨 디자인 시스템 (최우선 참고)
│   ├── MINDGARDEN_DESIGN_SYSTEM_GUIDE.md      ⭐ 디자인 가이드
│   └── DESIGN_SYSTEM_ARCHITECTURE.md          ⭐ 디자인 아키텍처
│
├── 📖 주요 폴더
│   ├── setup/                          # 환경 설정
│   │   ├── ENVIRONMENT_SETUP.md
│   │   └── PROJECT_STRUCTURE.md
│   │
│   ├── development/                    # 개발 가이드
│   │   ├── DEVELOPMENT_GUIDE.md
│   │   ├── CODING_STANDARDS.md
│   │   └── COMPONENT_STRUCTURE.md
│   │
│   ├── architecture/                   # 시스템 아키텍처
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   └── DATABASE_SCHEMA.md
│   │
│   ├── features/                       # 기능 명세
│   │   ├── ADMIN_FEATURES.md
│   │   ├── CONSULTANT_FEATURES.md
│   │   └── CLIENT_FEATURES.md
│   │
│   ├── api/                           # API 문서
│   │   ├── API_REFERENCE.md
│   │   └── REST_API.md
│   │
│   ├── security/                      # 보안
│   │   └── SECURITY_GUIDE.md
│   │
│   ├── deployment/                    # 배포
│   │   └── DEPLOYMENT_GUIDE.md
│   │
│   ├── testing/                       # 테스트
│   │   └── TESTING_GUIDE.md
│   │
│   └── maintenance/                   # 유지보수
│       └── MAINTENANCE_GUIDE.md
│
└── 🗄️ archive/                        # 아카이브
    ├── design-backup-2025-10-14/      # 이전 디자인 문서
    └── legacy-docs-backup-2025-10-14/ # 이전 레거시 문서
```

---

## 🎯 문서 카테고리별 목적

### 🎨 디자인 시스템 (Design System)

**최우선 참고 문서**

- **MINDGARDEN_DESIGN_SYSTEM_GUIDE.md**: 18개 컴포넌트 사용법, 색상, 타이포그래피, 레이아웃
- **DESIGN_SYSTEM_ARCHITECTURE.md**: CSS 아키텍처, 컴포넌트 패턴, 테마 시스템

**언제 참고하나요?**
- ✅ 새 페이지/컴포넌트 디자인 시
- ✅ CSS 클래스 사용 시
- ✅ 대시보드 레이아웃 작업 시
- ✅ 반응형 디자인 구현 시

---

### 📖 setup/ - 환경 설정

**누가 읽나요?**: 신규 개발자, DevOps 엔지니어

**포함 문서**:
- `ENVIRONMENT_SETUP.md`: 개발 환경 설정 (Node.js, Java, Maven, MySQL 등)
- `PROJECT_STRUCTURE.md`: 프로젝트 디렉토리 구조 설명

**언제 참고하나요?**
- ✅ 처음 프로젝트를 시작할 때
- ✅ 새로운 팀원 온보딩 시
- ✅ 개발 환경 문제 발생 시

---

### 💻 development/ - 개발 가이드

**누가 읽나요?**: 모든 개발자

**포함 문서**:
- `DEVELOPMENT_GUIDE.md`: 전반적인 개발 워크플로우
- `CODING_STANDARDS.md`: 코딩 컨벤션 및 표준
- `COMPONENT_STRUCTURE.md`: 컴포넌트 구조 가이드
- `REACT_GUIDE.md`: React 개발 가이드
- `BACKEND_GUIDE.md`: Spring Boot 백엔드 가이드

**언제 참고하나요?**
- ✅ 코드 작성 전
- ✅ 코드 리뷰 시
- ✅ 새 기능 개발 시

---

### 🏗️ architecture/ - 시스템 아키텍처

**누가 읽나요?**: 시니어 개발자, 아키텍트, 기술 리드

**포함 문서**:
- `SYSTEM_ARCHITECTURE.md`: 전체 시스템 설계
- `DATABASE_SCHEMA.md`: 데이터베이스 스키마
- `AUTH_SYSTEM.md`: 인증/권한 시스템

**언제 참고하나요?**
- ✅ 새 기능의 아키텍처 설계 시
- ✅ 시스템 이해가 필요할 때
- ✅ 기술 스택 결정 시

---

### 🎯 features/ - 기능 명세

**누가 읽나요?**: 개발자, PM, QA

**포함 문서**:
- `ADMIN_FEATURES.md`: 관리자 기능 명세
- `CONSULTANT_FEATURES.md`: 상담사 기능 명세
- `CLIENT_FEATURES.md`: 내담자 기능 명세
- `CONSULTATION_MANAGEMENT.md`: 상담 관리 기능
- `SCHEDULE_MANAGEMENT.md`: 일정 관리 기능

**언제 참고하나요?**
- ✅ 새 기능 개발 시
- ✅ 기능 테스트 시
- ✅ 요구사항 확인 시

---

### 📊 api/ - API 문서

**누가 읽나요?**: 프론트엔드/백엔드 개발자

**포함 문서**:
- `API_REFERENCE.md`: API 레퍼런스
- `REST_API.md`: REST API 명세
- `ERROR_CODES.md`: 에러 코드 목록
- `EXAMPLES.md`: API 사용 예시

**언제 참고하나요?**
- ✅ API 개발 시
- ✅ API 호출 시
- ✅ 에러 처리 시

---

### 🔐 security/ - 보안

**누가 읽나요?**: 모든 개발자, 보안 담당자

**포함 문서**:
- `SECURITY_GUIDE.md`: 보안 가이드
- `AUTHENTICATION.md`: 인증 시스템
- `AUTHORIZATION.md`: 권한 관리

**언제 참고하나요?**
- ✅ 인증/권한 기능 개발 시
- ✅ 보안 이슈 발생 시
- ✅ 보안 감사 시

---

### 🚢 deployment/ - 배포

**누가 읽나요?**: DevOps 엔지니어, 시니어 개발자

**포함 문서**:
- `DEPLOYMENT_GUIDE.md`: 배포 가이드
- `CI_CD.md`: CI/CD 파이프라인
- `ENVIRONMENT_VARIABLES.md`: 환경 변수

**언제 참고하나요?**
- ✅ 배포 전
- ✅ CI/CD 설정 시
- ✅ 환경 설정 시

---

### 🧪 testing/ - 테스트

**누가 읽나요?**: 개발자, QA

**포함 문서**:
- `TESTING_GUIDE.md`: 테스트 가이드
- `UNIT_TESTS.md`: 단위 테스트
- `INTEGRATION_TESTS.md`: 통합 테스트

**언제 참고하나요?**
- ✅ 테스트 코드 작성 시
- ✅ 테스트 전략 수립 시

---

### 🔧 maintenance/ - 유지보수

**누가 읽나요?**: DevOps, 시스템 관리자

**포함 문서**:
- `MAINTENANCE_GUIDE.md`: 유지보수 가이드
- `BACKUP.md`: 백업 전략
- `LOGGING.md`: 로깅 가이드

**언제 참고하나요?**
- ✅ 시스템 유지보수 시
- ✅ 백업 복구 시
- ✅ 로그 분석 시

---

## 📝 문서 작성 규칙

### 파일명 규칙

```
UPPERCASE_WITH_UNDERSCORES.md
예: DESIGN_SYSTEM_GUIDE.md, API_REFERENCE.md
```

### 문서 헤더

모든 문서는 다음 헤더를 포함해야 합니다:

```markdown
# 문서 제목

**작성일**: YYYY년 MM월 DD일  
**버전**: X.X  
**작성자**: 작성자명 (선택)

---

## 📋 목차

...
```

### 섹션 구조

```markdown
## 섹션 제목

### 하위 섹션

내용...

#### 세부 항목

- 목록 항목 1
- 목록 항목 2
```

### 코드 블록

````markdown
```javascript
// 코드 예시
const example = "hello";
```
````

---

## 🔍 문서 검색 가이드

### 주제별 빠른 찾기

| 찾고 싶은 내용 | 문서 위치 |
|--------------|----------|
| 디자인 작업 | `MINDGARDEN_DESIGN_SYSTEM_GUIDE.md` |
| 프로젝트 구조 | `setup/PROJECT_STRUCTURE.md` |
| 코딩 규칙 | `development/CODING_STANDARDS.md` |
| API 명세 | `api/API_REFERENCE.md` |
| 배포 방법 | `deployment/DEPLOYMENT_GUIDE.md` |
| 보안 정책 | `security/SECURITY_GUIDE.md` |

### 역할별 필수 문서

**신규 개발자**
1. `README.md`
2. `setup/ENVIRONMENT_SETUP.md`
3. `setup/PROJECT_STRUCTURE.md`
4. `development/DEVELOPMENT_GUIDE.md`
5. `MINDGARDEN_DESIGN_SYSTEM_GUIDE.md`

**프론트엔드 개발자**
1. `MINDGARDEN_DESIGN_SYSTEM_GUIDE.md`
2. `DESIGN_SYSTEM_ARCHITECTURE.md`
3. `development/REACT_GUIDE.md`
4. `api/API_REFERENCE.md`

**백엔드 개발자**
1. `development/BACKEND_GUIDE.md`
2. `api/API_DESIGN.md`
3. `architecture/DATABASE_SCHEMA.md`
4. `security/SECURITY_GUIDE.md`

**DevOps**
1. `deployment/DEPLOYMENT_GUIDE.md`
2. `deployment/CI_CD.md`
3. `maintenance/MAINTENANCE_GUIDE.md`

---

## 📦 백업 정책

### 자동 백업

- **위치**: `docs/archive/`
- **주기**: 주요 변경 시
- **네이밍**: `[category]-backup-YYYY-MM-DD/`

### 수동 백업

대규모 문서 재구조화 전에 수동 백업:

```bash
cd /Users/mind/mindGarden/docs
mkdir -p archive/manual-backup-$(date +%Y-%m-%d)
cp -r *.md archive/manual-backup-$(date +%Y-%m-%d)/
```

---

## 🔄 문서 업데이트 가이드

### 기존 문서 수정

1. 문서 상단의 **최종 업데이트** 날짜 변경
2. 변경 내용을 `CHANGELOG.md`에 기록
3. 필요 시 **버전** 업데이트 (Major.Minor 형식)

### 새 문서 추가

1. 적절한 카테고리 폴더에 추가
2. `README.md`의 목차에 링크 추가
3. 헤더 정보 포함 (작성일, 버전 등)

### 문서 삭제

1. 삭제 전 `archive/` 폴더로 이동
2. `README.md`에서 링크 제거
3. 삭제 이유를 `CHANGELOG.md`에 기록

---

## ⚠️ 주의사항

### 절대 삭제하지 말 것

- `MINDGARDEN_DESIGN_SYSTEM_GUIDE.md`
- `DESIGN_SYSTEM_ARCHITECTURE.md`
- `README.md`
- `archive/` 폴더

### 수정 시 주의

- 여러 문서에서 참조되는 문서 수정 시 링크 확인
- 코드 예시는 실제 동작하는 코드 사용
- 스크린샷은 최신 상태 유지

---

## 📌 2025-10-14 문서 재구조화 내역

### 백업된 문서

**위치**: `docs/archive/legacy-docs-backup-2025-10-14/`

**포함 내용**:
- 2025년 10월 14일 이전의 모든 문서 (50+ 파일)
- 디자인 관련 구버전 문서
- 시스템 분석 문서
- 각종 플랜 및 가이드 문서

### 새로 생성된 문서

1. `README.md` - 문서 인덱스
2. `MINDGARDEN_DESIGN_SYSTEM_GUIDE.md` - 디자인 가이드
3. `DESIGN_SYSTEM_ARCHITECTURE.md` - 디자인 아키텍처
4. `DOCUMENT_STRUCTURE_GUIDE.md` - 이 문서
5. `setup/PROJECT_STRUCTURE.md` - 프로젝트 구조

### 재구조화 이유

- ✅ 디자인 시스템 2.0 출시
- ✅ 문서 구조 명확화
- ✅ 역할별 문서 분류
- ✅ 검색 및 유지보수 용이성 향상

---

## 📞 문의

문서 관련 질문이나 제안사항:
- **개발팀**: development@mindgarden.com
- **문서 담당자**: docs@mindgarden.com

---

**문서 버전**: 1.0  
**마지막 업데이트**: 2025년 10월 14일

