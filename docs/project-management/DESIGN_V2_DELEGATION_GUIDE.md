# 디자인 v2 작업 가이드 SSOT

> **최종 업데이트**: 2026-06-15  
> **상태**: DRAFT — PII 완료 후 Phase A1 진입 시 ACTIVE 로 변경  
> **담당**: core-planner (MindGarden)  
> **이 문서의 목적**: 디자인 v2 전체 작업에 걸친 모델 조합 정책 · Phase 구조 · 위임 양식 · 검수 게이트를 단일 SSOT 로 정의한다. 모든 후속 디자인 위임은 본 문서 §4 양식을 준수한다.

---

## 목차

- [§1. 목적·범위](#1-목적범위)
- [§2. 모델 조합 정책](#2-모델-조합-정책)
- [§3. Phase 구조 (A → B → C → D)](#3-phase-구조)
- [§4. 위임 형태 표준 (실제 사용 양식)](#4-위임-형태-표준)
- [§5. 산출물 표준](#5-산출물-표준)
- [§6. 검수 게이트](#6-검수-게이트)
- [§7. 1회 완결성 보장 체크리스트](#7-1회-완결성-보장-체크리스트)
- [§8. 위험 + 롤백](#8-위험--롤백)
- [§9. 일정 + 위임 횟수](#9-일정--위임-횟수)
- [§10. 비용 추정](#10-비용-추정)
- [§11. 참조 문서](#11-참조-문서)

---

## §1. 목적·범위

### 1.1 배경

MindGarden 전체 표준화 작업(SECRET 회전 + PII 회전) 마지막 단계가 완료됨에 따라, 디자인 v2 작업에 진입한다.

이전 디자인 작업은 Gemini 단독으로 진행되었으며, 다음 한계가 확인되었다:

| 항목 | Gemini 단독 결과 |
|------|-----------------|
| 시각 일관성 | 양호 (멀티모달 강점) |
| 대규모 코드 일관성 | 취약 (컴포넌트 간 불일치) |
| 토큰 SSOT 정확도 | 보통 |
| 재작업 발생률 | 높음 (명세 드리프트) |

이번 v2 에서는 **Claude + Gemini 조합** 전략을 채택한다:

- **Gemini**: 시각 작업 (시안, 컬러팔레트, 마크업, 시각 회귀) 전담
- **Claude**: 코드 작업 (토큰 SSOT, 컴포넌트, 페이지 마이그) 전담
- **비용 합리화**: Opus / Sonnet / Gemini / default 를 작업 성격에 따라 분배

### 1.2 범위

#### 포함 (재디자인 대상)

- **어드민 대시보드** 전체 페이지
- **상담사 포털** 전체 페이지
- **내담자 앱** 웹 화면 전체
- **웰니스 / 숍 / ERP / 테넌트 관리** 페이지
- **공통 컴포넌트** (Atom → Molecule → Organism → Template)
- **디자인 토큰 SSOT** (`mg-*` prefix CSS 변수 전체)
- **다크 모드 / 반응형 / 접근성** (Phase A 부터 동시 설계)

#### 제외 (유지)

- 비즈니스 로직 (API, DB, 서비스 레이어)
- 인증/인가 흐름 (로그인, JWT)
- 기존 Expo Native App 디자인 (별도 모바일 트랙)
- 이미 v2 완료된 컴포넌트 (있다면 인벤토리 단계에서 식별)

### 1.3 목표

1. **1회 작업 완결** — 재작업 0. 사전 SSOT + 다중 검수 게이트로 달성
2. **운영 영향 최소화** — 점진적 마이그레이션 (페이지 단위 독립 PR)
3. **비용 합리화** — Opus 단독 대비 약 60% 절감 (Sonnet + Gemini 조합 활용)
4. **다크 모드 · 반응형 · 접근성** — Phase A 부터 내장, 후속 작업 없음

---

## §2. 모델 조합 정책

### 2.1 작업 단계별 추천 모델

| 작업 단계 | 추천 모델 | 이유 |
|-----------|-----------|------|
| 시안·와이어·컬러팔레트 | `gemini-3.1-pro` | 멀티모달 + 시각 일관성 강점 |
| 토큰 SSOT 정의 | `claude-4.6-opus-high-thinking` | 구조적 사고 + 표준 정확도 |
| 컴포넌트 코드 (Atom/Molecule) | `claude-4.6-opus-high-thinking` | 정확성 + 대규모 코드 일관성 |
| 컴포넌트 코드 (Organism) | `claude-4.6-opus-high-thinking` | 복잡 상호작용 정확성 |
| 페이지 마이그 (대규모 분배) | `claude-4.6-sonnet-medium-thinking` | 합리적 비용 + 충분한 품질 |
| 마크업 (BEM/HTML) | `gemini-3.1-pro` | 마크업 일관성 + 시각 검토 |
| 시각 회귀 검증 | `gemini-3.1-pro` | 스크린샷 비교 멀티모달 |
| 기획·분배 (core-planner) | `claude-4.6-sonnet-medium-thinking` | 효율 + 정확 |
| 단순 머지·CI 모니터 | `composer-2.5-fast` 또는 default | 빠름 + 저비용 |

### 2.2 비용 합리화 원칙

#### Opus 사용 (고비용 · 고정확도 필수 작업)

- 토큰 SSOT 정의 (Phase A3) — 전체 디자인의 기반, 오류 비용 큼
- 핸드오프 문서 SSOT (Phase A4) — 후속 모든 작업의 기준
- Atom 컴포넌트 (Phase B1) — 전체 컴포넌트 트리의 최하단, 일관성 결정적
- Molecule 컴포넌트 (Phase B2) — Atom 조합, 복잡도 중간
- Organism 컴포넌트 (Phase B3) — 헤더/사이드바 등 전역 영향

#### Sonnet 사용 (합리적 비용 · 충분한 품질)

- Template 레이아웃 (Phase B4) — 구조 단순, Opus 불필요
- 페이지 마이그 전체 (Phase C) — 반복 패턴, 토큰 치환 중심
- 단순 코드 변경 / import 정리

#### Gemini 사용 (시각 작업 전담)

- 모든 시안·와이어프레임 (Phase A1)
- 핸드오프 문서 시각 섹션 (Phase A2)
- 마크업 일관성 검토 (Phase C 병행)
- 시각 회귀 자동화 (Phase D)

#### default/composer 사용 (최저 비용)

- 머지 커밋 메시지 생성
- CI 상태 모니터링
- 단순 파일 이동·이름 변경

### 2.3 모델 선택 기준 요약

```
비용 우선순위: Gemini = default/fast  <  Sonnet  <  Opus
정확도 우선순위: default  <  Sonnet  <  Opus  <  Gemini(시각)

규칙:
- 시각 판단 포함 → Gemini
- 코드 일관성 중요 + 반복 최소 → Opus
- 코드 반복 패턴 → Sonnet
- 단순 자동화 → default/fast
```

---

## §3. Phase 구조

```
Phase A (시안·SSOT) ─────────────────────────────────────────────►
  A1(시안, Gemini) ──┐
  A2(핸드오프, Gemini) ──┤ 병렬
  A3(토큰SSOT, Opus) ──┤
  A4(DS문서, Opus) ──┘
         │
         ▼  [사용자 검수 게이트 A]
Phase B (컴포넌트 SSOT) ────────────────────────────────────────►
  B1(Atom, Opus) ──┐
  B2(Molecule, Opus) ──┤ 병렬
  B3(Organism, Opus) ──┤
  B4(Template, Sonnet) ──┘
         │
         ▼  [사용자 검수 게이트 B]
Phase C (페이지 마이그) ────────────────────────────────────────►
  C-admin / C-consultant / C-client / ... (Sonnet, 그룹별 병렬)
  마크업 검토 (Gemini, 병행)
         │
         ▼  [사용자 검수 게이트 C]
Phase D (시각 회귀 + 검수) ──────────────────────────────────────►
  D1(회귀 자동화, Gemini)
  D2(사용자 최종 검수)
         │
         ▼  [완료]
```

### 3.1 Phase A: 시안·SSOT 정의

**목표**: 전체 디자인 v2 의 시각적 · 코드적 기준을 확립한다. Phase B~D 의 모든 작업이 여기서 도출된 SSOT 를 따른다.

**병렬 진행 가능**: A1 + A2 + A3 + A4 는 의존성 없으므로 동시 호출 가능.  
단, A3/A4 는 A1 시안 초안이 있으면 더 정확하므로 A1 완료 후 A3/A4 진행 권장.

#### A1. 시안 (core-designer, Gemini 3.1 Pro)

**목표**: 전체 디자인 v2 의 시각적 방향성 확립

**산출물**:
- 전체 톤·무드 결정 (무드보드 또는 텍스트 명세)
- 컬러 팔레트 초안 (Primary / Secondary / Neutral / Semantic / Surface)
- 타이포그래피 스케일 (heading 1~6, body, caption, code)
- 그리드 시스템 (PC 1280px, 태블릿 768px, 모바일 375px)
- 카드 / 버튼 / 폼 / 레이아웃 SSOT 시안
- 다크 모드 컬러 대응 초안
- 모바일 레이아웃 대응 초안
- 접근성 초안 (WCAG AA 기준 컨트라스트 확인)

**완료 기준**:
- 무드보드 또는 시안 명세 문서 1건 (`docs/design-system/DESIGN_V2_VISION_A1.md`)
- 컬러 팔레트 HEX 값 포함
- 다크/라이트 양쪽 컬러 포함

#### A2. 핸드오프 문서 (core-designer, Gemini 3.1 Pro)

**목표**: A1 시안을 코더에게 전달 가능한 구조화된 핸드오프 문서로 변환

**산출물** (`docs/design-system/DESIGN_V2_HANDOFF_A2.md`):
- §A. 전체 톤·무드 (키워드 3~5개 + 설명)
- §B. 컬러 팔레트 (CSS 변수 이름 제안 포함)
- §C. 타이포그래피 (폰트 패밀리, 사이즈 스케일, line-height, letter-spacing)
- §D. 레이아웃 그리드 (컬럼 수, 거터, 마진, breakpoint)
- §E. 컴포넌트 스펙 (Button / Card / Form / Modal / Navigation 각 상태별)
- §F. 다크 모드 전환 규칙
- §G. 반응형 전환 규칙
- §H. 접근성 체크리스트

**완료 기준**:
- §A~§H 모두 작성
- CSS 변수명 제안 (`mg-*` prefix) 포함

#### A3. 토큰 SSOT (core-coder, Claude 4.6 Opus)

**목표**: `mg-*` prefix CSS 변수 SSOT 확립 (라이트/다크/forced-colors)

**입력**: A2 핸드오프 문서 §B~§D

**산출물** (`src/main/resources/static/css/unified-design-tokens.css` 또는 신규 파일):
- `--mg-color-*`: 컬러 토큰 (라이트/다크 양쪽)
- `--mg-typography-*`: 타이포 토큰
- `--mg-spacing-*`: 여백 토큰
- `--mg-border-*`: 보더 토큰
- `--mg-shadow-*`: 그림자 토큰
- `--mg-radius-*`: 라운드 토큰
- `--mg-breakpoint-*`: 브레이크포인트 토큰
- `@media (prefers-color-scheme: dark)` 블록
- `@media (forced-colors: active)` 블록

**완료 기준**:
- 모든 토큰 `mg-*` prefix 준수
- 라이트/다크/forced-colors 3가지 모드 포함
- CSS 변수 카테고리별 주석 섹션

#### A4. 디자인 시스템 문서 (core-coder, Claude 4.6 Opus)

**목표**: 토큰 SSOT 사용법 및 컴포넌트 개발 가이드 문서화

**입력**: A3 토큰 SSOT 결과

**산출물** (`docs/design-system/DESIGN_SYSTEM_V2.md`):
- 토큰 사용법 (예시 포함)
- 토큰 카테고리 설명
- 컴포넌트 개발 원칙 (토큰만 사용, override 금지)
- 아토믹 디자인 적용 가이드
- 다크 모드 구현 가이드
- 반응형 구현 가이드

**완료 기준**:
- 문서 작성 완료
- 토큰 사용 예시 코드 포함

---

### 3.2 Phase B: 컴포넌트 SSOT

**목표**: 아토믹 디자인 계층별 SSOT 컴포넌트 구현

**전제**: Phase A 완료 + 사용자 검수 게이트 A 통과 후 진입

**병렬 진행**: B1 + B2 + B3 + B4 는 의존성 구조상 B1 → B2 → B3 순서가 원칙이나, 각 그룹 내부는 병렬 가능.

#### B1. Atom 컴포넌트 (core-coder, Claude 4.6 Opus)

**대상 컴포넌트**:

| 컴포넌트 | 상태 | 비고 |
|----------|------|------|
| MGButton | 기본/hover/active/disabled/loading | v1 이미 존재, v2 토큰 치환 |
| MGInput | 기본/focus/error/disabled | |
| MGTextarea | 기본/focus/error/disabled | |
| MGSelect | 기본/open/selected/disabled | |
| MGCheckbox | 기본/checked/indeterminate/disabled | |
| MGRadio | 기본/checked/disabled | |
| MGToggle | on/off/disabled | |
| MGBadge | 상태별 variant | |
| MGAvatar | 이미지/이니셜/크기별 | |
| MGIcon | 크기별/색상별 | |
| MGSpinner | 크기별 | |
| MGDivider | 수평/수직 | |
| MGChip | 기본/선택/삭제 가능 | |
| MGTag | 색상별 variant | |
| MGTooltip | 위치별 | |

**완료 기준**:
- 모든 Atom 토큰만 사용 (`--mg-*` 변수)
- CSS override 0줄
- 각 상태별 스타일 구현
- PropTypes / TypeScript interface 정의

#### B2. Molecule 컴포넌트 (core-coder, Claude 4.6 Opus)

**대상 컴포넌트**:

| 컴포넌트 | 구성 Atom | 비고 |
|----------|-----------|------|
| MGCard | MGDivider, MGBadge | 기본/hover/선택 상태 |
| MGFormGroup | MGInput, MGLabel, MGError | 라벨+입력+에러 묶음 |
| MGSearchBar | MGInput, MGIcon, MGButton | 검색 UI |
| MGPagination | MGButton, MGIcon | 페이지네이션 |
| MGBreadcrumb | MGIcon | 경로 표시 |
| MGAlert | MGIcon, MGBadge | info/success/warning/error |
| MGDatePicker | MGInput, MGIcon, MGButton | 날짜 선택 |
| MGTimePicker | MGSelect | 시간 선택 |
| MGFileUpload | MGButton, MGIcon | 파일 업로드 |
| MGProgressBar | - | 진행률 표시 |
| MGStepIndicator | MGIcon | 단계 표시 |
| MGEmptyState | MGIcon, MGButton | 빈 화면 안내 |
| MGSkeletonCard | - | 로딩 스켈레톤 |
| MGStatCard | MGIcon, MGBadge | 통계 카드 |
| MGListItem | MGAvatar, MGBadge | 목록 아이템 |

**완료 기준**:
- 모든 Molecule Atom 만으로 조합
- 토큰만 사용
- 반응형 대응

#### B3. Organism 컴포넌트 (core-coder, Claude 4.6 Opus)

**대상 컴포넌트**:

| 컴포넌트 | 비고 |
|----------|------|
| AdminHeader | GNB, 알림, 사용자 메뉴 |
| AdminSidebar | LNB, 메뉴 트리, 접힘/펼침 |
| AdminFooter | 저작권, 링크 |
| UnifiedModal | 공통 모달 SSOT (기존 컴포넌트 v2 마이그) |
| MGTable | 테이블 + 정렬 + 페이지네이션 |
| MGDataGrid | 고급 그리드 |
| MGKanban | 칸반 보드 |
| MGCalendar | 캘린더 |
| MGNotificationList | 알림 목록 |
| MGUserProfile | 사용자 프로필 카드 |
| MGCommentThread | 댓글/피드백 스레드 |
| MGTimeline | 타임라인 |
| MGWizard | 단계별 폼 |
| MGDashboardWidget | 대시보드 위젯 래퍼 |

**완료 기준**:
- AdminCommonLayout 연동 확인
- UnifiedModal SSOT 적용 (커스텀 오버레이 0)
- 다크 모드 완전 지원

#### B4. Template 컴포넌트 (core-coder, Claude 4.6 Sonnet)

**대상**:

| 템플릿 | 설명 |
|--------|------|
| AdminCommonLayout | 어드민 기본 레이아웃 (헤더+사이드바+본문) |
| AdminListPageTemplate | 목록 페이지 (필터+테이블+페이지네이션) |
| AdminDetailPageTemplate | 상세 페이지 (breadcrumb+콘텐츠) |
| AdminFormPageTemplate | 폼 페이지 (섹션+버튼 영역) |
| AdminDashboardTemplate | 대시보드 (위젯 그리드) |
| ConsultantPortalLayout | 상담사 포털 레이아웃 |
| ClientAppLayout | 내담자 앱 레이아웃 |

**완료 기준**:
- 모든 어드민 페이지는 AdminCommonLayout children 사용
- title/loading 등만 페이지별 지정

---

### 3.3 Phase C: 페이지 마이그레이션

**목표**: 전체 페이지를 v2 컴포넌트 + 토큰으로 마이그레이션

**전제**: Phase B 완료 + 사용자 검수 게이트 B 통과 후 진입

**분배 방식**: 그룹별로 core-coder (Sonnet) 병렬 위임

#### C 그룹 분배

| 그룹 | 담당 모델 | 페이지 수 (예상) |
|------|-----------|-----------------|
| C-admin-dashboard | Sonnet | ~10 |
| C-admin-schedule | Sonnet | ~8 |
| C-admin-payment | Sonnet | ~10 |
| C-admin-consultant | Sonnet | ~8 |
| C-admin-client | Sonnet | ~8 |
| C-admin-settings | Sonnet | ~6 |
| C-admin-tenant | Sonnet | ~6 |
| C-consultant-portal | Sonnet | ~10 |
| C-client-app | Sonnet | ~10 |
| C-wellness | Sonnet | ~6 |
| C-shop | Sonnet | ~8 |
| C-erp | Sonnet | ~6 |
| C-mypage | Sonnet | ~4 |

**병렬 진행**: 그룹 간 의존성 없으므로 동시 호출 가능 (단, 동시 10개 이하 권장)

#### C 마크업 검토 (병행)

- 담당: core-publisher (Gemini 3.1 Pro)
- C 그룹 완료 후 각 그룹별 마크업 일관성 검토
- BEM 준수 여부, 시맨틱 HTML 여부, 접근성 attr 여부

#### C 각 그룹 위임 기준

```
각 그룹 위임 시 포함 사항:
1. 대상 페이지 목록 (파일 경로)
2. 참조할 토큰 SSOT 경로
3. 참조할 컴포넌트 경로 (Atom/Molecule/Organism)
4. 마이그 패턴 예시 (기존 클래스 → 신규 토큰/컴포넌트)
5. 완료 기준: override CSS 0, 인라인 스타일 0, 토큰 100%
```

---

### 3.4 Phase D: 시각 회귀 + 검수

**목표**: Phase C 완료 후 전체 페이지 시각 회귀 검증 및 최종 사용자 검수

#### D1. 시각 회귀 자동화 (core-tester, Gemini 3.1 Pro)

**KPI (D11)**:
- `r2Protected` 회귀 0 (기존 레이아웃 깨짐 없음)
- 라이트 모드 전체 페이지 스크린샷 통과
- 다크 모드 전체 페이지 스크린샷 통과
- 모바일 414×896 전체 페이지 스크린샷 통과
- Lighthouse 접근성 점수 ≥ 90

#### D2. 사용자 최종 검수

- Phase A 완료 시: 시안 + 토큰 SSOT 검수
- Phase B 완료 시: 컴포넌트 SSOT 검수
- Phase C 완료 시 (그룹별): 그룹별 페이지 검수
- Phase D 완료 시: 전체 최종 검수

---

## §4. 위임 형태 표준 (실제 사용 양식)

### 4.1 위임 호출 기본 형태

```typescript
Task(
  description: "Phase A1 시안 (core-designer)",
  subagent_type: "core-designer",
  model: "gemini-3.1-pro",
  run_in_background: true,
  prompt: `
    [프롬프트 내용 — 아래 양식 참조]
  `
)
```

### 4.2 Phase A1 시안 위임 양식

```
## 임무: 디자인 v2 Phase A1 — 시안 (톤·무드·컬러·타이포·그리드)

**참조 스킬**: /core-solution-design-handoff, /core-solution-planning §0
**참조 문서**: docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.1 A1

### 목표
MindGarden 디자인 v2 전체 톤·무드·컬러팔레트·타이포·그리드 시안을 작성한다.
이 시안은 Phase A3(토큰 SSOT)의 직접 입력이 된다.

### 사용성 요구 (필수 포함)
- 어드민: 데이터 집약적 UI, 정보 밀도 높음, 빠른 스캔 가능
- 상담사: 집중적 1:1 환경, 정서적 신뢰감
- 내담자: 친근하고 따뜻한 UX, 모바일 우선

### 정보 노출 원칙
- 역할별 컬러 시그니처 (admin/consultant/client 구분)
- 상태별 시맨틱 컬러 (성공/경고/에러/정보)

### 레이아웃
- PC: 1280px 기준, 12컬럼 그리드
- 태블릿: 768px, 8컬럼
- 모바일: 375px, 4컬럼

### 산출물
파일: docs/design-system/DESIGN_V2_VISION_A1.md
- §A 톤·무드 키워드 + 설명
- §B 컬러팔레트 (Primary/Secondary/Neutral/Semantic/Surface, 라이트/다크)
- §C 타이포그래피 스케일
- §D 레이아웃 그리드
- §E 초안 컴포넌트 방향성 (카드/버튼/폼)
- §F 다크 모드 컬러 대응
- §G 접근성 WCAG AA 컨트라스트 확인

### 완료 기준
- 모든 §A~§G 작성
- HEX 컬러 값 포함
- CSS 변수명 제안 (mg-* prefix)
```

### 4.3 Phase A3 토큰 SSOT 위임 양식

```
## 임무: 디자인 v2 Phase A3 — CSS 토큰 SSOT 정의

**참조 스킬**: /core-solution-design-system-css, /core-solution-frontend
**참조 문서**: docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.1 A3
**입력 문서**: docs/design-system/DESIGN_V2_HANDOFF_A2.md (A2 핸드오프)

### 목표
mg-* prefix CSS 변수 SSOT 를 확립한다.
라이트 / 다크 / forced-colors 3가지 모드를 모두 포함한다.

### 토큰 카테고리 (필수)
- --mg-color-*: 컬러 (primary/secondary/neutral/semantic/surface)
- --mg-typography-*: 폰트 패밀리/사이즈/weight/line-height
- --mg-spacing-*: 여백 (4px 그리드 기반)
- --mg-border-*: 보더 (radius/width/color)
- --mg-shadow-*: 그림자
- --mg-breakpoint-*: 브레이크포인트

### 규칙
- 모든 변수 mg-* prefix 필수
- :root { } 에 라이트 모드 정의
- @media (prefers-color-scheme: dark) { :root { } } 에 다크 정의
- @media (forced-colors: active) { } 에 고대비 정의
- 카테고리별 섹션 주석 필수

### 산출물
파일: src/main/resources/static/css/unified-design-tokens.css (또는 지정 경로)

### 완료 기준
- 3가지 모드 모두 포함
- 모든 토큰 mg-* prefix
- 카테고리별 주석
- A2 핸드오프 HEX 값 반영
```

### 4.4 Phase B1 Atom 컴포넌트 위임 양식

```
## 임무: 디자인 v2 Phase B1 — Atom 컴포넌트 SSOT 구현

**참조 스킬**: /core-solution-atomic-design, /core-solution-frontend, /core-solution-common-modules
**참조 문서**:
  - docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.2 B1
  - docs/design-system/DESIGN_SYSTEM_V2.md (A4 산출물)
  - src/main/resources/static/css/unified-design-tokens.css (A3 산출물)

### 목표
아토믹 디자인 Atom 계층 컴포넌트를 v2 토큰 기반으로 구현한다.

### 대상 컴포넌트
[§3.2 B1 표 참조 — MGButton, MGInput, MGBadge 등 15종]

### 절대 규칙
- CSS override 금지 — 토큰(--mg-*) 만 사용
- 인라인 스타일 금지
- !important 금지
- 하드코딩된 color/size 값 금지

### 디렉토리
src/main/resources/static/js/components/atoms/

### 완료 기준 (컴포넌트별)
- 모든 상태(기본/hover/active/disabled) 구현
- 다크 모드 자동 지원 (토큰 사용으로 달성)
- PropTypes/TypeScript interface 정의
- CSS override 0줄
```

### 4.5 Phase C 페이지 마이그 위임 양식

```
## 임무: 디자인 v2 Phase C — [그룹명] 페이지 마이그레이션

**참조 스킬**: /core-solution-frontend, /core-solution-atomic-design
**참조 문서**:
  - docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.3
  - src/main/resources/static/css/unified-design-tokens.css
  - docs/design-system/DESIGN_SYSTEM_V2.md

### 대상 페이지
[파일 경로 목록]

### 마이그 패턴
- 기존 hardcoded color → --mg-color-* 토큰
- 기존 custom 클래스 → v2 컴포넌트 (MGButton, MGCard 등)
- AdminCommonLayout 적용 확인
- 인라인 스타일 제거

### 절대 규칙
- CSS override 금지
- 인라인 스타일 금지
- 비즈니스 로직 변경 금지 (UI만 변경)
- 기존 API 호출 유지

### 완료 기준 (페이지별)
- 토큰 사용률 100%
- override CSS 0줄
- AdminCommonLayout 적용
- 기능 동일 (로직 변경 없음)
```

### 4.6 Phase D 시각 회귀 위임 양식

```
## 임무: 디자인 v2 Phase D — 시각 회귀 자동화

**참조 문서**: docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.4 D1

### 목표
Phase C 완료 후 전체 페이지 시각 회귀를 자동화 검증한다.

### KPI (D11) — 모두 통과해야 Phase D 완료
- r2Protected 회귀 0 (기존 레이아웃 구조 유지)
- 라이트 모드 전체 페이지 스크린샷 baseline 대비 diff 없음
- 다크 모드 전체 페이지 스크린샷 baseline 대비 diff 없음
- 모바일 414×896 전체 페이지 스크린샷 baseline 대비 diff 없음
- Lighthouse 접근성 점수 ≥ 90 (전체 페이지)

### 실행 방법
[테스트 환경 기준으로 작성]

### 산출물
- 시각 회귀 결과 리포트
- 통과/실패 페이지 목록
- 실패 시 스크린샷 diff
```

---

## §5. 산출물 표준

### 5.1 디자인 토큰 명명 규칙

#### prefix 규칙

```
모든 토큰: --mg-{category}-{variant}-{state}
```

#### 카테고리별 예시

```css
/* Color */
--mg-color-primary-500: #...;
--mg-color-primary-600: #...;
--mg-color-secondary-500: #...;
--mg-color-neutral-100: #...;
--mg-color-neutral-900: #...;
--mg-color-semantic-success: #...;
--mg-color-semantic-warning: #...;
--mg-color-semantic-error: #...;
--mg-color-semantic-info: #...;
--mg-color-surface-bg: #...;
--mg-color-surface-card: #...;

/* Typography */
--mg-typography-family-base: '...';
--mg-typography-size-h1: ...rem;
--mg-typography-size-h2: ...rem;
--mg-typography-size-body: ...rem;
--mg-typography-size-caption: ...rem;
--mg-typography-weight-regular: 400;
--mg-typography-weight-medium: 500;
--mg-typography-weight-bold: 700;
--mg-typography-line-height-body: 1.5;

/* Spacing */
--mg-spacing-1: 4px;
--mg-spacing-2: 8px;
--mg-spacing-3: 12px;
--mg-spacing-4: 16px;
--mg-spacing-6: 24px;
--mg-spacing-8: 32px;
--mg-spacing-12: 48px;
--mg-spacing-16: 64px;

/* Border */
--mg-border-radius-sm: 4px;
--mg-border-radius-md: 8px;
--mg-border-radius-lg: 12px;
--mg-border-radius-xl: 16px;
--mg-border-radius-full: 9999px;
--mg-border-width-1: 1px;
--mg-border-width-2: 2px;
--mg-border-color-default: var(--mg-color-neutral-200);

/* Shadow */
--mg-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--mg-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--mg-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

/* Breakpoint */
--mg-breakpoint-mobile: 375px;
--mg-breakpoint-tablet: 768px;
--mg-breakpoint-desktop: 1280px;
```

#### 금지 패턴

```css
/* 금지 — hardcoded 값 */
color: #1a73e8;
background: #fff;
padding: 16px;

/* 금지 — override */
.mg-button { background: red !important; }

/* 허용 — 토큰 사용 */
color: var(--mg-color-primary-500);
background: var(--mg-color-surface-bg);
padding: var(--mg-spacing-4);
```

### 5.2 컴포넌트 디렉토리 구조

```
src/main/resources/static/js/components/
├── atoms/
│   ├── MGButton/
│   │   ├── MGButton.jsx (또는 .tsx)
│   │   ├── MGButton.module.css
│   │   └── index.js
│   ├── MGInput/
│   ├── MGBadge/
│   └── ...
├── molecules/
│   ├── MGCard/
│   ├── MGFormGroup/
│   └── ...
├── organisms/
│   ├── AdminHeader/
│   ├── AdminSidebar/
│   ├── UnifiedModal/
│   └── ...
└── templates/
    ├── AdminCommonLayout/
    ├── AdminListPageTemplate/
    └── ...
```

### 5.3 핸드오프 문서 형식

모든 핸드오프 문서는 다음 §A~§H 섹션을 포함해야 한다:

```markdown
# [문서명] 핸드오프

## §A. 톤·무드
## §B. 컬러 팔레트
## §C. 타이포그래피
## §D. 레이아웃 그리드
## §E. 컴포넌트 스펙
## §F. 다크 모드 규칙
## §G. 반응형 규칙
## §H. 접근성 체크리스트
```

### 5.4 시각 회귀 게이트 (D11 KPI)

| KPI | 기준 | 측정 방법 |
|-----|------|-----------|
| r2Protected | 0 회귀 | Storybook 시각 회귀 또는 Playwright |
| 라이트 모드 | baseline 대비 diff 없음 | 스크린샷 비교 |
| 다크 모드 | baseline 대비 diff 없음 | 스크린샷 비교 |
| 모바일 414×896 | baseline 대비 diff 없음 | 스크린샷 비교 |
| Lighthouse 접근성 | ≥ 90 | Lighthouse CI |

### 5.5 CSS Override 금지

```
규칙: 모든 스타일은 CSS 토큰(--mg-*) 으로만 표현한다.
- 컴포넌트 외부에서 컴포넌트 내부 스타일 override 금지
- !important 사용 금지
- 인라인 스타일 금지 (애니메이션 동적 값 예외)
- hardcoded 색상/크기 금지

위반 감지:
- PR 시 override CSS 라인 수 리포트
- 목표: 0줄
```

---

## §6. 검수 게이트

### 6.1 Phase 전환 사용자 검수 (필수)

| 게이트 | 시점 | 검수 항목 |
|--------|------|-----------|
| 게이트 A | Phase A 완료 후 | 시안 방향성, 토큰 SSOT, 핸드오프 문서 |
| 게이트 B | Phase B 완료 후 | 컴포넌트 SSOT, 다크 모드, 반응형 |
| 게이트 C | Phase C 각 그룹 완료 후 | 그룹별 페이지 외관, 기능 이상 없음 |
| 게이트 D | Phase D 완료 후 | 시각 회귀 전체 통과, 최종 승인 |

**규칙**: 사용자 검수 통과 없이 다음 Phase 진입 불가.

### 6.2 자동화 게이트

| 자동화 | 시점 | 기준 |
|--------|------|------|
| CSS override 스캔 | 각 PR | override 줄 수 = 0 |
| 토큰 사용률 검사 | 각 PR | hardcoded 값 = 0 |
| 시각 회귀 | Phase D | D11 KPI 전체 통과 |
| Lighthouse | Phase D | 접근성 ≥ 90 |
| TypeScript 타입 체크 | 각 PR | 에러 0 |

### 6.3 정량 메트릭

| 메트릭 | 목표 |
|--------|------|
| 토큰 사용률 | 100% (hardcoded 0) |
| CSS override 라인 수 | 0 |
| 인라인 스타일 수 | 0 (동적 값 예외) |
| 시각 회귀 | 0 |
| Lighthouse 접근성 | ≥ 90 |
| 재작업 발생 횟수 | 0 |

---

## §7. 1회 완결성 보장 체크리스트

### 7.1 사전 필수 완료 항목 (Phase A 진입 전)

- [ ] **페이지 인벤토리** 완료 — 디자인 적용 범위 전체 목록화
- [ ] **컴포넌트 인벤토리** 완료 — 재사용 vs 신설 구분
- [ ] **다크 모드 정책** 결정 — Phase A 에서 동시 설계 확인
- [ ] **모바일 정책** 결정 — 반응형 breakpoint 확정
- [ ] **접근성 정책** 결정 — WCAG 준수 수준 확정 (AA)
- [ ] **사용자 검수 일정** 합의 — 각 Phase 종료 시점 일정 확인
- [ ] **PII Phase 1~4 완료** 확인 — 디자인 v2 진입 전제조건

### 7.2 작업 중 절대 금지 (재작업 방지)

- [ ] **MVP 수준 산출물 금지** — "나중에 보강" 불허, 각 Phase 완결
- [ ] **override CSS 금지** — 토큰 SSOT 위반
- [ ] **디자인-코드 비동기 금지** — 시안 변경 시 코드 동일 PR
- [ ] **토큰 없이 컬러 하드코딩 금지**
- [ ] **Phase 순서 위반 금지** — B 전에 C 진입 불허
- [ ] **검수 게이트 스킵 금지**

### 7.3 산출물 완결성 체크 (Phase 별)

#### Phase A 완결 체크
- [ ] A1 시안: §A~§G 모두 작성
- [ ] A2 핸드오프: §A~§H 모두 작성
- [ ] A3 토큰 SSOT: 라이트/다크/forced-colors 포함
- [ ] A4 디자인 시스템 문서: 토큰 사용 예시 포함
- [ ] 사용자 게이트 A 통과

#### Phase B 완결 체크
- [ ] B1 Atom 15종 구현 완료
- [ ] B2 Molecule 15종 구현 완료
- [ ] B3 Organism 14종 구현 완료
- [ ] B4 Template 7종 구현 완료
- [ ] 각 컴포넌트 CSS override 0
- [ ] 다크 모드 전체 지원 확인
- [ ] 사용자 게이트 B 통과

#### Phase C 완결 체크
- [ ] 각 그룹 페이지 토큰 사용률 100%
- [ ] 각 그룹 override CSS 0
- [ ] AdminCommonLayout 적용 확인
- [ ] 기능 동일 확인 (로직 변경 없음)
- [ ] 사용자 게이트 C (그룹별) 통과

#### Phase D 완결 체크
- [ ] D11 KPI 전체 통과
- [ ] Lighthouse 접근성 ≥ 90
- [ ] 사용자 최종 게이트 D 통과

---

## §8. 위험 + 롤백

### 8.1 위험 목록

| 위험 | 심각도 | 완화 방법 |
|------|--------|-----------|
| 페이지 마이그 중 회귀 — 컴포넌트 SSOT 미정합 | HIGH | Phase B 완전 완료 후 Phase C 진입 (순서 엄격) |
| 다크 모드 후속 미적용 — Phase A 에서 누락 | HIGH | Phase A3 토큰에 다크 모드 필수 포함 (게이트 확인) |
| 비용 폭증 — Opus 과다 사용 | MEDIUM | Phase C 는 Sonnet 사용 명시, 위임 양식에 모델 지정 |
| 시안-코드 드리프트 — 핸드오프 후 시안 변경 | MEDIUM | 시안 변경 시 A3 토큰 동시 업데이트 + 동일 PR |
| 컴포넌트 간 불일치 — 병렬 위임 시 | MEDIUM | B1 완료 후 B2 진입, B2 완료 후 B3 진입 (순차 권장) |
| Gemini API 오류 — 시각 작업 지연 | LOW | 1회 재시도, 실패 시 Claude Sonnet 대체 |
| 운영 영향 — 마이그 중 UI 깨짐 | HIGH | 페이지별 독립 PR (부분 rollback 가능) |

### 8.2 롤백 전략

#### Phase C 롤백 (페이지 단위)

```
각 페이지 그룹은 독립 PR로 관리
→ 특정 그룹 PR 만 revert 가능
→ 다른 그룹 영향 없음
```

#### Phase B 롤백 (컴포넌트 단위)

```
컴포넌트별 독립 커밋
→ 특정 컴포넌트만 revert 가능
→ Atom 롤백 시 해당 Atom 사용 Molecule도 함께 확인
```

#### Phase A 롤백

```
토큰 SSOT 는 전체 기반
→ Phase A 롤백 = 전체 v2 중단
→ Phase A 는 충분한 검수 후 확정 (게이트 A 엄격)
```

### 8.3 운영 영향 최소화

1. **모든 변경 develop 브랜치 경유** — main/production 직접 머지 금지
2. **페이지별 독립 PR** — 한 번에 전체 머지 금지
3. **페이지별 기능 테스트 후 머지** — 로직 변경 없음 확인
4. **Phase D 시각 회귀 통과 후 production 반영**

---

## §9. 일정 + 위임 횟수 (예상)

### 9.1 Phase별 예상 일정

| Phase | 예상 기간 | 위임 횟수 | 병렬 여부 |
|-------|-----------|-----------|-----------|
| Phase A | 1주 | 5~7회 | A1~A4 병렬 |
| Phase B | 1~2주 | 10~15회 | B1~B4 순차+병렬 |
| Phase C | 2~3주 | 20~30회 | 그룹별 병렬 |
| Phase D | 1주 | 5~10회 | D1~D2 순차 |
| **합계** | **5~7주** | **40~62회** | |

### 9.2 병렬 처리 최적화

#### Phase A (1주)
```
Day 1: A1 시안 위임 (Gemini)
Day 2: A1 완료 후 → A2 핸드오프 (Gemini) + A3 토큰 (Opus) 동시
Day 3: A4 디자인 시스템 문서 (Opus)
Day 4~5: 사용자 게이트 A 검수
```

#### Phase B (1~2주)
```
Week 1 Day 1~3: B1 Atom (Opus) — 15종 병렬 가능
Week 1 Day 3~5: B2 Molecule (Opus) — B1 완료 후 진입
Week 2 Day 1~3: B3 Organism (Opus) — B2 완료 후 진입
Week 2 Day 3~5: B4 Template (Sonnet) + 사용자 게이트 B
```

#### Phase C (2~3주)
```
그룹당 1~2일, 13개 그룹 → 2~3주 (최대 5개 그룹 동시 병렬)
각 그룹 완료 시 마크업 검토 (Gemini) 병행
```

### 9.3 전체 타임라인

```
PII Phase 1~4 완료 (현재 진행 중)
       │
       ▼
Phase A 시작 (1주)
       │
       ▼ [게이트 A]
Phase B 시작 (1~2주)
       │
       ▼ [게이트 B]
Phase C 시작 (2~3주, 병렬)
       │
       ▼ [게이트 C 그룹별]
Phase D 시작 (1주)
       │
       ▼ [게이트 D]
디자인 v2 완료
```

---

## §10. 비용 추정

### 10.1 모델별 사용 비중

| 모델 | 적용 Phase | 예상 위임 수 | 전체 비중 |
|------|-----------|-------------|-----------|
| `claude-4.6-opus-high-thinking` | A3/A4 + B1~B3 | ~15회 | 25% |
| `claude-4.6-sonnet-medium-thinking` | B4 + C 전체 + 기획 | ~35회 | 57% |
| `gemini-3.1-pro` | A1/A2 + C 마크업 + D | ~12회 | 18% |
| `composer-2.5-fast` / default | 머지, 모니터 | ~5회 | — |

### 10.2 비용 절감 효과

```
시나리오 1: Opus 단독 (기존 방식)
→ 전체 60회 × Opus 비용 = X

시나리오 2: 조합 방식 (v2 가이드)
→ Opus 15회 + Sonnet 35회 + Gemini 12회
→ 예상 절감: Opus 단독 대비 약 60%
```

### 10.3 비용 합리화 원칙 재확인

```
Opus 사용 조건 (엄격):
  ✓ 토큰 SSOT — 전체 기반, 오류 비용 큼
  ✓ Atom/Molecule/Organism 컴포넌트 — 코드 일관성 결정적
  ✗ 반복 패턴 페이지 마이그 — Sonnet 으로 충분
  ✗ 단순 마크업 — Gemini 로 충분
  ✗ 단순 머지/CI — default/fast 로 충분
```

---

## §11. 참조 문서

### 11.1 프로젝트 표준

| 문서 | 경로 | 용도 |
|------|------|------|
| 서브에이전트 가이드 | `/.cursor/rules/mindgarden-subagents.mdc` | 위임 기본 규칙 |
| 위임 순서 | `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` | Phase 순서 규칙 |
| 프론트 표준 | `docs/standards/*.md` | 코딩 표준 |

### 11.2 디자인 시스템

| 문서 | 경로 | 용도 |
|------|------|------|
| 디자인 시스템 v2 | `docs/design-system/DESIGN_SYSTEM_V2.md` | Phase A4 산출물 |
| 시안 A1 | `docs/design-system/DESIGN_V2_VISION_A1.md` | Phase A1 산출물 |
| 핸드오프 A2 | `docs/design-system/DESIGN_V2_HANDOFF_A2.md` | Phase A2 산출물 |
| 토큰 SSOT | `src/main/resources/static/css/unified-design-tokens.css` | Phase A3 산출물 |

### 11.3 이전 디자인 작업 참조

| 문서 | 경로 | 용도 |
|------|------|------|
| 로그인 화면 재설계 | `docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md` | 이전 디자인 패턴 참조 |
| 어드민 LNB 통합 | `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` | 레이아웃 패턴 참조 |
| 설정 페이지 통합 | `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` | 페이지 통합 패턴 참조 |

### 11.4 스킬 참조

| 스킬 | 경로 | 적용 시점 |
|------|------|-----------|
| 디자인 핸드오프 | `/core-solution-design-handoff` | Phase A 위임 시 |
| 디자인 시스템 CSS | `/core-solution-design-system-css` | Phase A3/B 위임 시 |
| 아토믹 디자인 | `/core-solution-atomic-design` | Phase B 위임 시 |
| 프론트 표준 | `/core-solution-frontend` | Phase B/C 위임 시 |
| 캡슐화·모듈화 | `/core-solution-encapsulation-modularization` | 전 Phase |
| 공통 모듈 | `/core-solution-common-modules` | Phase B/C 위임 시 |
| 기획 | `/core-solution-planning` | Phase 기획 시 |
| 배포 | `/core-solution-deployment` | Phase D 이후 배포 시 |

---

## 부록: 빠른 참조 카드

### A. Phase 진입 체크리스트 (요약)

```
Phase A 진입 전:
  □ PII Phase 1~4 완료
  □ 페이지 인벤토리 완료
  □ 컴포넌트 인벤토리 완료
  □ 다크/반응형/접근성 정책 결정
  □ 사용자 검수 일정 합의

Phase B 진입 전:
  □ Phase A 전체 완료
  □ 사용자 게이트 A 통과
  □ 토큰 SSOT 확정

Phase C 진입 전:
  □ Phase B 전체 완료
  □ 사용자 게이트 B 통과
  □ 컴포넌트 SSOT 확정

Phase D 진입 전:
  □ Phase C 전체 완료
  □ 사용자 게이트 C (전 그룹) 통과
```

### B. 위임 시 필수 포함 항목

```
모든 위임 프롬프트에 포함:
  1. 담당 모델 명시 (model: "...")
  2. 참조 스킬 경로
  3. 참조 문서 경로
  4. 산출물 파일 경로
  5. 완료 기준 (체크리스트)
  6. 절대 규칙 (override 금지, 토큰 사용 등)
```

### C. 모델 선택 요약

```
시각 → Gemini 3.1 Pro
코드 핵심 → Opus
코드 반복 → Sonnet
빠른 작업 → default/fast
```

---

*이 문서는 디자인 v2 작업 SSOT 입니다. 모든 후속 디자인 위임은 §4 양식을 준수합니다.*  
*Phase A1 시안 위임 전에 §7 사전 체크리스트를 반드시 완료하세요.*
