# App Store 재심사 대응 — Review Mode (2026-09-11)

> **반려**: Version 1.0 (17) · Submission `8e74baef-072c-4ea3-b1e7-d8518e04df6b` · Review Device: iPad Air 11" M3 · 2026-06-10  
> **전략**: 심사 빌드에서 UGC/커뮤니티를 `EXPO_PUBLIC_APP_STORE_REVIEW_MODE`로 게이트. 18+/EULA·iPad 최소 레이아웃·Org 계정은 체크리스트.

## 반려 ↔ 기능

| Guideline | 앱 기능 | 대응 |
|-----------|---------|------|
| 1.2 UGC | client/consultant 커뮤니티, admin 검수 | Review Mode ON 시 숨김+딥링크 가드. `/legal/eula` zero tolerance. ASC 18+ |
| 4 Design | iPad UI | `supportsTablet` + `TabletContentShell` |
| 5.1.1(ix) | Individual 계정 | Organization 전환 체크리스트만 |

## 분배실행

| Phase | 담당 | 산출 |
|-------|------|------|
| 1 | core-coder | 플래그·게이트·EULA·iPad·문서 |
| 2 | core-tester | `appStoreReviewMode` 단위 테스트 |
| 3 | shell | develop push · develop 반영 |

체크리스트: `APP_STORE_RESUBMIT_CHECKLIST_20260911.md`
