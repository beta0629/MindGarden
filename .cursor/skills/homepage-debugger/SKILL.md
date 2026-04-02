# 마인드가든 홈페이지 — 디버거 (Debugger)

## 사용 시기
- 런타임 오류, **빌드 실패**, API 4xx/5xx, hydration mismatch
- 배포 후 **동작 불일치** (캐시·PM2·구버전 프로세스)

## 절차
1. **재현 조건** 확보 (URL, 브랜치, 환경: 로컬/개발서버)
2. **로그·스택** 수집: 브라우저 콘솔, `pm2 logs homepage-dev`, `npm run build` 출력
3. **원인 가설 → 최소 수정**으로 검증; 광범위 리팩터 금지
4. Next.js 14: `dynamic`, `revalidate`, Edge, cookies 사용 시 **정적 생성 제한** 메시지 확인

## 자주 나오는 이슈
- **RSC / digest 오류**: 서버→클라이언트 전달 데이터 직렬화, 이벤트 핸들러 위치
- **DB**: `ER_ACCESS_DENIED`, 연결 풀, 환경별 호스트 허용
- **react-quill**: `DOMNodeInserted` deprecation은 **라이브러리 한계** (경고일 뿐 기능 오류 아님일 수 있음)

## 배포 불일치
- 서버 커밋: `git log -1` (SSH 후 `/var/www/homepage`)
- 웹훅 미동작: `docs/AUTO_DEPLOY_TROUBLESHOOTING.md`, `.cursor/skills/deploy-and-servers/SKILL.md`

## 검증
- 수정 후 `./scripts/verify-ui-changes.sh` (UI 정책 관련 시)
