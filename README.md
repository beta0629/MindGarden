# 마인드가든심리상담센터 공개 홈페이지

Next.js 16 + Cloudflare Workers(OpenNext) 대상의 공개 마케팅 사이트입니다.  
Clinic-OS 공개 API를 읽기 전용으로 사용하며, 홈페이지 관리자 UI는 포함하지 않습니다.

## 스택

- Next.js 16 (App Router)
- React 19
- Cloudflare Workers via `@opennextjs/cloudflare`
- Clinic-OS public API (fallback 데이터 내장)

## 로컬 실행

```bash
cp .env.example .env.local
npm install
npm run dev
```

http://localhost:4000

## 환경 변수

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 사이트 절대 URL (OG/sitemap). 스테이징 예: `https://staging.m-garden.co.kr` |
| `NEXT_PUBLIC_SITE_INDEXABLE` | `true`일 때만 검색 노출. 스테이징은 `false`/미설정(noindex) |
| `CLINIC_OS_API_BASE_URL` | Clinic-OS API base (예: `https://api.example.com`). 비어 있으면 fallback |
| `CLINIC_OS_TENANT_SLUG` | 테넌트 슬러그 (기본 `mindgarden`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (기본 `0x4AAAAAAF8rDKpWUewMGRcN`, m-garden.co.kr/www/staging 위젯). Secret 검증은 Clinic-OS |
| `DB_*` / `SMTP_*` / `CONSULTATION_NOTIFY_*` | 레거시 `/api/consultation` 전용 (추후 제거) |

## Clinic-OS 계약

- `GET /api/v1/public/tenants/{tenantSlug}/consultation-products`
- `GET /api/v1/public/tenants/{tenantSlug}/homepage-content`
- `POST /api/v1/public/tenants/{tenantSlug}/inquiries`  
  body: `{ name, phone, inquiryType, content, privacyConsent, turnstileToken, website }`  
  `inquiryType`: `개인상담|부부|가족|아동|검사|기타`  
  `website`는 honeypot. 성공 시 `202`.

클라이언트는 `lib/clinic-os/client.ts` 한 파일에서 필드명을 관리합니다.  
캐시/재검증: 5분(`revalidate = 300`).

## Cloudflare 배포 (스테이징)

배포는 이 저장소에서 실행하되, **이 에이전트 작업에서는 배포하지 않습니다.**

1. Cloudflare 계정에 Workers 권한·도메인 `staging.m-garden.co.kr` 라우팅 준비
2. Wrangler 로그인: `npx wrangler login`
3. 환경 변수/시크릿을 Workers에 설정 (`CLINIC_OS_*`, Turnstile, `NEXT_PUBLIC_*`)
4. 빌드·배포:

```bash
npm run deploy:staging
# 내부적으로: opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

5. `wrangler.toml`의 `[env.staging]` worker를 `staging.m-garden.co.kr`에 연결  
6. `NEXT_PUBLIC_SITE_INDEXABLE=false` 유지 (스테이징 noindex)

프로덕션(`m-garden.co.kr`)은 `NEXT_PUBLIC_SITE_INDEXABLE=true`와 `[env.production]`을 사용합니다.  
DNS/라이브 서버 변경은 별도 승인 후에만 진행합니다.

## 스크립트

```bash
npm run lint
npm run typecheck
npm run build
```

## 레거시

- `/api/consultation` 은 당분간 유지합니다. 신규 문의는 `/api/inquiries` → Clinic-OS 입니다.
- PM2 `:4000` Node 배포는 이전 운영 경로이며, 새 기본 경로는 Cloudflare Workers 입니다.

## 카피·시안

`content/` 에 확정 원고, `design-refs/` 에 시안 README를 두었습니다.  
원문 오탈자는 수정하지 않습니다(PR 본문 목록 참고).
