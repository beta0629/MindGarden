# GitHub Actions SSH 자동 배포 (참고·과거 안내)

> **현재 정책**: 개발·운영 서버 배포는 **SSH 수동**만 사용한다. `.github/workflows/deploy.yml`에는 **SSH 자동 배포 step이 없다** (린트·빌드만).  
> 수동 절차: `.cursor/skills/deploy-and-servers/SKILL.md` §6(개발), §8(운영).

아래 내용은 **과거에 CI에서 SSH 배포를 켤 때** 저장소 Secrets·Variables를 맞추는 참고용이다. 워크플로에 해당 step을 다시 넣을 때만 의미가 있다.

---

## (참고) 원래 의도했던 동작

`homepage/develop` 푸시 → Actions에서 **빌드 성공 후** SSH로 개발 서버에 접속해 `deploy-from-webhook.sh` 실행 → **`pm2 restart homepage-dev`** (과거 설계).

## 1. 로컬 SSH와의 관계

- 이 기능은 **GitHub Actions 클라우드 러너**가 서버로 SSH 접속하는 것이다.
- **개발자 PC의 `~/.ssh`·기존 키는 변경하지 않는다.**
- 서버에는 **배포 전용 공개키**를 하나 더 `authorized_keys`에 넣는 방식을 권장한다(기본 `id_ed25519`와 분리).

---

## 2. GitHub Repository secrets (이름을 정확히 맞출 것)

저장소 **Settings → Secrets and variables → Actions → Secrets** 에서 **New repository secret**.

| Secret 이름 | 넣을 값 | 예시 |
|-------------|---------|------|
| **`DEV_SSH_HOST`** | SSH 호스트 | `beta0629.cafe24.com` |
| **`DEV_SSH_USER`** | SSH 로그인 사용자 | `root` (또는 배포 전용 계정) |
| **`DEV_SSH_KEY`** | **개인키 전체** (PEM 한 덩어리) | 아래 형식 그대로 붙여넣기 |

### `DEV_SSH_KEY` 붙여넣기 형식

- **열어야 하는 파일**: `github-actions-homepage-deploy` (**확장자 없음**, `.pub` 아님).  
  `.pub` 파일은 공개키만 한 줄 들어 있고 **`BEGIN` 줄이 없다.**
- **첫 줄**이 바로 이 형태로 시작한다:  
  `-----BEGIN OPENSSH PRIVATE KEY-----`  
  마지막 줄은 `-----END OPENSSH PRIVATE KEY-----`.
- 그 **첫 줄부터 마지막 줄까지** **줄바꿈 포함 전부**를 `DEV_SSH_KEY`에 붙여넣는다.
- (다른 키라면) `-----BEGIN RSA PRIVATE KEY-----` … `-----END RSA PRIVATE KEY-----` 형식도 동일하게 **비밀키 파일 전체** 복사.
- 앞뒤에 따옴표나 공백 줄을 추가하지 말 것.

**비밀키는 절대 커밋·채팅에 올리지 말 것.** GitHub Secrets UI에만 붙여넣는다.

---

## 3. GitHub Repository variables

**Settings → Secrets and variables → Actions → Variables** 탭.

| Variable 이름 | 값 | 설명 |
|---------------|-----|------|
| **`HOMEPAGE_DEV_SSH_DEPLOY`** | `true` | SSH 배포 step 실행 조건(소문자 `true` 권장). `True`도 허용. |

### Variable 대신(또는 함께) Secret으로 켜기

저장소에 Variable이 **비어 있거나** Actions에서 인식되지 않으면(조직 정책 등), **Secrets**에 아래를 추가하면 SSH 배포가 켜진다.

| Secret 이름 | 값 |
|-------------|-----|
| **`DEV_SSH_AUTO_DEPLOY_ENABLE`** | `1` (숫자 1만) |

`HOMEPAGE_DEV_SSH_DEPLOY` Variable이 `true`이거나, 위 Secret이 `1`이면 **둘 중 하나만 만족해도** 배포 step이 실행된다. 끌 때는 Variable을 지우거나 Secret을 삭제한다.

### “Deploy to dev server” 가 skipped 인 경우

1. **Variables**에 `HOMEPAGE_DEV_SSH_DEPLOY`가 **이 저장소**(예: `beta0629/MindGarden`)에 있는지, 값이 `true` / `True` 인지 확인.  
2. 안 되면 **Secret** `DEV_SSH_AUTO_DEPLOY_ENABLE` = `1` 추가.  
3. `DEV_SSH_HOST` / `DEV_SSH_USER` / `DEV_SSH_KEY` 세 Secret이 같은 저장소에 있는지 확인.

---

## 4. 서버 측: 공개키 등록 (배포 전용 키 권장)

### `ssh-keygen`은 어디서 실행하나?

- **본인 PC(맥·리눅스 터미널, WSL 등)** 에서 실행한다.  
- **GitHub 웹이나 Actions 안에서는 실행하지 않는다.**  
- **개발 서버에 SSH로 들어가서 할 필요도 없다.** (키 파일만 만들고, 공개키 내용을 서버에 붙여 넣으면 된다.)

### 키 생성 예시 (PC에서, 레포 밖 임의 폴더에서 해도 됨)

```bash
ssh-keygen -t ed25519 -f ./github-actions-homepage-deploy -N "" -C "github-actions homepage develop"
```

**주의**: `ssh-keygen`이 끝난 뒤 터미널에 나오는 것은 **저장 위치·지문·randomart**뿐이다.  
`-----BEGIN OPENSSH PRIVATE KEY-----` 줄은 **터미널에 출력되지 않는다.** 반드시 비밀키 **파일**을 연다:

```bash
cat ./github-actions-homepage-deploy
```

첫 줄이 `-----BEGIN OPENSSH PRIVATE KEY-----`이면 정상이다.

- **`github-actions-homepage-deploy.pub`** 내용 한 줄을 서버 `~/.ssh/authorized_keys`에 추가.
- **`github-actions-homepage-deploy`** (비밀키) 내용 전체를 GitHub Secret **`DEV_SSH_KEY`**에 붙여넣기.
- 로컬 비밀키 파일은 안전한 곳에 보관하거나, Secrets 등록 후 삭제해도 됨(GitHub에만 있으면 Actions는 동작).
- 레포 루트에 키를 만들었다면 **커밋하지 말 것**. 프로젝트 `.gitignore`에 `github-actions-homepage-deploy` 패턴이 포함되어 있다.

서버에서:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAA...github-actions... 한줄전체' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

(사용자가 `DEV_SSH_USER`로 로그인할 때의 홈 디렉터리 기준.)

---

## 5. SSH 포트가 22가 아닐 때

`.github/workflows/deploy.yml`의 `appleboy/ssh-action` `with:` 블록에 한 줄 추가:

```yaml
          port: 2222
```

(실제 포트로 바꿈.) 기본은 생략 시 22.

---

## 6. 확인

1. Variable `HOMEPAGE_DEV_SSH_DEPLOY` = `true`
2. Secrets 세 개 등록
3. `homepage/develop`에 임시 커밋 푸시
4. **Actions** 탭에서 `Deploy Homepage` → `deploy-dev` job이 초록인지, **Deploy to dev server** step 성공 여부 확인
5. 서버: `cd /var/www/homepage && git log -1 --oneline`

---

## 7. 웹훅과 동시 사용

푸시 시 **웹훅(즉시 배포)** 과 **CI 후 SSH** 를 같이 켜면 빌드가 두 번 돌 수 있다. 보통 한쪽만 쓰거나, 팀에서 정책을 정한다.

---

## 8. 관련 파일

- `.github/workflows/deploy.yml` — `Deploy to dev server (SSH, after CI)` step
- `deploy-from-webhook.sh` → `scripts/deploy-from-webhook.sh` — 서버에서 실행되는 스크립트
