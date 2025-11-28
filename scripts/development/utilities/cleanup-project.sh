#!/bin/bash

# 프로젝트 파일 정리 스크립트
# 사용법: ./scripts/cleanup-project.sh

echo "🧹 프로젝트 파일 정리 시작..."

# 1. 폴더 구조 생성
echo "📁 폴더 구조 생성 중..."
mkdir -p test-data/{cookies,scripts,branch-data,logs}
mkdir -p sql-scripts/{ddl,dml,migration}
mkdir -p config/{examples,github,shell-scripts}

# 2. 테스트 관련 파일 이동
echo "📦 테스트 파일 이동 중..."
mv *cookies*.txt *session*.txt test-data/cookies/ 2>/dev/null || true
mv test_*.sh *test*.sh security-test*.sh test-data/scripts/ 2>/dev/null || true
mv test_*.txt test_*.html test_*.sql test-data/scripts/ 2>/dev/null || true
mv *.log backend.log frontend.log test-data/logs/ 2>/dev/null || true
mv branch_codes.txt test-data/branch-data/ 2>/dev/null || true

# 3. SQL 스크립트 이동
echo "🗄️ SQL 스크립트 이동 중..."
mv create_*.sql sql-scripts/ddl/ 2>/dev/null || true
mv fix_*.sql sync_*.sql updated_*.sql local_*.sql sql-scripts/migration/ 2>/dev/null || true

# 4. 설정 파일 이동
echo "⚙️ 설정 파일 이동 중..."
mv env.example erp-config-example.properties config/examples/ 2>/dev/null || true
mv GITHUB_*.md setup-*.md config/github/ 2>/dev/null || true
mv *.sh config/shell-scripts/ 2>/dev/null || true

# 5. frontend 폴더 내 파일 정리
echo "🎨 frontend 폴더 정리 중..."
mv frontend/*cookies*.txt frontend/test_*.txt test-data/cookies/ 2>/dev/null || true

# 6. .gitignore 업데이트 (필요시)
echo "📝 .gitignore 확인 중..."
if ! grep -q "test-data/" .gitignore; then
    echo "" >> .gitignore
    echo "# Test data (organized)" >> .gitignore
    echo "test-data/" >> .gitignore
    echo "config/examples/" >> .gitignore
    echo "config/shell-scripts/" >> .gitignore
    echo "✅ .gitignore 업데이트 완료"
fi

# 7. 정리 결과 출력
echo ""
echo "✅ 파일 정리 완료!"
echo ""
echo "📊 정리 결과:"
echo "  - test-data/cookies/: $(find test-data/cookies -name "*.txt" 2>/dev/null | wc -l)개 파일"
echo "  - test-data/scripts/: $(find test-data/scripts -type f 2>/dev/null | wc -l)개 파일"
echo "  - sql-scripts/ddl/: $(find sql-scripts/ddl -name "*.sql" 2>/dev/null | wc -l)개 파일"
echo "  - sql-scripts/migration/: $(find sql-scripts/migration -name "*.sql" 2>/dev/null | wc -l)개 파일"
echo "  - config/examples/: $(find config/examples -type f 2>/dev/null | wc -l)개 파일"
echo "  - config/github/: $(find config/github -type f 2>/dev/null | wc -l)개 파일"
echo "  - config/shell-scripts/: $(find config/shell-scripts -type f 2>/dev/null | wc -l)개 파일"
echo ""
echo "🎉 프로젝트가 깔끔하게 정리되었습니다!"
