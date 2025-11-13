# MindGarden Ops Portal – Frontend

내부 운영 포털 프런트엔드. Next.js(App Router) + TypeScript 기반으로 구성되며, MindGarden Design System v2.0 Admin 확장을 사용합니다.

## 요구 사항
- Node.js 18 LTS 이상
- pnpm 또는 npm (사내 표준 패키지 매니저 사용)

## 빠른 시작
```bash
pnpm install
cp env.local.example .env.local  # 최초 1회 (환경변수 설정)
pnpm run dev:ops  # http://localhost:4300
```

운영 배포 시 `env.production.example`을 참조하여 `.env.production` 또는 호스팅 환경 변수에 등록하세요.
- 로컬 개발 시에는 `/auth/login` 화면에서 관리자 계정(환경변수 `OPS_ADMIN_*`)으로 로그인하면 JWT가 쿠키에 저장되어 API 요청이 가능합니다.
- Mock 데이터로만 확인하려면 `.env.local`에서 `NEXT_PUBLIC_OPS_API_USE_MOCK=true` 값을 사용하세요.

## 변경 후 필수 문법 검사
```bash
chmod +x ../config/shell-scripts/check-syntax.sh  # 최초 1회
chmod +x ../config/shell-scripts/check-hardcode.sh
../config/shell-scripts/check-syntax.sh
../config/shell-scripts/check-hardcode.sh
```
- backend: `./gradlew check`
- frontend: `npm run lint`
- 하드코딩/매직 넘버 점검: frontend-ops/src, backend-ops ops 모듈을 대상으로 검사 (ripgrep 설치 시 속도 향상)
- 실패 시 코드 수정 후 재실행하고, 성공까지 반복한 뒤에만 PR/커밋 진행

### 필수 환경 변수
`.env.local` 파일에 최소 아래 값을 설정해야 합니다.

```bash
NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:7080/api/v1
NEXT_PUBLIC_OPS_API_USE_MOCK=true # (선택, Mock 데이터 사용 시)
```

- 기본적으로 JWT/Actor 정보는 로그인 성공 시 쿠키(`ops_token`, `ops_actor_id`, `ops_actor_role`)에 저장됩니다.
- CI나 자동 테스트에서 직접 토큰을 주입하고 싶다면 `NEXT_PUBLIC_OPS_API_TOKEN`, `NEXT_PUBLIC_OPS_ACTOR_ID`, `NEXT_PUBLIC_OPS_ACTOR_ROLE`을 추가 정의할 수 있습니다.

## 보안 가이드
- 기본적으로 모든 페이지는 인증이 필요합니다 (`/auth/login`, `/api/auth/*` 예외)
- `middleware.ts`에서 쿠키(`ops_token`) 유무를 검사하여 미로그인 사용자는 로그인 페이지로 리다이렉트합니다.
- 토큰 만료 시 UI에서 401 응답을 감지하면 자동으로 로그인 화면으로 이동합니다.
- 보안 헤더는 `next.config.mjs`에서 전역 적용

## 스크립트
- `pnpm dev`: 개발 서버 시작 (`http://localhost:4300`)
- `pnpm build`: 프로덕션 빌드
- `pnpm start`: 프로덕션 서버 실행
- `pnpm lint`: ESLint 검사

## 배포 전략
- `output: standalone` 설정 적용 (Docker 이미지 경량화)
- GitHub Actions → ArgoCD 파이프라인으로 배포 예정

## TODO (Phase 1)
- Auth Guard, RBAC 기반 네비게이션
- API 연동 (`internal-api`) 및 React Query 캐시 전략
- Design System Admin 컴포넌트 도입
