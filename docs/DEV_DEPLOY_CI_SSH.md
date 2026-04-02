# CI SSH 자동 배포 (현재 미사용)

**상태**: 저장소 `.github/workflows/deploy.yml`에서 **GitHub Actions → SSH 배포 단계는 제거**되었다.  
개발 반영은 **SSH 수동 배포**(`deploy-and-servers` 스킬) 또는 **서버 웹훅**을 사용한다.

## 로컬 SSH에 대한 원칙

- 본 홈페이지 레포·CI 설정은 **개발자 PC의 `~/.ssh`**, **기존 `config` / 키 파일을 덮어쓰거나 수정하지 않는다.**
- 배포용 키를 따로 쓰려면 **별도 경로**에 생성하고 `ssh -i /path/to/key …` 또는 `~/.ssh/config`의 **호스트별 블록**만 추가하는 방식으로, 기본 `id_rsa` / `id_ed25519` 등과 분리하는 것을 권장한다.

## 과거 참고 (복구 시만)

CI에서 `appleboy/ssh-action`으로 서버에 `deploy-from-webhook.sh`를 돌리려면 워크플로에 해당 step을 다시 넣고, GitHub Variables/Secrets를 맞추면 된다. 운영 정책과 보안 검토 후 결정할 것.
