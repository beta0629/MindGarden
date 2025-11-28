# 🗂️ 폴더 재구성 실행 가이드

> **목적**: 중구난방인 프로젝트 구조를 깔끔하게 정리  
> **소요시간**: 10-15분  
> **안전성**: 자동 백업 포함

---

## 🚀 한 번에 실행하기

### **자동 재구성 (권장)**
```bash
# 프로젝트 루트에서 실행
cd /Users/mind/mindGarden

# 전체 재구성 실행
./scripts/reorganize-project.sh
```

**실행 결과:**
- ✅ 자동 백업 생성
- ✅ 180개 스크립트 → 카테고리별 분류
- ✅ 358개 문서 → 목적별 정리
- ✅ SQL 파일들 → 통합 관리
- ✅ 테스트 파일들 → 통합 폴더
- ✅ 환경 설정 → 체계적 분류

---

## 📂 재구성 전후 비교

### **Before (현재 - 복잡함)** 😰
```
scripts/
├── 180개 파일이 한 폴더에 무작위 배치
├── detect-hardcoded-colors.js
├── convert-hardcoded-colors.js  
├── deploy-to-production.sh
├── fix-all-paths.js
└── ... (176개 더)

docs/
├── mgsb/ (358개 파일)
├── CI_BI_DESIGN_STANDARDIZATION_GUIDE.md
├── QUICK_START_GUIDE.md
└── ... (산재된 문서들)

sql/, sql-scripts/, database/ (3곳 분산)
e2e-tests/, test-data/, test-reports/ (3곳 분산)
```

### **After (목표 - 깔끔함)** 😎
```
scripts/
├── design-system/
│   ├── color-management/           # CI/BI 도구들
│   │   ├── detect-hardcoded-colors.js
│   │   ├── convert-hardcoded-colors.js
│   │   └── create-unified-css-variables.js
│   └── widget-tools/               # 위젯 도구들
│       └── create-widget.js
├── automation/
│   └── deployment/                 # 배포 스크립트들
│       └── deploy-to-production.sh
└── development/
    └── utilities/                  # 개발 유틸리티들
        └── fix-all-paths.js

docs/
├── design-system/
│   └── ci-bi/                     # CI/BI 관련 문서들
│       ├── CI_BI_DESIGN_STANDARDIZATION_GUIDE.md
│       └── QUICK_START_GUIDE.md
├── guides/                        # 가이드 문서들
└── project-management/
    └── archive/                   # mgsb 파일들 (정리됨)

database/                          # 통합 데이터베이스 폴더
├── schema/                        # 스키마 정의
├── migrations/                    # 마이그레이션
└── procedures/                    # 저장 프로시저

tests/                            # 통합 테스트 폴더
├── e2e/                          # E2E 테스트
├── data/                         # 테스트 데이터
└── reports/                      # 테스트 리포트
```

---

## 🎯 재구성 후 혜택

### **개발 효율성**
- 🔍 **파일 찾기 시간 80% 단축**
- 📝 **새 스크립트 작성 시 위치 명확**
- 🗂️ **논리적 폴더 구조**

### **CI/BI 작업**
- 🎨 **색상 관리 도구**: `scripts/design-system/color-management/`
- 📚 **CI/BI 가이드**: `docs/design-system/ci-bi/`
- 🔧 **위젯 도구**: `scripts/design-system/widget-tools/`

### **협업 효율성**
- 👥 **팀원들이 파일 쉽게 찾기**
- 📖 **명확한 문서 구조**
- 🎯 **목적별 폴더 분리**

---

## 🔍 새로운 파일 위치

### **자주 사용하는 스크립트들**
```bash
# CI/BI 색상 탐지
./scripts/design-system/color-management/detect-hardcoded-colors.js

# CI/BI 색상 변환
./scripts/design-system/color-management/convert-hardcoded-colors.js

# 통합 CSS 변수 생성
./scripts/design-system/color-management/create-unified-css-variables.js

# 위젯 생성
./scripts/design-system/widget-tools/create-widget.js

# 배포
./scripts/automation/deployment/deploy-to-production.sh

# 테스트 실행
./scripts/development/testing/run-all-tests.sh
```

### **자주 찾는 문서들**
```bash
# CI/BI 빠른 시작 가이드
docs/design-system/ci-bi/QUICK_START_GUIDE.md

# CI/BI 완전 가이드
docs/design-system/ci-bi/CI_BI_DESIGN_STANDARDIZATION_GUIDE.md

# 개발 가이드들
docs/guides/development/

# 프로젝트 구조
PROJECT_STRUCTURE.md
```

---

## ⚠️ 주의사항

### **안전장치**
- ✅ **자동 백업**: `mindgarden-backup-YYYYMMDD-HHMMSS.tar.gz` 생성
- ✅ **기존 폴더 보존**: `*-old/` 폴더로 백업
- ✅ **단계별 실행**: 에러 발생 시 중단

### **실행 전 확인사항**
- [ ] 현재 작업 중인 파일들 저장 완료
- [ ] Git 커밋 완료 (권장)
- [ ] 충분한 디스크 공간 확보

### **실행 후 확인사항**
- [ ] `PROJECT_STRUCTURE.md` 파일 확인
- [ ] 주요 스크립트 실행 테스트
- [ ] 문서 링크 정상 동작 확인

---

## 🆘 문제 해결

### **실행 권한 오류**
```bash
chmod +x /Users/mind/mindGarden/scripts/reorganize-project.sh
```

### **백업에서 복원**
```bash
# 전체 복원
tar -xzf mindgarden-backup-YYYYMMDD-HHMMSS.tar.gz

# 특정 폴더만 복원
cp -r scripts-old scripts
cp -r docs-old docs
```

### **부분 롤백**
```bash
# 스크립트만 롤백
rm -rf scripts && mv scripts-old scripts

# 문서만 롤백  
rm -rf docs && mv docs-old docs
```

---

## 📋 체크리스트

### **실행 전**
- [ ] 현재 작업 저장 완료
- [ ] Git 상태 확인
- [ ] 디스크 공간 확인

### **실행 중**
- [ ] 백업 생성 확인
- [ ] 각 Phase 완료 메시지 확인
- [ ] 에러 메시지 없음 확인

### **실행 후**
- [ ] `PROJECT_STRUCTURE.md` 생성 확인
- [ ] 주요 스크립트 경로 확인
- [ ] 문서 구조 확인
- [ ] 기존 기능 정상 동작 확인

---

## 🎉 완료 후

### **새로운 사용법**
```bash
# CI/BI 작업 시작
./scripts/design-system/color-management/detect-hardcoded-colors.js

# 가이드 문서 확인
cat docs/design-system/ci-bi/QUICK_START_GUIDE.md

# 프로젝트 구조 확인
cat PROJECT_STRUCTURE.md
```

### **팀원들에게 공유**
- 📢 새로운 폴더 구조 안내
- 📚 `PROJECT_STRUCTURE.md` 파일 공유
- 🔄 자주 사용하는 경로 업데이트

---

**💡 이제 프로젝트가 훨씬 깔끔하고 찾기 쉬워집니다!**

**🚀 지금 바로 실행해보세요:**
```bash
./scripts/reorganize-project.sh
```

---

**📝 작성일**: 2025-11-28  
**⏰ 소요시간**: 10-15분  
**📊 상태**: 바로 실행 가능 ✅
