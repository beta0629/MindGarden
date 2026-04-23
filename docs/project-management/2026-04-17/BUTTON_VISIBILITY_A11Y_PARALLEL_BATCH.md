# 전역 버튼 가시성·A11y — 병렬 1차 위임 & 후속 기록

**작성일**: 2026-04-17  
**에픽**: 랜딩/로그인/역할별 화면에서 버튼 대비·레이어(클리핑·z-index)·포커스 가시성 전수 점검  
**기획 참조**: `core-planner` 분배안(메인 대화 2026-04-17), `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

## 1. 목적

- **동시에** 1차 증거를 모은다: 코드 인벤토리(explore) · 컴포넌트 난립 제안(component-manager) · 배경별 시각 계약(designer) · 재현·점검 체크리스트(debugger).
- 본 문서에 **위임 프롬프트·에이전트 ID·요약 결과**를 누적해 두어, 이후 **P4 core-coder / P5 core-tester** 배치 시 그대로 이어간다.

---

## 2. 병렬 Wave 1 (동시 실행)

| # | 서브에이전트 | 산출물 | 이 문서 섹션 |
|---|----------------|--------|----------------|
| W1a | **explore** | grep/파일맵 기반 **우선순위 인벤토리 표** | §3 |
| W1b | **core-component-manager** | MGButton·variant **중복·난립 제안서**(코드 수정 없음) | §4 |
| W1c | **core-designer** | 투명·sticky·히어로·모달 맥락 **버튼 시각·토큰 계약** 초안 | §5 |
| W1d | **core-debugger** | 재현 3단계 + **DevTools 대비·레이어 체크리스트** | §6 |

**의존성**: Wave 2는 Wave 1 요약을 입력으로 받는다.

- **P1 정식** component-manager 리뷰는 explore 표가 있으면 더 정확함(본 Wave에서 예비안만 받아도 됨).
- **P4 core-coder**는 §5 디자인 입력 + §3 우선순위 확정 후.
- **P5 core-tester**는 P4 이후 필수(위임 순서 문서).

---

## 3. W1a — explore (프롬프트 복붙)

```
역할: explore (readonly)

frontend/ 전역에서 다음을 읽기 전용으로 조사해 표로 정리하라.

검색·맵 키워드:
- mg-header--transparent, mg-header--sticky, mg-v2-homepage-nav
- MGButton, buildErpMgButtonClassName (erpMgButtonProps.js)
- mg-button--primary, mg-v2-button-primary, mg-v2-btn-primary
- z-index, overflow: hidden, position: sticky (헤더·툴바·테이블과 인접한 버튼)

산출:
1) 우선순위 표: 화면·라우트(추정 가능)·대표 파일 경로·패턴·심각도 High/Med/Low·역할(공개/로그인/어드민/상담사/내담자/모달)
2) 홈 GNB "회원가입" 버튼(사용자 DOM 예시)과 연결되는 스타일 소스 후보 목록

코드 수정 없음. /core-solution-atomic-design, /core-solution-frontend 맥락만 참고.
```

**에이전트 ID**: `05b230d2-5f5a-432a-b7be-1679fa8bb3ea` (explore, `resume` 가능)

**결과 요약**  
- **High**: `/` 랜딩 `Homepage.js` + `Homepage.css` — `UnifiedHeader` transparent+sticky, `MGButton` + `buildErpMgButtonClassName` + `mg-v2-btn-primary` **3계층** 스타일 경쟁.  
- **High(캐스케이드)**: `unified-design-tokens.css`의 `.mg-v2-button` / `.mg-v2-button-primary` + `main.css` 로드 순서.  
- **Med**: `MGButton.css`의 `overflow: hidden`, `UnifiedHeader` + `_header.css`, z-index(`_z-index.css`), 모달 `_unified-modals.css`, `UnifiedLogin.css`, ERP `ErpCommon.css`, 테이블 `MGTable.css` 등.  
- 코더 인계 파일 bullet: `Homepage.js`, `Homepage.css`, `UnifiedHeader.js`, `MGButton.js`, `MGButton.css`, `erpMgButtonProps.js`, `main.css`, `unified-design-tokens.css`(해당 구간), `_header.css`, `_z-index.css`.

---

## 4. W1b — core-component-manager (프롬프트 복붙)

```
역할: core-component-manager (코드 직수정 없음)

목표: MGButton + buildErpMgButtonClassName + mg-v2-button-* 조합의 중복·난립·적재적소 수렴 제안.

할 일:
- 사용처·패턴 인벤토리(제안서 형식)
- 공통 수렴안(예: 헤더 컨텍스트 variant 단일화 여부는 "제안"만)
- core-coder에게 넘길 때 필요한 체크리스트 bullet

참조: /core-solution-encapsulation-modularization, /core-solution-common-modules, docs/standards/COMMON_MODULES_USAGE_GUIDE.md (경로 있으면)
```

**에이전트 ID**: `93d91910-10cd-4643-b280-e7570b8c4b11`

**결과 요약**  
- **패턴**: P-DUAL(`MGButton`+`buildErpMgButtonClassName`), P-DUAL+EXTRA(문자열로 `mg-v2-*` 중복), P-DUAL+CTX(모듈/B0KlA pill), P-DUAL+OPT(`mg-v2-button--compact`).  
- **수렴 제안(우선순위)**: (1) `MGButton` 내부에 v2 조합 캡슐화 또는 `MgV2Button` 분리 (2) `erpMgButtonProps` → `common/` 이전·개명 (3) CSS `mg-v2-button--*` vs `mg-v2-button-*` 정본화.  
- **인증·어드민 대표 파일**: `TabletLogin.js`, `UnifiedLogin.js`, `ClientModal.js`, `StaffManagement.js` 등 — 제안서 본문은 에이전트 응답 아카이브 또는 동일 날짜 스레드 참조.

---

## 5. W1c — core-designer (프롬프트 복붙)

```
역할: core-designer (코드·CSS 작성 없음)

과제: 투명 헤더·스크롤 후 불투명 헤더·히어로 상단·모달·어드민 밀집 UI에서 primary / outline / ghost 버튼의 시각 계약.

산출:
- 배경 맥락별(밝은/어두운/반투명) 최소 대비 목표(WCAG AA 지향)
- 포커스 링·hover·disabled 일관 규칙
- 토큰·클래스 명세(기존 unified-design-tokens·B0KlA와 충돌 시 "치환 우선순위"만 제안)

참조: /core-solution-planning §0 사용성·정보노출·레이아웃, /core-solution-design-handoff, admin 샘플 스타일 가이드(프로젝트 규칙상 URL 있으면)
```

**에이전트 ID**: `ee647e13-9fc1-4b05-b44a-9348adbf1352`

**결과 요약**  
- **대비 목표 표**: 밝은/다크/반투명(글래스) 맥락별 WCAG AA 지향(일반 4.5:1, 대형·비텍스트 3:1).  
- **Variant 계약**: Primary / Outline / Ghost 역할·실루엣·어드민 밀집·모달 푸터 규칙.  
- **포커스·Hover·Disabled·로딩** 일관 규칙 및 **맥락 매트릭스**(투명 헤더·스크롤 후·히어로·모달·어드민).  
- **토큰 우선순위**: B0KlA `--mg-color-*` > 테넌트 랜딩 > 레거시 리다이렉트; 포커스 토큰 단일화 제안.  
- 코더 핸드오프: on-light/on-dark/on-glass 프리셋 한 줄·토큰명만 기술 여부 등 체크리스트.

---

## 6. W1d — core-debugger (프롬프트 복붙)

```
역할: core-debugger (코드 패치 금지)

과제: "버튼 라벨이 안 보임"류에 대한 운영·재현 지원 문서.

산출:
1) 재현 3단계(환경·스크롤 위치·역할)
2) DevTools 체크리스트: Contrast, Computed color/background, stacking(z-index), overflow clip, forced-colors(가능 시)
3) core-coder에게 넘길 확인 포인트만 bullet (수정 코드는 쓰지 말 것)

증상 예시: mg-header--transparent + mg-button--primary + 회원가입 라벨 대비 불량(사용자 스크린샷)
```

**에이전트 ID**: `5e397e76-1182-4a9a-94e0-04aa1461b0b9`

**결과 요약**  
- **재현 3단계**: URL·뷰포트·줌 / 스크롤 0 vs 이후·스티키 / 역할·세션·시크릿.  
- **DevTools**: Contrast·axe, Computed(`color`·inherit·opacity·background·filter·blend), Stacking(Layers·z-index·pointer-events), Overflow(clip·line-clamp·flex shrink).  
- **코더 확인 포인트**: transparent 헤더 `inherit`·토큰 충돌, primary 라벨 vs 배경, sticky/오버레이 가림, flex 0폭 텍스트 등.

---

## 7. Wave 2 — 병렬 실행 (구현 + 검증 자산)

**실행일**: 2026-04-17  
**방식**: `core-coder`와 `core-tester` **동시** 위임(코더 완료를 테스터가 기다리지 않음 — 테스터는 E2E·체크리스트·스냅샷 기준선 추가).

| # | 서브에이전트 | 에이전트 ID | 산출 |
|---|----------------|-------------|------|
| W2a | **core-coder** | `34c6b271-e574-4d46-a56f-c9fcce134f48` | `Homepage.css` 헤더 액션 스코프 대비·overflow 완화; `Homepage.js`에서 `mg-v2-btn-text` / `mg-v2-btn-primary` 제거·빌더만 유지 |
| W2b | **core-tester** | `325f2298-ff2a-47f8-9019-a8945fa91ab0` | `tests/e2e/tests/landing/landing-home-header.spec.ts` + chromium 스냅샷 2장; `BUTTON_VISIBILITY_WAVE2_TEST_CHECKLIST.md` |

**코더 검증 요약**: `npm run lint` 통과; `npm test -- --testPathPattern="Button\.test|components\.test"` 44 passed. 전역 `unified-design-tokens` 미변경(회귀 최소화).

**테스터 검증 요약**: `npx playwright test tests/landing/landing-home-header.spec.ts --project=chromium` 통과(스냅샷 갱신 후 재실행 통과 보고).

**코더 머지 후 테스터 재확인(요약)**  
- 동일 Playwright 명령 전부 통과 및 스냅샷 갱신 필요 여부  
- Linux CI 스냅샷 OS 접미사 차이 대비  
- (선택) `@axe-core/playwright` 도입 합의 시 Violations 0 목표

위임 시 반드시 인용: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`.

### Wave 2 관련 문서
- 수동·자동 검증 체크리스트: `docs/project-management/2026-04-17/BUTTON_VISIBILITY_WAVE2_TEST_CHECKLIST.md`

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-17 | Wave 1 병렬 위임 문서 초안 작성 |
| 2026-04-17 | Wave 1 실행 완료: explore·core-component-manager·core-designer·core-debugger 병렬 Task, §3~§6에 ID·요약 반영 |
| 2026-04-17 | Wave 2 병렬: core-coder(W2a) + core-tester(W2b), §7 갱신 |

---

## 9. 이어하기 (Wave 3 제안)

1. **검수·커밋**: Wave 2 변경(`Homepage.js`/`Homepage.css`, e2e 스펙·스냅샷, 체크리스트 md)을 사용자가 검수한 뒤 브랜치에 커밋.  
2. **CI**: Linux에서 Playwright 스냅샷 불일치 시 `BUTTON_VISIBILITY_WAVE2_TEST_CHECKLIST.md` 절차로 기준선 정리.  
3. **Wave 3**: `core-coder` 배치 2 — `UnifiedLogin`·모달 `_unified-modals` 등 Wave1 표 **Med** 항목 순; 병렬로 `core-tester`는 `/login` 스모크 또는 axe 도입 합의 시 스펙 추가.
