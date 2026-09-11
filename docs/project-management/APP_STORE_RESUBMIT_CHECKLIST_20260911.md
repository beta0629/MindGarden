# App Store 재제출 체크리스트 (Review Mode · 2026-09-11)

반려: **1.0 (17)** · Submission `8e74baef-072c-4ea3-b1e7-d8518e04df6b` · iPad Air 11" M3

기획: `docs/project-management/APP_STORE_REVIEW_MODE_PLAN_20260911.md`

## A. 코드·빌드 (expo-app)

- [ ] `EXPO_PUBLIC_APP_STORE_REVIEW_MODE=1` (eas.json `production` 기본 포함)
- [ ] 내담자/상담사 **커뮤니티** 메뉴 미노출 · 딥링크 시 더보기로 복귀
- [ ] 어드민 **커뮤니티 검수** 메뉴·라우트 미노출
- [ ] 설정 → **EULA · 콘텐츠 정책** (`/legal/eula`) · zero tolerance 문구 확인
- [ ] 설정 → 이용약관·개인정보 WebView (`/legal/terms` · `/legal/privacy`)
- [ ] 플랫폼 terms SSOT에 UGC 무관용 조항 (`frontend/public/legal/clinic-os-platform-legal-copy.md`)
- [ ] `ios.supportsTablet: true` + 더보기/홈/설정 `TabletContentShell`
- [ ] EAS iOS production 빌드 → TestFlight → ASC 제출 (토큰·자격 있을 때)

## B. App Store Connect 메타 (코드 밖)

- [ ] **연령 등급 18+** (또는 해당 시장 동등 등급)로 변경
- [ ] Privacy Policy URL: 공개 `/legal/privacy` (운영 호스트)
- [ ] EULA: Custom EULA 선택 시 `/legal/eula` 또는 약관 URL + zero tolerance 명시 확인
- [ ] 심사 노트: "Community/UGC is disabled in this build via APP_STORE_REVIEW_MODE. Core counseling flows remain. EULA with zero-tolerance is under Settings."

## C. Guideline 5.1.1(ix) — Organization 계정 (필수·코드 불가)

- [ ] Apple Developer Program을 **Organization**으로 신규 등록 **또는** Individual → Organization 전환 (Developer Support)
- [ ] 법인 서류(D-U-N-S 등) 준비 · **권한 위임 문서만으로는 해결 불가**(Apple 안내)
- [ ] Organization 계정으로 앱 이전·재서명·재제출
- [ ] Individual 계정 제출 상태면 **이 항목 미완 시 재반려 확정**

## D. 승인 후

- [ ] UGC 전면 안전장치(Plan A) 완료 전 커뮤니티 재오픈 금지
- [ ] Plan A 완료 후 `EXPO_PUBLIC_APP_STORE_REVIEW_MODE=0` OTA 또는 다음 빌드
