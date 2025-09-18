# MindGarden 자동화 스크립트 가이드 🚀

## 개요

MindGarden 프로젝트의 개발 효율성을 극대화하기 위한 완전 자동화 스크립트 모음입니다.

## 🎯 주요 스크립트

### 🚀 **start-all.sh** - 통합 시작 스크립트
```bash
./scripts/start-all.sh [backend_profile] [frontend_mode]

# 예시
./scripts/start-all.sh local dev        # 로컬 개발 모드
./scripts/start-all.sh prod build       # 프로덕션 빌드 모드
```

**기능:**
- ✅ 모든 기존 프로세스 자동 종료
- ✅ 환경 및 의존성 자동 확인 (Java, Maven, Node.js)
- ✅ 백엔드 Maven 빌드 및 실행
- ✅ 프론트엔드 npm 설치 및 실행/빌드
- ✅ 헬스체크 및 상태 확인
- ✅ 상세한 진행 상황 표시

### 🛑 **stop-all.sh** - 통합 종료 및 정리 스크립트
```bash
./scripts/stop-all.sh
```

**기능:**
- ✅ 모든 백엔드/프론트엔드 프로세스 안전 종료
- ✅ 포트 8080, 3000 완전 정리
- ✅ 메모리 정리 및 최적화
- ✅ 임시 파일 및 캐시 정리
- ✅ 로그 파일 압축 보관
- ✅ 시스템 헬스체크

### 🔄 **restart-all.sh** - 통합 재시작 스크립트
```bash
./scripts/restart-all.sh [backend_profile] [frontend_mode]

# 예시
./scripts/restart-all.sh local dev      # 전체 재시작
```

**기능:**
- ✅ 안전한 전체 종료 → 시스템 안정화 대기 → 새로 시작

### 🔍 **health-check.sh** - 시스템 헬스체크
```bash
./scripts/health-check.sh
```

**기능:**
- ✅ 백엔드/프론트엔드 서버 상태 확인
- ✅ 응답 시간 측정
- ✅ 프로세스 및 포트 상태 확인
- ✅ 시스템 리소스 모니터링 (CPU, 메모리, 디스크)
- ✅ 로그 파일 에러 검사
- ✅ Git 상태 확인
- ✅ 전체 건강 점수 (0-100%) 제공

## 🎛️ 개별 컴포넌트 스크립트

### 백엔드 관리
```bash
./scripts/start-backend.sh [profile]    # 백엔드만 시작
./scripts/stop-backend.sh               # 백엔드만 종료
./scripts/restart-backend.sh [profile]  # 백엔드만 재시작
```

### 프론트엔드 관리
```bash
./scripts/start-frontend.sh [mode]      # 프론트엔드만 시작
./scripts/stop-frontend.sh              # 프론트엔드만 종료
```

## 🚦 사용 시나리오

### 1️⃣ 개발 시작
```bash
# 로컬 개발 환경으로 전체 시스템 시작
./scripts/start-all.sh local dev
```

### 2️⃣ 개발 중 문제 발생 시
```bash
# 시스템 상태 확인
./scripts/health-check.sh

# 문제가 있으면 전체 재시작
./scripts/restart-all.sh local dev
```

### 3️⃣ 프로덕션 빌드 테스트
```bash
# 프로덕션 모드로 빌드 및 테스트
./scripts/start-all.sh prod build
```

### 4️⃣ 개발 완료 후 정리
```bash
# 모든 프로세스 종료 및 메모리 정리
./scripts/stop-all.sh
```

### 5️⃣ 코드 변경 후 빠른 재시작
```bash
# 변경사항 적용을 위한 재시작
./scripts/restart-all.sh
```

## 📊 헬스체크 점수 기준

| 점수 | 상태 | 설명 |
|------|------|------|
| 80-100% | 🟢 매우 좋음 | 모든 시스템 정상 작동 |
| 60-79% | 🟡 양호 | 일부 개선 필요 |
| 0-59% | 🔴 주의 필요 | 시스템 점검 필요 |

## 🎨 스크립트 특징

### ✨ 사용자 친화적 인터페이스
- 🎨 컬러풀한 출력으로 상태를 한눈에 파악
- 📊 실시간 진행 상황 표시
- 💡 문제 발생 시 해결 방법 제시

### 🛡️ 안전한 프로세스 관리
- 🔄 Graceful shutdown (SIGTERM → SIGKILL)
- ⏱️ 적절한 대기 시간 제공
- 🔍 프로세스 상태 실시간 확인

### 🧹 스마트한 리소스 관리
- 🗑️ 자동 임시 파일 정리
- 💾 메모리 최적화
- 📦 로그 파일 자동 압축

### 🔍 종합적인 모니터링
- ⚡ 성능 지표 측정
- 📈 리소스 사용량 추적
- 🚨 에러 자동 감지

## 🔧 문제 해결

### Q: 스크립트 실행 권한 에러
```bash
chmod +x scripts/*.sh
```

### Q: 포트가 이미 사용 중
```bash
# 강제 정리
./scripts/stop-all.sh

# 특정 포트 확인
lsof -i:8080
lsof -i:3000
```

### Q: Java/Node.js 버전 문제
```bash
# 환경 확인
java -version
node --version
mvn -version
```

### Q: 메모리 부족
```bash
# 메모리 정리
./scripts/stop-all.sh
```

## 📝 로그 파일

모든 로그는 `logs/` 디렉토리에 저장됩니다:
- `backend.log` - 백엔드 애플리케이션 로그
- `frontend.log` - 프론트엔드 개발 서버 로그
- `frontend-install.log` - npm 설치 로그
- `frontend-build.log` - React 빌드 로그

## 🎯 팁 & 트릭

### 1. 빠른 개발 재시작
```bash
# 백엔드만 재시작 (프론트엔드는 그대로)
./scripts/restart-backend.sh local
```

### 2. 시스템 모니터링
```bash
# 주기적 헬스체크
watch -n 30 './scripts/health-check.sh'
```

### 3. 로그 모니터링
```bash
# 실시간 로그 확인
tail -f logs/backend.log

# 에러만 필터링
tail -f logs/backend.log | grep -i error
```

### 4. Git 워크플로우와 연동
```bash
# 코드 변경 후
git add .
git commit -m "feature: 새 기능 추가"
./scripts/restart-all.sh  # 변경사항 적용
```

## 🚀 CI/CD 연동

GitHub Actions와 함께 사용하면 더욱 강력한 자동화가 가능합니다:

1. **로컬 개발**: `./scripts/start-all.sh local dev`
2. **Git Push**: GitHub Actions 자동 배포
3. **운영 환경**: systemd service 자동 관리

---

💡 **개발 효율성을 극대화하세요!** 

이 스크립트들로 번거로운 수동 작업 없이 개발에만 집중할 수 있습니다. 🎉
