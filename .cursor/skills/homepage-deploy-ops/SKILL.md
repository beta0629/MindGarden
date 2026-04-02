# 마인드가든 홈페이지 — 배포·운영·개발 (Deploy & Ops)

## 사용 시기
- **개발 서버** 반영: `homepage/develop` 푸시 → (설정 시) **Actions CI 후 SSH 자동 배포** 또는 웹훅·SSH 수동 (`docs/DEV_DEPLOY_CI_SSH.md`)
- 웹훅·포트·시크릿 **점검**
- 배포 후 **검증**까지 한 번에 요청받을 때

## 필수 참조 (이 순서)
1. **배포 절차·호스트·PM2**: `.cursor/skills/deploy-and-servers/SKILL.md`
2. **자동 배포 실패 시**: `docs/AUTO_DEPLOY_TROUBLESHOOTING.md` (있을 경우)
3. **배포/머지 후 UI 정책 검증**: `.cursor/skills/verify-changes/SKILL.md` + `./scripts/verify-ui-changes.sh`

## 빠른 수동 배포 (SSH)
```bash
ssh beta0629.cafe24.com
cd /var/www/homepage
bash deploy-from-webhook.sh
```
(레포에 스크립트가 없으면 기존처럼 `git fetch` / `reset` / `npm ci` / `build` / `pm2 restart homepage-dev` 순서로 동일.)

## 정책
- GNB/문의: `.cursor/skills/gnb-inquiry-bottom-sheet/SKILL.md`
- 커밋 메시지는 **문장형**, 관련 변경만 포함

## 보안
- 시크릿·`.env` 내용을 채팅/로그에 붙여넣지 않음
