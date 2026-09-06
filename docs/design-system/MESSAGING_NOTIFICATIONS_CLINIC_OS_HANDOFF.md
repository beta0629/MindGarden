# 알림·메시지 클러스터 Clinic-OS UI/UX 스펙 (Design Handoff)

**대상**: `/admin/push-monitoring`, `/admin/manual-notification`, `/admin/notifications`  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**트윈**: consultation-logs (#854), mapping-management summary strip, PG config list  
**범위**: Frontend chrome / layout / CSS / class cleanup only. 비즈니스 로직·API·역할 가드 **변경 금지**.

---

## 레이아웃

| 페이지 | 스코프 | Strip | Stage |
|--------|--------|-------|-------|
| Push monitoring | `mg-push-monitor push-monitoring--clinic-os` | 4-cell `mapping-management-summary--cols-4` (기존 kpi 재매핑) | `mg-push-monitor__stage` |
| Manual notification | `mg-v2-admin-manual-notification manual-notification--clinic-os` | 생략 (KPI 없음) | form + history 동일 기하 stage |
| Notifications | `mg-v2-admin-notifications-page admin-notifications--clinic-os` | 생략 | `admin-notifications-stage` + page-local tabs |

## 금지 / 게이트

- `AdminDashboardB0KlA.css` import, `mg-v2-ad-b0kla` 루트, `--ad-b0kla-*`, 왼쪽 4px accent
- Hex soft-gate: ADMIN_LNB §17, SETTINGS §1.3

## 의도적 잔여

- `SystemNotificationFormModal` 내부 `mg-v2-ad-b0kla-*` form/modal class — 본 배치 범위 밖(후속 모달 패스)
- PushMonitoring 내부 atom CSS(배지·차트 등)는 토큰 치환 완료; 카드 atom `PushMonitorKpiCard`는 레거시 유지(페이지는 strip 사용)

## Lock tests

- `PushMonitoring/__tests__/AdminPushMonitoringPage.clinicOsChrome.test.js`
- `manual-notification/__tests__/AdminManualNotificationPage.clinicOsChrome.test.js`
- `admin/__tests__/AdminNotificationsPage.clinicOsChrome.test.js`

## .dev 검증

1. `/admin/push-monitoring` — quiet header, 4-cell strip, main stage, 필터 행 유지
2. `/admin/manual-notification` — quiet header, form/history stage, 역할 가드 유지
3. `/admin/notifications` —「공지 작성」primary, tabs active teal, stage, 탭/권한 유지
