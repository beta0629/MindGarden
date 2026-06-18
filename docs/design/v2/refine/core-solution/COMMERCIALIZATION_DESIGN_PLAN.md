# Core Solution 상용화 디자인 계획 (Phase 3 v1.1)

> **Status**: Active  
> **Scope**: Core Solution 메인 앱 UI (`frontend/`, 로그인 후 `/` 허브·어드민). Trinity 제외.  
> **Version**: v1.1 — [DESIGN_CURRENT_STATE_ANALYSIS.md](./DESIGN_CURRENT_STATE_ANALYSIS.md) 점검 결과 통합  
> **Date**: 2026-06-18  
> **Active Commercial SSOT**: [COMMERCIALIZATION_SPEC_ACTIVE.md](./COMMERCIALIZATION_SPEC_ACTIVE.md) — Gate·Batch·진행 상태 단일 권위  
> **상위 SSOT**: [DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md) · [README.md](./README.md)

---

## Executive Summary

전면 Greenfield로 갈아엎고 싶은 욕구는 타당하다 — 1·2차 부분 패치 실패, z-index·버튼·모달 파편화, B0KlA와 프로덕션 `/` 간격이 이를 뒷받침한다([DESIGN_CURRENT_STATE_ANALYSIS.md](./DESIGN_CURRENT_STATE_ANALYSIS.md) §2~§3). 다만 이미 투입된 **MGButton·ActionBar·B0KlA(AdminDashboardV2)·`--mg-v2-*` 토큰·UnifiedModal·ContentHeader**를 버리면 시간·비용 손실이 크다. **권장안: 점검 기반 단계적 상용화** — ROI가 가장 높은 **메인 셸(`/`)과 첫인상 허브만 Greenfield 시안 1벌**로 재정의하고, LNB/GNB·버튼·모달·카드는 **B0KlA 확장 + Refactor**로 수렴한다. 전역 일괄 치환·부분 패치는 금지하며, Phase 1 시안 확정 후 Phase 3에서 하향식 일괄 React 반영한다.

---

## 입력 문서 (SSOT 체인)

| 순서 | 문서 | 역할 |
|------|------|------|
| 0 | [COMMERCIALIZATION_SPEC_ACTIVE.md](./COMMERCIALIZATION_SPEC_ACTIVE.md) | **Active Commercial SSOT** — Gate·Batch·금지·진행 상태 |
| 1 | [DESIGN_CURRENT_STATE_ANALYSIS.md](./DESIGN_CURRENT_STATE_ANALYSIS.md) | 현황·P0/P1/P2·코드 근거 |
| 2 | 본 문서 | 의사결정·상용화 바·로드맵 v1.1 |
| 3 | [DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md) | Phase 0~4 실행 게이트 |
| 4 | [DESIGN_V2_TOKEN_SSOT.md](../../DESIGN_V2_TOKEN_SSOT.md) | Calm Forest `--mg-v2-*` |
| 5 | [CORE_SOLUTION_IDENTITY.md](./CORE_SOLUTION_IDENTITY.md) | 제품 톤·Calm Forest |
| 6 | [KR_SAAS_BENCHMARK_20260617.md](./KR_SAAS_BENCHMARK_20260617.md) | 국내 B2B SaaS 참고 |

---

## 의사결정 매트릭스

**축**: 우선순위(P0/P1/P2) × 접근(패치 / B0KlA 확장 / Greenfield 해당 영역) × 예상 공수(S/M/L)

| ID | 문제 영역 | P | 패치 | B0KlA 확장 | Greenfield | 권장 | 공수 |
|----|-----------|---|------|------------|------------|------|------|
| D1 | z-index·오버레이 충돌 | P0 | △ (재발 위험) | ○ 토큰 `--mg-v2-z-*` 일원화 | ○ 셸 레이어 재설계 | **B0KlA 확장** → Phase 3 일괄 | M |
| D2 | SaaS Blue `#3B82F6` 잔존 | P0 | × | ○ 토큰 치환 가이드 | — | **B0KlA 확장** (시안 범위 외 코드는 Phase 3) | S |
| D3 | `/` 허브 IA·밀도·첫인상 | P0 | × | △ 틀만 유지 | **◎** 백지 시안 1벌 | **Greenfield (해당 영역만)** | L |
| D4 | MGButton vs `<button>` 혼재 | P1 | × | **◎** variant·높이 SSOT | — | **B0KlA 확장** | M |
| D5 | UnifiedModal vs 커스텀 모달 | P1 | × | **◎** 마이그레이션 패턴 | — | **B0KlA 확장** | M |
| D6 | LNB/GNB·TabletHomepage vs AdminDashboardV2 격차 | P1 | × | **◎** B0KlA 레이아웃 토큰화 | ○ `/` 시안에 통합 스펙 | **B0KlA 확장** + Phase 1 시안에 명시 | M |
| D7 | ContentHeader·섹션 블록 | P1 | ○ | **◎** 악센트 바·radius 토큰 | — | **B0KlA 확장** | S |
| D8 | 다크모드 `.dark-mode` vs `[data-theme]` | P2 | △ | **◎** TOKEN SSOT 단일화 | — | **B0KlA 확장** | M |
| D9 | padding 하드코딩 (`16px` 등) | P2 | × | **◎** `--mg-v2-space-*` | — | **B0KlA 확장** | S |
| D10 | 역할별 허브(원장·상담사·행정) | P2 | × | ○ Phase 4 템플릿 | ○ 역할별 시안 1벌 | **Greenfield (Phase 4, `/` 완료 후)** | L×N |

**공수 기준**: S = 0.5~1일(문서·토큰·소규모), M = 2~5일(컴포넌트·레이아웃), L = 1~2주(시안+React 일괄)

**원칙**: Greenfield는 **D3(메인 셸·첫인상)** 과 **Phase 4 역할별 허브**에만 집중. 나머지는 이미 존재하는 B0KlA·공통 컴포넌트 **확장(Refactor)**.

---

## Keep / Refactor / Rebuild 표

| 영역 | 판정 | 근거 (점검) | Phase 1 시안 | Phase 3 React |
|------|------|-------------|--------------|---------------|
| **메인 `/` 허브** | **Rebuild** | B0KlA 샘플 vs 프로덕션 `/` 밀도·IA 갭 P0 ([GAP_ANALYSIS](../v2/GAP_ANALYSIS.md) §2) | Greenfield 시안 1벌 (데스크톱+375px) | 확정 시안 일괄 반영 |
| **공개 메인 (Public Main)** | **Rebuild** | 첫인상 제네릭화·로고 부재·GNB 파편화 P0 | Shield 로고·Calm Forest 시안 1벌 | Phase 3 (Admin Hub와 병렬 또는 선행) |
| **LNB (260px 사이드바)** | **Refactor** | B0KlA 구조 유효, 토큰·활성 상태만 불일치 | 시안에 Dark `#2C2C2C`·활성 `#3D5246` 명시 | `AdminCommonLayout`·DesktopLnb 토큰 정합 |
| **GNB (64px 상단)** | **Refactor** | UnifiedHeader·MGHeader 병존 | Shield 로고 variant·알림·프로필 배치 고정 | 기존 GNB 컴포넌트 토큰화 |
| **ContentHeader** | **Keep → Refactor** | 패턴 존재, spacing·타이포 파편화 P2 | 타이틀·브레드크럼·액션 바 위계 | `--mg-v2-*` 간격·타이포만 |
| **카드·섹션 블록** | **Refactor** | B0KlA 악센트 바·radius 16px SSOT 있음 | 섹션 래퍼·KPI 카드 밀도 정의 | `mg-v2-ad-b0kla__*`·FeatureCard 계열 |
| **Core Flow Pipeline** | **Refactor** | Wide 화면 중앙 몰림·여백 이슈 | 5단계 전체 너비 균등 분배 (Grid/Flex) | Phase 3 일괄 반영 (선행 패치 금지) |
| **모달** | **Refactor** | UnifiedModal 표준 있으나 커스텀 병존 P1 | 닫기·패딩·오버레이 1종 | EventModal 등 → UnifiedModal |
| **버튼 SSOT** | **Refactor** | MGButton vs `btn-primary` 혼재 P1 | Primary 40px·radius 10px·variant 표 | MGButton 100% (`/` 라우트 우선) |
| **다크모드** | **Refactor** | `.dark-mode` 레거시 P2 | 라이트+다크 시안 각 1프레임 | `[data-theme="dark"]` + TOKEN SSOT |
| **역할별 허브** | **Rebuild (순차)** | IA 미확정 ([GAP_ANALYSIS](../v2/GAP_ANALYSIS.md) §2.2) | Phase 4 — `/` 템플릿 파생 | Phase 4 React |

---

## 상용화 품질 바 (측정 가능 체크리스트)

Phase 1 시안 검수(Phase 2) 및 Phase 3 React 반영 완료 시 **모두 충족**해야 상용화 게이트 통과.

### 타이포그래피
- [ ] 본문 `--mg-v2-font-size-body` (15~16px)만 사용; 임의 `font-size: 14px` 등 **0건** (`/` 관련 CSS)
- [ ] 페이지 타이틀 `--mg-v2-font-size-h1` 계층; KPI 숫자 24px Bold, 라벨 12px (시안·구현 일치)
- [ ] Off-black 텍스트: `--mg-v2-color-text-primary` (순수 `#000` 금지)

### 8px 그리드·간격
- [ ] padding/margin/gap은 `--mg-v2-space-*` (8px 배수)만; 임의 `17px`·`23px` **0건**
- [ ] 섹션 간 수직 간격 최소 `--mg-v2-space-10` (80px) 또는 시안 명시 토큰
- [ ] 카드 내부 패딩 `--mg-v2-space-6` (24px) 이상

### 대비·색상 (Contrast)
- [ ] 본문 대비 WCAG AA 4.5:1 이상 (TOKEN SSOT semantic 표 준수)
- [ ] 앱 UI 주조색 Calm Forest `#3D5246` only; `#3B82F6`·`#8B5CF6` **0건**
- [ ] 색상 100% `var(--mg-v2-*)` 또는 `design-v2-tokens.css` 참조

### 인터랙션 (hover / focus)
- [ ] 모든 클릭 가능 요소: `:hover` + `:focus-visible` 링 (`--mg-v2-color-primary-*` 또는 neutral)
- [ ] 버튼 disabled 상태 `--mg-v2-color-*-disabled` 명시
- [ ] 포커스 링 2px 이상, 키보드 탭 순서 논리적 (시안에 표기)

### Empty / Loading 상태
- [ ] 데이터 없음: 일러스트+한 줄 안내+CTA 1개 (시안 1프레임 이상)
- [ ] 로딩: 스켈레톤 또는 통일 스피너 (`LoadingSpinner` 패턴); 빈 화면 금지
- [ ] 에러: SafeErrorDisplay 패턴 준수 (코드 Phase 3)

### 모바일 (375px)
- [ ] 375px 시안 1벌 필수; LNB → 드로어, KPI 1열 스택
- [ ] 터치 타깃 최소 44×44px
- [ ] 가로 스크롤 없음 (허브 본문)

### 접근성 (a11y)
- [ ] 아이콘-only 버튼 `aria-label` (구현 Phase 3)
- [ ] 시맨틱 랜드마크: `nav`·`main`·`header` (시안 와이어에 표기)
- [ ] `prefers-reduced-motion` 대응 (TOKEN SSOT §2)

### 코드 정합 (Phase 3 전용)
- [ ] `z-index` ≥ 9999 하드코딩 **0건** → `--mg-v2-z-*`
- [ ] `/` 라우트 레거시 `<button class="btn-*">` **0건** → MGButton
- [ ] `/` 라우트 커스텀 모달 **0건** → UnifiedModal
- [ ] Visual regression: 확정 시안 대비 픽셀/레이아웃 차이 검수 통과 (core-tester)

---

## Phase 1~4 재정의 (v1.1)

기존 [DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md)와 **충돌 없음**. 본 절은 점검 결과·상용화 바를 **추가 조건**으로만 얹는다.

| Phase | v1.1 추가 목표 | 완료 조건 (추가) |
|-------|----------------|------------------|
| **0** | 문서 SSOT + 점검 통합 | 본 문서·CURRENT_STATE_ANALYSIS Active; INDEX 읽기 순서 반영 |
| **1** | **상용화 수준** `/` 시안 1벌 | 상용화 품질 바 **시안 항목** 충족; Keep/Refactor/Rebuild 표의 Rebuild 범위만 Greenfield; [§ Phase 1 브리프](#phase-1-시안-브리프-상용화) 준수 |
| **2** | 사용자 게이트 | [§ 사용자 게이트](#사용자-게이트) 질문 확정; 미충족 시 Phase 3 차단 |
| **3** | 확정 시안 → React **일괄** | 상용화 품질 바 **코드 항목** + core-tester 게이트 |
| **4** | 역할별 허브 | `/` 템플릿 파생 Rebuild (상담사 → 내담자 순); Phase 3 완료 전 착수 금지 |

**변경 없음 (유지)**: 시안 1벌 → 검수 → React 일괄; static mockup·Trinity·부분 패치 금지.

---

## 비용·시간 절약 원칙

1. **재사용 극대화**: `AdminDashboardV2.js`·B0KlA CSS·MGButton·ActionBar·UnifiedModal·`design-v2-tokens.css` — 신규 발명 금지, 시안은 **조합·밀도·IA**만 재정의.
2. **Greenfield 최소화**: 공개 메인(Public Main), 메인 셸(`/`)·역할별 허브(Phase 4)만 Rebuild; 나머지 Refactor.
3. **일괄 치환 스크립트 금지**: 전역 버튼/색상 스크립트 치환은 1·2차 실패 원인 — Phase 3에서 **시안 범위 파일만** core-coder 일괄.
4. **토큰 단일 권위**: HEX는 시안 주석·Figma만; 코드는 `--mg-v2-*` only.
5. **샘플 라우트 보존**: `/admin-dashboard-sample` 삭제 금지 — B0KlA 시각 회귀 기준.
6. **Trinity 분리**: 로고 canonical은 Trinity `public/assets` **참조만**; CS 앱 색은 TOKEN SSOT.

---

## Phase 1 시안 브리프 (상용화)

**대상**: 로그인 후 `/` (TabletHomepage / 대시보드 허브) — **전체 화면 1벌** (부분 컴포넌트 시안 금지)

### 사용자·IA (designer 입력)
- **역할 (진행 순서)**: **어드민(ADMIN) → 상담사(CONSULTANT) → 내담자(CLIENT)**. Phase 1은 **ADMIN 단일** 대상.
- **확정 KPI 3종 (2026-06-18)**: 1. 오늘 상담 일정, 2. 상담사별 오늘 일정, 3. 신규 상담 접수
- **목적**: 오늘 일정·KPI·미처리 알림·빠른 액션 — **3초 내** 핵심 파악
- **정보 노출**: 테넌트명·역할 배지·알림 수; 민감 PII는 카드 요약만

### 레이아웃 블록 (필수 프레임)
1. **GNB** 64px — Shield H2 로고(primary/inverse), 검색(placeholder), 알림, 프로필
2. **LNB** 260px — Dark `#2C2C2C`, 활성 `#3D5246`, 44px 행 높이; 모바일: 햄버거+드로어
3. **ContentHeader** — 페이지 타이틀, 브레드크럼, 우측 ActionBar(Primary 1 + Secondary ≤2)
4. **Hero/KPI 행** — 3~4 메트릭 카드, 24px 숫자, 12px 라벨, 내부 24px 패딩
5. **섹션 블록** — bg `#F5F3EF`, border `#D4CFC8`, radius 16px, 좌측 4px 악센트 바 `#3D5246`
6. **위젯 그리드** — 오늘 일정·미완료 회기·빠른 액션(최대 6개)
7. **Empty state** — 일정 없음 1프레임
8. **다크 모드** — 동일 IA 라이트+다크 각 1프레임 (또는 나란히)

### 컴포넌트 스펙 (B0KlA 정합)
| 컴포넌트 | 스펙 |
|----------|------|
| Primary 버튼 | h 40px, radius 10px, bg `#3D5246`, text `#FAF9F7` |
| Secondary 버튼 | outline neutral-300, 동일 높이 |
| KPI 카드 | radius 16px, shadow `--mg-v2-shadow-sm` |
| KpiFlipCard (신규) | 3D rotateY(180deg), 앞면 요약/뒷면 상세, radius 16px |
| 모달 (참고) | UnifiedModal 패딩·닫기 위치 — 시안에 1예시 |

### 산출물 형식
- Figma / PNG / PDF — **데스크톱 1440px + 모바일 375px**
- Calm Forest 토큰 표 첨부 (HEX는 TOKEN SSOT와 일치)
- Shield 로고 variant 명시 (light/dark)

### 금지사항
- SaaS Blue `#3B82F6`, Purple 그라데이션
- Trinity public 랜딩 컴포넌트·카피 혼용
- React/HTML/CSS/mockup 코드 선행
- `/landing`·C-1 스펙을 `/` 기준으로 혼용
- 부분 위젯만 따로 시안 (전체 허브 1벌 원칙)

### 참조 코드·시각 앵커 (그리기용, 구현 아님)
- `frontend/src/components/dashboard-v2/AdminDashboardV2.js`
- `https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample`
- `mindgarden-design-system.pen` B0KlA

---

## 사용자 게이트

Phase 1 시안 **검수 전** 사용자 확인 (Phase 2 착수 조건).

1. **IA 우선순위**: `/` 허브 첫 화면에 **반드시** 보여 줄 KPI·위젯 3가지는? → **확정 (2026-06-18)**: 1. 오늘 상담 일정, 2. 상담사별 오늘 일정, 3. 신규 상담 접수
2. **역할 기본값**: **어드민(ADMIN) 단일 진행 확정** (Phase 1). 상담사·내담자는 Phase 4 확장.
3. **Rebuild 범위 승인**: 메인 셸 Greenfield + LNB/GNB·컴포넌트 B0KlA 확장 전략에 **동의**하는지? (전면 Greenfield 아님을 명시 확인)

검수 체크리스트: [상용화 품질 바](#상용화-품질-바-측정-가능-체크리스트) 시안 해당 항목.

---

## 분배실행 (다음 단계)

| Phase | 서브에이전트 | 작업 | 병렬 |
|-------|-------------|------|------|
| 1-Design | **core-designer** (`model: gemini-3.1-pro`) | 본 문서 §Phase 1 브리프로 `/` 시안 1벌 | 사용자 게이트 3문항 **선행 권장** |
| 2-Review | 사용자 | 상용화 체크리스트·게이트 질문 확정 | — |
| 3-Code | **core-coder** → **core-tester** | 확정 시안 React 일괄; Keep/Refactor/Rebuild 표 준수; KpiFlipCard(3D Flip) 구현 포함 | Phase 2 OK 후 |
| 4-Expand | **core-designer** → **core-coder** | 역할별 허브 시안→반영 | Phase 3 완료 후 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-18 | Active SSOT 분리 — [COMMERCIALIZATION_SPEC_ACTIVE.md](./COMMERCIALIZATION_SPEC_ACTIVE.md) 신규; SSOT 체인 0번 추가 |
| 2026-06-18 | v1.1 초안 — CURRENT_STATE 점검 통합, 상용화 바·의사결정 매트릭스·ROI 기반 선택적 Rebuild |
