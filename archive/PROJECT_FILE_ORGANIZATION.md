# 프로젝트 파일 정리 가이드

## 📁 폴더 구조 표준

### 1. 루트 디렉토리 정리 원칙

루트 디렉토리는 **핵심 프로젝트 파일들만** 유지하고, 나머지는 적절한 폴더로 분류합니다.

#### ✅ 루트에 유지할 파일들
- `pom.xml`, `package.json` - 프로젝트 설정 파일
- `src/` - 소스 코드
- `frontend/` - 프론트엔드 소스 코드
- `docs/` - 프로젝트 문서
- `scripts/` - 프로젝트 실행 스크립트
- `deployment/` - 배포 관련 파일
- `backup/` - 백업 파일

#### ❌ 루트에서 제거할 파일들
- 테스트 관련 파일들
- 임시 쿠키/세션 파일들
- SQL 스크립트들
- 설정 예시 파일들
- 로그 파일들

### 2. 폴더별 분류 기준

#### 📂 `test-data/` - 테스트 관련 파일
```
test-data/
├── cookies/           # 쿠키 파일들 (*cookies*.txt, *session*.txt)
├── scripts/           # 테스트 스크립트들 (test_*.sh, *test*.sh)
├── branch-data/       # 브랜치 관련 데이터 (branch_codes.txt)
└── logs/             # 로그 파일들 (*.log)
```

**이동 대상:**
- `*cookies*.txt`, `*session*.txt` → `test-data/cookies/`
- `test_*.sh`, `*test*.sh`, `security-test*.sh` → `test-data/scripts/`
- `test_*.txt`, `test_*.html`, `test_*.sql` → `test-data/scripts/`
- `*.log`, `backend.log`, `frontend.log` → `test-data/logs/`
- `branch_codes.txt` → `test-data/branch-data/`

#### 📂 `sql-scripts/` - SQL 스크립트
```
sql-scripts/
├── ddl/              # 테이블 생성 스크립트 (create_*.sql)
├── dml/              # 데이터 조작 스크립트
└── migration/        # 데이터 마이그레이션 (fix_*.sql, sync_*.sql)
```

**이동 대상:**
- `create_*.sql` → `sql-scripts/ddl/`
- `fix_*.sql`, `sync_*.sql`, `updated_*.sql`, `local_*.sql` → `sql-scripts/migration/`

#### 📂 `config/` - 설정 관련 파일
```
config/
├── examples/         # 예시 설정 파일들
├── github/           # GitHub 관련 설정
└── shell-scripts/    # 쉘 스크립트들
```

**이동 대상:**
- `*.example`, `*config*.properties` → `config/examples/`
- `GITHUB_*.md`, `setup-*.md` → `config/github/`
- `*.sh` (일반 쉘 스크립트) → `config/shell-scripts/`

### 3. .gitignore 업데이트

정리된 폴더들을 .gitignore에 추가하여 버전 관리에서 제외:

```gitignore
# Test data (organized)
test-data/
config/examples/
config/shell-scripts/
```

### 4. 정리 스크립트

#### 자동 정리 명령어
```bash
# 1. 폴더 구조 생성
mkdir -p test-data/{cookies,scripts,branch-data,logs}
mkdir -p sql-scripts/{ddl,dml,migration}
mkdir -p config/{examples,github,shell-scripts}

# 2. 파일 이동
mv *cookies*.txt *session*.txt test-data/cookies/ 2>/dev/null || true
mv test_*.sh *test*.sh security-test*.sh test-data/scripts/ 2>/dev/null || true
mv test_*.txt test_*.html test_*.sql test-data/scripts/ 2>/dev/null || true
mv *.log backend.log frontend.log test-data/logs/ 2>/dev/null || true
mv create_*.sql sql-scripts/ddl/ 2>/dev/null || true
mv fix_*.sql sync_*.sql updated_*.sql local_*.sql sql-scripts/migration/ 2>/dev/null || true
mv env.example erp-config-example.properties config/examples/ 2>/dev/null || true
mv GITHUB_*.md setup-*.md config/github/ 2>/dev/null || true
mv *.sh config/shell-scripts/ 2>/dev/null || true
mv branch_codes.txt test-data/branch-data/ 2>/dev/null || true
```

### 5. 정리 체크리스트

#### 정기 정리 시 확인사항
- [ ] 루트 디렉토리에 테스트 파일이 있는가?
- [ ] 쿠키/세션 파일들이 `test-data/cookies/`에 있는가?
- [ ] SQL 스크립트들이 적절한 폴더에 분류되어 있는가?
- [ ] 설정 파일들이 `config/` 폴더에 있는가?
- [ ] 로그 파일들이 `test-data/logs/`에 있는가?
- [ ] .gitignore가 업데이트되었는가?

#### 금지사항
- ❌ 루트에 임시 파일 생성 금지
- ❌ 테스트 파일을 소스 코드와 함께 두지 않기
- ❌ 설정 파일을 버전 관리에 포함하지 않기
- ❌ 로그 파일을 프로젝트 루트에 두지 않기

### 6. 예외사항

#### 유지해야 할 루트 파일들
- `.gitignore` - Git 설정
- `README.md` - 프로젝트 설명
- `.deploy-trigger` - 배포 트리거 파일
- `.firewall-*` - 방화벽 테스트 파일 (임시)

#### 특별 처리 파일들
- `frontend/` 내 쿠키 파일들도 `test-data/cookies/`로 이동
- `deployment/` 폴더는 배포 관련 파일이므로 유지
- `scripts/` 폴더는 프로젝트 실행 스크립트이므로 유지

### 7. 정리 효과

#### Before (정리 전)
```
mindGarden/
├── admin_cookies.txt
├── test_session.txt
├── create_branch_accounts.sql
├── env.example
├── backend.log
├── security-test.sh
├── ... (50+ 개의 산재된 파일들)
├── src/
└── frontend/
```

#### After (정리 후)
```
mindGarden/
├── test-data/
│   ├── cookies/ (34개 파일)
│   ├── scripts/ (12개 파일)
│   └── logs/ (로그 파일들)
├── sql-scripts/
│   ├── ddl/ (4개 파일)
│   └── migration/ (5개 파일)
├── config/
│   ├── examples/ (2개 파일)
│   ├── github/ (2개 파일)
│   └── shell-scripts/ (4개 파일)
├── src/
├── frontend/
├── docs/
├── scripts/
└── deployment/
```

### 8. 유지보수 가이드

#### 새로운 파일 추가 시
1. **테스트 파일**: `test-data/` 하위 적절한 폴더에 저장
2. **SQL 스크립트**: `sql-scripts/` 하위 적절한 폴더에 저장
3. **설정 파일**: `config/` 하위 적절한 폴더에 저장
4. **문서**: `docs/` 폴더에 저장

#### 정기 정리 주기
- **주간**: 테스트 파일 정리
- **월간**: 전체 폴더 구조 점검
- **배포 전**: 루트 디렉토리 정리 확인

---

**📝 참고**: 이 가이드는 프로젝트의 가독성과 유지보수성을 높이기 위한 표준입니다. 모든 팀원이 이 가이드를 따라 일관된 파일 구조를 유지해야 합니다.
