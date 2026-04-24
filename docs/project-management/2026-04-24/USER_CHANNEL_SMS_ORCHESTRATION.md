# 사용자 채널·SMS 오케스트레이션

## 1. 목표·범위 (P0 / P1)

### 「권장 UX (2026-04-24)」

- LNB: DB Flyway `V20260424_004` + `mergeSupplementalAdminLnbItems` 로 운영 DB/API 메뉴와 프론트 보강 이중화
- 테넌트 허브: `/tenant/profile` 개요에 **알림·연동** 섹션으로 상세 화면 진입(ADMIN/STAFF)
- SMS: 테넌트 설정·메뉴는 USER_CHANNEL P0에서 별도 구현

상세 발송 라우팅은 동 문서 분배표 따름.

- **P0**: TODO — 핵심 범위 요약
- **P1**: TODO — 후속·확장 범위 요약
- **비범위**: TODO — 이번에 다루지 않는 것

## 2. 역할 (내담자·상담사·OPS·테넌트)

- **내담자**: TODO — 책임·권한
- **상담사**: TODO — 책임·권한
- **OPS**: TODO — 책임·권한
- **테넌트**: TODO — 책임·권한

## 3. 데이터 모델 가칭

| 가칭 테이블명 | 용도 (요약) | 비고 |
| --- | --- | --- |
| `user_notification_preferences` | TODO | |
| `tenant_sms_settings` | TODO | |

## 4. 발송 라우팅 (이벤트 × 채널 선택)

| 이벤트 / 트리거 | SMS | 기타 채널 | 선택 규칙 요약 |
| --- | --- | --- | --- |
| TODO | | | |

## 5. 분배실행 (explore · designer · coder · tester · deployer)

| 담당 | 작업 요약 | 상태 |
| --- | --- | --- |
| explore | TODO | [ ] |
| designer | TODO | [ ] |
| coder | TODO | [ ] |
| tester | TODO | [ ] |
| deployer | TODO | [ ] |

## 6. 관련 링크

- **관리자 LNB**: 운영 메뉴 트리는 DB `menus` Flyway와 프론트 `mergeSupplementalAdminLnbItems` 보강을 함께 봄 (`src/main/resources/db/migration/V20260424_004__lnb_admin_kakao_alimtalk_settings_menu.sql`, `frontend/src/utils/lnbMenuUtils.js`). SMS 전용 메뉴는 제품 미구현으로 이번 범위 밖.

테넌트 프로필(`/tenant/profile`) 개요 탭에 **알림·연동** 섹션을 두어, `ADMIN`·`STAFF`는 카카오 알림톡 설정 화면으로 진입할 수 있게 하고(백엔드 `@PreAuthorize`와 동일하게 그 외 역할은 버튼 미노출), 문자(SMS)는 준비 중 문구만 노출한다. 설정 메뉴 트리 정렬·멱등은 LNB Flyway `V20260424_004`와 맞춘다.
- [예약 카카오 알림톡 오케스트레이션 체크리스트 (11번 항목)](../2026-04-23/RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md)
- [알림 시스템 표준](../../standards/NOTIFICATION_SYSTEM_STANDARD.md)
- [코어 플래너 위임 순서](../CORE_PLANNER_DELEGATION_ORDER.md)
- [카카오 알림톡 테넌트 온보딩](../../../tenant-guides/kakao-alimtalk-tenant-onboarding.md)
- [프리프로덕션 Go-Live 체크리스트](../../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)
- [멀티테넌트 스킬](../../../.cursor/skills/core-solution-multi-tenant/SKILL.md)

TODO: explore 인벤토리 붙이기
