# Clinic-OS MyPage (1인 이중역할) TO-BE v2 — Handoff

> Spec SSOT cite: `clinic-os-mypage-dual.md` (layout paths may be offline; Critic PASS handoff is authoritative for this branch).
> Branch: `cursor/clinic-os-mypage-dual-v2-5ba8`

## Policy (unchanged)

- One account, one login; landing Clinic-OS when ops role present
- No mode switch / re-login UI
- Menu union; API/save role-checked
- Own salary **view** = consultant path; own salary **approve/pay** = ops (+ audit); others' salary = ops only
- Consultant schedule-create remains banned — optional note on consultant row: 「일정 등록 없음」

## UI TO-BE v2 (discard v1 2-card comparison)

Order (dual-role only extras marked ★):

1. Quiet header (`MypageQuietHeader`)
2. ★ Identity band — display name + 「운영 · 상담」 (not a toggle)
3. Summary strip3 (`MypageSummaryStrip`)
4. ★ Role map — one landing line + **two links only** (not comparison cards)
5. Tabs → stage panels

### Role map links (existing routes)

| Label | Path | Capacity |
|-------|------|----------|
| 본인 급여(조회) | `/consultant/salary-settlement` | consultant view |
| 운영·재무(승인) | `/erp/salary` | ops approve/pay |

### Tokens / CTA

- Clinic-OS `--mg-v2-*` only; primary CTA dusty teal (`--mg-v2-color-primary-solid` / `#0E5F5A`)
- CTA height lock: `--mg-v2-component-height-row: 2.25rem` (36px), `MGButton`
- Copy: standard Korean only — 할 일 / 확인할 항목 / 조치 필요 (no 「손볼」)

### Gate (non-dual)

Identity band + role map render **only** when `isOperatorCounselingDualRole(user)`.

### Hardcoding / go-live

- `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- Dynamic values via `SafeText` / `safeDisplay` (COMMON_DISPLAY_BOUNDARY)
