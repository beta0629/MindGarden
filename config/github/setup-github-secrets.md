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
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
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
