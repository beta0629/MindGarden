# Clinic-OS · 내담자 장바구니 → 체크아웃 (`clinic-os-client-cart`)

**Shot IDs (SSOT)**: `clinic-os-client-cart` · `shot-client-cart-tobe`  
**범위**: `/client/shop/cart`, `/client/shop/checkout` (웹)  
**원칙**: Clinic-OS · **ink/slate** · 회기수 티켓 · 셸 여백 = ClientAppShell 대시보드와 동일 · **페이지 중앙 max-width 금지**  
**참조**: `CLINIC_OS_ADMIN_VISUAL_SSOT.md`, `clinic-os-package-page-width.md`, `clinic-os-sidebar-cards.md` (티켓 트랙 톤)

---

## TO-BE

1. **Shell width** — `.client-shop`에 `max-width` / `margin: 0 auto` 금지. 가로 여백은 `mg-app-shell__content` 패딩만 사용.
2. **Palette** — ink `var(--cs-ink)` / `var(--mg-v2-color-text-primary)`; slate line `var(--cs-slate-200)`·`var(--cs-slate-300)`; paper `var(--mg-v2-color-neutral-50)`; primary CTA dusty teal `var(--mg-v2-color-primary-solid)`.
3. **Chrome** — quiet header(h1) + stage 카드(섹션). **왼쪽 4px accent bar 금지**.
4. **회기수 티켓** — 라인마다 `SessionCountTicket` (`sessionCount` API). 라벨 `N회 · 단회기|패키지`. 티켓 크롬: ink 텍스트 · slate 보더 · paper fill.
5. **장바구니 라인** — 제목 · 티켓 · 단가 · 수량 스테퍼 · 라인 합계. CTA `MGButton` primary fullWidth.
6. **체크아웃** — 주문 라인(+티켓) · 매핑 · 포인트 · CheckoutSummary · 약관 · CTA. 최소 카드 결제 모달 유지.
7. **Type** — h1 / section title / body-md / caption 4단계 (`--mg-v2-font-size-*`).

### Forbidden

- Forest `#3D5246` primary CTA
- 페이지 셸 중앙 `max-width` 컬럼 (기존 `75rem` 제거)
- Hex·매직 여백 하드코딩 (토큰/`--mg-v2-space-*` / `--cs-*`만)
- Accent bar / B0KlA forest 칩

### Implementation checklist

- [ ] `ShopClientLayout` → `client-shop client-shop--clinic-os`
- [ ] `.client-shop` `max-width: none; width: 100%`
- [ ] `SessionCountTicket` on cart + checkout lines
- [ ] `MGButton` primary for checkout CTA
- [ ] Lock test: no page max-width; ink/slate tokens; session ticket present
