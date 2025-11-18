# Week 4 ERD 기능 빠른 테스트 가이드

## 🚀 서버 실행 방법

### 방법 1: 전체 서버 자동 실행 (권장)

```bash
# 백엔드 + 프론트엔드 모두 실행
./scripts/start-all.sh
```

또는 Windows:
```powershell
.\scripts\start-all.ps1
```

### 방법 2: 개별 실행

#### 백엔드 서버 실행
```bash
# 로컬 개발 모드 (Hot Reload 지원)
./scripts/start-backend.sh local

# 또는 직접 실행
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

#### 프론트엔드 서버 실행
```bash
cd frontend
npm install  # 최초 1회만
npm start
```

## 📋 테스트 전 확인사항

### 1. 데이터베이스 연결 확인
- 데이터베이스가 실행 중인지 확인
- `application-local.yml` 또는 환경 변수에 DB 설정이 올바른지 확인

### 2. 테넌트 데이터 확인
ERD 기능을 테스트하려면:
- 테넌트가 생성되어 있어야 함
- 온보딩 승인이 완료되어 ERD가 생성되어 있어야 함

### 3. 로그인 정보
- 테넌트 포털에 로그인할 수 있는 계정 필요
- 테스트 계정: `superadmin@mindgarden.com` / `admin123` (관리자)

## 🧪 테스트 시나리오

### 시나리오 1: ERD 목록 페이지 테스트

1. **서버 실행 확인**
   - 백엔드: http://localhost:8080
   - 프론트엔드: http://localhost:3000

2. **로그인**
   - http://localhost:3000 접속
   - 테넌트 포털에 로그인

3. **ERD 목록 페이지 접근**
   - URL: http://localhost:3000/tenant/erd
   - 또는 메뉴에서 "ERD" 선택

4. **확인 사항**
   - [ ] ERD 목록이 카드 형태로 표시되는가?
   - [ ] ERD 이름, 타입, 버전, 상태가 표시되는가?
   - [ ] 필터 버튼이 동작하는가?
   - [ ] ERD 카드 클릭 시 상세 페이지로 이동하는가?

### 시나리오 2: ERD 상세 페이지 테스트

1. **ERD 상세 페이지 접근**
   - ERD 목록에서 ERD 카드 클릭
   - 또는 URL: http://localhost:3000/tenant/erd/{diagramId}

2. **기본 기능 확인**
   - [ ] ERD 정보 헤더가 표시되는가?
   - [ ] 탭 전환 (다이어그램/변경 이력/텍스트 ERD)이 동작하는가?
   - [ ] Mermaid.js로 ERD가 렌더링되는가?

3. **인터랙티브 기능 확인**
   - [ ] 테이블 클릭 시 하이라이트되는가?
   - [ ] 관계선 클릭 시 하이라이트되는가?
   - [ ] 호버 효과가 동작하는가?
   - [ ] 선택 정보 패널이 표시되는가?

4. **확대/축소 기능 확인**
   - [ ] 확대 버튼 (+) 동작하는가?
   - [ ] 축소 버튼 (-) 동작하는가?
   - [ ] 확대/축소 레벨이 표시되는가?
   - [ ] 리셋 버튼 (⌂) 동작하는가?
   - [ ] 마우스 휠로 확대/축소가 동작하는가?

5. **팬 기능 확인**
   - [ ] 마우스 드래그로 다이어그램을 이동할 수 있는가?
   - [ ] 커서가 grab/grabbing으로 변경되는가?

6. **필터링 기능 확인**
   - [ ] 필터 토글 버튼이 동작하는가?
   - [ ] 테이블 이름 검색이 동작하는가?
   - [ ] "선택된 항목만 표시" 체크박스가 동작하는가?

### 시나리오 3: API 직접 테스트

#### 1. ERD 목록 조회 API
```bash
curl -X GET "http://localhost:8080/api/v1/tenants/{tenantId}/erd" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

#### 2. ERD 상세 조회 API
```bash
curl -X GET "http://localhost:8080/api/v1/tenants/{tenantId}/erd/{diagramId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

#### 3. ERD 변경 이력 조회 API
```bash
curl -X GET "http://localhost:8080/api/v1/tenants/{tenantId}/erd/{diagramId}/history" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

## 🔍 문제 해결

### 백엔드 서버가 시작되지 않는 경우

1. **포트 충돌 확인**
   ```bash
   lsof -i :8080
   # 또는
   netstat -an | grep 8080
   ```

2. **데이터베이스 연결 확인**
   - `application-local.yml` 파일의 DB 설정 확인
   - 데이터베이스가 실행 중인지 확인

3. **로그 확인**
   ```bash
   tail -f logs/backend.log
   ```

### 프론트엔드 서버가 시작되지 않는 경우

1. **포트 충돌 확인**
   ```bash
   lsof -i :3000
   ```

2. **의존성 설치 확인**
   ```bash
   cd frontend
   npm install
   ```

3. **로그 확인**
   - 터미널에서 직접 확인 가능

### ERD가 표시되지 않는 경우

1. **ERD 데이터 확인**
   - 데이터베이스에 ERD가 생성되어 있는지 확인
   - 온보딩 승인이 완료되었는지 확인

2. **브라우저 콘솔 확인**
   - F12로 개발자 도구 열기
   - Console 탭에서 오류 확인
   - Network 탭에서 API 호출 확인

3. **Mermaid.js 로드 확인**
   - Network 탭에서 mermaid 관련 리소스 로드 확인

## 📊 테스트 체크리스트

### 백엔드
- [ ] 서버가 정상적으로 시작되는가?
- [ ] API 엔드포인트가 응답하는가?
- [ ] 인증/권한 검증이 동작하는가?
- [ ] ERD 데이터가 조회되는가?

### 프론트엔드
- [ ] 페이지가 로드되는가?
- [ ] ERD 목록이 표시되는가?
- [ ] ERD 상세 페이지가 표시되는가?
- [ ] Mermaid.js 렌더링이 동작하는가?
- [ ] 인터랙티브 기능이 동작하는가?
- [ ] 확대/축소가 동작하는가?
- [ ] 필터링이 동작하는가?

## 🎯 빠른 테스트 명령어

### 백엔드 테스트 실행
```bash
# ERD 컨트롤러 테스트
mvn test -Dtest=ErdControllerIntegrationTest

# ERD 생성 서비스 테스트
mvn test -Dtest=ErdGenerationServiceIntegrationTest

# 모든 ERD 관련 테스트
mvn test -Dtest=*Erd*
```

### 서버 상태 확인
```bash
# 백엔드 헬스체크
curl http://localhost:8080/actuator/health

# 프론트엔드 확인
curl http://localhost:3000
```

## 📝 테스트 데이터 생성

ERD가 없는 경우, 테스트 데이터를 생성하려면:

1. **온보딩 승인 프로시저 실행**
   - 테넌트 온보딩 승인 시 자동으로 ERD가 생성됨

2. **수동 ERD 생성** (개발용)
   - `ErdGenerationService`를 사용하여 수동으로 ERD 생성 가능

## 🚨 주의사항

1. **데이터베이스 백업**
   - 테스트 전 데이터베이스 백업 권장

2. **환경 변수**
   - 로컬 개발 환경에서는 `application-local.yml` 사용
   - 프로덕션 환경에서는 환경 변수 사용

3. **포트 충돌**
   - 8080 (백엔드), 3000 (프론트엔드) 포트가 사용 가능한지 확인

## 📚 추가 문서

- 상세 테스트 가이드: `docs/mgsb/WEEK4_TESTING_GUIDE.md`
- API 문서: http://localhost:8080/swagger-ui.html (Swagger 설정 시)

