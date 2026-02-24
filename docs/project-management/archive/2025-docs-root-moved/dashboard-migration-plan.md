# 대시보드 마이그레이션 계획

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-22  
**상태**: 1단계 진행 중

---

## 1. 배경

### 1.1 기존 AdminDashboard 한계

- 단일 파일 기반으로 복잡도 증가 (`AdminDashboard.js` 1800+ 라인)
- GNB/LNB 레이아웃 스펙 미준수 (RESPONSIVE_LAYOUT_SPEC)
- 반응형 브레이크포인트 6단계(375~3840px) 체계적 대응 부족
- 아토믹 디자인 패턴 미적용으로 재사용성·유지보수성 저하
- B0KlA 디자인 스펙이 일부만 적용된 하이브리드 구조

### 1.2 새 구현 목적

- `mindgarden-design-system.pen` B0KlA 스펙 완전 반영
- RESPONSIVE_LAYOUT_SPEC 기반 GNB/LNB/메인 콘텐츠 구조
- 아토믹 디자인(Atoms → Molecules → Organisms → Templates → Pages) 적용
- 4K부터 모바일까지 반응형 레이아웃 지원
- mg-v2-* CSS 클래스 규칙 일괄 적용

---

## 2. 목표

- **mindgarden-design-system.pen B0KlA** + **RESPONSIVE_LAYOUT_SPEC** 기반 신규 대시보드 구현
- 기존 기능(loadStats, 위젯, 파이프라인, 매칭 큐 등) 동등 수준 유지
- 기존 API 연동, sessionManager, 비즈니스 로직 재사용

---

## 3. 마이그레이션 단계

| 단계 | 내용 | 상태 |
|------|------|------|
| **1** | 백업 및 신규 구조 생성 | 진행 중 |
| **2** | Layout (Desktop GNB/LNB, Mobile GNB/드로어) | 예정 |
| **3** | 기능 이전 (loadStats, 위젯 등) | 예정 |
| **4** | 라우트 전환 및 검증 | 예정 |

### 3.1 1단계: 백업 및 신규 구조 생성

1. **백업**
   - `AdminDashboard.js` → `backup/AdminDashboard.legacy.backup.js`
   - `AdminDashboard/AdminDashboardB0KlA.css` → `backup/AdminDashboardB0KlA.legacy.backup.css`
   - `AdminLayout.js` → `backup/AdminLayout.legacy.backup.js`
   - 관련 백업 파일은 `frontend/src/components/admin/backup/` 또는 `.legacy.backup.*` 접미사

2. **신규 구조 골격**
   - `frontend/src/components/dashboard-v2/` 디렉토리 생성
   - `atoms/`, `molecules/`, `organisms/`, `templates/`, `pages/` 폴더
   - `AdminDashboardV2.js` (최소 렌더링 페이지) 생성
   - App.js에 `/admin/dashboard-v2` 라우트 추가 (기존 `/admin/dashboard` 병렬 유지)

### 3.2 2단계: Layout 구현

- Desktop: GNB(64px) + LNB(260px) + 메인 콘텐츠
- Mobile: GNB + 햄버거 토글 드로어(280px)
- RESPONSIVE_LAYOUT_SPEC 섹션 3.1~3.4 준수

### 3.3 3단계: 기능 이전

- loadStats, 위젯, CoreFlowPipeline, ManualMatchingQueue, DepositPendingList, SchedulePendingList
- StandardizedApi, sessionManager, hasPermission 등 그대로 사용

### 3.4 4단계: 라우트 전환 및 검증

- `/admin/dashboard` → AdminDashboardV2로 전환 (옵션)
- 검증 후 레거시 컴포넌트 제거

---

## 4. 기존 유지

- **API 연동**: StandardizedApi 사용 유지
- **sessionManager**: 세션/테넌트 처리 그대로
- **비즈니스 로직**: loadStats, 파이프라인, 매칭 큐 로직 유지
- **기존 AdminDashboard**: 삭제하지 않고 백업만, 병렬 사용 가능

---

## 5. 참조 문서

- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` — 반응형 레이아웃 스펙
- `mindgarden-design-system.pen` — B0KlA 디자인 스펙
- `.cursor/skills/core-solution-atomic-design/SKILL.md` — 아토믹 디자인 패턴
- `.cursor/skills/core-solution-frontend/SKILL.md` — 프론트엔드 표준

---

## 6. 디렉토리 구조 (신규)

```
frontend/src/components/dashboard-v2/
├── atoms/
├── molecules/
├── organisms/
├── templates/
├── pages/
└── AdminDashboardV2.js
```
