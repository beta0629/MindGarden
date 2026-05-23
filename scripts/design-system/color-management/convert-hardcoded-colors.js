#!/usr/bin/env node

/**
 * 하드코딩된 색상값 자동 변환 도구
 *
 * CI/BI 변경 대비 하드코딩된 색상을 CSS 변수로 자동 변환.
 *
 * 안전 가드 (T1 2차 §6 회귀 사고 재발 방지):
 *   - HARD_EXCLUDE: 토큰 정의 파일 (unified-design-tokens / dashboard-tokens-extension /
 *     responsive-layout-tokens / mindgarden-design-system / 00-core/_variables /
 *     00-core/_component-variables / common/variables / constants/css-variables.js)
 *     은 절대 처리하지 않음. `*tokens*.css` `*variables*.css` `*design-system*.css`
 *     일반 패턴도 자동 보호. (§6.2)
 *   - `--targets-file <path>`: zsh `$TARGETS` 단어 분리 문제 회피용 옵션. (§6.1)
 *   - 잔존 hex 카운트: 매핑 후에도 남는 hex 색상을 dry-run에서 정확히 집계.
 *     회색 3자리(#666·#333·#000·#ccc·#999·#eee 등) 및 8자리 alpha hex 모두 포함.
 *   - dry-run 보고서는 `docs/COLOR_CONVERSION_DRY_RUN_REPORT.md` 로 분리 저장.
 *   - var() 폴백 보호 (시각 QA R-2): `var(--token, #hex)` 형태의 폴백 위치에 들어 있는
 *     hex 는 codemod 가 절대 변환하지 않는다. processFile 1단계에서 placeholder 로
 *     임시 치환 → 2단계에서 HEX/RGB 매핑 적용 → 3단계에서 placeholder 복원으로
 *     `var(--cs-error-600, #dc2626)` 가 `var(--cs-error-600, var(--mg-color-error))`
 *     같은 nested var 로 잘못 치환되는 부작용을 차단한다.
 *
 * @author MindGarden Team
 * @version 1.3.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const glob = require('glob');

// ── D10 P2-a HARD_EXCLUDE 보존 토큰 (P1 §C1=a 신설 최소화 결정) ────────────
// SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §2.1 + §4 C1=a,
//       docs/project-management/2026-05-23/D10_P1_DESIGN_HANDOFF.md §2 C1,
//       docs/project-management/2026-05-23/D10_P0_INVENTORY.md §1 (HOLD 6쌍 / 7건).
//
// P1 디자이너 결정 C1=a (신설 최소화) 답습 — 아래 7쌍 (legacy token + hex 컨텍스트) 은
// 캐노니컬 매핑 부재 또는 시맨틱 시프트 위험 보수 분류 잔존. 본 codemod 의 COLOR_MAPPING /
// SAFE_PAIRS 어느 경로에도 추가하지 않음으로써 영구 보존한다. 후속 운영 게이트(D11 자산
// 갱신 라운드) 에서 폐기 마이그레이션 또는 패밀리 신설 여부 재판단.
//
// HARD_EXCLUDE_TOKENS_PRESERVED:
//   1. --mg-purple-light      + #ede9fe  (purple 패밀리 부재, PrivacyPolicy.css)
//   2. --mg-custom-ffeaa7     + #ffeaa7  (커스텀 placeholder, PrivacyPolicy.css)
//   3. --mg-custom-e8f4fd     + #e8f4fd  (커스텀 placeholder, PrivacyPolicy.css)
//   4. --mg-custom-bee5eb     + #bee5eb  (커스텀 placeholder, PrivacyPolicy.css)
//   5. --mg-custom-0c5460     + #0c5460  (커스텀 placeholder, AppToast.css)
//   6. --mg-purple-500        + #6f42c1  (purple 패밀리 부재, DashboardFormModal.css)
//   7. --mg-color-accent-main + #8b7355  (coffee/brown 커스텀 톤, ConsultationRecordScreen.js)
//
// R-2 폴백 보호 (`var(--token, #hex)`) 는 1단계에서 placeholder 치환으로 자동 보존되며,
// 위 7쌍은 SAFE_PAIRS 화이트리스트 미등록으로 인해 본 codemod 의 R-2 alias 대체 경로
// (--r2-mg-alias-replace / --r2-mg-alias-bc-replace) 에서도 변환되지 않는다.

// 색상 매핑 테이블 (하드코딩 → CSS 변수)
const COLOR_MAPPING = {
  // Primary Colors
  '#007aff': 'var(--mg-primary-500)',
  '#007bff': 'var(--mg-primary-500)', 
  '#2196F3': 'var(--mg-primary-500)',
  '#3b82f6': 'var(--mg-primary-500)',
  '#6c5ce7': 'var(--mg-primary-500)',
  '#667eea': 'var(--mg-primary-500)',
  
  // Success Colors  
  '#28a745': 'var(--mg-success-500)',
  '#34c759': 'var(--mg-success-500)',
  '#4CAF50': 'var(--mg-success-500)',
  '#00b894': 'var(--mg-success-500)',
  '#10b981': 'var(--mg-success-500)',
  
  // Error/Danger Colors
  '#dc3545': 'var(--mg-error-500)',
  '#ff3b30': 'var(--mg-error-500)',
  '#F44336': 'var(--mg-error-500)',
  '#ff6b6b': 'var(--mg-error-500)',
  '#ef4444': 'var(--mg-error-500)',
  
  // Warning Colors
  '#ffc107': 'var(--mg-warning-500)',
  '#ff9500': 'var(--mg-warning-500)',
  '#FF9800': 'var(--mg-warning-500)',
  '#f59e0b': 'var(--mg-warning-500)',
  '#f093fb': 'var(--mg-warning-500)',
  
  // Info Colors
  '#17a2b8': 'var(--mg-info-500)',
  '#74b9ff': 'var(--mg-info-500)',
  
  // Secondary Colors
  '#6c757d': 'var(--mg-secondary-500)',
  '#1976D2': 'var(--mg-secondary-600)',
  
  // Gray Scale
  '#333333': 'var(--mg-gray-800)',
  '#666666': 'var(--mg-gray-600)', 
  '#999999': 'var(--mg-gray-500)',
  '#e0e0e0': 'var(--mg-gray-300)',
  '#f8f9fa': 'var(--mg-gray-100)',
  '#f5f5f5': 'var(--mg-gray-100)',
  
  // Background Colors
  '#ffffff': 'var(--mg-white)',
  '#000000': 'var(--mg-black)',
  
  // Brand Specific Colors (MindGarden)
  '#F5F5DC': 'var(--mg-cream)',
  '#FDF5E6': 'var(--mg-light-beige)',
  '#8B4513': 'var(--mg-cocoa)',
  '#808000': 'var(--mg-olive-green)',
  '#98FB98': 'var(--mg-mint-green)',
  '#B6E5D8': 'var(--mg-soft-mint)',
  
  // Purple Colors
  '#5856d6': 'var(--mg-purple-500)',
  '#8b5cf6': 'var(--mg-purple-500)',
  '#a29bfe': 'var(--mg-purple-400)',
  
  // Consultant Colors
  '#a29bfe': 'var(--mg-consultant-primary)',
  '#6c5ce7': 'var(--mg-consultant-dark)',
  
  // Finance Colors
  '#f39c12': 'var(--mg-finance-primary)',
  '#e67e22': 'var(--mg-finance-dark)',

  // 2026 Q2 D1 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2.md)
  // A. 기존 토큰 매핑 (4건)
  '#3d5246': 'var(--mg-color-primary-main)',
  '#d4cfc8': 'var(--mg-color-border-main)',
  '#5c6b61': 'var(--mg-color-text-secondary)',
  '#faf9f7': 'var(--mg-color-background-main)',

  // B. 신설 토큰 (3건) — unified-design-tokens.css §2026 Q2 신규 블록에 정의
  // 주의: #2c2c2c 는 텍스트 용도일 땐 var(--mg-color-text-main) 사용 (합의서 §1)
  '#1a1a1a': 'var(--mg-dark-bg-900)',
  '#2c2c2c': 'var(--mg-dark-bg-800)',
  '#764ba2': 'var(--mg-gradient-primary-end)',

  // C. 폐기·통합 (4건) — 합의서 §1 명시 통합 대상으로 치환
  // 주의: #1d1d1f 는 배경 용도일 땐 var(--mg-dark-bg-800) 로 수동 확인 (합의서 §1)
  '#1d1d1f': 'var(--mg-color-text-main)',
  '#0056b3': 'var(--mg-color-primary-dark)',
  '#87ceeb': 'var(--mg-info-500)',
  '#2c3e50': 'var(--mg-color-text-main)',

  // 2026 Q2 D2 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D2.md §3)
  // A. 기존 토큰 통합 (5건) — 변수명은 unified-design-tokens.css 실제 정의에 맞춤
  '#6b7280': 'var(--mg-color-text-secondary)',
  '#1f2937': 'var(--mg-color-text-main)',
  '#f9fafb': 'var(--mg-color-background-main)',
  '#2563eb': 'var(--mg-color-info)',
  '#dc2626': 'var(--mg-color-error)',

  // B. 신설 토큰 (2건) — unified-design-tokens.css D2 블록에 정의
  '#374151': 'var(--mg-color-text-secondary-dark)',
  '#4b5563': 'var(--mg-color-text-tertiary)',

  // C. 폐기 통합 (3건) — Tailwind/Bootstrap 잔재를 시스템 표준 토큰으로 흡수
  '#e5e7eb': 'var(--mg-color-border-main)',
  '#e9ecef': 'var(--mg-color-border-main)',
  '#495057': 'var(--mg-color-text-secondary)',

  // D2 보강 — 3자리 흰색(#fff)도 var(--mg-white)로 정규화
  // (lookbehind/lookahead 가드가 #ffffff 와의 충돌을 방지)
  '#fff': 'var(--mg-white)',

  // 2026 Q2 D3 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D3.md §3)
  // A. 기존 토큰 통합 (5건) — 3자리 회색 정규화 + Tailwind 잔재 흡수
  // 주의: 6자리 형태(#666666·#333333)는 기존 매핑(--mg-gray-*)에 그대로 남고,
  //       3자리 형태(#666·#333)는 D3 결정에 따라 시맨틱 토큰으로 정규화된다.
  //       lookbehind/lookahead 가드가 6자리/3자리를 분리한다.
  '#666': 'var(--mg-color-text-secondary)',
  '#333': 'var(--mg-color-text-main)',
  // 주의: --mg-color-background-subtle 토큰이 unified-design-tokens.css 에
  //       미정의이므로 D2 의 #f9fafb 매핑(--mg-color-background-main)과
  //       일관 처리한다. (작업 정의서 §PR-1, D3 SSOT §1 본문 동일)
  '#f3f4f6': 'var(--mg-color-background-main)',
  '#f8fafc': 'var(--mg-color-background-main)',
  '#9ca3af': 'var(--mg-color-text-tertiary)',

  // B. 신설 토큰 (2건) — unified-design-tokens.css D3 블록에 정의
  '#fef3c7': 'var(--mg-color-warning-bg)',
  '#fee2e2': 'var(--mg-color-error-bg)',

  // C. 폐기 통합 (3건) — Tailwind/Bootstrap 잔재를 시스템 표준 토큰으로 흡수
  '#e2e8f0': 'var(--mg-color-border-main)',
  '#d1d5db': 'var(--mg-color-border-main)',
  '#2d3748': 'var(--mg-color-text-main)',

  // 2026 Q2 D4 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D4.md §1·§3)
  // A. 기존 토큰 통합 + 3자리 회색 일괄 정규화 보강 (7건)
  // 주의: 6자리 형태(#000000·#999999 등)는 기존 매핑(--mg-black·--mg-gray-*)에 그대로 남고,
  //       3자리 형태(#000·#999 등)는 D4 결정에 따라 시맨틱 토큰으로 정규화된다.
  //       lookbehind/lookahead 가드가 6자리/3자리를 분리하고,
  //       매핑 키 길이 내림차순(8→6→4→3) 정렬로 6자리가 항상 먼저 처리된다.
  '#000': 'var(--mg-color-text-main)',
  '#ddd': 'var(--mg-color-border-main)',
  '#ccc': 'var(--mg-color-border-main)',
  '#bbb': 'var(--mg-color-text-tertiary)',
  '#aaa': 'var(--mg-color-text-tertiary)',
  '#999': 'var(--mg-color-text-tertiary)',
  '#eee': 'var(--mg-color-border-main)',

  // C. 폐기 통합 (2건) — Bootstrap 잔재를 D3 정착 토큰으로 흡수
  '#f8d7da': 'var(--mg-color-error-bg)',
  '#fff3cd': 'var(--mg-color-warning-bg)',

  // B. 신설 토큰 (6건) — unified-design-tokens.css D4 블록에 정의
  '#f0f9ff': 'var(--mg-color-info-bg)',
  '#1e40af': 'var(--mg-color-info-dark)',
  '#fef2f2': 'var(--mg-color-error-50)',
  '#991b1b': 'var(--mg-color-error-dark)',
  '#059669': 'var(--mg-color-success)',
  '#6b7c32': 'var(--mg-color-brand-olive)',

  // 2026 Q2 D7-1 라운드 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D6.md §3·§6 + P1 §2)
  // D6 §9.1 C2·C3·C4 결정 후속 — D6 P2-a 에서 정의만 추가된 6 토큰의 사용처 흡수.
  // 라이트·다크 양쪽 SSOT 정착 확인(unified-design-tokens.css §1451~§1482)
  // 폴백 위치(`var(--token, #hex)`)는 R-2 보호 패턴에 의해 자동 제외된다.
  '#9caf88': 'var(--mg-color-brand-olive-light)', // C2 brand-olive light (마케팅 배너)
  '#d1fae5': 'var(--mg-color-success-100)',       // success light surface (Tailwind emerald-100 톤)
  '#065f46': 'var(--mg-color-success-800)',       // success dark text (on success-100 6.6:1 PASS)
  '#fecaca': 'var(--mg-color-error-100)',         // error light surface (Tailwind red-200 톤)
  '#dbeafe': 'var(--mg-color-info-100)',          // info light surface (Tailwind blue-100 톤)
  '#856404': 'var(--mg-color-warning-dark)',      // warning dark text (D4 warning-800 톤 통합)

  // 2026 Q2 D7-2 라운드 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D7_2.md §4·§4.1 + P1 §2·§3)
  // §4.1 C2 컨펌 (2026-05-22) — NAVER OAuth 외부 브랜드 자동 흡수
  // 라이트·다크 양쪽 SSOT 정착 확인 (unified-design-tokens.css L1455 / L1472, 라이트·다크 동일 hex)
  '#03c75a': 'var(--mg-color-naver-green)',
  '#03C75A': 'var(--mg-color-naver-green)', // 대문자 변형

  // §4.1 C3 컨펌 (2026-05-22) — Bootstrap 잔재 3종 일괄 폐기
  // 라이트·다크 cascade 정착 확인:
  //   --mg-color-border-main: 라이트 L1127 (다크 cascade 미정의 — T-D 가드 WARN 인지, P1 §3 표 (동일/테마별))
  //   --mg-color-error-dark : 라이트 L1376 / 다크 L1383
  //   --mg-color-success-100: 라이트 L1457 / 다크 L1474
  '#dee2e6': 'var(--mg-color-border-main)',
  '#DEE2E6': 'var(--mg-color-border-main)',
  '#721c24': 'var(--mg-color-error-dark)',
  '#721C24': 'var(--mg-color-error-dark)',
  '#d4edda': 'var(--mg-color-success-100)',
  '#D4EDDA': 'var(--mg-color-success-100)',

  // §4.1 C4 컨펌 (2026-05-22) — T-Top 50 신설 1종 + 통합 4건
  // PR-B 책무 (D7_2_P1_DESIGN_HANDOFF §4·§5.3):
  //   - 신설 : info-800 (#1e3a8a 라이트 / #bfdbfe 다크, unified-design-tokens.css §D7-2 블록 정착)
  //   - 통합 : text-main (#2C2C2C·L1124, ΔRGB 18/12/0) / text-secondary-dark
  //           (#374151 라이트 L1230 · #d1d5db 다크 L1236, ΔRGB 19/20/23) /
  //           warning-dark (#856404 라이트 L1465 · #fde68a 다크 L1482, ΔRGB 13/36/10) /
  //           info-dark (#1e40af 라이트 L1374 · #bae6fd 다크 L1381, ΔRGB 1/14/41 — B채널 41 MEDIUM)
  '#1e3a8a': 'var(--mg-color-info-800)',
  '#1E3A8A': 'var(--mg-color-info-800)',
  '#1a202c': 'var(--mg-color-text-main)',
  '#1A202C': 'var(--mg-color-text-main)',
  '#4a5568': 'var(--mg-color-text-secondary-dark)',
  '#4A5568': 'var(--mg-color-text-secondary-dark)',
  '#92400e': 'var(--mg-color-warning-dark)',
  '#92400E': 'var(--mg-color-warning-dark)',
  '#1d4ed8': 'var(--mg-color-info-dark)',
  '#1D4ED8': 'var(--mg-color-info-dark)',

  // 2026 Q2 D8 PR-A 라운드 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D8.md §4 + P1 §1·§2·§5)
  // §4 C1 컨펌 (2026-05-22) — T-Pink2 개별 신설 3종
  // 라이트·다크 cascade 정착 확인 (unified-design-tokens.css D8 PR-A 블록):
  //   --mg-color-pink-400 : light #f472b6 / dark #f9a8d4
  //   --mg-color-pink-200 : light #fbcfe8 / dark #fce7f3
  //   --mg-color-rose-400 : light #fb7185 / dark #fda4af
  '#f472b6': 'var(--mg-color-pink-400)',
  '#F472B6': 'var(--mg-color-pink-400)',
  '#fbcfe8': 'var(--mg-color-pink-200)',
  '#FBCFE8': 'var(--mg-color-pink-200)',
  '#fb7185': 'var(--mg-color-rose-400)',
  '#FB7185': 'var(--mg-color-rose-400)',

  // §4 C2 컨펌 (2026-05-22) — T-Top100 신설 5종
  // 라이트·다크 cascade 정착 확인 (unified-design-tokens.css D8 PR-A 블록):
  //   --mg-color-surface-light     : light #f0f0f0 / dark #262626 (배경용)
  //   --mg-color-info-soft         : light #e3f2fd / dark #1e3a8a (배경용)
  //   --mg-color-accent-violet     : light #7b68ee / dark #a78bfa (Large 4.3:1)
  //   --mg-color-surface-blue-soft : light #b0e0e6 / dark #164e63 (배경용)
  //   --mg-color-success-50        : light #f0fdf4 / dark #064e3b (배경용)
  '#f0f0f0': 'var(--mg-color-surface-light)',
  '#F0F0F0': 'var(--mg-color-surface-light)',
  '#e3f2fd': 'var(--mg-color-info-soft)',
  '#E3F2FD': 'var(--mg-color-info-soft)',
  '#7b68ee': 'var(--mg-color-accent-violet)',
  '#7B68EE': 'var(--mg-color-accent-violet)',
  '#b0e0e6': 'var(--mg-color-surface-blue-soft)',
  '#B0E0E6': 'var(--mg-color-surface-blue-soft)',
  '#f0fdf4': 'var(--mg-color-success-50)',
  '#F0FDF4': 'var(--mg-color-success-50)',

  // §4 C2 컨펌 (2026-05-22) — T-Top100 통합 3건 (기존 SSOT 흡수)
  // P1 §2.3 결정 + ΔRGB 검증값 인용. 통합 대상 토큰은 D8 PR-A SSOT 블록의
  // alias (warning-500/error-500) 또는 D5 §2 정착 토큰 (info-bg) 으로 흡수된다.
  //   #fbbf24 → --mg-color-warning-500 (alias → --mg-warning-500 → #f59e0b, ΔRGB 6/33/25)
  //   #f8f9ff → --mg-color-info-bg (D5 §2 정착, light #f0f9ff / dark #082f49, ΔRGB 24/7/1)
  //   #e53e3e → --mg-color-error-500 (alias → --mg-error-500 → #ef4444, ΔRGB 10/6/6)
  '#fbbf24': 'var(--mg-color-warning-500)',
  '#FBBF24': 'var(--mg-color-warning-500)',
  '#f8f9ff': 'var(--mg-color-info-bg)',
  '#F8F9FF': 'var(--mg-color-info-bg)',
  '#e53e3e': 'var(--mg-color-error-500)',
  '#E53E3E': 'var(--mg-color-error-500)',

  // 2026 Q2 D9 §C2 라운드 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1 + §4 C2)
  // §C2 신설 2종 — 라이트·다크 cascade 정착 확인 (unified-design-tokens.css D9 §C2/§C3 블록):
  //   --mg-color-legacy-primary    : light #4a90e2 / dark #60a5fa (Tailwind blue-400, 다크 4.9:1 PASS)
  //   --mg-color-brand-olive-muted : light #4a6354 / dark #86a793 (brand-olive 변형, 양방향 5.x:1 PASS)
  // R-2 폴백 위치(`var(--mg-primary, #4a90e2)` 등)는 R-2 보호 패턴에 의해 자동 제외되며,
  // --r2-mg-alias-bc-replace 옵션을 통해서만 alias 대체된다. 본 매핑은 raw hex 직접 사용처
  // (예: 인라인 hex / 다른 alias 의 fallback 외 사용) 흡수 + T-D 가드 lint 인입용이다.
  // §C3 신설 1종 (--mg-color-bg-hover, light #f3f4f6) 은 #f3f4f6 이 D3 라운드에서 이미
  // --mg-color-background-main 으로 매핑되어 있어 alias 충돌 회피를 위해 본 매핑에서 의도적 제외.
  // bg-hover 토큰은 --r2-mg-alias-bc-replace 옵션의 SAFE_PAIRS 경로로만 alias 대체된다.
  '#4a90e2': 'var(--mg-color-legacy-primary)',
  '#4A90E2': 'var(--mg-color-legacy-primary)',
  '#4a6354': 'var(--mg-color-brand-olive-muted)',
  '#4A6354': 'var(--mg-color-brand-olive-muted)',

  // 2026 Q2 D10 P2-a 라운드 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §2.1·§2.2 + §4 C1·C2,
  //                              docs/project-management/2026-05-23/D10_P1_DESIGN_HANDOFF.md §2 C2·C3 + §C9=a)
  // §C2 신설 10종 + §C3 신설 1종(border-soft, 본 매핑 제외 — #f3f4f6 alias 충돌 회피) —
  // 라이트·다크 cascade 정착 확인 (unified-design-tokens.css D10 §C2/§C3 블록):
  //   --mg-color-primary-50    : light #eff6ff / dark #1e3a8a (Tailwind blue-50/900)
  //   --mg-color-primary-200   : light #bfdbfe / dark #1e40af (Tailwind blue-200/800)
  //   --mg-color-primary-300   : light #93c5fd / dark #1d4ed8 (Tailwind blue-300/700)
  //   --mg-color-warning-50    : light #fffbeb / dark #451a03 (Tailwind amber-50/900)
  //   --mg-color-warning-200   : light #fde68a / dark #78350f (Tailwind amber-200/800)
  //   --mg-color-warning-600   : light #d97706 / dark #fcd34d (Tailwind amber-600/300)
  //   --mg-color-warning-700   : light #b45309 / dark #fbbf24 (Tailwind amber-700/400)
  //   --mg-color-success-600   : light #059669 / dark #34d399 (Tailwind emerald-600/400, 재신설)
  //   --mg-color-success-700   : light #047857 / dark #6ee7b7 (Tailwind emerald-700/300)
  //   --mg-color-info-600      : light #2563eb / dark #3b82f6 (Tailwind blue-600/500)
  //
  // ⚠️ Alias 충돌 회피 의도적 제외:
  //   - #059669 (success-600 light) : 기존 D4 매핑 `var(--mg-color-success)` 유지.
  //                                    raw 사용처는 운영 코드 0건(HARD_EXCLUDE 토큰 정의 파일에만 존재).
  //                                    V2 actual `#16a34a` 만 본 매핑으로 success-600 흡수.
  //   - #2563eb (info-600 light)    : 기존 D2 매핑 `var(--mg-color-info)` 유지.
  //                                    V2 actual `#0284c7` 만 본 매핑으로 info-600 흡수.
  //   - #f3f4f6 (border-soft light) : 기존 D3 매핑 `var(--mg-color-background-main)` 유지.
  //                                    border-light alias `var(--mg-v2-color-border-light, #f3f4f6)`
  //                                    는 R2_V2_ALIAS_SAFE_PAIRS 경로로만 border-soft 흡수.
  //
  // ⚠️ V2 actual hex ↔ P1 신설 hex 톤 시프트 endorsed (D10 합의서 §9 C9=a, `1bff963bd`):
  //   success-600 : V2 actual `#16a34a` → SSOT light `#059669` (Tailwind emerald-600, ΔE 인지 가능)
  //   success-700 : V2 actual `#15803d` → SSOT light `#047857` (Tailwind emerald-700, ΔE 인지 가능)
  //   info-600    : V2 actual `#0284c7` → SSOT light `#2563eb` (sky-600 → blue-600, ΔE 인지 가능)
  //   ConsultantDashboard.css 광역 변화는 D10 P3 시각 회귀 검수 게이트.
  '#eff6ff': 'var(--mg-color-primary-50)',
  '#EFF6FF': 'var(--mg-color-primary-50)',
  '#bfdbfe': 'var(--mg-color-primary-200)',
  '#BFDBFE': 'var(--mg-color-primary-200)',
  '#93c5fd': 'var(--mg-color-primary-300)',
  '#93C5FD': 'var(--mg-color-primary-300)',
  '#fffbeb': 'var(--mg-color-warning-50)',
  '#FFFBEB': 'var(--mg-color-warning-50)',
  '#fde68a': 'var(--mg-color-warning-200)',
  '#FDE68A': 'var(--mg-color-warning-200)',
  '#d97706': 'var(--mg-color-warning-600)',
  '#D97706': 'var(--mg-color-warning-600)',
  '#b45309': 'var(--mg-color-warning-700)',
  '#B45309': 'var(--mg-color-warning-700)',
  '#16a34a': 'var(--mg-color-success-600)',
  '#16A34A': 'var(--mg-color-success-600)',
  '#15803d': 'var(--mg-color-success-700)',
  '#15803D': 'var(--mg-color-success-700)',
  '#047857': 'var(--mg-color-success-700)',
  '#0284c7': 'var(--mg-color-info-600)',
  '#0284C7': 'var(--mg-color-info-600)',

  // 2026 Q2 D10 P2-c §C7 B0KlA Admin Palette 신설 6종 raw hex 직접 흡수
  // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §9 C7=a (commit `1bff963bd`),
  //       docs/project-management/2026-05-23/D10_P1_DESIGN_HANDOFF.md §5 (P2-c B0KlA),
  //       docs/project-management/2026-05-23/D10_P0_INVENTORY.md §6.3.a (28건).
  // 라이트·다크 cascade 정착 확인 (unified-design-tokens.css §D10 §C7 블록):
  //   --mg-color-b0kla-green-500  : light #4b745c / dark #9cb89e (admin primary olive-green)
  //   --mg-color-b0kla-orange-300 : light #e8a87c / dark #f4b988 (Large Text/UI Component 한정)
  //   --mg-color-b0kla-blue-400   : light #6d9dc5 / dark #9bb8d3 (Large Text/UI Component 한정)
  //   --mg-color-b0kla-green-50   : light #ebf2ee / dark #1c2e23 (B0KlA green soft bg)
  //   --mg-color-b0kla-orange-50  : light #fcf3ed / dark #2d1f15 (B0KlA orange soft bg)
  //   --mg-color-b0kla-blue-50    : light #f0f5f9 / dark #1c2733 (B0KlA blue soft bg)
  //
  // brand-olive vs b0kla-green-500 분리 (P1 §5.4):
  //   #4a6354 (brand-olive-muted) ↔ #4b745c (b0kla-green-500) ΔE ≈ 7.8 — 통합 불가.
  //
  // ⚠️ HARD_EXCLUDE 보존: `#0d9488` (teal-600 변형, ad-b0kla-green HOLD-shift, 1건) —
  //   teal 패밀리 부재로 본 매핑 의도적 제외 (D11 검토 대상).
  '#4b745c': 'var(--mg-color-b0kla-green-500)',
  '#4B745C': 'var(--mg-color-b0kla-green-500)',
  '#e8a87c': 'var(--mg-color-b0kla-orange-300)',
  '#E8A87C': 'var(--mg-color-b0kla-orange-300)',
  '#6d9dc5': 'var(--mg-color-b0kla-blue-400)',
  '#6D9DC5': 'var(--mg-color-b0kla-blue-400)',
  '#ebf2ee': 'var(--mg-color-b0kla-green-50)',
  '#EBF2EE': 'var(--mg-color-b0kla-green-50)',
  '#fcf3ed': 'var(--mg-color-b0kla-orange-50)',
  '#FCF3ED': 'var(--mg-color-b0kla-orange-50)',
  '#f0f5f9': 'var(--mg-color-b0kla-blue-50)',
  '#F0F5F9': 'var(--mg-color-b0kla-blue-50)'
};

// RGB/RGBA 색상 매핑
//
// ── 2026 Q2 D9 §C6 (T-Glass-Shadow-Overlay 5종 SSOT 정착 — PR-D) ───────────────
// SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.6 + §4 C6=a,
//       docs/project-management/2026-05-23/D9_P1_DESIGN_HANDOFF.md §2.5·§4(P2-f).
// 본 라운드에서 5종 SSOT(`--mg-glass-bg-{light,medium,strong}` /
// `--mg-shadow-medium` / `--mg-overlay`) 가 unified-design-tokens.css 에 라이트·
// 다크 cascade 정의로 정착됨. 이에 따라 D5 P3 NO-OP 였던 rgba 광역 흡수가 가능
// 해졌다. 본 매핑은 P1 §C6 α 단계 결정 (Light 0.05/0.20/0.40, Dark 0.20/0.40/0.60)
// 에 맞춰 white-기반 rgba 변형을 glass-bg-* 로 흡수한다.
//
// 시맨틱 분류 가이드:
//   - white(255,255,255) 기반 rgba α 변형 → glass-bg-* (라이트 cascade)
//     · 0.05 (exact P1 light), 0.10·0.15 (light 근접), 0.20 (exact P1 medium),
//       0.25 (legacy "light" → 스테이지 보존, 0.05 으로 α 정밀화 — HIGH 시각 변화),
//       0.30 (medium 근접), 0.35 (legacy "medium" → 0.20 정밀화 — MED 시각 변화),
//       0.40 (exact P1 strong), 0.45 (legacy "strong" → 0.40 정밀화 — LOW 시각 변화),
//       0.50 (strong 근접 — LOW 시각 변화)
//   - black(0,0,0) 기반 rgba α 변형 → shadow / overlay (시맨틱 명확 케이스만)
//     · 0.10 → shadow-light (기존 D5, dark cascade 부재 — 변화 0)
//     · 0.15 → shadow-medium (D9 SSOT 정착 후 light=0.10 으로 α 정밀화 — LOW)
//     · 0.50 → overlay (양방향 0.50 고정, 변화 0)
//     · 0.20·0.30·0.40·0.60 (black 변형): HOLD — glass-bg-* 다크 cascade 와
//       shadow-medium 다크 cascade 와 동일 hex 가 겹쳐 시맨틱 시프트 위험 케이스.
//       (예: rgba(0,0,0,0.40) 은 light-mode 코드 컨텍스트에서 glass-bg-medium 다크 ≠
//       의도. 라이트 모드에서 glass-bg-medium 은 white(0.20) 으로 cascade 되어
//       시각 의도와 충돌함.) D9 §6 / D10 케이스별 분리 권장.
//
// 모든 매핑은 `buildRgbRegex` 로 공백/소수점/대문자 변형 (`rgba`·`RGBA`·`rgba(...,.10)` 등)
// 을 자동 매칭한다 (D4 인프라 보강). 따라서 본 표는 카논 형식만 한 줄로 표기.
const RGB_MAPPING = {
  'rgb(0, 123, 255)': 'var(--mg-primary-500)',
  'rgb(40, 167, 69)': 'var(--mg-success-500)',
  'rgb(220, 53, 69)': 'var(--mg-error-500)',
  'rgb(255, 193, 7)': 'var(--mg-warning-500)',
  'rgb(23, 162, 184)': 'var(--mg-info-500)',
  'rgb(108, 117, 125)': 'var(--mg-secondary-500)',

  // D9 §C6 Glass 배경 light — white α 변형 흡수 (light=0.05 exact)
  // 0.05 (exact), 0.10·0.15 (근접), 0.25 (legacy light → P1 α 정밀화)
  'rgba(255, 255, 255, 0.05)': 'var(--mg-glass-bg-light)',
  'rgba(255, 255, 255, 0.1)': 'var(--mg-glass-bg-light)',
  'rgba(255, 255, 255, 0.15)': 'var(--mg-glass-bg-light)',
  'rgba(255, 255, 255, 0.25)': 'var(--mg-glass-bg-light)',

  // D9 §C6 Glass 배경 medium — white α 변형 흡수 (medium=0.20 exact)
  // 0.20 (exact), 0.30 (근접), 0.35 (legacy medium → P1 α 정밀화)
  'rgba(255, 255, 255, 0.2)': 'var(--mg-glass-bg-medium)',
  'rgba(255, 255, 255, 0.3)': 'var(--mg-glass-bg-medium)',
  'rgba(255, 255, 255, 0.35)': 'var(--mg-glass-bg-medium)',

  // D9 §C6 Glass 배경 strong — white α 변형 흡수 (strong=0.40 exact)
  // 0.40 (exact), 0.45 (legacy strong → P1 α 정밀화), 0.50 (근접)
  'rgba(255, 255, 255, 0.4)': 'var(--mg-glass-bg-strong)',
  'rgba(255, 255, 255, 0.45)': 'var(--mg-glass-bg-strong)',
  'rgba(255, 255, 255, 0.5)': 'var(--mg-glass-bg-strong)',

  // 그림자·오버레이 (black 기반) — D9 §C6 SAFE 케이스만 흡수
  // 0.10 → shadow-light (D5 기존, dark cascade 부재로 변화 0)
  // 0.15 → shadow-medium (D9 SSOT 정착 후 light=0.10 으로 α 정밀화 — LOW)
  // 0.50 → overlay (D9 SSOT light=dark=0.50 정확 일치, 변화 0)
  'rgba(0, 0, 0, 0.1)': 'var(--mg-shadow-light)',
  'rgba(0, 0, 0, 0.15)': 'var(--mg-shadow-medium)',
  'rgba(0, 0, 0, 0.5)': 'var(--mg-overlay)',

  // black α 0.20/0.30/0.40/0.60 변형은 의도적으로 누락 — glass-bg-* 다크 cascade
  // 와 shadow-medium 다크 cascade 와 동일 hex 가 겹쳐 시맨틱 시프트 위험 케이스.
  // 본 위임(P2-f) 제약 "시맨틱 시프트 위험 케이스 일괄 흡수 금지" 준수. D10 이월.

  // 2026 Q2 D5 P3 라운드 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md §3.3 — T-A 흡수)
  // 불투명 rgba 변형 1종 — 시각 등가 보장 (rgba(R,G,B,1) ≡ #RRGGBB) 의 안전 흡수.
  //   --mg-white → var(--cs-white) → #ffffff (unified-design-tokens.css L371·L1015·L193)
  // buildRgbRegex 가 공백·소수점·`1` ↔ `1.0` 변형을 자동 매칭한다.
  // 잔존 카운트(canonical)는 hex 기준이므로 본 매핑은 canonical 감축에 기여하지 않으나,
  // codebase 일관성을 위한 cleanup 으로 추가. T-D 가드 영향 없음(--mg-color-* 토큰 미포함).
  'rgba(255, 255, 255, 1)': 'var(--mg-white)'
};

// 제외할 파일 패턴
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.css'
];

// 백업할 파일들
const BACKUP_EXTENSIONS = ['.css', '.scss', '.js', '.jsx', '.ts', '.tsx'];

// ── 시각 QA R-2: var() 폴백 보호 패턴 ─────────────────────────────────────────────
// `var(--token, #hex)` 형태의 폴백 위치에 있는 hex 는 절대 변환하지 않는다.
// 정규식 설계:
//   - `var\(`                : `var(` 시작 (공백 허용)
//   - `--[\w-]+`              : CSS 커스텀 프로퍼티 이름 (밑줄·하이픈·영숫자)
//   - `\s*,\s*`               : 폴백 구분자
//   - `#[0-9a-fA-F]{3,8}`     : 3·4·6·8자리 hex (alpha 포함 가능)
//   - `(?![0-9a-fA-F])`       : 추가 hex 문자 없을 때만 (예: `#1a1a1aff` 의 일부로 잘못 잡히지 않게)
//   - `\s*\)`                 : 닫는 괄호
// 주의: linear-gradient/box-shadow 등 var() 밖에서 콤마 + #hex 가 등장하는 케이스는
//       매칭되지 않으므로 정상 치환 대상으로 남는다.
// 주의: nested var 폴백(`var(--a, var(--b, #c))`)의 경우 안쪽 `var(--b, #c)` 가
//       매칭돼 placeholder 로 치환되므로, 바깥 var 는 자연히 비-hex 폴백을 갖게 되고
//       추가 처리 없이 그대로 유지된다.
const VAR_FALLBACK_HEX_PATTERN = /var\s*\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])\s*\)/g;
const VAR_FALLBACK_PLACEHOLDER_PREFIX = '__MG_VAR_FALLBACK_HEX_';
const VAR_FALLBACK_PLACEHOLDER_SUFFIX = '__';

// ── D8 PR-B 단계 1: R-2 mg-* 폴백 alias 대체 SAFE_PAIRS 화이트리스트 ────────
// SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D8.md §2.3 + §4 C3 결정
// 본 화이트리스트는 `--r2-mg-alias-replace` 옵션이 명시될 때에만 사용된다.
// 옵션 미지정 시 R-2 폴백 보호 동작은 100% 유지된다 (기존 코드 경로 무수정).
//
// 분류 기준:
//   - Group A: 캐노니컬 토큰명이 legacy 토큰명과 동일 → 폴백만 제거 (시각 변화 0)
//   - Group B: dashboard-tokens-extension.css legacy alias → D-round 캐노니컬
//   - Group C: 색 패밀리 alias (legacy 토큰 미정의 + 라이트 hex 일치) → 다크 cascade 정착 효과
//   - Group D: custom-* placeholder (legacy 토큰 미정의, hex 바인딩 명확) → 다크 cascade 정착 효과
//
// 본 화이트리스트에 없는 (token, hex) 쌍은 본 옵션 사용 시에도 절대 변환되지 않는다.
// mg-v2-* 폴백 (D9 이월), `--mg-bg-hover` 등 시맨틱 시프트 케이스는 의도적으로 제외.
const R2_MG_ALIAS_SAFE_PAIRS = [
  // Group A: 캐노니컬 토큰명 동일 (폴백만 제거, 시각 변화 0)
  { tokenName: '--mg-color-text-secondary', hex: '#666', canonical: 'var(--mg-color-text-secondary)' },
  { tokenName: '--mg-error-50', hex: '#fef2f2', canonical: 'var(--mg-color-error-50)' },

  // Group B: 텍스트 alias (dashboard-tokens-extension legacy → D-round 캐노니컬)
  // text-secondary/tertiary/primary 는 dashboard-tokens-extension L94-97 에서 mg-gray-* alias.
  // D-round 캐노니컬은 unified-design-tokens.css 의 라이트·다크 cascade 정착 토큰.
  { tokenName: '--mg-text-secondary', hex: '#666', canonical: 'var(--mg-color-text-secondary)' },
  { tokenName: '--mg-text-tertiary', hex: '#999', canonical: 'var(--mg-color-text-tertiary)' },
  { tokenName: '--mg-text-tertiary', hex: '#9ca3af', canonical: 'var(--mg-color-text-tertiary)' },
  { tokenName: '--mg-color-text-primary', hex: '#333', canonical: 'var(--mg-color-text-main)' },
  { tokenName: '--mg-text-primary', hex: '#2d3748', canonical: 'var(--mg-color-text-main)' },

  // Group C: 색 패밀리 alias (legacy 미정의 + 라이트 hex 정확 일치)
  // 다크 모드에서는 캐노니컬 토큰의 다크 cascade 가 적용되어 다크 모드 가시성 향상.
  { tokenName: '--mg-amber-light', hex: '#fef3c7', canonical: 'var(--mg-color-warning-bg)' },
  { tokenName: '--mg-emerald-light', hex: '#d1fae5', canonical: 'var(--mg-color-success-100)' },
  { tokenName: '--mg-red-light', hex: '#fee2e2', canonical: 'var(--mg-color-error-bg)' },
  { tokenName: '--mg-success-light', hex: '#d1fae5', canonical: 'var(--mg-color-success-100)' },
  { tokenName: '--mg-color-warning-light', hex: '#fef3c7', canonical: 'var(--mg-color-warning-bg)' },

  // Group D: custom-* placeholder (legacy 미정의, hex 바인딩 명확)
  { tokenName: '--mg-custom-fff3cd', hex: '#fff3cd', canonical: 'var(--mg-color-warning-bg)' },
  { tokenName: '--mg-custom-856404', hex: '#856404', canonical: 'var(--mg-color-warning-dark)' }
];

// ── D9 P2-a: R-2 mg-v2-* 폴백 alias 대체 SAFE_PAIRS 화이트리스트 ────────────
// SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1 + §4 C1=b 결정
// 본 화이트리스트는 `--r2-v2-alias-replace` 옵션이 명시될 때에만 사용된다.
// 옵션 미지정 시 R-2 폴백 보호 동작은 100% 유지된다 (기존 코드 경로 무수정).
//
// 분류 기준 (D8 PR-B 단계 1 §1.2 답습):
//   - Group A: 캐노니컬 토큰명이 mg-v2-* 토큰명과 시맨틱 동명 → 폴백만 제거 (라이트 hex 동일)
//   - Group B: mg-v2-* legacy text alias → D-round 캐노니컬 text-* (라이트 톤 시프트 가능, 다크 가시성 향상)
//   - Group C: mg-v2-* 색 패밀리 alias → 캐노니컬 패밀리 토큰 (라이트 hex 일치, 다크 cascade 정착)
//
// 본 화이트리스트에 없는 (token, hex) 쌍은 본 옵션 사용 시에도 절대 변환되지 않는다.
// HOLD (시맨틱 시프트: border-light / 등) 및 manual-review (캐노니컬 매핑 부재)
// 케이스는 의도적으로 제외 — D10 또는 P1 디자이너 결정 대기.
//
// D9 P2-c 보강 (2026-05-23):
//   `--mg-v2-color-primary-100` + `#dbeafe` (3건) 는 P2-a 시점에서 primary↔info
//   패밀리 시프트로 HOLD 였으나, P1 §C3 결정으로 `--mg-primary-light` + `#dbeafe`
//   → `--mg-color-info-100` 시맨틱 시프트가 SAFE 로 정착됨에 따라 일관성 차원에서
//   본 위임에서도 함께 흡수 (P2-a 이월 통합).
const R2_V2_ALIAS_SAFE_PAIRS = [
  // Group A: 동명 토큰 (success-50 ↔ success-50, 라이트 hex 정확 일치)
  // SSOT 정의: --mg-color-success-50 라이트 #f0fdf4 / 다크 #064e3b (다크 cascade 정착 효과)
  { tokenName: '--mg-v2-color-success-50', hex: '#f0fdf4', canonical: 'var(--mg-color-success-50)' },

  // Group B: mg-v2-* text alias → D-round 캐노니컬
  // text-primary alias → text-main, text-tertiary 동일 시맨틱 (tier 보존)
  // 라이트 톤 시프트: #111827→#2C2C2C (text-main), #9ca3af→#4b5563 (text-tertiary) — 가독성 향상 방향
  // 다크 cascade 정착: #111827→#E5E5E5 (대폭 가시성 향상), #9ca3af→#9ca3af (동일)
  { tokenName: '--mg-v2-color-text-primary', hex: '#111827', canonical: 'var(--mg-color-text-main)' },
  { tokenName: '--mg-v2-color-text-tertiary', hex: '#9ca3af', canonical: 'var(--mg-color-text-tertiary)' },

  // Group C: 색 패밀리 alias (info-50 톤 → info-bg 시맨틱, 라이트 hex 정확 일치)
  // SSOT 정의: --mg-color-info-bg 라이트 #f0f9ff / 다크 #082f49 (다크 정착)
  // D8 PR-B 답습 `--mg-amber-light` → warning-bg 패턴
  { tokenName: '--mg-v2-color-info-50', hex: '#f0f9ff', canonical: 'var(--mg-color-info-bg)' },

  // D9 P2-c 보강 — P2-a HOLD 이월: primary↔info 패밀리 시프트
  // SSOT 정의: --mg-color-info-100 라이트 #dbeafe / 다크 #1e3a8a (다크 cascade 정착 효과)
  // P1 §C3 결정 (--mg-primary-light + #dbeafe → --mg-color-info-100) 과 동일 라인.
  // 라이트 hex 정확 일치 (시각 변화 0), 다크 cascade 정착 효과 (#dbeafe → #1e3a8a)
  { tokenName: '--mg-v2-color-primary-100', hex: '#dbeafe', canonical: 'var(--mg-color-info-100)' },

  // ── D10 P2-a (2026-05-23, §C2 Tailwind palette 10종 + §C3 border-soft 1종) ──
  // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §2.1·§2.2 + §4 C2/C3,
  //       docs/project-management/2026-05-23/D10_P1_DESIGN_HANDOFF.md §2 C2·C3 + §3,
  //       docs/project-management/2026-05-23/D10_P0_INVENTORY.md §2·§3 (16건 + 4건).
  // mg-v2-* Tailwind palette 10쌍 R-2 폴백 (ConsultantDashboard.css 광역 16건) +
  // border-light 1쌍 (border-soft 시맨틱 분리, 4건) SAFE 화이트리스트 흡수.
  //
  // ⚠️ V2 actual hex ↔ P1 신설 hex 톤 시프트 endorsed (D10 §9 C9=a, commit `1bff963bd`):
  //   success-600 V2 actual `#16a34a` → SSOT light `#059669` (Tailwind emerald-600, ΔE 인지 가능)
  //   success-700 V2 actual `#15803d` → SSOT light `#047857` (Tailwind emerald-700, ΔE 인지 가능)
  //   info-600    V2 actual `#0284c7` → SSOT light `#2563eb` (sky-600 → blue-600, ΔE 인지 가능)
  //   ConsultantDashboard.css 광역 변화는 D10 P3 시각 회귀 검수 게이트.

  // §C2 — primary blue 3종 (Tailwind blue-50/200/300, ConsultantDashboard accent)
  { tokenName: '--mg-v2-color-primary-50', hex: '#eff6ff', canonical: 'var(--mg-color-primary-50)' },
  { tokenName: '--mg-v2-color-primary-200', hex: '#bfdbfe', canonical: 'var(--mg-color-primary-200)' },
  { tokenName: '--mg-v2-color-primary-300', hex: '#93c5fd', canonical: 'var(--mg-color-primary-300)' },
  // §C2 — warning amber 4종 (Tailwind amber-50/200/600/700, V2 alert/badge)
  { tokenName: '--mg-v2-color-warning-50', hex: '#fffbeb', canonical: 'var(--mg-color-warning-50)' },
  { tokenName: '--mg-v2-color-warning-200', hex: '#fde68a', canonical: 'var(--mg-color-warning-200)' },
  { tokenName: '--mg-v2-color-warning-600', hex: '#d97706', canonical: 'var(--mg-color-warning-600)' },
  { tokenName: '--mg-v2-color-warning-700', hex: '#b45309', canonical: 'var(--mg-color-warning-700)' },
  // §C2 — success emerald 2종 + info blue 1종 (V2 actual hex 톤 시프트 endorsed)
  { tokenName: '--mg-v2-color-success-600', hex: '#16a34a', canonical: 'var(--mg-color-success-600)' },
  { tokenName: '--mg-v2-color-success-700', hex: '#15803d', canonical: 'var(--mg-color-success-700)' },
  { tokenName: '--mg-v2-color-info-600', hex: '#0284c7', canonical: 'var(--mg-color-info-600)' },
  // §C3 — border-soft 시맨틱 분리 (정적 border 전용, hover-bg 와 동일 hex 시맨틱 분리)
  // light #f3f4f6 (Tailwind gray-100) / dark #374151 (Tailwind gray-700)
  { tokenName: '--mg-v2-color-border-light', hex: '#f3f4f6', canonical: 'var(--mg-color-border-soft)' }
];

// ── D9 P2-b + P2-c: R-2 mg-* 폴백 alias 대체 SAFE_PAIRS 화이트리스트 (BC) ───────
// SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1·§2.2 + §4 C2·C3 결정
// 본 화이트리스트는 `--r2-mg-alias-bc-replace` 옵션이 명시될 때에만 사용된다.
// 옵션 미지정 시 D8 PR-B 단계 1·D9 P2-a 동작은 100% 유지된다 (기존 코드 경로 무수정).
//
// 분류 기준 (P1 디자이너 핸드오프 §2.1·§2.2 결정표 정확 인용):
//   - Group N (NEW): 시각적 보존을 위해 신설된 토큰으로 흡수
//                    (`legacy-primary` / `brand-olive-muted` / `bg-hover` — 라이트 hex 정확 일치)
//   - Group A (polyfill-only): 캐노니컬 토큰명이 legacy 와 동일 → 폴백만 제거 (시각 변화 0)
//   - Group B (tone-shift): P1 명시 endorsed 톤/패밀리 시프트
//   - Group C (closest-canonical): 라이트 hex 일치 또는 ΔE 작은 변화로 가장 근접한 캐노니컬 흡수
//
// 본 화이트리스트에 없는 (token, hex) 쌍은 본 옵션 사용 시에도 절대 변환되지 않는다.
// HOLD (manual-review 12쌍 — custom-*, danger-dark, purple-* 등): D10 또는 P1 디자이너 재컨펌 대기.
const R2_MG_ALIAS_BC_SAFE_PAIRS = [
  // Group N (NEW token 흡수, P1 §C2/§C3 신설 결정)
  // --mg-color-legacy-primary 라이트 #4a90e2 / 다크 #60a5fa (Tailwind blue-400)
  { tokenName: '--mg-primary', hex: '#4a90e2', canonical: 'var(--mg-color-legacy-primary)' },
  // --mg-color-brand-olive-muted 라이트 #4a6354 / 다크 #86a793
  { tokenName: '--mg-color-primary-light', hex: '#4a6354', canonical: 'var(--mg-color-brand-olive-muted)' },
  { tokenName: '--mg-primary-light', hex: '#4a6354', canonical: 'var(--mg-color-brand-olive-muted)' },
  // --mg-color-bg-hover 라이트 #f3f4f6 / 다크 #374151 (Tailwind gray-700)
  { tokenName: '--mg-bg-hover', hex: '#f3f4f6', canonical: 'var(--mg-color-bg-hover)' },

  // Group A (polyfill-only, 시각 변화 0)
  // SSOT --mg-color-surface-main 라이트 #F5F3EF / 다크 #262626 (case-insensitive 매칭)
  { tokenName: '--mg-color-surface-main', hex: '#f5f3ef', canonical: 'var(--mg-color-surface-main)' },
  // SSOT --mg-color-success 라이트 #059669 (fallback #81c784 다르지만 SSOT 정의 시 fallback 미사용)
  { tokenName: '--mg-color-success', hex: '#81c784', canonical: 'var(--mg-color-success)' },
  // SSOT --mg-color-error 라이트 #E57373 (case-insensitive 매칭)
  { tokenName: '--mg-color-error', hex: '#e57373', canonical: 'var(--mg-color-error)' },

  // Group B (P1 명시 endorsed 톤/패밀리 시프트, P1 §C2/§C3 결정표 원문 인용)
  // P1 §C2: --mg-surface-primary + #f5f3ef → --mg-color-surface-main (표면 시맨틱 중복 정리)
  { tokenName: '--mg-surface-primary', hex: '#f5f3ef', canonical: 'var(--mg-color-surface-main)' },
  // P1 §C2: --mg-text-secondary + #64748b → --mg-color-text-secondary (Tailwind slate-500 → 캐노니컬)
  //         SSOT 라이트 #5C6B61 (브랜드 olive-gray), 라이트 톤 시프트 인지 (가독성 유지)
  { tokenName: '--mg-text-secondary', hex: '#64748b', canonical: 'var(--mg-color-text-secondary)' },
  // P1 §C2: --mg-primary-light + #4f6b5a → --mg-color-brand-olive-muted (brand-olive 변형 통합)
  //         hex 시프트 #4f6b5a → #4a6354 (ΔE 작은 olive 변형)
  { tokenName: '--mg-primary-light', hex: '#4f6b5a', canonical: 'var(--mg-color-brand-olive-muted)' },
  // P1 §C2: --mg-consultant-primary-light + #6b7f72 → --mg-color-brand-olive-muted (도메인 alias 통합)
  //         hex 시프트 #6b7f72 → #4a6354 (brand-olive 패밀리)
  { tokenName: '--mg-consultant-primary-light', hex: '#6b7f72', canonical: 'var(--mg-color-brand-olive-muted)' },
  // P1 §C2: --mg-pipeline-primary + #4b745c → --mg-color-brand-olive-muted (도메인 alias 통합)
  //         hex 시프트 #4b745c → #4a6354 (brand-olive 패밀리)
  { tokenName: '--mg-pipeline-primary', hex: '#4b745c', canonical: 'var(--mg-color-brand-olive-muted)' },

  // P1 §C3: --mg-text-tertiary + #666 → --mg-color-text-secondary (tier 시프트 허용)
  //         tertiary → secondary tier 흡수, P1 결정
  { tokenName: '--mg-text-tertiary', hex: '#666', canonical: 'var(--mg-color-text-secondary)' },
  // P1 §C3: --mg-primary-light + #dbeafe → --mg-color-info-100 (info 패밀리 시프트 허용)
  //         SSOT 라이트 #dbeafe 정확 일치, 다크 cascade #1e3a8a 정착
  { tokenName: '--mg-primary-light', hex: '#dbeafe', canonical: 'var(--mg-color-info-100)' },
  // P1 §C3: --mg-pipeline-card-bg + #f8fafc → --mg-color-background-main (generic bg 통합)
  //         hex 시프트 #f8fafc → #faf9f7 (warm bg 톤 시프트, P1 endorsed)
  { tokenName: '--mg-pipeline-card-bg', hex: '#f8fafc', canonical: 'var(--mg-color-background-main)' },
  // P1 §C3: --mg-gray-light + #f3f4f6 → --mg-color-background-main (semantic surface 통합)
  //         hex 시프트 #f3f4f6 → #faf9f7 (warm bg 톤, P1 endorsed)
  { tokenName: '--mg-gray-light', hex: '#f3f4f6', canonical: 'var(--mg-color-background-main)' },
  // P1 §C3: --mg-color-primary-light + #e3f2fd → --mg-color-info-soft (info 패밀리 통합)
  //         SSOT 라이트 #e3f2fd 정확 일치, 다크 cascade #1e3a8a 정착
  { tokenName: '--mg-color-primary-light', hex: '#e3f2fd', canonical: 'var(--mg-color-info-soft)' },
  // P1 §C3: --mg-gray-100 + #f3f4f6 → --mg-color-background-main (semantic surface 통합)
  //         hex 시프트 #f3f4f6 → #faf9f7 (warm bg 톤, P1 endorsed)
  { tokenName: '--mg-gray-100', hex: '#f3f4f6', canonical: 'var(--mg-color-background-main)' },

  // Group C (closest-canonical, P1 §C2 "기타 18쌍" 라인 중 ΔE 작은 케이스 흡수)
  // --mg-layout-main-bg-end + #f2ede8 → --mg-color-background-muted (SSOT 라이트 #F2EDE8 정확 일치)
  { tokenName: '--mg-layout-main-bg-end', hex: '#f2ede8', canonical: 'var(--mg-color-background-muted)' },
  // --mg-surface-secondary + #ebe9e4 → --mg-color-background-secondary (SSOT 라이트 #EBE6E0, ΔE 작음)
  { tokenName: '--mg-surface-secondary', hex: '#ebe9e4', canonical: 'var(--mg-color-background-secondary)' },
  // --mg-color-primary-light + #7a9082 → --mg-color-brand-olive-muted (brand-olive 변형, ΔE 작음)
  { tokenName: '--mg-color-primary-light', hex: '#7a9082', canonical: 'var(--mg-color-brand-olive-muted)' },

  // ── D10 P2-a (2026-05-23, §C1 mg-* manual-review SAFE 통합 7쌍 / 9건) ───
  // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §2.1 + §4 C1=a (신설 최소화),
  //       docs/project-management/2026-05-23/D10_P1_DESIGN_HANDOFF.md §2 C1,
  //       docs/project-management/2026-05-23/D10_P0_INVENTORY.md §1 (SAFE 9건).
  // mg-* manual-review 16건 중 SAFE 통합 7쌍을 기존 캐노니컬 또는 D10 신설 토큰으로 흡수.
  // HOLD 7쌍 (`--mg-purple-light` `#ede9fe` / `--mg-custom-*` 4종 / `--mg-purple-500`
  // `#6f42c1` / `--mg-color-accent-main` `#8b7355`) 은 본 매핑 의도적 제외 (HARD_EXCLUDE 보존,
  // 본 파일 상단 HARD_EXCLUDE_TOKENS_PRESERVED 주석 참조).

  // P0 §1 row 1 — Bootstrap danger 잔재 통합 (2건, ModernDashboardEditor.css)
  { tokenName: '--mg-color-danger-dark', hex: '#c82333', canonical: 'var(--mg-color-error-dark)' },
  // P0 §1 row 2 — brand olive-gray 통합 (2건, ModernDashboardEditor.css)
  { tokenName: '--mg-color-text-tertiary', hex: '#8a9a90', canonical: 'var(--mg-color-text-secondary)' },
  // P0 §1 row 4 — Tailwind success 통합 (1건, DashboardFormModal.css)
  { tokenName: '--mg-success', hex: '#22c55e', canonical: 'var(--mg-color-success)' },
  // P0 §1 row 5 — V2 actual hex (Tailwind emerald-600), D10 §C2 신설 success-700 으로 흡수 (1건)
  { tokenName: '--mg-success-dark', hex: '#16a34a', canonical: 'var(--mg-color-success-700)' },
  // P0 §1 row 6 — text-secondary 표준 보조 통합 (1건, ConsultationRecordScreen.js)
  { tokenName: '--mg-color-text-secondary', hex: '#888', canonical: 'var(--mg-color-text-secondary)' },
  // P0 §1 row 11 — Bootstrap warning orange 잔재, D10 §C2 신설 warning-600 으로 흡수 (1건)
  { tokenName: '--mg-warning-500', hex: '#fd7e14', canonical: 'var(--mg-color-warning-600)' },
  // P0 §1 row 14 — text-secondary 표준 보조 통합 (1건, Homepage.css)
  { tokenName: '--mg-text-secondary', hex: '#555555', canonical: 'var(--mg-color-text-secondary)' }
];

// ── D10 P2-c (2026-05-23): R-2 other 그룹 폴백 alias 대체 SAFE_PAIRS 화이트리스트 ───
// SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §2.5 + §9 C6=b/C7=a/C8=a,
//       docs/project-management/2026-05-23/D10_P1_DESIGN_HANDOFF.md §5 (P2-c B0KlA),
//       docs/project-management/2026-05-23/D10_P0_INVENTORY.md §6 (R-2 other 156건).
// 본 화이트리스트는 `--r2-other-alias-replace` 옵션이 명시될 때에만 사용된다.
// 옵션 미지정 시 D8 PR-B / D9 P2-a / D9 P2-b/c / D10 P2-a 동작은 100% 유지된다.
//
// T-CS-Theme-Other 표준 SAFE 70%+ 광역 (C6=b 결정 답습):
//   §6.2 SAFE 화이트리스트 12쌍 (캐노니컬 존재, replaceable: true) 광역 흡수 +
//   §6.3.a B0KlA palette 신설 6쌍 + 통합 8쌍 + HARD_EXCLUDE 1쌍 +
//   §6.3.b color-* legacy 통합 13쌍 (모호 2쌍 HARD_EXCLUDE 보존)
//
// 분류 기준:
//   - Group A (B0KlA new): D10 §C7 신설 6종 (--mg-color-b0kla-*) 흡수
//   - Group B (B0KlA merge): B0KlA → 기존 캐노니컬 통합 (P1 §5.5, ΔE endorsed)
//   - Group C (SAFE white-list): §6.2 캐노니컬 일치 12쌍 광역 흡수
//   - Group D (color-* legacy merge): §6.3.b legacy alias 통합 (광역)
//
// HARD_EXCLUDE 보존 (본 화이트리스트 의도적 제외):
//   - `--ad-b0kla-green` + `#0d9488` (teal-600 변형, 1건) — teal 패밀리 부재, D11 검토
//   - `--ios-*-dark` 6쌍 / 9건 — C8=a 다크 전용 시맨틱, D11 iOS theme 재설계 이월
//   - `--color-primary-hover` + `#0056cc` (5건) — primary hover 시맨틱 모호, 보수 보존
//   - `--color-border-accent` + `#a1a1a6` (1건) — neutral-400 변형, 캐노니컬 부재 보수 보존
//
// 본 화이트리스트에 없는 (token, hex) 쌍은 본 옵션 사용 시에도 절대 변환되지 않는다.
const R2_OTHER_ALIAS_SAFE_PAIRS = [
  // ── Group A: B0KlA palette 신설 6쌍 (P1 §5.7.2 신설 흡수, 28건) ─────────────
  // SSOT 정의: unified-design-tokens.css §D10 §C7 블록 (라이트·다크 양방향 cascade)
  // 라이트 hex 정확 일치, 다크 cascade 신규 정착 (admin 다크 가시성 향상)
  { tokenName: '--ad-b0kla-green', hex: '#4b745c', canonical: 'var(--mg-color-b0kla-green-500)' },
  { tokenName: '--ad-b0kla-orange', hex: '#e8a87c', canonical: 'var(--mg-color-b0kla-orange-300)' },
  { tokenName: '--ad-b0kla-blue', hex: '#6d9dc5', canonical: 'var(--mg-color-b0kla-blue-400)' },
  { tokenName: '--ad-b0kla-green-bg', hex: '#ebf2ee', canonical: 'var(--mg-color-b0kla-green-50)' },
  { tokenName: '--ad-b0kla-orange-bg', hex: '#fcf3ed', canonical: 'var(--mg-color-b0kla-orange-50)' },
  { tokenName: '--ad-b0kla-blue-bg', hex: '#f0f5f9', canonical: 'var(--mg-color-b0kla-blue-50)' },

  // ── Group B: B0KlA → 기존 캐노니컬 통합 8쌍 (P1 §5.5, 26건) ──────────────────
  // P1 endorsed ΔE 시프트 — admin SSOT 시각 변화 LOW~MEDIUM (P3 시각 회귀 게이트)
  // slate-500 #64748b → brand olive-gray #5C6B61 (D9 P2-b/c 답습 톤 시프트, 가독성 유지)
  { tokenName: '--ad-b0kla-text-secondary', hex: '#64748b', canonical: 'var(--mg-color-text-secondary)' },
  // warm bg #fcfbfa → background-main #faf9f7 (ΔE ≈ 1.2 미세)
  { tokenName: '--ad-b0kla-bg', hex: '#fcfbfa', canonical: 'var(--mg-color-background-main)' },
  // gray-400 placeholder → text-tertiary tier 정합 (P1 §5.5 ΔE 작음)
  { tokenName: '--ad-b0kla-placeholder', hex: '#a0aec0', canonical: 'var(--mg-color-text-tertiary)' },
  // 라이트 hex 정확 일치 #f5f3ef → surface-main #F5F3EF (case-insensitive, 시각 변화 0)
  { tokenName: '--ad-b0kla-card-bg', hex: '#f5f3ef', canonical: 'var(--mg-color-surface-main)' },
  // P0 §6.2 SAFE — slate-700 #4a5568 → text-secondary-dark #374151 (icon 시맨틱 유지)
  { tokenName: '--ad-b0kla-icon-color', hex: '#4a5568', canonical: 'var(--mg-color-text-secondary-dark)' },
  // P0 §6.2 SAFE — slate-700 #4a5568 → text-secondary-dark (위 동일)
  { tokenName: '--ad-b0kla-text-secondary', hex: '#4a5568', canonical: 'var(--mg-color-text-secondary-dark)' },
  // P0 §6.2 SAFE — slate-800 #2d3748 → text-main #2C2C2C (ΔE ≈ 3 warm-neutral 시프트)
  { tokenName: '--ad-b0kla-title-color', hex: '#2d3748', canonical: 'var(--mg-color-text-main)' },
  // P0 §6.2 SAFE — slate-200 #e2e8f0 → border-main #D4CFC8 (ΔE ≈ 5 warm beige 시프트)
  { tokenName: '--ad-b0kla-border', hex: '#e2e8f0', canonical: 'var(--mg-color-border-main)' },

  // ── Group C: T-CS-Theme-Other §6.2 SAFE 화이트리스트 10쌍 (74건 중 캐노니컬 일치) ──
  // P0 §6.2 인벤토리 SSOT (`groups.other.autoReplaceable` 정확 일치)
  // 라이트 hex 정확 일치 또는 ΔE 작은 endorsed 시프트
  { tokenName: '--text-secondary', hex: '#666', canonical: 'var(--mg-color-text-secondary)' },
  { tokenName: '--text-primary', hex: '#333', canonical: 'var(--mg-color-text-main)' },
  { tokenName: '--color-text-secondary', hex: '#666', canonical: 'var(--mg-color-text-secondary)' },
  { tokenName: '--color-border', hex: '#ddd', canonical: 'var(--mg-color-border-main)' },
  { tokenName: '--color-text', hex: '#333', canonical: 'var(--mg-color-text-main)' },
  { tokenName: '--bg-hover', hex: '#f0f0f0', canonical: 'var(--mg-color-surface-light)' },
  { tokenName: '--text-secondary', hex: '#999', canonical: 'var(--mg-color-text-tertiary)' },
  { tokenName: '--color-text-primary', hex: '#333', canonical: 'var(--mg-color-text-main)' },
  { tokenName: '--color-background-alt', hex: '#f3f4f6', canonical: 'var(--mg-color-background-main)' },
  { tokenName: '--cs-secondary-400', hex: '#9ca3af', canonical: 'var(--mg-color-text-tertiary)' },

  // ── Group D: §6.3.b color-* legacy 통합 매핑 (C6=b 표준 SAFE 70%+ 광역) ─────
  // legacy color- 접두 alias 흡수 — D2 라운드 진입 이전 변형. ΔE 작거나 시맨틱 정합.
  // ΔE 미세 endorsed (P0 §6.4 표준 시나리오) — warm/neutral 시프트는 D5/D6 답습.

  // #fafafa → background-main #faf9f7 (5건, ΔE 미세)
  { tokenName: '--color-bg-primary', hex: '#fafafa', canonical: 'var(--mg-color-background-main)' },
  // #f5f5f7 → background-secondary #EBE6E0 (5건, warm bg 시프트 endorsed)
  { tokenName: '--color-bg-secondary', hex: '#f5f5f7', canonical: 'var(--mg-color-background-secondary)' },
  // Apple gray-800 #424245 → text-main #2C2C2C (4건, neutral 시프트)
  { tokenName: '--color-text-secondary', hex: '#424245', canonical: 'var(--mg-color-text-main)' },
  // Apple gray-200 #e8e8ed → border-soft #f3f4f6 (3건, D10 §C3 신설 토큰)
  { tokenName: '--color-border-secondary', hex: '#e8e8ed', canonical: 'var(--mg-color-border-soft)' },
  // Bootstrap gray-600 #5a6268 → text-secondary (2건)
  { tokenName: '--color-gray-dark', hex: '#5a6268', canonical: 'var(--mg-color-text-secondary)' },
  // Tailwind slate-900 #111827 → text-main (2건)
  { tokenName: '--color-text-primary', hex: '#111827', canonical: 'var(--mg-color-text-main)' },
  // Bootstrap success-700 #218838 → D10 §C2 신설 success-700 (1건, 시맨틱 정합)
  { tokenName: '--color-success-dark', hex: '#218838', canonical: 'var(--mg-color-success-700)' },
  // Bootstrap danger-700 #c82333 → error-dark (1건)
  { tokenName: '--color-danger-dark', hex: '#c82333', canonical: 'var(--mg-color-error-dark)' },
  // Bootstrap warning-700 #e0a800 → D10 §C2 신설 warning-700 (1건, 시맨틱 정합)
  { tokenName: '--color-warning-dark', hex: '#e0a800', canonical: 'var(--mg-color-warning-700)' },
  // Apple gray-300 #d1d1d6 → border-main (1건)
  { tokenName: '--color-border-primary', hex: '#d1d1d6', canonical: 'var(--mg-color-border-main)' },
  // Apple gray-200 #e8e8ed → border-soft (1건, 동일 hex 다른 토큰)
  { tokenName: '--color-bg-accent', hex: '#e8e8ed', canonical: 'var(--mg-color-border-soft)' },
  // Bootstrap danger-700 #c82333 → error-dark (1건, error-hover 시맨틱 → dark 통합)
  { tokenName: '--error-hover', hex: '#c82333', canonical: 'var(--mg-color-error-dark)' },
  // Bootstrap info-700 #138496 → info-dark #1e40af (1건, blue-800 시프트, P1 §C1 답습)
  { tokenName: '--color-info-dark', hex: '#138496', canonical: 'var(--mg-color-info-dark)' }
];

function escapeRegexLiteral(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSafePairRegex(tokenName, hex) {
  // var(--token, #hex) 패턴 — 공백 변형 허용 + 케이스 무시 + 인접 hex 문자 가드.
  return new RegExp(
    `var\\s*\\(\\s*${escapeRegexLiteral(tokenName)}\\s*,\\s*${escapeRegexLiteral(hex)}(?![0-9a-fA-F])\\s*\\)`,
    'gi'
  );
}

// ── D4 인프라 보강: rgb()/rgba() 변형 매칭 헬퍼 ─────────────────────────────────
// RGB_MAPPING 키는 카논 형식(`rgba(R, G, B, A)`)만 다루지만, 실 코드에는
// 다양한 공백·소수점 표기 변형(`rgba(0,0,0,.1)`·`rgba(0, 0, 0, 0.1)` 등)이
// 혼재한다. 각 키를 파싱해 다음 변형을 모두 매칭하는 정규식으로 변환한다:
//   - 콤마/괄호 주변 공백 0~다수
//   - 소수의 leading-zero 옵션 (`0.1` ↔ `.1`)
//   - 정수 채널: lookbehind/lookahead 가드로 `0` 가 `10`·`100`의 부분 매칭 방지
// 카논 입력(매핑 키 자체)이 위 정규식에 매칭됨이 보장되며, 치환 결과는 항상
// 카논 var(--token) 한 종류이므로 동일 입력에 동일 출력(R-2 정신 연장).
function buildRgbRegex(rgbColor) {
  const parsed = rgbColor.match(
    /^(rgba?)\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i
  );
  if (!parsed) {
    return new RegExp(rgbColor.replace(/[()]/g, '\\$&'), 'gi');
  }
  const [, fn, r, g, b, a] = parsed;
  const ws = '\\s*';
  const numToken = (val) => {
    const num = parseFloat(val);
    if (Number.isInteger(num)) {
      return `(?<![0-9.])${num}(?![0-9.])`;
    }
    const decPart = num.toString().split('.')[1];
    return `0?\\.${decPart}`;
  };
  const parts = [numToken(r), numToken(g), numToken(b)];
  if (a !== undefined) parts.push(numToken(a));
  const pattern = `${fn}${ws}\\(${ws}${parts.join(`${ws},${ws}`)}${ws}\\)`;
  return new RegExp(pattern, 'gi');
}

class HardcodedColorConverter {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backup: options.backup !== false,
      verbose: options.verbose || false,
      criticalOnly: options.criticalOnly || false,
      target: options.target || null,
      r2MgAliasReplace: options.r2MgAliasReplace || false,
      r2MgAliasBcReplace: options.r2MgAliasBcReplace || false,
      r2V2AliasReplace: options.r2V2AliasReplace || false,
      r2OtherAliasReplace: options.r2OtherAliasReplace || false,
      ...options
    };

    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      colorsConverted: 0,
      backupsCreated: 0,
      errors: [],
      perMappingCounts: {},
      // 매핑 후에도 남은 hex 색상 카운트 (3·4·6·8자리 모두)
      // 회색 3자리(#666·#333·#000·#ccc·#999·#eee 등)가 매핑 테이블에 없을 때
      // dry-run에서 정확히 추적되도록 함 (D3 합의서 적용 라운드 데이터 소스)
      residualHexCounts: {},
      // 시각 QA R-2: `var(--token, #hex)` 폴백 위치에서 치환 대상에서 제외된 hex 개수.
      // dry-run 시 D3 적용 라운드에서 어떤 hex 가 폴백 안에 들어 있어 보호됐는지 추적.
      protectedVarFallbacks: 0,
      protectedVarFallbackHexCounts: {},
      // D8 PR-B 단계 1: R-2 mg-* 폴백 alias 대체 통계.
      // 본 옵션 사용 시 SAFE_PAIRS 화이트리스트로 치환된 쌍별 카운트.
      r2MgAliasReplaced: 0,
      r2MgAliasPairCounts: {},
      // D9 P2-a: R-2 mg-v2-* 폴백 alias 대체 통계.
      // 본 옵션(`--r2-v2-alias-replace`) 사용 시 SAFE_PAIRS 화이트리스트로 치환된 쌍별 카운트.
      r2V2AliasReplaced: 0,
      r2V2AliasPairCounts: {},
      // D9 P2-b + P2-c: R-2 mg-* 폴백 BC SAFE_PAIRS alias 대체 통계.
      // 본 옵션(`--r2-mg-alias-bc-replace`) 사용 시 R2_MG_ALIAS_BC_SAFE_PAIRS 로 치환된 쌍별 카운트.
      r2MgAliasBcReplaced: 0,
      r2MgAliasBcPairCounts: {},
      // D10 P2-c: R-2 other 그룹 폴백 SAFE_PAIRS alias 대체 통계.
      // 본 옵션(`--r2-other-alias-replace`) 사용 시 R2_OTHER_ALIAS_SAFE_PAIRS 로 치환된 쌍별 카운트.
      r2OtherAliasReplaced: 0,
      r2OtherAliasPairCounts: {}
    };
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    console.log('🔄 하드코딩된 색상값 자동 변환 시작...\n');
    
    if (this.options.dryRun) {
      console.log('🧪 DRY RUN 모드 - 실제 파일은 수정되지 않습니다.\n');
    }

    const startTime = Date.now();

    // 파일 검색
    const files = await this.findFiles();
    console.log(`📁 처리 대상 파일: ${files.length}개\n`);

    // 각 파일 처리
    for (const file of files) {
      await this.processFile(file);
    }

    // 결과 리포트
    this.generateReport();

    const endTime = Date.now();
    console.log(`\n✅ 변환 완료 (${endTime - startTime}ms)`);
  }

  /**
   * 처리할 파일들 찾기
   *
   * - `--target <path>` 가 주어지면 해당 디렉터리(또는 파일) 하위로만 한정한다 (반복 지정 가능).
   * - 토큰 정의 파일(`styles/unified-design-tokens.css`, `styles/tokens/**`, `styles/themes/**`,
   *   루트 외 `tokens/**`, `themes/**`) 과 테스트 파일(`__tests__/**`, `*.test.*`, `*.spec.*`)
   *   은 절대 변환하지 않는다 (인벤토리 §6).
   */
  async findFiles() {
    const exts = ['css', 'scss', 'js', 'jsx', 'ts', 'tsx'];
    const rawTargets = this.options.target
      ? (Array.isArray(this.options.target) ? this.options.target : [this.options.target])
      : [null];

    let allFiles = [];

    for (const rawTarget of rawTargets) {
      const base = rawTarget ? rawTarget.replace(/\/+$/, '') : 'frontend/src';

      try {
        const stat = fs.statSync(base);
        if (stat.isFile()) {
          if (exts.some(ext => base.endsWith('.' + ext))) {
            allFiles.push(base);
          }
          continue;
        }
      } catch (_) {
        // 존재하지 않으면 glob 으로 fall-through
      }

      for (const ext of exts) {
        const pattern = `${base}/**/*.${ext}`;
        const files = glob.sync(pattern, {
          ignore: EXCLUDE_PATTERNS,
          cwd: process.cwd()
        });
        allFiles = allFiles.concat(files);
      }
    }

    // 안전망: 절대 변환 금지 영역 (인벤토리 §6 + 작업 정의서 §치환 규칙)
    // T1 2차 라운드 회귀 사고(§6.2)에서 codemod가 토큰 정의 파일을 휩쓸어
    // `--mg-white: var(--mg-white)` 같은 순환 참조를 만든 사례를 재발 방지.
    const HARD_EXCLUDE = [
      // ── 명시적 토큰 정의 파일 (T1 2차 §6.2 되돌린 7개 파일) ──
      /\bfrontend\/src\/styles\/unified-design-tokens\.css$/,
      /\bfrontend\/src\/styles\/dashboard-tokens-extension\.css$/,
      /\bfrontend\/src\/styles\/responsive-layout-tokens\.css$/,
      /\bfrontend\/src\/styles\/mindgarden-design-system\.css$/,
      /\bfrontend\/src\/styles\/00-core\/_variables\.css$/,
      /\bfrontend\/src\/styles\/00-core\/_component-variables\.css$/,
      /\bfrontend\/src\/styles\/common\/variables\.css$/,
      /\bfrontend\/src\/constants\/css-variables\.js$/,

      // ── 일반 패턴 (forward-looking) — 신규 토큰/변수/디자인시스템 파일도 자동 보호 ──
      // 파일명에 tokens/variables/design-system 키워드를 포함하는 CSS는 정의 파일로 간주
      /(?:^|\/)[^/]*tokens[^/]*\.css$/i,
      /(?:^|\/)[^/]*variables[^/]*\.css$/i,
      /(?:^|\/)[^/]*design-system[^/]*\.css$/i,

      // ── 디렉터리 단위 보호 영역 ──
      /\bfrontend\/src\/styles\/tokens\//,
      /\bfrontend\/src\/styles\/themes\//,
      /\bfrontend\/src\/tokens\//,
      /\bfrontend\/src\/themes\//,
      /(?:^|\/)tokens\//,
      /(?:^|\/)themes\//,

      // ── 테스트·스토리북 ──
      /\/__tests__\//,
      /\.test\.(js|jsx|ts|tsx)$/,
      /\.spec\.(js|jsx|ts|tsx)$/,
      /\.stories\.(js|jsx|ts|tsx|mdx)$/
    ];
    allFiles = allFiles.filter(f => !HARD_EXCLUDE.some(rx => rx.test(f)));

    if (this.options.criticalOnly) {
      allFiles = allFiles.filter(file => this.isCriticalFile(file));
    }

    return [...new Set(allFiles)];
  }

  /**
   * 중요 파일 여부 확인
   */
  isCriticalFile(filePath) {
    const criticalPatterns = [
      /branding/i,
      /design-system/i,
      /theme/i,
      /color/i,
      /css-variables/i,
      /constants.*css/i,
      /mindgarden.*css/i
    ];

    return criticalPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * 개별 파일 처리
   */
  async processFile(filePath) {
    try {
      this.stats.filesProcessed++;
      
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = originalContent;
      let changeCount = 0;

      // ── 0단계 (D8 PR-B 단계 1): R-2 mg-* 폴백 alias 대체 ──────────────────────
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D8.md §2.3 + §4 C3
      // `--r2-mg-alias-replace` 옵션이 지정된 경우에만 SAFE_PAIRS 화이트리스트로
      // `var(--legacy, #hex)` → `var(--canonical)` 일괄 치환을 수행한다.
      // 화이트리스트에 없는 쌍은 절대 변환되지 않으며, 1단계 R-2 보호로 폴백 인계.
      // 본 단계가 1단계보다 먼저 실행되어야 placeholder 치환 전에 원문 패턴 매칭 가능.
      if (this.options.r2MgAliasReplace) {
        for (const pair of R2_MG_ALIAS_SAFE_PAIRS) {
          const regex = buildSafePairRegex(pair.tokenName, pair.hex);
          const matches = modifiedContent.match(regex);
          if (matches && matches.length > 0) {
            modifiedContent = modifiedContent.replace(regex, pair.canonical);
            changeCount += matches.length;
            this.stats.r2MgAliasReplaced += matches.length;
            const pairKey = `${pair.tokenName}|${pair.hex}`;
            this.stats.r2MgAliasPairCounts[pairKey] =
              (this.stats.r2MgAliasPairCounts[pairKey] || 0) + matches.length;
            if (this.options.verbose) {
              console.log(`  🔁 R-2 alias 대체: var(${pair.tokenName}, ${pair.hex}) → ${pair.canonical} (${matches.length}개, ${filePath})`);
            }
          }
        }
      }

      // ── 0단계-v2 (D9 P2-a): R-2 mg-v2-* 폴백 alias 대체 ───────────────────────
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1 + §4 C1=b
      // `--r2-v2-alias-replace` 옵션이 지정된 경우에만 R2_V2_ALIAS_SAFE_PAIRS 화이트리스트로
      // `var(--mg-v2-*, #hex)` → `var(--mg-color-*)` 일괄 치환을 수행한다.
      // 본 단계도 1단계(R-2 placeholder)보다 먼저 실행되어 원문 패턴 매칭 가능.
      if (this.options.r2V2AliasReplace) {
        for (const pair of R2_V2_ALIAS_SAFE_PAIRS) {
          const regex = buildSafePairRegex(pair.tokenName, pair.hex);
          const matches = modifiedContent.match(regex);
          if (matches && matches.length > 0) {
            modifiedContent = modifiedContent.replace(regex, pair.canonical);
            changeCount += matches.length;
            this.stats.r2V2AliasReplaced += matches.length;
            const pairKey = `${pair.tokenName}|${pair.hex}`;
            this.stats.r2V2AliasPairCounts[pairKey] =
              (this.stats.r2V2AliasPairCounts[pairKey] || 0) + matches.length;
            if (this.options.verbose) {
              console.log(`  🔁 R-2 v2 alias 대체: var(${pair.tokenName}, ${pair.hex}) → ${pair.canonical} (${matches.length}개, ${filePath})`);
            }
          }
        }
      }

      // ── 0단계-bc (D9 P2-b + P2-c): R-2 mg-* 폴백 BC SAFE_PAIRS alias 대체 ─────
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1·§2.2 + §4 C2·C3
      // `--r2-mg-alias-bc-replace` 옵션이 지정된 경우에만 R2_MG_ALIAS_BC_SAFE_PAIRS
      // 화이트리스트로 `var(--mg-*, #hex)` → `var(--mg-color-*)` 일괄 치환을 수행한다.
      // 본 단계도 1단계(R-2 placeholder)보다 먼저 실행되어 원문 패턴 매칭 가능.
      // D8 PR-B 단계 1 / D9 P2-a 답습 패턴 (옵션 분리로 단계적 흡수, 광역 위험 격리).
      if (this.options.r2MgAliasBcReplace) {
        for (const pair of R2_MG_ALIAS_BC_SAFE_PAIRS) {
          const regex = buildSafePairRegex(pair.tokenName, pair.hex);
          const matches = modifiedContent.match(regex);
          if (matches && matches.length > 0) {
            modifiedContent = modifiedContent.replace(regex, pair.canonical);
            changeCount += matches.length;
            this.stats.r2MgAliasBcReplaced += matches.length;
            const pairKey = `${pair.tokenName}|${pair.hex}`;
            this.stats.r2MgAliasBcPairCounts[pairKey] =
              (this.stats.r2MgAliasBcPairCounts[pairKey] || 0) + matches.length;
            if (this.options.verbose) {
              console.log(`  🔁 R-2 mg-* BC alias 대체: var(${pair.tokenName}, ${pair.hex}) → ${pair.canonical} (${matches.length}개, ${filePath})`);
            }
          }
        }
      }

      // ── 0단계-other (D10 P2-c): R-2 other 그룹 폴백 SAFE_PAIRS alias 대체 ─────
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §2.5 + §9 C6=b/C7=a
      // `--r2-other-alias-replace` 옵션이 지정된 경우에만 R2_OTHER_ALIAS_SAFE_PAIRS
      // 화이트리스트로 `var(--{ad-b0kla,text,color,bg,cs,error}-*, #hex)` →
      // `var(--mg-color-*)` 일괄 치환을 수행한다.
      // 본 단계도 1단계(R-2 placeholder)보다 먼저 실행되어 원문 패턴 매칭 가능.
      // D8 PR-B / D9 P2-a/b/c / D10 P2-a 답습 패턴 (단계적 흡수, 광역 위험 격리).
      // T-CS-Theme-Other 표준 SAFE 70%+ 광역 (C6=b 결정) + B0KlA palette 신설 (C7=a).
      if (this.options.r2OtherAliasReplace) {
        for (const pair of R2_OTHER_ALIAS_SAFE_PAIRS) {
          const regex = buildSafePairRegex(pair.tokenName, pair.hex);
          const matches = modifiedContent.match(regex);
          if (matches && matches.length > 0) {
            modifiedContent = modifiedContent.replace(regex, pair.canonical);
            changeCount += matches.length;
            this.stats.r2OtherAliasReplaced += matches.length;
            const pairKey = `${pair.tokenName}|${pair.hex}`;
            this.stats.r2OtherAliasPairCounts[pairKey] =
              (this.stats.r2OtherAliasPairCounts[pairKey] || 0) + matches.length;
            if (this.options.verbose) {
              console.log(`  🔁 R-2 other alias 대체: var(${pair.tokenName}, ${pair.hex}) → ${pair.canonical} (${matches.length}개, ${filePath})`);
            }
          }
        }
      }

      // ── 1단계 (R-2): var(--token, #hex) 폴백 보호 ─────────────────────────────
      // 매핑 적용 전에 폴백 hex 위치를 placeholder 로 임시 치환하여
      // `var(--cs-error-600, #dc2626)` → `var(--cs-error-600, var(--mg-color-error))`
      // 같은 nested var 부작용을 차단한다. (시각 QA 보고서 §6 R-2)
      // 보호 토큰은 hex/rgb/매핑 정규식 어디에도 매칭되지 않는 ASCII 식별자다.
      const fallbackPlaceholders = new Map();
      let fallbackCounter = 0;
      modifiedContent = modifiedContent.replace(VAR_FALLBACK_HEX_PATTERN, (match) => {
        const placeholder = `${VAR_FALLBACK_PLACEHOLDER_PREFIX}${fallbackCounter++}${VAR_FALLBACK_PLACEHOLDER_SUFFIX}`;
        fallbackPlaceholders.set(placeholder, match);
        // 보호된 hex 통계 (dry-run 보고서·로그용)
        const hexMatch = match.match(/#[0-9a-fA-F]{3,8}/);
        if (hexMatch) {
          const hex = hexMatch[0].toLowerCase();
          this.stats.protectedVarFallbackHexCounts[hex] =
            (this.stats.protectedVarFallbackHexCounts[hex] || 0) + 1;
        }
        return placeholder;
      });
      if (fallbackPlaceholders.size > 0) {
        this.stats.protectedVarFallbacks += fallbackPlaceholders.size;
        if (this.options.verbose) {
          console.log(`  🛡️  R-2 폴백 보호: ${fallbackPlaceholders.size}건 (${filePath})`);
        }
      }

      // ── 2단계: HEX/RGB 매핑 적용 ──────────────────────────────────────────────
      // HEX 색상 변환
      // 안전성: 매핑 키 길이 내림차순(8→6→3) + 앞뒤가 hex 문자가 아닐 때만 치환
      // → `#1a1a1a` 가 `#1a1a1aff` 의 일부로 잘못 잡히는 케이스 방지
      const orderedHex = Object.entries(COLOR_MAPPING).sort((a, b) => b[0].length - a[0].length);
      orderedHex.forEach(([hexColor, cssVar]) => {
        const escaped = hexColor.replace(/[#]/g, '\\$&');
        const regex = new RegExp(`(?<![0-9a-fA-F])${escaped}(?![0-9a-fA-F])`, 'gi');
        const matches = modifiedContent.match(regex);
        if (matches) {
          modifiedContent = modifiedContent.replace(regex, cssVar);
          changeCount += matches.length;
          this.stats.perMappingCounts[hexColor] = (this.stats.perMappingCounts[hexColor] || 0) + matches.length;

          if (this.options.verbose) {
            console.log(`  🎨 ${hexColor} → ${cssVar} (${matches.length}개)`);
          }
        }
      });

      // RGB/RGBA 색상 변환 (D4 인프라 보강 — 공백·소수점 변형 자동 매칭)
      // buildRgbRegex 는 카논 키를 변형 허용 정규식으로 변환한다.
      // 치환 결과는 항상 카논 var(--token) 이므로 동일 입력에 동일 출력 보장.
      Object.entries(RGB_MAPPING).forEach(([rgbColor, cssVar]) => {
        const regex = buildRgbRegex(rgbColor);
        const matches = modifiedContent.match(regex);
        if (matches) {
          modifiedContent = modifiedContent.replace(regex, cssVar);
          changeCount += matches.length;
          this.stats.perMappingCounts[rgbColor] = (this.stats.perMappingCounts[rgbColor] || 0) + matches.length;

          if (this.options.verbose) {
            console.log(`  🎨 ${rgbColor} → ${cssVar} (${matches.length}개)`);
          }
        }
      });

      // 잔존 hex 카운트 (매핑 후에도 남아 있는 hex 색상)
      // - 회색 3자리(#666·#333·#000·#ccc·#999·#eee 등) 미매핑 항목 추적
      // - 8자리 alpha 포함 hex(#1a1a1aff) 등 lookbehind 가드로 변환 제외된 케이스 추적
      // - 정규식: `#` 다음 hex 문자 시퀀스, 뒤에 hex 문자가 더 없을 때만 (lookbehind는 불필요)
      // - R-2: placeholder 가 남아 있는 상태에서 카운트하므로 폴백 hex 는 잔존에서 제외된다
      //        (의도된 폴백은 잔존 hex 가 아니라 protectedVarFallbacks 로 별도 추적).
      const residualHexRegex = /#[0-9a-fA-F]+(?![0-9a-fA-F])/g;
      const residualMatches = modifiedContent.match(residualHexRegex) || [];
      residualMatches.forEach(raw => {
        const hex = raw.toLowerCase();
        const len = hex.length - 1; // '#' 제외
        if (![3, 4, 6, 8].includes(len)) return;
        this.stats.residualHexCounts[hex] = (this.stats.residualHexCounts[hex] || 0) + 1;
      });

      // ── 3단계 (R-2): placeholder 를 원본 var(--token, #hex) 폴백으로 복원 ─────
      // 보호된 폴백 위치는 codemod 변환 대상에서 제외했으므로 1단계에서 임시 치환한
      // 문자열을 그대로 원본으로 되돌린다. 동작 변경 0건이 되도록 placeholder 순서대로 복원.
      if (fallbackPlaceholders.size > 0) {
        for (const [placeholder, original] of fallbackPlaceholders) {
          modifiedContent = modifiedContent.split(placeholder).join(original);
        }
        // 방어 로직: 어떤 이유로든 placeholder 잔존 시 즉시 실패시켜
        // 잘못된 내용을 저장하지 않도록 한다 (T1 2차 §6 회귀 사고 재발 방지 정신).
        if (modifiedContent.includes(VAR_FALLBACK_PLACEHOLDER_PREFIX)) {
          throw new Error(
            `var() 폴백 placeholder 복원 실패: ${filePath} — 보호 토큰이 잔존함`
          );
        }
      }

      // 변경사항이 있는 경우 처리
      if (changeCount > 0) {
        this.stats.filesModified++;
        this.stats.colorsConverted += changeCount;

        console.log(`📝 ${filePath} - ${changeCount}개 색상 변환`);

        if (!this.options.dryRun) {
          // 백업 생성
          if (this.options.backup) {
            await this.createBackup(filePath, originalContent);
          }

          // 파일 저장
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
        }
      }

    } catch (error) {
      this.stats.errors.push({
        file: filePath,
        error: error.message
      });
      console.error(`❌ 파일 처리 실패: ${filePath} - ${error.message}`);
    }
  }

  /**
   * 백업 파일 생성
   */
  async createBackup(filePath, content) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    
    try {
      fs.writeFileSync(backupPath, content, 'utf8');
      this.stats.backupsCreated++;
      
      if (this.options.verbose) {
        console.log(`💾 백업 생성: ${backupPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  백업 생성 실패: ${backupPath} - ${error.message}`);
    }
  }

  /**
   * 결과 리포트 생성
   */
  generateReport() {
    console.log('\n📊 변환 결과 리포트');
    console.log('='.repeat(50));
    
    console.log(`📁 처리된 파일: ${this.stats.filesProcessed}개`);
    console.log(`📝 수정된 파일: ${this.stats.filesModified}개`);
    console.log(`🎨 변환된 색상: ${this.stats.colorsConverted}개`);
    console.log(`💾 생성된 백업: ${this.stats.backupsCreated}개`);
    console.log(`🛡️  R-2 폴백 보호: ${this.stats.protectedVarFallbacks}건`);
    if (this.options.r2MgAliasReplace) {
      console.log(`🔁 R-2 mg-* alias 대체: ${this.stats.r2MgAliasReplaced}건`);
    }
    if (this.options.r2V2AliasReplace) {
      console.log(`🔁 R-2 mg-v2-* alias 대체: ${this.stats.r2V2AliasReplaced}건`);
    }
    if (this.options.r2MgAliasBcReplace) {
      console.log(`🔁 R-2 mg-* BC alias 대체: ${this.stats.r2MgAliasBcReplaced}건`);
    }
    if (this.options.r2OtherAliasReplace) {
      console.log(`🔁 R-2 other alias 대체: ${this.stats.r2OtherAliasReplaced}건`);
    }
    console.log(`❌ 오류 발생: ${this.stats.errors.length}개`);

    if (this.options.r2MgAliasReplace && this.stats.r2MgAliasReplaced > 0) {
      const aliasPairs = Object.entries(this.stats.r2MgAliasPairCounts).sort((a, b) => b[1] - a[1]);
      console.log('\n🔁 R-2 mg-* alias 대체 — 쌍별 분포:');
      aliasPairs.forEach(([key, count]) => {
        const [token, hex] = key.split('|');
        console.log(`  - var(${token}, ${hex}): ${count}건`);
      });
    }

    if (this.options.r2V2AliasReplace && this.stats.r2V2AliasReplaced > 0) {
      const aliasPairs = Object.entries(this.stats.r2V2AliasPairCounts).sort((a, b) => b[1] - a[1]);
      console.log('\n🔁 R-2 mg-v2-* alias 대체 — 쌍별 분포:');
      aliasPairs.forEach(([key, count]) => {
        const [token, hex] = key.split('|');
        console.log(`  - var(${token}, ${hex}): ${count}건`);
      });
    }

    if (this.options.r2MgAliasBcReplace && this.stats.r2MgAliasBcReplaced > 0) {
      const aliasPairs = Object.entries(this.stats.r2MgAliasBcPairCounts).sort((a, b) => b[1] - a[1]);
      console.log('\n🔁 R-2 mg-* BC alias 대체 — 쌍별 분포:');
      aliasPairs.forEach(([key, count]) => {
        const [token, hex] = key.split('|');
        console.log(`  - var(${token}, ${hex}): ${count}건`);
      });
    }

    if (this.options.r2OtherAliasReplace && this.stats.r2OtherAliasReplaced > 0) {
      const aliasPairs = Object.entries(this.stats.r2OtherAliasPairCounts).sort((a, b) => b[1] - a[1]);
      console.log('\n🔁 R-2 other alias 대체 — 쌍별 분포:');
      aliasPairs.forEach(([key, count]) => {
        const [token, hex] = key.split('|');
        console.log(`  - var(${token}, ${hex}): ${count}건`);
      });
    }

    if (this.stats.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      this.stats.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
    }

    // R-2 보호된 var() 폴백 hex 분포 (상위 20건)
    const protectedFallbackEntries = Object.entries(this.stats.protectedVarFallbackHexCounts)
      .sort((a, b) => b[1] - a[1]);
    if (protectedFallbackEntries.length > 0) {
      console.log('\n🛡️  R-2 보호된 var() 폴백 hex — 상위 20건:');
      protectedFallbackEntries.slice(0, 20).forEach(([hex, count]) => {
        console.log(`  - ${hex}: ${count}건`);
      });
    }

    // 잔존 hex 색상 Top 20 (D3 합의서 데이터 소스)
    const residualEntries = Object.entries(this.stats.residualHexCounts)
      .sort((a, b) => b[1] - a[1]);
    if (residualEntries.length > 0) {
      console.log('\n🔍 잔존 hex 색상 (매핑 외) — 상위 20건:');
      residualEntries.slice(0, 20).forEach(([hex, count]) => {
        const lenLabel = hex.length === 4 ? '3자리'
          : hex.length === 5 ? '4자리'
          : hex.length === 7 ? '6자리'
          : hex.length === 9 ? '8자리'
          : '기타';
        console.log(`  - ${hex} (${lenLabel}): ${count}건`);
      });
      const total = residualEntries.reduce((s, [, n]) => s + n, 0);
      const unique = residualEntries.length;
      console.log(`  합계: 고유 ${unique}종 / 총 ${total}건`);
    }

    // 상세 리포트 파일 생성
    this.generateDetailedReport();
  }

  /**
   * 상세 리포트 파일 생성
   *
   * - `--no-report` 가 주어지면 생성하지 않음.
   * - dry-run 결과는 actual 보고서를 덮어쓰지 않도록 별도 경로에 기록.
   *   (직전 라운드의 actual 보고서가 dry-run 결과에 휩쓸려 잔존하던 문제 해소)
   */
  generateDetailedReport() {
    if (this.options.report === false) {
      console.log('\n📄 상세 리포트 생략 (--no-report)');
      return;
    }

    const reportPath = this.options.dryRun
      ? 'docs/COLOR_CONVERSION_DRY_RUN_REPORT.md'
      : 'docs/COLOR_CONVERSION_REPORT.md';

    const residualEntries = Object.entries(this.stats.residualHexCounts)
      .sort((a, b) => b[1] - a[1]);
    const residualSection = residualEntries.length === 0
      ? '잔존 hex 없음 ✅'
      : residualEntries.slice(0, 50).map(([hex, count]) => {
          const lenLabel = hex.length === 4 ? '3자리'
            : hex.length === 5 ? '4자리'
            : hex.length === 7 ? '6자리'
            : hex.length === 9 ? '8자리'
            : '기타';
          return `- \`${hex}\` (${lenLabel}): ${count}건`;
        }).join('\n');
    const residualTotal = residualEntries.reduce((s, [, n]) => s + n, 0);
    const residualUnique = residualEntries.length;

    const protectedFallbackEntries = Object.entries(this.stats.protectedVarFallbackHexCounts)
      .sort((a, b) => b[1] - a[1]);
    const protectedFallbackSection = protectedFallbackEntries.length === 0
      ? '보호된 폴백 hex 없음 (영향 0건)'
      : protectedFallbackEntries.slice(0, 50)
          .map(([hex, count]) => `- \`${hex}\`: ${count}건`)
          .join('\n');

    const targetSummary = Array.isArray(this.options.target) && this.options.target.length > 0
      ? this.options.target.map(t => `\`${t}\``).join(', ')
      : '전체 (`frontend/src`)';

    const report = `# 🎨 색상 변환 리포트

> **생성일**: ${new Date().toISOString()}  
> **모드**: ${this.options.dryRun ? 'DRY RUN' : 'ACTUAL'}  
> **대상 영역**: ${targetSummary}  
> **필터**: ${this.options.criticalOnly ? '중요 파일만' : '전체 파일'}

---

## 📊 변환 결과

| 구분 | 수량 |
|------|------|
| 처리된 파일 | ${this.stats.filesProcessed}개 |
| 수정된 파일 | ${this.stats.filesModified}개 |
| 변환된 색상 | ${this.stats.colorsConverted}개 |
| 생성된 백업 | ${this.stats.backupsCreated}개 |
| R-2 폴백 보호 | ${this.stats.protectedVarFallbacks}건 |
| 오류 발생 | ${this.stats.errors.length}개 |

---

## 🛡️ R-2 — \`var(--token, #hex)\` 폴백 보호

> 시각 QA 보고서 §6 R-2 — 폴백 위치의 hex 가 nested var 로 잘못 치환되는 사고 방지.  
> 본 영역은 codemod 의 HEX 매핑에서 명시적으로 제외된다.  
> D3 적용 라운드처럼 매핑이 늘어나도 폴백 hex 는 안전.

- **보호된 폴백 총 건수**: ${this.stats.protectedVarFallbacks}건
- **보호된 폴백 고유 hex 종 수**: ${protectedFallbackEntries.length}종

${protectedFallbackSection}

---

## 🔍 잔존 hex 색상 (매핑 외)

> 처리 후에도 변환되지 않고 남아 있는 hex 색상.  
> 회색 3자리(\`#666\`·\`#333\`·\`#000\`·\`#ccc\`·\`#999\`·\`#eee\` 등) 미매핑 항목과  
> 4·8자리 alpha 포함 hex 모두 포함. D3 합의서 작성/적용 라운드의 데이터 소스.

- **고유 종 수**: ${residualUnique}종
- **총 건수**: ${residualTotal}건

${residualSection}

---

## 🎯 변환 규칙

### HEX 색상 변환
${Object.entries(COLOR_MAPPING).map(([hex, cssVar]) =>
  `- \`${hex}\` → \`${cssVar}\``
).join('\n')}

### RGB/RGBA 색상 변환  
${Object.entries(RGB_MAPPING).map(([rgb, cssVar]) =>
  `- \`${rgb}\` → \`${cssVar}\``
).join('\n')}

---

## 📋 다음 단계

1. **검증**: 변환된 파일들이 정상 동작하는지 확인
2. **테스트**: 전체 시스템 빌드 및 테스트 실행
3. **CSS 변수 정의**: 새로운 CSS 변수들이 실제로 정의되어 있는지 확인
4. **시각적 검토**: UI가 기존과 동일하게 표시되는지 확인

---

## 🚨 오류 목록

${this.stats.errors.length > 0 ?
  this.stats.errors.map(({ file, error }) => `- \`${file}\`: ${error}`).join('\n') :
  '오류 없음 ✅'
}

---

**💡 다음 실행**: \`node scripts/validate-css-variables.js\`로 CSS 변수 정의 확인
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 상세 리포트 생성: ${reportPath}`);
  }
}

// CLI 인터페이스
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { target: [] };

  const loadTargetsFile = (filePath) => {
    // 다중 --target 인자 안전성 (T1 2차 §6.1 zsh $TARGETS 단어 분리 문제 재발 방지)
    // 파일에서 영역 목록을 한 줄에 하나씩 읽고 빈 줄·`#` 주석은 무시.
    const absPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      console.error(`❌ --targets-file 경로를 찾을 수 없습니다: ${filePath}`);
      process.exit(2);
    }
    const lines = fs.readFileSync(absPath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('#')) continue;
      options.target.push(trimmed);
    }
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--no-backup') options.backup = false;
    else if (arg === '--no-report') options.report = false;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg === '--critical-only') options.criticalOnly = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--target' && args[i + 1]) {
      options.target.push(args[i + 1]);
      i++;
    } else if (arg.startsWith('--target=')) {
      options.target.push(arg.split('=')[1]);
    } else if (arg === '--targets-file' && args[i + 1]) {
      loadTargetsFile(args[i + 1]);
      i++;
    } else if (arg.startsWith('--targets-file=')) {
      loadTargetsFile(arg.split('=')[1]);
    } else if (arg === '--token-priority' && args[i + 1]) {
      options.tokenPriority = args[i + 1].split(',').map(s => s.trim()).filter(Boolean);
      i++;
    } else if (arg.startsWith('--token-priority=')) {
      options.tokenPriority = arg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '--allow-duplicate-alias') {
      options.allowDuplicateAlias = true;
    } else if (arg === '--strict-validation') {
      options.strictValidation = true;
    } else if (arg === '--skip-validation') {
      // 긴급 우회용 — 사용자 명세(D5 §3.1·§4 P1-a) 호환.
      // 본 옵션 사용 시에도 진입 시점에 명시적 경고를 5초간 표시하고,
      // 회피 사용 사실을 stderr 로 기록하여 운영 게이트 회피가 우발적으로
      // 발생하지 않도록 한다 (가드 회피 차단 정신은 유지).
      options.skipValidation = true;
    } else if (arg === '--r2-mg-alias-replace') {
      // D8 PR-B 단계 1: R-2 mg-* 폴백 SAFE_PAIRS 화이트리스트 alias 대체.
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D8.md §2.3 + §4 C3.
      // R-2 보호는 그대로 유지되며, 본 옵션이 명시될 때에만 SAFE_PAIRS 가 우선 적용된다.
      options.r2MgAliasReplace = true;
    } else if (arg === '--r2-v2-alias-replace') {
      // D9 P2-a: R-2 mg-v2-* 폴백 SAFE_PAIRS 화이트리스트 alias 대체.
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1 + §4 C1=b.
      // R-2 보호는 그대로 유지되며, 본 옵션이 명시될 때에만 R2_V2_ALIAS_SAFE_PAIRS 가 우선 적용된다.
      options.r2V2AliasReplace = true;
    } else if (arg === '--r2-mg-alias-bc-replace') {
      // D9 P2-b + P2-c: R-2 mg-* 폴백 BC SAFE_PAIRS 화이트리스트 alias 대체.
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1·§2.2 + §4 C2·C3.
      // R-2 보호 / D8 PR-B / D9 P2-a 동작은 그대로 유지되며, 본 옵션이 명시될 때에만
      // R2_MG_ALIAS_BC_SAFE_PAIRS 가 우선 적용된다 (단계적 흡수, 광역 위험 격리).
      options.r2MgAliasBcReplace = true;
    } else if (arg === '--r2-other-alias-replace') {
      // D10 P2-c: R-2 other 그룹 폴백 SAFE_PAIRS 화이트리스트 alias 대체.
      // SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md §2.5 + §9 C6=b/C7=a.
      // R-2 보호 / D8 PR-B / D9 P2-a/b/c / D10 P2-a 동작은 그대로 유지되며,
      // 본 옵션이 명시될 때에만 R2_OTHER_ALIAS_SAFE_PAIRS 가 우선 적용된다.
      // T-CS-Theme-Other 표준 SAFE 70%+ 광역 (B0KlA palette 신설 6 + 통합 8 + SAFE 화이트리스트 10 + color-* legacy 13쌍).
      options.r2OtherAliasReplace = true;
    }
  }

  if (options.target.length === 0) {
    options.target = null;
  }

  return options;
}

// ── T-D 진입 가드 (D5 §3.1·§4 P1-a) ─────────────────────────────────────────
// 직전 라운드 회귀 4건 (R-3·R-4·weekend·R-5) 모두 codemod 가 토큰 매핑을
// 일괄 치환했지만 SSOT 정의 없는 토큰을 사용한 사이드이펙트가 원인.
// 본 가드는 codemod 진입 시 다음을 차단한다:
//   1) validate-codemod-mappings.js 가 ERROR/충돌 보고 → 즉시 abort
//   2) 매핑 텍스트에서 동일 hex → 다중 `--mg-color-*` 매핑 (alias 충돌) 발견 시
//      `--allow-duplicate-alias` (또는 `--token-priority`) 옵션이 없으면 abort
//
// `--skip-validation` 옵션은 긴급 우회용으로만 제공된다. 사용 시 5초간
// 강력한 경고를 출력하여 운영 게이트 회피가 우발적으로 발생하지 않도록 한다.
function runEntryGuards(options) {
  if (options.skipValidation) {
    console.error('');
    console.error('🚨🚨🚨 [T-D 가드 우회] --skip-validation 지정됨 🚨🚨🚨');
    console.error('   D5 §3.1·§4 P1-a 가드를 우회하여 codemod 를 실행합니다.');
    console.error('   R-3/R-4/weekend/R-5 류 회귀 재발 위험이 있습니다.');
    console.error('   본 옵션은 긴급 우회 전용이며 운영 반영 전 반드시 재검증 필요합니다.');
    console.error('   (5초 후 codemod 본문 실행을 계속합니다...)');
    console.error('');
    const waitUntil = Date.now() + 5000;
    while (Date.now() < waitUntil) {
      // 의도적 동기 대기 — 우발적 우회 방지 (5초 인지 신호)
    }
    return;
  }

  const validatorScript = path.resolve(__dirname, 'validate-codemod-mappings.js');
  const legacyScript = path.resolve(__dirname, 'check-token-ssot.js');

  // 신규 wrapper (사용자 명세 호환) 우선, 부재 시 legacy lint 로 fallback.
  let lintScript = null;
  let isLegacy = false;
  if (fs.existsSync(validatorScript)) {
    lintScript = validatorScript;
  } else if (fs.existsSync(legacyScript)) {
    lintScript = legacyScript;
    isLegacy = true;
  } else {
    console.error('🚨 [T-D 가드] lint 스크립트가 존재하지 않습니다:');
    console.error(`   - ${validatorScript}`);
    console.error(`   - ${legacyScript}`);
    console.error('   codemod 사이드이펙트 차단 가드가 비활성 상태로 진행할 수 없습니다.');
    console.error('   (긴급 우회: --skip-validation 옵션 사용 — 위험 인지 후 한정)');
    process.exit(1);
  }

  const lintArgs = ['--quiet'];
  if (options.strictValidation) {
    lintArgs.push('--strict');
  }
  if (options.allowDuplicateAlias && !isLegacy) {
    lintArgs.push('--allow-duplicate-alias');
  }
  if (Array.isArray(options.tokenPriority) && options.tokenPriority.length > 0) {
    lintArgs.push('--token-priority', options.tokenPriority.join(','));
  }

  console.log(`🔍 [T-D 가드] ${path.basename(lintScript)} 실행 중...`);
  const result = spawnSync(process.execPath, [lintScript, ...lintArgs], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    console.error('');
    console.error('🚨 [T-D 가드] SSOT cross-check 실패 — codemod 를 abort 합니다.');
    console.error('   D5 §3.1·§4 P1-a: SSOT 정의 누락·alias 충돌 토큰의 일괄 치환은 회귀를 유발합니다.');
    console.error('   1) 위 lint 출력의 ❌ ERROR / 🚨 alias 충돌 항목을 먼저 해소하세요.');
    console.error('   2) 의도적 alias 충돌 운영 시 `--allow-duplicate-alias` 또는');
    console.error('      `--token-priority a,b,c` 옵션을 추가하세요.');
    console.error('   3) 긴급 우회 (운영 반영 전 재검증 전제): `--skip-validation`');
    process.exit(result.status || 1);
  }

  console.log('✅ [T-D 가드] SSOT cross-check 통과. codemod 본문 실행을 계속합니다.\n');
}

// 스크립트 실행
if (require.main === module) {
  const options = parseArgs();

  const usage = [
    '사용법:',
    '  node scripts/design-system/color-management/convert-hardcoded-colors.js [옵션]',
    '',
    '옵션:',
    '  --dry-run                 실제 파일 수정 없이 미리보기 (보고서는 별도 경로에 저장)',
    '  --no-backup               백업 파일 생성 안함',
    '  --no-report               docs/COLOR_CONVERSION_*REPORT.md 생성 생략',
    '  --verbose                 상세 로그 출력',
    '  --critical-only           중요 파일만 처리',
    '  --target <path>           처리 영역을 디렉터리/파일로 한정 (반복 지정 가능)',
    '  --targets-file <path>     영역 목록 파일에서 한 줄에 하나씩 읽어 처리',
    '                            (zsh $TARGETS 단어 분리 문제 회피 — T1 2차 §6.1)',
    '  --token-priority a,b,c    [T-D 가드] alias 충돌 발견 시 명시적 우선순위 (인지 신호)',
    '                            옵션 미지정 + 매핑에 동일 hex → 다중 --mg-color-* 토큰',
    '                            매핑이 있을 때 lint 가 abort 한다.',
    '  --allow-duplicate-alias   [T-D 가드] alias 충돌을 의도된 운영으로 허용 (D5 명세 호환).',
    '                            내부적으로 validate-codemod-mappings.js 의 동명 옵션과 동일.',
    '  --strict-validation       [T-D 가드] WARN (다크 미정의 / chain 깊이 / cycle) 도',
    '                            ERROR 로 승격하여 abort 한다 (운영 게이트 직전 사용 권장).',
    '  --skip-validation         [T-D 가드 우회 — 긴급용] lint 가드를 건너뛴다. 5초 경고 후',
    '                            진행하며 회피 사용을 stderr 로 기록한다. 운영 반영 전',
    '                            반드시 가드 재실행 필요. (R-3/R-4 재발 위험)',
    '  --r2-mg-alias-replace     [D8 PR-B 단계 1] R-2 mg-* 폴백 SAFE_PAIRS 화이트리스트',
    '                            alias 대체 활성화. SSOT: docs/standards/',
    '                            DESIGN_TOKEN_GAP_2026Q2_D8.md §2.3 + §4 C3.',
    '                            화이트리스트는 본 파일의 R2_MG_ALIAS_SAFE_PAIRS 참조.',
    '                            mg-v2-* 폴백 / HOLD 케이스는 본 옵션에서도 변환되지 않음.',
    '  --r2-v2-alias-replace     [D9 P2-a] R-2 mg-v2-* 폴백 SAFE_PAIRS 화이트리스트',
    '                            alias 대체 활성화. SSOT: docs/standards/',
    '                            DESIGN_TOKEN_GAP_2026Q2_D9.md §2.1 + §4 C1=b.',
    '                            화이트리스트는 본 파일의 R2_V2_ALIAS_SAFE_PAIRS 참조.',
    '                            HOLD (border-light) / manual-review 케이스는',
    '                            본 옵션에서도 변환되지 않음 (D10 또는 P1 결정 대기).',
    '                            D9 P2-c 보강: primary-100 + #dbeafe (3건) 추가 흡수.',
    '  --r2-mg-alias-bc-replace  [D9 P2-b + P2-c] R-2 mg-* 폴백 BC SAFE_PAIRS',
    '                            화이트리스트 alias 대체 활성화 (T-R2-manual + T-R2-hold).',
    '                            SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md',
    '                            §2.1·§2.2 + §4 C2·C3. 화이트리스트는 본 파일의',
    '                            R2_MG_ALIAS_BC_SAFE_PAIRS 참조 (Group N/A/B/C 21쌍).',
    '                            신설 3종 (legacy-primary / brand-olive-muted /',
    '                            bg-hover) 흡수 + P1 §C2/§C3 endorsed 통합 매핑.',
    '                            manual-review HOLD (custom-*, danger-dark, purple-*',
    '                            등) 케이스는 본 옵션에서도 변환되지 않음.',
    '  --r2-other-alias-replace  [D10 P2-c] R-2 other 그룹 폴백 SAFE_PAIRS',
    '                            화이트리스트 alias 대체 활성화 (T-CS-Theme-Other).',
    '                            SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md',
    '                            §2.5 + §9 C6=b/C7=a. 화이트리스트는 본 파일의',
    '                            R2_OTHER_ALIAS_SAFE_PAIRS 참조 (Group A/B/C/D ~37쌍).',
    '                            B0KlA palette 신설 6 + 통합 8 + SAFE 화이트리스트 10 +',
    '                            color-* legacy 13쌍 흡수. iOS dark / teal / hover 모호',
    '                            케이스는 HARD_EXCLUDE 보존 (D11 검토 대상).',
    '  --help, -h                도움말 출력',
    '',
    '예시 (영역 목록 파일):',
    '  # scripts/design-system/color-management/targets.b7.txt',
    '  frontend/src/components/common',
    '  frontend/src/components/admin/commoncode',
    '  frontend/src/styles/06-components',
    '',
    '  node scripts/design-system/color-management/convert-hardcoded-colors.js \\\\',
    '       --dry-run --targets-file scripts/design-system/color-management/targets.b7.txt',
    '',
    '안전성:',
    '  - 토큰 정의 파일 (unified-design-tokens / dashboard-tokens-extension /',
    '    responsive-layout-tokens / mindgarden-design-system /',
    '    00-core/_variables / 00-core/_component-variables / common/variables /',
    '    constants/css-variables.js) 은 항상 처리 대상에서 제외 (T1 2차 §6.2 재발 방지)',
    '  - *tokens*.css / *variables*.css / *design-system*.css / tokens/* / themes/*',
    '    및 *.test.* / *.spec.* / *.stories.* / __tests__/ 도 자동 제외',
    '  - var(--token, #hex) 폴백 위치의 hex 는 절대 변환하지 않음 (시각 QA R-2 보호).',
    '    예: `var(--cs-error-600, #dc2626)` → 그대로 유지 (nested var 부작용 방지)',
    '  - [T-D 가드, D5 §3.1·§4 P1-a] 진입 시 validate-codemod-mappings.js 를',
    '    (없으면 check-token-ssot.js 를) 호출해 매핑 토큰의 SSOT 정의·alias 충돌을',
    '    cross-check. 실패 시 즉시 abort. (--skip-validation 명시 시 우회)',
    ''
  ].join('\n');

  if (options.help) {
    console.log(usage);
    process.exit(0);
  }

  console.log(usage);

  // T-D 진입 가드: lint·alias 충돌 사전 차단 (D5 §3.1·§4 P1-a)
  runEntryGuards(options);

  const converter = new HardcodedColorConverter(options);
  converter.run().catch(console.error);
}

module.exports = HardcodedColorConverter;