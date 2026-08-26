# Core Solution — 다크 대비(AA) + 이모지/장식 SVG 제거 오케스트레이션

**역할**: core-planner  
**브랜치**: `cursor/core-solution-dark-contrast-emoji-efe3` (base: develop)  
**범위**: frontend/theme/copy only — 백엔드 변경 금지  
**플랫폼 브랜드**: Core Solution (sian 05 Secure Core) — slate `#0F172A` / teal `#0D9488` / mint `#CCFBF1`  
**금지**: MindGarden 테넌트 비주얼(나비·수채화·골드 스크립트·Calm Forest olive)로 플랫폼 재스타일

---

## 1. 목표

1. 다크 모드 WCAG 2.1 AA 대비(일반 텍스트 4.5:1, large/UI 3:1) — 토큰 우선, 하드코딩 원오프 후속.
2. 사용자 대면 UI에서 이모지 문자·장식 일러스트 SVG 제거 → plain text 또는 quiet stroke/geometric 아이콘.
3. 로그인 히어로 Core Solution shield/wordmark + path-draw / LoginHero Lottie(이모지·일러스트 문제 아니면) 유지. 기능 UI 아이콘(chevron/close/check) 유지.

---

## 2. 범위

| 포함 | 제외 |
|------|------|
| 다크 테마 토큰 SSOT (`dark-theme.css`, `unified-design-tokens.css` dark 블록, `design-v2-tokens*.css`, `dashboard-tokens-extension.css`, `_theme-variables.css`) | 백엔드 API/DB |
| 대비를 깨는 프론트 하드코딩 색 | 새 브랜드 팔레트 발명 |
| UI 문자열·empty/toast/nav/button 이모지 | console.log ✅❌ (저우선) |
| 장식 illustration SVG / cute sticker (로그인 히어로 제외) | 테스트 전용 화면은 후순위 가능 |
| 라이트 모드 회귀 방지(동일 토큰 일관성) | PR 생성(메인이 ManagePullRequest) |

---

## 3. Phase 1 탐색 결과 (검증됨 — 추측 아님)

### 3.1 다크 토큰 SSOT · 복제 가설

| 파일 | 역할 | 관찰 |
|------|------|------|
| `frontend/src/styles/themes/dark-theme.css` | `[data-theme="dark"]` legacy `--color-*` | **라이트 단순 복제 아님**. bg/text 대부분 반전. 단 `--color-text-muted: #94a3b8`은 light와 **동일 hex**. |
| `frontend/src/styles/themes/light-theme.css` | light 대응 | 동일 토큰명 59개 중 동일값 2개(muted + primary-dark var) |
| `frontend/src/styles/unified-design-tokens.css` | `:root[data-theme="dark"]` **22+ 블록** (~L1215+) | 다크 서페이스 `#1a1a1a`/`#262626` + **MindGarden olive primary `#6B7F72`**, B0KlA green, warm login stops 잔존 |
| `frontend/src/styles/tokens/design-v2-tokens.css` | `[data-theme="dark"]` mg-v2 | **Calm Forest 다크 복제** (primary `#4A6354` 등) — Core Solution slate/teal 아님 |
| `frontend/src/styles/tokens/design-v2-tokens-refine.css` | onboarding/pricing dark | slate 계열 일부 이미 사용 |
| `frontend/src/contexts/DarkModeContext.js` | `html[data-theme=dark]` | CSS cascade 실제 스위치 |
| `frontend/src/hooks/useTheme.js` | classList `dark-theme` | data-theme와 **병행/불일치 가능** — 코더가 적용 경로 확인 |

**복제 가설 결론**: `dark-theme.css`는 배경만 바꾼 복제가 **아님**. 다만 (a) muted 동일 hex, (b) **border·primary·disabled가 AA 미달**, (c) **mg-v2 / unified 다크가 MindGarden Calm Forest를 유지**해 Core Solution 팔레트·가독성 목표와 충돌.

### 3.2 저대비 후보 (실측)

| 쌍 | 대략 대비 | AA |
|----|-----------|-----|
| `--color-border-primary #334155` on `#0f172a` | 1.72:1 | UI FAIL |
| `--color-border-secondary #475569` on `#0f172a` | 2.36:1 | UI FAIL |
| `--mg-color-border-main #3A3A3A` on `#1a1a1a` | 1.53:1 | UI FAIL |
| `--mg-v2-color-border-default #3D3D3D` on `#1A1A1A` | 1.60:1 | UI FAIL |
| `--mg-v2-color-primary-main #4A6354` on `#121212`/`#1A1A1A` | ~2.66–2.86:1 | text+UI FAIL |
| `--mg-color-primary-main #6B7F72` on `#1a1a1a` | 4.06:1 | text FAIL / UI PASS |
| `--mg-v2-color-text-tertiary #7A7A7A` on `#121212` | 4.36:1 | text FAIL (경계) |
| `--mg-v2-color-text-disabled #525252` on `#121212` | 2.23:1 | UI FAIL |
| teal `#0D9488` on slate `#0F172A` | 4.77:1 | text PASS |
| teal on `#1e293b` | 3.91:1 | text FAIL / UI PASS → 다크 raised 표면에서는 teal-400/300 검토 |

### 3.3 이모지 인벤토리 (UI 문자열, console/comment 제외)

약 **580 lines** / 다수 파일. 우선 교체 클러스터:

| 클러스터 | 대표 경로 |
|----------|-----------|
| Toast / Notification | `Toast.js`, `UnifiedNotification.js`, `PublicNotification.jsx` |
| Empty / Chart empty | `MGTable.js`, `MGChart.js`, `BaseWidget.js`, `*Empty*`, mapping empty |
| Nav / Header / Greeting | `MGHeader.js`(🌱), `WelcomeWidget.js`(👋), `DynamicDashboard.js`(🏥) |
| Forms / Status icons | `ScheduleList.js`, `ConsultationLogModal.js`, `codeHelperStrings.js`(등급 메달), `schedule.js`, `vacation.js`, `mapping.js`, `widgetConstants.js`, `pageConfigs.js` |
| Auth password toggle | `UnifiedLogin.js` 등 👁 이모지 → stroke eye 아이콘 |
| Locales | `locales/ko/{admin,auth,common,schedule,report,erp}.json` |
| Mood/rating (도메인) | `MoodJournal.js`, `ClientHomeRenewal.js`, `ConsultantRatingDisplay.js` — **텍스트 라벨 또는 stroke로 교체 가이드 필요** |

저우선: `components/test/*`, 주석 `⚠️ 표준화…`, console ✅❌.

### 3.4 장식 SVG / 일러스트

| 항목 | 권고 |
|------|------|
| `LoginHeroBrandLockup` + `core-solution-hero-lockup.svg` + path-draw | **유지** (sian 05) |
| `LoginHeroLottieOverlay` | 이모지/cute 아니면 **유지** |
| `core-logo-butterfly-trace.svg`, `core-wordmark-mindgarden-trace.svg` | MindGarden 트레이스 → **플랫폼 chrome에서 미사용 확인 후 제거/격리** |
| `TenantProfileIllustrations.js` | 빈상태 장식 SVG → text 또는 quiet geometric으로 교체 |
| landing `icon-feature-*.svg`, `dashboard-preview.svg` | 랜딩이면 stroke 유지 가능; cute/sticker면 정리 |
| chevron/close/check stroke icons | **유지** |

---

## 4. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | 다크 모드에서 폼·테이블·라벨·테두리가 읽히고, empty/toast가 이모지 없이도 상태를 전달. 로그인 히어로 브랜드 인식 유지. |
| **정보 노출** | 역할별 화면 동일. 등급/상태/무드는 이모지 대신 텍스트·Badge·stroke. |
| **레이아웃** | LNB/GNB/메인·AdminCommonLayout 구조 변경 없음. 토큰·카피·아이콘 치환만. |

---

## 5. 분배실행 표

| Phase | 담당 | 병렬 | model | 산출 |
|-------|------|------|-------|------|
| 1 Explore | explore / planner 직접 스캔 | — | — | 본 문서 §3 (**완료**) |
| 2 Design | **core-designer** | Phase1 후 | **`gemini-3.7-flash-high`** | 다크 AA 토큰 스펙 + 이모지→text/stroke 가이드 |
| 3 Implement | **core-coder** | Phase2 후 | default | 토큰·하드코딩·이모지/SVG 패치 + 커밋 |
| 4 Verify | **core-tester** | Phase3 후 | default | 다크/라이트 스모크·대비·이모지 잔존·회귀 |

---

## 6. Phase 2 — core-designer 전달 프롬프트

```
역할: core-designer (코드 작성 금지 — 스펙만)

과제: Core Solution 플랫폼 다크 모드 WCAG 2.1 AA 토큰 스펙 + 이모지/장식 SVG 제거 가이드.
브랜드: Core Solution / slate #0F172A, teal #0D9488, mint #CCFBF1.
MindGarden(Calm Forest olive, 나비, 수채화, 골드 스크립트)로 플랫폼 재스타일 금지.
새 팔레트 발명 금지 — slate/teal/mint 유지, 다크 서페이스만 읽기 쉽게.

참조 인벤토리:
- docs/project-management/CORE_SOLUTION_DARK_CONTRAST_EMOJI_ORCHESTRATION.md §3
- frontend/src/styles/themes/dark-theme.css
- frontend/src/styles/unified-design-tokens.css (:root[data-theme="dark"] 다수)
- frontend/src/styles/tokens/design-v2-tokens.css [data-theme="dark"]
- frontend/src/styles/tokens/design-v2-tokens-refine.css
- DarkModeContext → html[data-theme=dark]

사용성: 다크에서 text/border/muted/input/chart/hover/disabled/teal-on-dark 가독.
정보 노출: 등급·상태·무드·toast·empty는 역할 동일, 이모지 없이 의미 전달.
레이아웃: LNB/GNB/AdminCommonLayout 구조 변경 없음.

산출물 (docs/design-system/ 저장 권장):
1) 다크 토큰 전/후 표: 토큰명, before hex, after hex, 대상 배경, 목표 대비(≥4.5 text / ≥3 UI), 라이트 영향 여부.
2) mg-v2 / unified / dark-theme 중 SSOT 우선순위(충돌 시 어느 값을 승자로).
3) MindGarden olive(#4A6354/#6B7F72) → Core Solution teal 계열 매핑(다크에서 텍스트용은 teal-400/300 등 AA 충족 톤).
4) 이모지→plain text 또는 stroke/geometric 아이콘 교체 표(클러스터별: Toast, Empty, Nav, Status, Auth eye, Locales, Mood/Rating).
5) 유지 목록: LoginHeroBrandLockup/core-solution-hero-lockup, 기능 chevron/close/check, LoginHero Lottie(해당 시).
6) 제거/교체: TenantProfileIllustrations, butterfly/mindgarden-trace(미사용 시), cute sticker SVG.

스킬: /core-solution-design-handoff, /core-solution-atomic-design, /core-solution-design-system-css
완료 조건: 코더가 hex/토큰명만으로 패치 가능한 표 + 교체 가이드. 코드 없음.
```

---

## 7. Phase 3 — core-coder 전달 프롬프트

```
역할: core-designer 스펙 구현. 브랜치: cursor/core-solution-dark-contrast-emoji-efe3 워킹트리에만 반영.

입력: core-designer 산출물(다크 AA 토큰 표 + 이모지/SVG 가이드) +
docs/project-management/CORE_SOLUTION_DARK_CONTRAST_EMOJI_ORCHESTRATION.md §3

필수 참조:
- .cursor/skills/core-solution-design-system-css/SKILL.md
- .cursor/skills/core-solution-frontend/SKILL.md
- .cursor/skills/core-solution-standardization/SKILL.md
- docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17 (하드코딩 게이트)
- docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3

작업:
1) 다크 토큰 수정(우선순위: design-v2-tokens.css dark, unified-design-tokens.css dark 블록, dark-theme.css). 라이트 :root 깨지 말 것.
2) 대비 깨는 하드코딩 원오프 색 → 토큰 치환.
3) UI 문자열 이모지 제거(§3.3 우선 클러스터 + locales). console/주석 저우선.
4) 장식 SVG/일러스트 제거·교체(로그인 히어로 Core Solution lockup/Lottie 유지).
5) 백엔드 변경 금지. MindGarden 테넌트 팔레트로 플랫폼 재스타일 금지.

완료 조건:
- 다크 핵심 토큰 AA 목표 충족(스펙 표 기준)
- 사용자 대면 UI 문자열에 이모지 문자 없음(우선 클러스터)
- product chrome에 장식 일러스트 SVG 없음(히어로 제외)
- 변경 요약: 토큰 전/후, 이모지/SVG 파일 목록
- 커밋 가능 상태(메시지 예: fix(ui): dark AA contrast tokens + remove emoji/decorative SVG)

하드코딩 스캔에 걸린 범위 항목은 예외 없이 치환.
```

---

## 8. Phase 4 — core-tester 전달 프롬프트

```
역할: core-tester. 브랜치 cursor/core-solution-dark-contrast-emoji-efe3 변경 검증.

검증:
1) 다크/라이트 스모크: login, dashboard/shell(AdminCommonLayout), forms, tables, empty states
2) 다크 대비: 스펙 표 토큰 샘플(text/border/muted/primary/teal) 실측 또는 계산 ≥ AA
3) 이모지 잔존: frontend/src components/constants/locales 스캔(콘솔/주석/test 제외) — 우선 클러스터 0건
4) 장식 SVG: TenantProfileIllustrations·butterfly-trace 등 플랫폼 chrome 미노출
5) 로그인 히어로 Core Solution lockup 유지
6) 라이트 모드 회귀: 명백한 깨짐 없음
7) 백엔드/API 변경 없음(git diff 범위)

산출: PASS/FAIL, 실패 목록, 잔여 리스크.
미통과 시 core-coder 재위임 포인트 명시.
```

---

## 9. 완료 기준 (배치)

- [ ] designer 스펙 승인·저장
- [ ] coder 패치 + 브랜치 반영
- [ ] tester PASS
- [ ] 최종 보고: 원인 결론 / 토큰 전후 / 이모지·SVG 목록 / 잔여 리스크 / tester 여부

---

## 10. 리스크

- 토큰 cascade 다중 SSOT → 잘못된 파일만 고치면 화면이 구토큰 사용.
- Calm Forest → teal 전환 시 어드민 B0KlA olive 잔존 혼선.
- Mood/Rating 이모지는 UX 관행 → 텍스트 대체 시 디자이너 가이드 필수.
- useTheme class vs data-theme 이중 경로.
- 랜딩 SVG는 마케팅 자산일 수 있음 — 플랫폼 app chrome과 구분.
