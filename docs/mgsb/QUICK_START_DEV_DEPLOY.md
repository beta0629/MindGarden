# 개발 서버 배포 빠른 시작 가이드

작성일: 2025-01-XX

---

## 🚀 5분 안에 개발 서버 배포 설정하기

### Step 1: SSH 키 생성 및 개발 서버 등록 (2분)

```bash
# 스크립트 실행
./scripts/setup-dev-server-ssh.sh
```

또는 수동으로:

```bash
# 1. SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions-dev" -f ~/.ssh/github_actions_dev

# 2. 공개키를 개발 서버에 등록
ssh-copy-id -i ~/.ssh/github_actions_dev.pub root@beta0629.cafe24.com

# 3. 연결 테스트
ssh -i ~/.ssh/github_actions_dev root@beta0629.cafe24.com "echo 'SSH 연결 성공!'"
```

### Step 2: GitHub Secrets 등록 (2분)

1. **GitHub 저장소로 이동**
   - Settings > Secrets and variables > Actions

2. **개발 서버 Secrets 추가**

   | Secret Name | Value |
   |------------|-------|
   | `DEV_SERVER_HOST` | `beta0629.cafe24.com` |
   | `DEV_SERVER_USER` | `root` |
   | `DEV_SERVER_SSH_KEY` | 아래 명령어로 출력된 내용 전체 복사 |

```bash
# 개인키 내용 확인
cat ~/.ssh/github_actions_dev
```

**⚠️ 중요:** 출력된 전체 내용(-----BEGIN 부터 -----END 까지)을 복사하여 GitHub Secrets에 등록하세요.

### Step 3: 테스트 배포 (1분)

```bash
# develop 브랜치에 push
git checkout develop
git add .
git commit -m "test: 개발 서버 배포 테스트"
git push origin develop
```

**확인:**
- GitHub 저장소 > Actions 탭에서 배포 진행 상황 확인
- 배포 완료 후 개발 서버 접속하여 확인:
  ```bash
  ssh root@beta0629.cafe24.com
  sudo systemctl status mindgarden-dev.service
  curl http://localhost:8080/actuator/health
  ```

---

## ✅ 완료!

이제 `develop` 또는 `main` 브랜치에 push하면 자동으로 개발 서버에 배포됩니다!

---

## 📚 상세 가이드

- [CI/CD 워크플로우 가이드](./CI_CD_WORKFLOW.md)
- [GitHub 개발 서버 설정 가이드](./GITHUB_DEV_SERVER_SETUP.md)
- [개발 서버 설정 가이드](./DEV_SERVER_SETUP.md)


