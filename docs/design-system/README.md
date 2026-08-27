# 디자인 시스템 문서

**🚨 [MindGarden Design SSOT (단일 진입점)](./MINDGARDEN_DESIGN_SSOT.md)**: 디자인 토큰·레이아웃·패턴의 최상위 기준 문서입니다.

**위치**: `docs/design-system/`  
**용도**: 디자인 시스템·토큰·컴포넌트 스펙 및 관련 가이드.  
**표준 문서**: `docs/standards/` (표준·가이드 전반) 참조.

**하위 구조**: 디자인 시스템 v2 문서는 [v2/](./v2/) (실전 적용 플랜, 가이드, 아키텍처 등). CI/BI 디자인 표준화 가이드는 [ci-bi/](./ci-bi/) (빠른 시작, 완전 가이드, 하드코딩 현황 등). 문서 탐색은 [docs/README.md](../README.md) 진입점부터.

---

## 운영자/어드민 비주얼 SSOT (우선)

| 문서 | 설명 |
|------|------|
| [Clinic-OS 운영자/어드민 비주얼 SSOT](./CLINIC_OS_ADMIN_VISUAL_SSOT.md) | **운영자·어드민 화면의 시각 단일 기준**. Admin Dashboard V2 레퍼런스, `--mg-v2-*` 토큰, 크롬 계약·금지·page-walk·페이지 체크리스트. 신규·개편 어드민은 이 문서만 따른다. |

---

## 디자인 스펙 문서

| 문서 | 설명 |
|------|------|
| [관리자 대시보드 모니터링 섹션](./ADMIN_DASHBOARD_MONITORING_DESIGN_SPEC.md) | AI·보안 모니터링, 시스템 모니터링 두 Organism 섹션의 UI/UX·레이아웃·비주얼 설계 스펙. |
| [구현 참조: 관리자 대시보드 모니터링](./ADMIN_DASHBOARD_MONITORING.md) | 위 스펙의 구현 컴포넌트 경로 및 디자인 스펙 링크 요약. |
| [통합일정 사이드바 Compact Row](./SCREEN_SPEC_INTEGRATED_SCHEDULE_COMPACT_ROW.md) | IntegratedMatchingSchedule 사이드바 밀도 토글·Compact Row 비주얼 handoff (V3+ Seq 28f). |

---

## 펜슬 가이드 (역사 — B0KlA / .pen 전용)

| 문서 | 설명 |
|------|------|
| [펜슬(Pencil) 디자인 가이드](./PENCIL_DESIGN_GUIDE.md) | **역사 문서**. B0KlA·`.pen` 아티팩트 참조용. **신규 어드민 화면에 사용 금지** — [Clinic-OS 비주얼 SSOT](./CLINIC_OS_ADMIN_VISUAL_SSOT.md)를 쓴다. |

## 아토믹 디자인·가이드

| 문서 | 설명 |
|------|------|
| [아토믹 디자인 시스템](./ATOMIC_DESIGN_SYSTEM.md) | Atoms → Molecules → Organisms → Templates → Pages 계층 및 컴포넌트 규칙. |
| [반응형 레이아웃 스펙](./RESPONSIVE_LAYOUT_SPEC.md) | 브레이크포인트·컨테이너·Pencil 레이아웃 프레임. |
| [v2 마스터 가이드](./v2/MASTER_GUIDE.md) | MindGarden 디자인 시스템 v2.0 개요 및 Phase별 실행 계획. |

---

**최종 업데이트**: 2026-08-27
