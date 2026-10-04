# GitHub Secrets 설정 가이드

## 자동 배포를 위한 GitHub Repository Secrets 설정

### 📋 설정 단계

1. **GitHub 웹사이트 접속**
   - https://github.com/[your-username]/mindGarden 이동
   - **Settings** 탭 클릭
   - 왼쪽 메뉴에서 **Secrets and variables** > **Actions** 클릭

2. **다음 3개의 Secret 등록**

### 🔑 Secret 1: PRODUCTION_HOST
- **Name**: `PRODUCTION_HOST`
- **Value**: `beta74.cafe24.com`

### 👤 Secret 2: PRODUCTION_USER  
- **Name**: `PRODUCTION_USER`
- **Value**: `root`

### 🔐 Secret 3: PRODUCTION_SSH_KEY
- **Name**: `PRODUCTION_SSH_KEY`
- **Value**: 아래 SSH 프라이빗 키 **전체 내용** (시작과 끝 라인 포함)

```
<개인키 전문은 문서에 기입 금지 — 로컬 ~/.ssh/<배포키> 내용을 GitHub Secret 에 직접 붙여넣기>
```

### ✅ 설정 완료 후

1. **설정 확인**
   - 3개의 Secrets가 모두 등록되었는지 확인
   - Secret 값에 앞뒤 공백이 없는지 확인

2. **자동 배포 테스트**
   ```bash
   # main 브랜치에 push하여 자동 배포 테스트
   git add .
   git commit -m "feat: GitHub Actions CI/CD 설정 완료"
   git push origin main
   ```

3. **배포 상태 확인**
   - GitHub > Actions 탭에서 워크플로우 실행 상태 확인
   - http://m-garden.co.kr 접속하여 배포 결과 확인

### 🚨 주의사항

- SSH 프라이빗 키는 **절대로** 코드에 포함하지 말고 반드시 GitHub Secrets에만 저장
- Secret 값 복사 시 줄바꿈과 공백을 정확히 유지
- `-----BEGIN OPENSSH PRIVATE KEY-----`와 `-----END OPENSSH PRIVATE KEY-----` 라인 포함

### 🔄 자동 배포 동작

설정 완료 후 다음과 같이 자동 배포됩니다:

1. `main` 브랜치에 push
2. GitHub Actions에서 자동으로 빌드 시작
3. Spring Boot JAR 파일 생성
4. React 프론트엔드 빌드
5. 운영 서버에 자동 배포
6. systemd service 재시작
7. 배포 완료!
