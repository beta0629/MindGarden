# 관리자 대시보드 모니터링 — 구현 참조

**대상**: 관리자 대시보드의 AI·시스템 모니터링 섹션.  
**역할**: 디자인 스펙 위치와 구현 컴포넌트 경로를 한곳에서 참조하기 위한 짧은 문서.

---

## 1. 이 섹션이 무엇인지

관리자 대시보드에서 **두 개의 Organism 섹션**으로 구성된다.

| 섹션 | 내용 |
|------|------|
| **AI 및 보안 모니터링** | 긴급/높음 KPI, 이상 탐지, 보안 위협, 감사 로그, AI 호출/예산 (2열 그리드). |
| **시스템 모니터링** | 스케줄러 실행, CPU/메모리/JVM, AI 호출·비용 (3열 그리드). |

각 섹션은 `DashboardSection`(Organism)으로 래핑되며, 내부에 위젯(카드)이 그리드로 배치된다.

---

## 2. 디자인 스펙

- **전체 스펙**: [ADMIN_DASHBOARD_MONITORING_DESIGN_SPEC.md](./ADMIN_DASHBOARD_MONITORING_DESIGN_SPEC.md)  
- 레이아웃·그리드·헤더·카드/위젯·비주얼 토큰·반응형 등 상세 규칙은 위 문서를 따른다.

---

## 3. 구현 컴포넌트 경로

| 구분 | 경로 |
|------|------|
| 모니터링 페이지(섹션 배치) | `frontend/src/components/admin/AdminDashboard/AdminDashboardMonitoring.js` |
| 섹션 레이아웃(Organism) | `frontend/src/components/layout/DashboardSection.js`, `DashboardSection.css` |
| AI·보안 위젯 | `frontend/src/components/dashboard/widgets/admin/AIMonitoringWidget.js` |
| | `frontend/src/components/dashboard/widgets/admin/SecurityAuditWidget.js` |
| 시스템 위젯 | `frontend/src/components/dashboard/widgets/admin/SchedulerStatusWidget.js` |
| | `frontend/src/components/dashboard/widgets/admin/SystemMetricsWidget.js` |
| | `frontend/src/components/dashboard/widgets/admin/AIUsageWidget.js` |

---

**최종 업데이트**: 2026-02-24
