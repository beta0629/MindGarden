# Core Solution — 제품 비주얼 언어 정돈 + 토큰 SSOT 오케스트레이션

**역할**: core-planner  
**브랜치**: `cursor/core-solution-dark-contrast-emoji-efe3` (base: develop → PR `develop`)  
**범위**: frontend theme / tokens / chrome / copy only — **백엔드 변경 금지**  
**플랫폼 브랜드**: Core Solution / CoreSolution / 코어 솔루션 (sian 05 Secure Core)  
**팔레트 고정**: slate `#0F172A`, teal `#0D9488`, mint `#CCFBF1`  
**금지**: Cursor 로고 복제 · MindGarden 테넌트 재스타일(나비·수채화·골드 스크립트·Calm Forest olive) · 화면별 paint-job 하드코딩

**Supersedes**:
- ~~`docs/project-management/CORE_SOLUTION_DARK_CONTRAST_EMOJI_ORCHESTRATION.md`~~ (다크+이모지 협소 범위 — **DEPRECATED**)
- ~~`docs/design-system/CORE_SOLUTION_DARK_CONTRAST_EMOJI_SPEC.md`~~ (다크 전용 designer 산출물 — **SUPERSEDED**, 재호출 전 폐기)

---

## 0. 사용자 정정 요약 (필수 전제)

| # | 정정 | 의미 |
|---|------|------|
| **1** | 다크만이 아님 | “Cursor homepage-level design” = **제품 전체 비주얼 언어(라이트+다크)**. 셸·로그인·대시보드·폼·테이블·empty·settings 전반. |
| **2** | 마케팅 랜딩처럼 비우지 말 것 | 제품은 **dense SaaS**. 정보는 유지하고 **messy/uncomposed**만 고친다. Quality bar = **Cursor the product**(dense지만 tidy) ≠ cursor.com 마케팅(한 헤드라인+여백). |
| **3** | 하드코딩 누적 실패 반복 금지 | 화면별 restyle/새 look hex 금지. **theme/token 레이어 SSOT**로 color·type·spacing·radius·border를 통합하고 chrome 잔여 hex/rgb/font-size/margin을 **토큰으로 이관**. 중복 local CSS는 **삭제 우선**. 성공 = 토큰 한 번 → 앱 전체 반영. |

다크 AA·이모지/장식 SVG 제거는 **포함**하되, 배치의 **중심이 아님**. PR 설명도 “페이지 restyle 목록”이 아니라 **토큰 통합·하드코딩 이관**.

---

## 1. 목표 (한 문장)

Core Solution 제품 chrome을 **같은 토큰 SSOT**(라이트+다크)에서 나오는 quiet·tidy한 dense SaaS 비주얼로 정렬하고, one-off 하드코딩·이모지·장식 일러스트를 제거해 **토큰만 바꾸면 전체가 움직이는** 상태를 만든다.

### 1.1 Do

- 정보·워크플로·컬럼·필드·기능 **유지**
- 시각 계층·그룹핑·정렬·spacing rhythm·type scale·chrome **정돈**
- 관련 컨트롤 그룹화, 컬럼 정렬, **페이지 타이틀 하나**, secondary action 조용히
- 경쟁 색 / 그림자 / 이모지 **감소**
- color·type·spacing·radius·border의 **단일 SSOT**; 잔여 하드코딩 → 토큰 이관
- 라이트·다크 **동일 토큰명**, 값만 테마 분기
- 라이트+다크 WCAG 2.1 AA (text 4.5:1, large/UI 3:1)
- 이모지 → plain label / geometric stroke; 장식 SVG 제거
- 로그인 히어로 Core Solution shield/wordmark + path-draw (quieter language와 충돌 없으면 **유지**)

### 1.2 Don't

- 기능·컬럼·필드 삭제
- 거대 hero 여백 / sparse marketing 레이아웃으로 교체
- 다크만 리스타일 / 화면별 paint job으로 새 look 하드코딩
- 새 wrapper CSS 남발 · 중복 local styles 방치
- MindGarden 팔레트·나비 등으로 플랫폼 재브랜드
- Cursor 로고/마케팅 비주얼 복제
- 백엔드·API·DB 변경

---

## 2. 범위

| 포함 | 제외 |
|------|------|
| 토큰 SSOT 확정·통합 (`unified-design-tokens.css`, `design-v2-tokens*.css`, `themes/*`, `dashboard-tokens-extension.css`, `_theme-variables.css` 등) | 백엔드 |
| 라이트+다크 color / type / spacing / radius / border / shadow 억제 규칙 | 기능 삭제·정보 축소 |
| chrome 하드코딩(hex/rgb/font-size/margin) → 토큰 이관 | 마케팅 랜딩식 sparse 재구성 |
| 셸·로그인·대시보드·폼·테이블·empty·settings의 **정돈**(구조는 AdminCommonLayout 등 유지) | Cursor 로고 복제 |
| 이모지·장식 SVG 제거 | console/주석 이모지(저우선) |
| AA contrast (light+dark) | PR 생성(메인 ManagePullRequest) |

### 2.1 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | dense 화면에서도 어디가 제목·액션·데이터인지 한눈에. 다크/라이트 모두 읽힘. |
| **정보 노출** | 기존 필드·컬럼·상태 **전부 유지**. 표현만 quiet하게. |
| **레이아웃** | GNB+LNB+메인 / AdminCommonLayout **골격 유지**. spacing·type·색만 토큰으로 정렬. |

---

## 3. Phase 1 탐색 요약 (이전 스캔 — 재사용, 범위만 확장)

상세 수치·파일 목록은 구 오케스트레이션 §3에 있었으나 **범위가 협소했으므로 참고용**. 확장 시 코더·디자이너가 재확인할 핵심:

| 관찰 | 함의 |
|------|------|
| 토큰 파일이 **다중 SSOT** (`unified` dark 22+ 블록, `design-v2`, `dark-theme.css`, JS `useTheme` class vs `DarkModeContext` `data-theme`) | designer가 **승자 파일 우선순위**를 못 박아야 함 |
| mg-v2 / unified 다크에 **Calm Forest olive** 잔존 | Core Solution teal로 **토큰 레이어**에서 교체 (화면별 아님) |
| border·disabled·일부 primary AA 미달 (다크) | light+dark 같은 토큰으로 함께 교정 |
| UI 이모지 ~580 lines, `TenantProfileIllustrations` 등 장식 SVG | text/stroke·삭제; 히어로 lockup 유지 |
| chrome one-off hex 누적 | **이관+local CSS 삭제**가 본 배치의 성공 조건 |

---

## 4. 분배실행 표 (갱신)

| Phase | 담당 | 의존 | model | 산출 |
|-------|------|------|-------|------|
| 1 Explore | planner 스캔(완료·확장 참고) | — | — | §3 + 하드코딩/SSOT 후보 |
| **2 Design** | **core-designer** | — | **`gemini-3.7-flash-high`** | **토큰 SSOT + overall quiet chrome** 스펙 (다크 전용 폐기) |
| **3 Implement** | **core-coder** | Phase 2 | default | 토큰 통합·하드코딩 이관·이모지/SVG·커밋 |
| **4 Verify** | **core-tester** | Phase 3 | default | light+dark 스모크·밀도 유지·토큰 회귀·이모지·AA |

**이전 Phase 2~4 프롬프트(다크+이모지 전용)는 전부 폐기.** 아래 §6~§8만 사용.

---

## 5. designer 산출물 필수 항목 (핸드오프)

저장 권장: `docs/design-system/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_SPEC.md`

1. **SSOT 파일 우선순위** — 어느 CSS/토큰 파일이 승자인지, cascade 충돌 시 규칙  
2. **통합 type scale** — page title / section / body / meta → **토큰명**  
3. **spacing scale** — **토큰명** (rhythm)  
4. **color tokens light+dark** — slate/teal/mint, AA 표(전/후 hex + 대비), card/shadow/border **억제** 규칙  
5. **상태색** — rainbow chrome 금지, 의미 상태만 절제  
6. **이모지→text/stroke**, 장식 SVG 제거 가이드 (로그인 히어로 유지)  
7. **삭제할 것**(중복 local CSS) vs **토큰으로 올릴 것**(잔여 hex/font-size/margin)  
8. **정보 밀도 유지** 명시 — sparse marketing layout **금지**  
9. 코더가 **hex/토큰명만으로** 패치 가능한 표  

스킬: `/core-solution-design-handoff`, `/core-solution-atomic-design`, `/core-solution-design-system-css`, `/core-solution-standardization`

---

## 6. Phase 2 — core-designer 프롬프트 (전문)

```
역할: core-designer (코드 작성 금지 — 스펙·표만)

## 범위 정정 (이전 다크+이모지 전용 스펙 폐기)
이전 CORE_SOLUTION_DARK_CONTRAST_EMOJI_SPEC / 다크-only 배치는 범위를 잘못 잡은 것이다. 본 배치는 아래 세 정정을 모두 반영한다.

1) 다크만이 아님
- “Cursor homepage-level design” = 제품 전체 비주얼 언어(라이트+다크).
- 셸·로그인·대시보드·폼·테이블·empty·settings 전반.
- 브랜드: Core Solution (sian 05). slate #0F172A, teal #0D9488, mint #CCFBF1.
- Cursor 로고 복제 금지. MindGarden(Calm Forest olive/나비/수채화/골드 스크립트)로 플랫폼 재스타일 금지.

2) 마케팅 랜딩처럼 비우지 말 것
- 제품은 dense SaaS(기능·테이블·폼·상태 많음). 문제는 “정보가 많다”가 아니라 messy/uncomposed.
- Do: 정보·워크플로 유지. 시각 계층·그룹핑·정렬·spacing rhythm·type scale·chrome만 정돈.
  관련 컨트롤 그룹화, 컬럼 정렬, 페이지 타이틀 하나, secondary action 조용히, 경쟁 색/그림자/이모지 감소.
- Quality bar = Cursor the product(dense IDE지만 tidy) — cursor.com 마케팅(한 헤드라인+여백)이 아님.
- Don't: 기능/컬럼/필드 삭제, 거대 hero 여백으로 교체, 다크만 리스타일.

3) 하드코딩 누적 실패 반복 금지 (핵심)
- 화면별 paint job으로 새 look 하드코딩 금지.
- theme/token 레이어에서 color·type scale·spacing·radius·border의 단일 SSOT를 정하고,
  chrome 잔여 hex/rgb/font-size/margin을 토큰으로 이관.
- 라이트·다크는 같은 토큰명에서 값이 나온다.
- 중복 local styles는 삭제 우선, 새 wrapper CSS 추가 지양.
- 성공 기준: 토큰 한 번 바꾸면 앱 전체가 움직이고, 새 화면에 unique hex가 필요 없어짐.

## 사용성 / 정보 노출 / 레이아웃
- 사용성: dense 화면에서 제목·액션·데이터 계층이 즉시 읽힘. light+dark AA.
- 정보 노출: 기존 필드·컬럼·상태 전부 유지. 표현만 quiet.
- 레이아웃: GNB+LNB+AdminCommonLayout 골격 유지. spacing/type/color만 토큰 정렬.

## 참조
- docs/project-management/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_ORCHESTRATION.md (본 오케스트레이션)
- frontend/src/styles/unified-design-tokens.css
- frontend/src/styles/tokens/design-v2-tokens.css
- frontend/src/styles/tokens/design-v2-tokens-refine.css
- frontend/src/styles/themes/dark-theme.css, light-theme.css
- frontend/src/styles/dashboard-tokens-extension.css
- frontend/src/styles/01-settings/_theme-variables.css
- frontend/src/contexts/DarkModeContext.js (data-theme)
- 구스펙 docs/design-system/CORE_SOLUTION_DARK_CONTRAST_EMOJI_SPEC.md 는 SUPERSEDED — 다크 표만 참고 가능, 그대로 채택 금지

## 산출물 (필수 — docs/design-system/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_SPEC.md)
1) SSOT 파일 우선순위 (승자 cascade)
2) type scale: page title / section / body / meta → 토큰명
3) spacing scale → 토큰명
4) color tokens light+dark (slate/teal/mint, AA 전/후 hex+대비), card/shadow/border 억제 규칙
5) 상태색: rainbow chrome 금지, 의미 상태만 절제
6) 이모지→plain text/stroke, 장식 SVG 제거 가이드 (LoginHero Core Solution shield/wordmark + path-draw 유지 조건)
7) “삭제할 중복 local CSS” vs “토큰으로 올릴 하드코딩” 목록 가이드
8) 정보 밀도 유지 명시 — sparse marketing 금지
9) 코더가 hex/토큰명만으로 패치 가능한 표

스킬: /core-solution-design-handoff, /core-solution-atomic-design, /core-solution-design-system-css, /core-solution-standardization
코드 없음. 다크-only 스펙 재제출 금지.
```

---

## 7. Phase 3 — core-coder 프롬프트 (전문)

```
역할: core-coder. 브랜치 cursor/core-solution-dark-contrast-emoji-efe3 워킹트리에만 반영.

## 입력 (필수)
- docs/design-system/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_SPEC.md (Phase 2 신규 designer 산출 — 다크-only 구스펙 사용 금지)
- docs/project-management/CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_ORCHESTRATION.md

## 필수 참조
- .cursor/skills/core-solution-design-system-css/SKILL.md
- .cursor/skills/core-solution-frontend/SKILL.md
- .cursor/skills/core-solution-standardization/SKILL.md
- docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17 (하드코딩 게이트)
- docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3

## 작업 원칙
1) 화면별 paint job / 페이지 restyle 하드코딩 금지. 토큰 SSOT 먼저.
2) designer가 지정한 승자 파일에 color·type·spacing·radius·border 통합. light+dark 같은 토큰명.
3) chrome 잔여 hex/rgb/font-size/margin → 토큰 이관. 중복 local CSS는 삭제 우선. 새 wrapper CSS 지양.
4) 정보·컬럼·필드·기능 삭제 금지. dense 유지. sparse marketing 레이아웃 도입 금지.
5) 이모지→plain text/stroke, 장식 SVG 제거. LoginHero Core Solution lockup/path-draw 유지(스펙 조건).
6) MindGarden olive/나비 등으로 플랫폼 재스타일 금지. 백엔드 변경 금지.
7) AA: light+dark text 4.5:1, UI 3:1 (스펙 표 기준).

## 완료 조건
- 토큰 레이어가 SSOT로 동작(핵심 화면이 토큰 변경에 반응)
- 스캔 범위 하드코딩 이관·§17 게이트 정합
- 사용자 대면 UI 이모지 우선 클러스터 제거, 장식 일러스트 제거(히어로 제외)
- 라이트+다크 핵심 화면(login, shell/dashboard, forms, tables, empty, settings) 밀도 유지·quiet chrome
- 변경 요약: 토큰 전/후, 이관/삭제한 local CSS·이모지·SVG 목록
- 커밋 메시지 예: fix(ui): unify Core Solution visual tokens (light+dark) and migrate hard-coded chrome

PR 설명 관점: “페이지 restyle 목록”이 아니라 토큰 통합·하드코딩 이관.
```

---

## 8. Phase 4 — core-tester 프롬프트 (전문)

```
역할: core-tester. 브랜치 cursor/core-solution-dark-contrast-emoji-efe3.

## 검증
1) light + dark 스모크: login, dashboard/shell(AdminCommonLayout), forms, tables, empty states, settings
2) 정보 밀도: 기능/컬럼/필드가 제거·거대 여백 마케팅 레이아웃으로 바뀌지 않았는지 (dense tidy)
3) 토큰 SSOT: 핵심 색·타이포·간격이 하드코딩 one-off가 아니라 토큰을 쓰는지 샘플 확인; 구스펙(다크-only)만 적용된 회귀 없는지
4) AA: 스펙 표 샘플(text/border/muted/primary/teal) light+dark 대비
5) 이모지 잔존: components/constants/locales 우선 클러스터 (console/주석/test 제외)
6) 장식 SVG: TenantProfileIllustrations·butterfly/mindgarden-trace 등 chrome 미노출; LoginHero Core Solution lockup 유지
7) MindGarden olive가 플랫폼 primary로 재도입되지 않았는지
8) git diff: 백엔드/API 없음; 화면별 거대 paint-job CSS 남발 없음

## 산출
PASS/FAIL, 실패 목록, 잔여 리스크, coder 재위임 포인트.
미통과 시 배치 미완료.
```

---

## 9. 완료 기준 (배치)

- [ ] 구 오케스트레이션·구 designer 스펙 DEPRECATED/SUPERSEDED 표시
- [ ] 신규 designer 스펙(토큰 SSOT + quiet chrome + density) 저장
- [ ] coder: 토큰 통합·하드코딩 이관·이모지/SVG + 브랜치 커밋
- [ ] tester PASS
- [ ] 최종 보고: SSOT 결론 / 토큰 전후 / 이관·삭제 목록 / 이모지·SVG / 잔여 리스크 / tester

---

## 10. 리스크

- 다중 토큰 파일 cascade — 승자 미지정 시 부분만 바뀌어 더 난잡해짐
- “정리”를 “비우기”로 오해 → dense 회귀 실패
- B0KlA/admin olive와 플랫폼 teal 혼선
- useTheme class vs data-theme 이중 경로
- 랜딩 마케팅 SVG vs app chrome 구분
