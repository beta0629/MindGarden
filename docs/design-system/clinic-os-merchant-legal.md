# Clinic-OS Merchant Legal (사업자·약관)

**Status**: PASS·Ship  
**Path**: Center settings `/tenant/merchant-legal` (LNB neighbor to 「결제 연결」). Not ops PG approval.

## Ship checklist

| # | Item | Notes |
|---|------|--------|
| 1 | Header → strip3 → live public preview rail → form | 등록 / 통신판매 / 사이트 공개 |
| 2 | Min 7 fields | 사업자등록번호, 대표, 유선, 주소, 통신판매신고번호, 환불/취소 조항, 상품·가격 안내 |
| 3 | Save CTA teal | ink/slate UI; no green select lines; no MindGarden hardcode |
| 4 | Shared tenant-scoped record | Onboarding create → same columns; settings complement; **login** (`UnifiedLogin` + `MerchantLegalFooterPreview`) / footer / tenant home read same via `by-subdomain` · `fetchTenantPublicHomeMeta` |
| 5 | Fail-closed | Biz number format+checksum (`BusinessRegistrationNumberValidator` / FE util); tenant access via `TenantAccessControlService` |
| 6 | Worth | Biz-number error UI; onboarding-prefill hint; one-line preview role (before/after save) |

### Login auth shell (P0)

- Tenant host (`getTenantSubdomainFromHost()` non-empty): compact merchant-legal footer on `/login` (`data-testid="login-merchant-legal-footer"`). Placeholders when empty; never MindGarden/Core Solution as center legal.
- Platform apex (`dev.core-solution.co.kr` / `core-solution.co.kr`): no tenant merchant-legal footer.
- Login footer: **minimal `/legal/terms` · `/legal/privacy` · `/legal/products` links only** — no product table, no long terms/privacy body.

### Platform legal copy (P0 public)

- 이용약관·개인정보처리방침은 **플랫폼 공통** (`docs/design-system/clinic-os-platform-legal-copy.md` → `frontend/public/legal/clinic-os-platform-legal-copy.md`). Settings에 편집 textarea 없음; quiet notice + 공개 링크만.
- 공개 crawl: `/legal/terms` · `/legal/privacy` · `/legal/products` (GET). Modal-only public legal **금지**.
- Footer molecule (`MerchantLegalFooterPreview`): 안내 컬럼 3 Links → `/legal/*`. Account privacy → `/legal/privacy` (not `/privacy`).
- 상품·가격 공개 목록 = 테넌트 `CONSULTATION_PACKAGE` 중 **공개 노출(`extraData.publicVisible`)만** (`by-subdomain.consultationPackages`). LIVE 전체 고정 노출 금지. Settings의 `productPriceGuideText`는 보조 안내 문구로 유지. 토글 UI: `/admin/package-pricing` (`clinic-os-package-visibility.md`).

## Onboarding (clinic-os-onboarding-legal)

- Trinity stepKey `7` 「사업자·약관」 after 기본 정보
- Copy: 「나중에 설정에서 또 쓰지 않아요」 + mini footer preview
- Empty 통신판매 OK at onboarding; PG-required fill later in settings

## API / DB

- Migration: `V20260909_001__tenant_merchant_legal_fields.sql`
- `GET/PUT /api/v1/tenants/{tenantId}/merchant-legal`
- Public: `by-subdomain` includes `merchantLegal`, `consultationPackages` (+ optional `primaryColor`)
