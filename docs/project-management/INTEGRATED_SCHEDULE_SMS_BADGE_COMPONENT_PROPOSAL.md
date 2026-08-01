# 통합 스케줄 — 내담자 예약 문자 상태 배지 컴포넌트 배치 제안

- **역할**: core-component-manager (제안·문서화만, 코드 수정 없음)
- **일자**: 2026-08-01
- **Phase 0 맥락**: SENT / PENDING / FAILED만 표시 · N/A·SKIPPED·해당없음 숨김 · 캘린더 scheduleId 1순위 + CardMeta(± Compact) · 툴팁(fireAt/발송시각/짧은 실패사유) · 전화·본문 비노출

---

## 1. 현재 `SmsLogStatusBadge` API·사용처 요약

- **위치**: `frontend/src/components/admin/PushMonitoring/atoms/SmsLogStatusBadge.jsx` (+ `.css`)
- **API**: `successFlag: boolean | null|undefined` → `true`=success, `false`=failure, 그 외=pending. 라벨은 `ADMIN_WEB_SCAFFOLD_COPY` Push 모니터 카피(성공/실패/대기).
- **표현**: `mg-sms-log-status-badge` / `--success|failure|pending` 토큰 pill. 툴팁·숨김·커스텀 라벨 prop **없음**.
- **사용처**: `SmsLogRow` 1곳뿐(Push 모니터 SMS 로그 행). 통합 스케줄·common과는 **미연동**.
- **대비**: CardMeta는 `common/StatusBadge`(매칭 상태) + `RemainingSessionsBadge`(회기) + 로컬 desync/schedule span. Compact는 배지 슬롯이 더 좁음.

---

## 2. 권장안: **(B) 스케줄 전용 molecule이 시각 atom을 감쌈**

**권장 = (B)** — 예: `integrated-schedule/molecules/ReservationSmsStatusBadge`(가칭).

| 안 | 요지 | 판정 |
|----|------|------|
| (A) atom 확장 재사용 | `SmsLogStatusBadge`에 status 문자열·숨김·툴팁·라벨 오버라이드 추가 | 비권장 — Push 도메인 atom이 스케줄 정책을 흡수, 공통 모듈 경계 붕괴 |
| **(B) 스케줄 molecule → atom** | molecule이 표시/숨김·툴팁·밀도·scheduleId 컨텍스트 담당, 시각만 atom/공통 Badge | **권장** |
| (C) 완전 신규 atom | 스케줄 전용 3상태 atom을 새로 둠 | 보류 — (B)로 pill 중복이 커질 때만 common 승격 또는 thin atom 분리 |

**이유**

1. **도메인 정책**(N/A·SKIPPED 숨김, fireAt 툴팁, PII 비노출)은 molecule 책임. Push의 `successFlag` 3값은 PENDING과 “없음”을 구분하지 못하므로 **호출부(molecule)에서 null 렌더**가 맞다.
2. **Push atom 직접 CardMeta import**(A에 가까움)는 기능 간 결합·카피 고정(“성공” ≠ 예약 문자 “발송” 가능)·툴팁 부재로 부적합. molecule 래퍼가 경계를 지킨다.
3. **시각 재사용**: 디자이너가 Push와 동일 pill·동일 한글이면 molecule이 `SmsLogStatusBadge`를 `SENT→true / FAILED→false / PENDING→null`로 매핑해 감싸고 `title`은 래퍼에 둔다. 카피·밀도가 다르면 molecule이 **common `Badge`(status variant)** 를 감싸며, pill CSS 중복이 확정되면 그때 thin atom을 common으로 승격(후속 (C)).

**비권장 요약**: (A)는 PushMonitoring 스코프 오염. (C)는 Phase 0에서 성급 — 시각 SSOT가 확정된 뒤.

---

## 3. CardMeta·캘린더 배치 시 주의점

- **중복 배지**: CardMeta에 이미 StatusBadge(매칭)·RemainingSessions·desync/schedule span이 밀집. SMS 배지는 **SENT/PENDING/FAILED일 때만** 추가하고 Compact에서는 아이콘/초단축 또는 툴팁 우선(스펙 확정).
- **네이밍**: `SmsLogStatusBadge` 이름 재사용 금지(Push 로그 의미). 스케줄은 `ReservationSmsStatusBadge` / `ScheduleClientSmsBadge` 등 **예약 문자** 의미를 쓸 것. CSS는 `integrated-schedule__…` 또는 molecule BEM — `mg-sms-log-status-badge`를 CardMeta에 직접 심지 말 것(Push 스코프로 오인).
- **CSS 스코프**: 사이드바는 이미 `.integrated-schedule__card-meta .mg-v2-status-badge` 밀도 축소 규칙 있음. SMS 배지도 **동일 meta flex**에 넣고 Compact/Comfortable 스케일 규칙을 molecule 클래스에 명시. 캘린더 `eventContent`는 FullCalendar DOM이라 **동일 molecule**을 쓰되 래퍼 클래스만 `…--calendar`로 밀도 분기.
- **데이터 키**: scheduleId 1순위 상태를 CardMeta(매핑 단위)와 캘린더(이벤트 단위)에 넣을 때 **같은 mapper/util**(status → show + label + tooltip)을 molecule 밖 util로 두고 UI만 molecule — 로직 이중 구현 금지.
- **common StatusBadge 오용 금지**: `PENDING`/`FAILED` 등을 StatusBadge status로 넣으면 매칭·스케줄 상태 카피와 충돌. SMS는 별 molecule.
- **접근성**: 툴팁에 실패사유만; `aria-label`에 전화·본문 금지. `SafeText`/`toDisplayString` 경계 유지(React #130).

---

## 4. Designer 스펙 한 줄 권고

> 통합 스케줄 내담자 예약 문자 상태는 Push `SmsLogStatusBadge`를 CardMeta에 직접 꽂지 말고, **스케줄 전용 molecule**(숨김·툴팁·밀도)이 시각 atom/common Badge를 감싸도록 스펙에 명시하고, 라벨은 Push「성공/실패/대기」재사용 여부를 시안에서 확정할 것.

---

## 5. core-coder 실행 시 체크 (참고)

- [ ] molecule 경로: `integrated-schedule/molecules/`
- [ ] PushMonitoring atom API·카피 변경 최소화(필요 시 optional `className` 정도만, 스케줄 정책은 molecule)
- [ ] CardMeta + 캘린더 이벤트 + Compact 분기에서 **동일 molecule**
- [ ] `COMMON_MODULES_USAGE_GUIDE`: 신규 인라인 배지 클래스 남발 금지 → Badge/기존 atom 경유
- [ ] 구현 후 component-manager 인벤토리 갱신 요청

---

## 참조

- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` §1 배지 · §2.1 공통 우선
- `.cursor/skills/core-solution-atomic-design/SKILL.md` — molecule이 도메인 조합, atom은 최소 표현
- `frontend/src/components/admin/PushMonitoring/atoms/SmsLogStatusBadge.jsx`
- `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/CardMeta.js`
