# Trinity 트랙 종결 (Closure)

**종결일**: 2026-06-18  
**운영 URL**: https://apply.e-trinity.co.kr  
**개발 URL**: https://apply.dev.e-trinity.co.kr  
**main 커밋**: `735ba1c96f775b6cc2361ae02343625823001abe`  
**운영 배포 Run**: [#27716295028](https://github.com/beta0629/MindGarden/actions/runs/27716295028) (SUCCESS, `deploy-trinity-prod.yml`, push `main`)

---

## 범위 완료 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| Design v2 랜딩 | ✅ | mockup parity, Hero·Feature·대시보드 프리뷰 |
| Design v2 온보딩 (40/60 split) | ✅ | Vertical stepper, Welcome, Step 1–6 |
| Design v2 프라이싱 (Step 3) | ✅ | TrustBadges, BillingCycleToggle |
| CoreSolutionLogo (H2) | ✅ | `components/CoreSolutionLogo.tsx`, 제품 구간만 노출 |
| Trinity 로고 F1 | ✅ | `TrinityLogo.tsx`, 헤더·푸터 |
| 휴대폰 SMS OTP (Step 1) | ✅ | 이메일 인증 → SMS 전환, 지역 선택 필수 |
| 비밀번호 정책 (CS 공유) | ✅ | `constants/passwordPolicy.ts`, `PasswordPolicyPanel` |
| dev SMS OTP 생략 | ✅ | `NEXT_PUBLIC_SKIP_PHONE_VERIFICATION` + 런타임 fallback (dev만) |
| 신청 상태 조회 (전화·이메일) | ✅ | `status/page.tsx` |
| 운영·개발 HTTP 검증 | ✅ | `/`, `/onboarding/`, `/pricing` — 200 |

---

## 배포 SSOT

| 환경 | 워크플로 | 트리거 |
|------|----------|--------|
| 운영 | `.github/workflows/deploy-trinity-prod.yml` | `push` → `main` + `frontend-trinity/**` 또는 `workflow_dispatch` |
| 개발 | `.github/workflows/deploy-trinity-dev.yml` | `push` → `develop` + `frontend-trinity/**` 또는 `workflow_dispatch` |

운영 반영: `main`에 `frontend-trinity/` 변경 push 시 자동 빌드·`/var/www/html-trinity` 배포.

---

## 이후 정책

- **Trinity 추가 디자인·기능**: **P2** (운영 버그·보안·장애만 P0/P1).
- **우선순위**: **Core Solution Design Phase 3** (landing / onboarding / pricing on `frontend/`).
- **브랜드·배치 SSOT**: [`BRAND_DECISIONS_TRINITY_CORESOLUTION.md`](../BRAND_DECISIONS_TRINITY_CORESOLUTION.md)
- **MindGarden v2 (#425–427)**: 본 종결 시점 기준 **Defer** — CS Phase 3 완료 후 재판단.

---

## 관련 문서

- 브랜드 결정: `docs/design/v2/refine/BRAND_DECISIONS_TRINITY_CORESOLUTION.md`
- Core Solution 디자인: `docs/design/v2/refine/core-solution/` (Phase 3 집중)
- 운영 게이트: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
