# 개발(release/dev)에 있고 운영(release/prod)에 없는 변경 목록

- 기준: `origin/release/dev` = `f89547805`, `origin/release/prod` = `99a746f68` (2026-09-30, 동기화 PR [#1312](https://github.com/beta0629/MindGarden/pull/1312) 머지 후 release/dev tip)
- `release/prod` 는 `release/dev` 의 조상이다 (`git merge-base --is-ancestor origin/release/prod origin/release/dev` = 0).
- 대상 커밋: `git rev-list --no-merges origin/release/prod..origin/release/dev` = 271건 → release/dev 첫 부모 이력 기준으로 PR 127건 + PR 없는 직접 커밋 40건으로 묶음.
- `git cherry -v origin/release/prod origin/release/dev` 는 동기화 이후 운영 쪽 비교 대상이 없어 전부 `+` 로 나온다. 그래서 "운영에 다른 형태로 들어감"은 **운영 이력(2025-06-01 이후) 전체 커밋의 `git patch-id --stable` 과 일치하는지**로 판정했다.
- 분류: BE = `src/**`(마이그레이션 제외)·`pom.xml`, FE = `frontend/**`, DB = `src/main/resources/db/migration/**`. 워크플로·문서만 바꾼 PR 은 셋 다 `-`.
- "운영 메시지 언급" = 운영 커밋 메시지에 해당 PR 번호(`#N`)가 나옴. 파일 일부만 운영에 옮긴 경우(예: 프론트만 반영) patch-id 가 달라 여기서만 드러난다. 수동 확인 필요.
- 운영 반영은 화면+서버 세트로만 (`/.cursor/skills/core-solution-deployment/SKILL.md` 「운영 배포는 세트로만」). 이 표는 목록일 뿐 반영 순서·묶음을 정하지 않는다.

## 1. 운영 patch-id 가 없는 PR (115건)

| PR | 제목 | BE | FE | DB 마이그레이션 | 운영에 같은 patch-id | 운영 메시지 언급 |
|----|------|----|----|----------------|---------------------|-----------------|
| [#1313](https://github.com/beta0629/MindGarden/pull/1313) | fix(client-mall): 휴대폰 인증 타이머 시작 5:01 → 5:00 | - | O | - | 없음 | - |
| [#1310](https://github.com/beta0629/MindGarden/pull/1310) | fix(erp): 부분환불 시 전액 CONSULTATION_REFUND 전표 중복 생성 제거 | O | - | - | 없음 | - |
| [#1309](https://github.com/beta0629/MindGarden/pull/1309) | fix(client-mall): 결제 거절 안내 스크롤 간헐 FAIL 수정 (#1304 추가) | - | O | - | 없음 | - |
| [#1308](https://github.com/beta0629/MindGarden/pull/1308) | fix(integrated-schedule): 가예약 헤더 목록·당일 결제 버튼 세로 정렬 (CSS only) | - | O | - | 없음 | - |
| [#1307](https://github.com/beta0629/MindGarden/pull/1307) | fix(client-mall): #1301 후속 — 몰 시안 세부 (인증 시트·장바구니 요약 위치·결제 완료 하단 바, CSS/화면만) | - | O | - | 없음 | - |
| [#1306](https://github.com/beta0629/MindGarden/pull/1306) | fix(integrated-schedule): 캘린더 첫 로드 높이 0 회귀 — 최소 높이 보장 · 범례 기본 접힘 (#1302 후속) | - | O | - | 없음 | - |
| [#1304](https://github.com/beta0629/MindGarden/pull/1304) | fix(client-mall): 결제창 취소 시 들어온 화면으로 복귀 · 사용자 취소 API · 재결제 주문 재사용 | O | O | - | 없음 | - |
| [#1303](https://github.com/beta0629/MindGarden/pull/1303) | test(fe): 프론트 덮어쓰기 방지 규칙 + 회귀 잠금 jest + PR FE jest 잡 | - | O | - | 없음 | - |
| [#1302](https://github.com/beta0629/MindGarden/pull/1302) | fix(integrated-schedule): 배정 목록 스크롤 영역 확보 — 48px 붕괴 해소 | - | O | - | 없음 | - |
| [#1301](https://github.com/beta0629/MindGarden/pull/1301) | fix(client-mall): #1298 후속 — 인증 바텀시트·장바구니·결제 완료 시안 맞춤 | - | O | - | 없음 | - |
| [#1300](https://github.com/beta0629/MindGarden/pull/1300) | fix(integrated-schedule): 빈 CardMeta 미렌더(카드 간격 8px) · 입금 확인 후 활성화 버튼 잘림 해소 | - | O | - | 없음 | - |
| [#1298](https://github.com/beta0629/MindGarden/pull/1298) | fix(client-mall): #1297 후속 — 390px 헤더·phone/change 오답/잠김·모바일 인증 시트·장바구니/완료 배치 | O | O | - | 없음 | - |
| [#1297](https://github.com/beta0629/MindGarden/pull/1297) | feat(client-mall): #1295 후속 — 바로구매 stateless·하단 바·SMS 정책·인증 시트·화면 문구 | O | O | O | 없음 | - |
| [#1296](https://github.com/beta0629/MindGarden/pull/1296) | fix(consultation-log): 헤더 없는 레거시 앱 본문 통과, 앱 위험도 필수·필드별 서버 오류 표시 | O | - | - | 없음 | - |
| [#1295](https://github.com/beta0629/MindGarden/pull/1295) | feat(client-mall): 내담자 몰 TO-BE 웹 | O | O | - | 없음 | - |
| [#1292](https://github.com/beta0629/MindGarden/pull/1292) | fix(consultation-log): 상담일지 작성 POST 서버 필수값 검증 | O | - | - | 없음 | - |
| [#1294](https://github.com/beta0629/MindGarden/pull/1294) | feat(admin-shop): 판매 상태 토글·유효기간·주문 사용 기한/연장·서버 페이징 (v3.2 정정) | O | O | O | 없음 | - |
| [#1291](https://github.com/beta0629/MindGarden/pull/1291) | chore(security): remove plaintext DB credential comment in deploy-production.yml | - | - | - | 없음 | - |
| [#1290](https://github.com/beta0629/MindGarden/pull/1290) | fix(shop): 매핑 없는 상담 상품 결제 차단 + afterCommit 이행 REQUIRES_NEW (P0) | O | - | - | 없음 | - |
| [#1286](https://github.com/beta0629/MindGarden/pull/1286) | fix(pg-config): 결제 연결 목록 자동 상세 이동 제거 및 모바일 폼 레이아웃 보정 | - | O | - | 없음 | - |
| [#1283](https://github.com/beta0629/MindGarden/pull/1283) | chore: sync release/prod (12fe32688) into release/dev + PG 설정 CSS 토큰 | - | O | - | 없음 | - |
| [#1263](https://github.com/beta0629/MindGarden/pull/1263) | fix(admin): 당일결제 sameDaySessionScheduleId rem 타겟 차감 + FE 큐 변경 원복 | O | O | - | 일부 (1/2 커밋) | - |
| [#1261](https://github.com/beta0629/MindGarden/pull/1261) | fix(session): COMPLETED+당일결제 후 labeled rem 차감 (release/dev port #1218) | O | O | - | 없음 | - |
| [#1260](https://github.com/beta0629/MindGarden/pull/1260) | fix(shop): 어드민 환불 PortOne+rem+ERP 원자성 (claim OL 롤백) | O | O | - | 없음 | O |
| [#1259](https://github.com/beta0629/MindGarden/pull/1259) | feat(pg): ACTIVE PG 설정에 웹훅 시크릿 전용 PATCH (재승인 없음) | O | O | - | 없음 | O |
| [#1257](https://github.com/beta0629/MindGarden/pull/1257) | fix(schedules): force page/size on GET /api/v1/schedules/admin (P0 #1256 follow-up) | - | O | - | 없음 | O |
| [#1255](https://github.com/beta0629/MindGarden/pull/1255) | fix(schedules): page GET /schedules/admin before enrichment (P0) | O | O | - | 일부 (1/3 커밋) | O |
| [#1243](https://github.com/beta0629/MindGarden/pull/1243) | fix(admin): P0 새 배정 ~20캡 + 어드민 목록 page/size drain SSOT | O | O | - | 없음 | O |
| [#1241](https://github.com/beta0629/MindGarden/pull/1241) | fix(admin): mobile profile Logout blocked by dropdown dim overlay | - | O | - | 없음 | - |
| [#1242](https://github.com/beta0629/MindGarden/pull/1242) | fix(shop): claim rem restore before subtract — stop refund over-subtract (2→0) | O | - | - | 없음 | - |
| [#1240](https://github.com/beta0629/MindGarden/pull/1240) | fix(shop): alreadyReversed always owns rem set — no rem≥grant residual heal | O | - | - | 없음 | - |
| [#1238](https://github.com/beta0629/MindGarden/pull/1238) | fix(shop): rem restore claim — cancel must −grant only (not over-subtract) | O | - | - | 없음 | - |
| [#1236](https://github.com/beta0629/MindGarden/pull/1236) | fix(erp): Path B shop INCOME order-scoped UK (P0 mapping 272) | O | - | - | 없음 | - |
| [#1232](https://github.com/beta0629/MindGarden/pull/1232) | fix(shop): cancel empty-events rem restore + ERP REFUND child | O | - | - | 없음 | - |
| [#1234](https://github.com/beta0629/MindGarden/pull/1234) | fix(shop): persist fulfillment COMPLETED with rem+INCOME atomic TX | O | - | - | 없음 | - |
| [#1231](https://github.com/beta0629/MindGarden/pull/1231) | fix(shop): PAID rem+INCOME atomic — shop confirmDeposit skip nested UpdateMappingInfo | O | - | - | 없음 | - |
| [#1229](https://github.com/beta0629/MindGarden/pull/1229) | fix(session+admin): idle soft overlay + IntegratedMatchingSchedule softRefresh | - | O | - | 없음 | - |
| [#1226](https://github.com/beta0629/MindGarden/pull/1226) | fix(session): port #1225 idle overlay fix to release/dev | - | O | - | 없음 | - |
| [#1222](https://github.com/beta0629/MindGarden/pull/1222) | fix(payment): PortOne test-mode pay/cancel SUCCESS (rem+ERP) gaps | O | - | - | 없음 | - |
| [#1221](https://github.com/beta0629/MindGarden/pull/1221) | fix(admin): P0 soft 가예약 배정큐 분리 + rem=0 당일결제 CTA 숨김 | - | O | - | 없음 | - |
| [#1217](https://github.com/beta0629/MindGarden/pull/1217) | fix(a11y): remove redundant role=region (P0 FE build after #1214) | - | O | - | 없음 | - |
| [#1214](https://github.com/beta0629/MindGarden/pull/1214) | fix(admin): P0 가예약 MappingScheduleCard + dirty∪TENTATIVE SSOT | - | O | - | 없음 | - |
| [#1211](https://github.com/beta0629/MindGarden/pull/1211) | fix(payment): fail-closed PortOne evidence on status CANCELLED/REFUNDED | O | - | - | 없음 | - |
| [#1200](https://github.com/beta0629/MindGarden/pull/1200) | fix(admin): shared adminListFetch SSOT — force page+size (P0 ONE BUNDLE) | O | O | - | 없음 | - |
| [#1195](https://github.com/beta0629/MindGarden/pull/1195) | tests: align consultation mapping checkout fixtures with fail-closed bind | O | - | - | 없음 | - |
| [#1193](https://github.com/beta0629/MindGarden/pull/1193) | fix(shop): PAID empty-events fulfill + never-fulfilled refund (absorb #1181) | O | - | - | 없음 | - |
| [#1174](https://github.com/beta0629/MindGarden/pull/1174) | feat(session): Spring Session Redis only (Track2 — survive blue/green restart) | O | - | - | 없음 | O |
| [#1186](https://github.com/beta0629/MindGarden/pull/1186) | fix(scheduler): LeftoverOccupying backfill Hikari pool ready 가드 | O | - | - | 없음 | - |
| [#1185](https://github.com/beta0629/MindGarden/pull/1185) | P0: Admin dashboard — STATS only, mappings/clients BE pagination | O | O | - | 없음 | O |
| [#1184](https://github.com/beta0629/MindGarden/pull/1184) | fix(shop): hide 전액환불 when PortOne already CANCELLED (pgStatus) | O | O | - | 없음 | - |
| [#1177](https://github.com/beta0629/MindGarden/pull/1177) | fix(ops): CF520 origin-hang prevention (Track4) — nginx timeouts + health snapshot + runbook | - | - | - | 없음 | O |
| [#1176](https://github.com/beta0629/MindGarden/pull/1176) | fix(P0): with-mapping-info 풀페치 → view=summary (IntegratedMatchingSchedule, PsychAssessmentManagement) | - | O | - | 없음 | - |
| [#1175](https://github.com/beta0629/MindGarden/pull/1175) | Track3: Hikari/thread/heap stacking observability + safe guards | O | - | - | 없음 | - |
| [#1173](https://github.com/beta0629/MindGarden/pull/1173) | fix(P0): consultation-messages/all 페이지네이션 누락 — 210KB 응답 수정 | - | O | - | 없음 | - |
| [#1172](https://github.com/beta0629/MindGarden/pull/1172) | fix(shop-refund): P0 — Clinic REFUNDED + PG 미취소 시 PortOne cancel 재시도 | O | - | - | 없음 | - |
| [#1167](https://github.com/beta0629/MindGarden/pull/1167) | fix(refund): P0 환불 코드 fail-closed 재작성 — PG 취소 증거 없이 REFUNDED 금지 | O | - | - | 없음 | - |
| [#1166](https://github.com/beta0629/MindGarden/pull/1166) | SSL 문서·점검 현행화: SSOT 신설, 구경로 Obsolete, SCP 버그 수정 | - | - | - | 없음 | - |
| [#1155](https://github.com/beta0629/MindGarden/pull/1155) | fix(p0): hotfix consultation-messages/all + schedules BOOKED latency | O | O | O | 없음 | O |
| [#1163](https://github.com/beta0629/MindGarden/pull/1163) | fix(shop): Path B REFUND UK soft-delete flush — 잔여 전액환불 멱등 | O | - | - | 없음 | - |
| [#1162](https://github.com/beta0629/MindGarden/pull/1162) | feat(admin-shop): Clinic-OS 주문 상세 모달 SSOT (P1 FE) | - | O | - | 없음 | - |
| [#1161](https://github.com/beta0629/MindGarden/pull/1161) | fix(shop): Path B multi-order REFUND UK slot — 신규 첫환불 「중복」오탐 | O | - | - | 없음 | - |
| [#1160](https://github.com/beta0629/MindGarden/pull/1160) | fix(admin): soft-refresh remaining admin screens (ACL remount flash) | - | O | - | 없음 | - |
| [#1158](https://github.com/beta0629/MindGarden/pull/1158) | fix(shop): refund atomic clinic chain + no email-unique mis-map (P0) | O | - | - | 없음 | - |
| [#1156](https://github.com/beta0629/MindGarden/pull/1156) | fix(shop): PAID→INCOME 원자 fulfill + COMPLETED 전 주문귀속 require | O | - | - | 없음 | - |
| [#1146](https://github.com/beta0629/MindGarden/pull/1146) | ci(deploy): align FE deploy ubuntu-latest with prod (release/dev) | - | - | - | 없음 | - |
| [#1142](https://github.com/beta0629/MindGarden/pull/1142) | fix(shop): PAID INCOME claim·환불 SSOT·reconcile-refund force (P0) | O | O | - | 없음 | - |
| [#1141](https://github.com/beta0629/MindGarden/pull/1141) | fix(erp): Path B PAID stale/missing INCOME heal by order attribution | O | - | - | 없음 | - |
| [#1138](https://github.com/beta0629/MindGarden/pull/1138) | fix(shop): Path B 환불 EXPENSE≠0 + ONLINE 정산 fee (no estimate) | O | O | - | 없음 | - |
| [#1140](https://github.com/beta0629/MindGarden/pull/1140) | fix(client/erp): 홈 remaining SSOT + soft-refresh + PAID=INCOME heal | O | O | - | 없음 | - |
| [#1139](https://github.com/beta0629/MindGarden/pull/1139) | fix(shop): 기배정 상담사 체크아웃 피커 숨김 (P0 UX) | O | O | - | 없음 | - |
| [#1137](https://github.com/beta0629/MindGarden/pull/1137) | fix(shop): 환불 후 consultant-mappings NO_MAPPING — 상담 연결 유지 | O | - | - | 없음 | - |
| [#1136](https://github.com/beta0629/MindGarden/pull/1136) | fix(shop): Path B 환불 원자체인 + 결제/이행 실패 방어 | O | O | - | 없음 | - |
| [#1135](https://github.com/beta0629/MindGarden/pull/1135) | fix(shop): Path B REFUNDED 매핑 heal 후 confirmDeposit | O | - | - | 없음 | - |
| [#1134](https://github.com/beta0629/MindGarden/pull/1134) | fix(shop): LEADER P0 재이행 CTA + events/lines 매퍼 (단일 PR) | O | O | - | 없음 | - |
| [#1133](https://github.com/beta0629/MindGarden/pull/1133) | fix(shop): fulfill-retry Path B mid-state → ERP INCOME COMPLETED | O | O | O | 없음 | - |
| [#1132](https://github.com/beta0629/MindGarden/pull/1132) | fix(ci): FE .dev SSH 배포 runner를 ubuntu-latest로 전환 | - | - | - | 없음 | - |
| [#1131](https://github.com/beta0629/MindGarden/pull/1131) | feat(shop): FAILED+retryable 이행 「재이행」버튼 + fulfill-retry API | O | O | O | 없음 | - |
| [#1130](https://github.com/beta0629/MindGarden/pull/1130) | fix(shop): Path B PAID 회기·입금 INCOME·환불 EXPENSE 삼중 SSOT | O | - | - | 없음 | - |
| [#1129](https://github.com/beta0629/MindGarden/pull/1129) | fix(shop): Path B 환불 시 입금 INCOME 수리 후 EXPENSE 쌍 보장 | O | - | - | 없음 | - |
| [#1128](https://github.com/beta0629/MindGarden/pull/1128) | fix(pg): add missing decrypt-keys HTTP endpoints (tenant + ops) | O | - | - | 없음 | - |
| [#1127](https://github.com/beta0629/MindGarden/pull/1127) | fix(shop): Path B PAID rollback-only — 상담 훅/환불 ERP REQUIRES_NEW 격리 | O | - | - | 없음 | - |
| [#1126](https://github.com/beta0629/MindGarden/pull/1126) | fix(shop): Path B 환불 시 ERP 매출취소/환불 반대전표 생성 | O | - | - | 없음 | - |
| [#1119](https://github.com/beta0629/MindGarden/pull/1119) | fix(P0): sessionSequence 중복 — cancel/rebook 가용 순번 부여 | O | - | - | 없음 | - |
| [#1125](https://github.com/beta0629/MindGarden/pull/1125) | fix(shop): PortOne Path B — PAID 후 회기 부여·ERP 이행 실패 재시도 | O | - | - | 없음 | - |
| [#1124](https://github.com/beta0629/MindGarden/pull/1124) | ci: 온보딩·Core 빌드를 ubuntu-latest로 분리 (self-hosted OOM) | - | - | - | 없음 | - |
| [#1123](https://github.com/beta0629/MindGarden/pull/1123) | fix(shop): cart 500 — session_count 컬럼 멱등 Flyway ensure | O | - | O | 없음 | - |
| [#1122](https://github.com/beta0629/MindGarden/pull/1122) | fix(shop): PortOne Path B — 신규 결제 SDK 성공 후 자동 PAID (#1121 후속) | O | O | - | 없음 | - |
| [#1121](https://github.com/beta0629/MindGarden/pull/1121) | fix(shop): PortOne V2 결제 완료·웹훅·reconcile을 release/dev에 이식 (P0) | O | O | - | 없음 | - |
| [#1118](https://github.com/beta0629/MindGarden/pull/1118) | fix(shop): unwrap checkout/prepare API responses so PortOne can open | - | O | - | 없음 | - |
| [#1117](https://github.com/beta0629/MindGarden/pull/1117) | feat(payment): distinguish online vs manual payment source on history | O | O | - | 없음 | - |
| [#1114](https://github.com/beta0629/MindGarden/pull/1114) | fix(client): settings profile form for PortOne customer gate (#1111) | O | O | O | 없음 | - |
| [#1116](https://github.com/beta0629/MindGarden/pull/1116) | fix(shop): P0 client shop banner on-dark text contrast | - | O | - | 없음 | - |
| [#1115](https://github.com/beta0629/MindGarden/pull/1115) | fix(client): unify home upcoming with schedule list SSOT | - | O | - | 없음 | - |
| [#1113](https://github.com/beta0629/MindGarden/pull/1113) | feat(admin): persist toggles immediately via API (PG testMode SSOT) | O | O | - | 없음 | - |
| [#1111](https://github.com/beta0629/MindGarden/pull/1111) | fix(shop): prevent orphan unpaid checkout orders before PortOne | - | O | - | 없음 | - |
| [#1110](https://github.com/beta0629/MindGarden/pull/1110) | fix(shop): PAID cart clear + guest merge + PortOne CARD/customer fail-closed | O | O | - | 없음 | - |
| [#1109](https://github.com/beta0629/MindGarden/pull/1109) | fix(shop): Admin SKU sessionCount required (fail-closed) | O | O | - | 없음 | - |
| [#1108](https://github.com/beta0629/MindGarden/pull/1108) | feat(client-web): Clinic-OS suite shared shell + face slots | - | O | - | 없음 | - |
| [#1107](https://github.com/beta0629/MindGarden/pull/1107) | fix(client): /client/community no longer redirects to dashboard | - | O | - | 없음 | - |
| [#1102](https://github.com/beta0629/MindGarden/pull/1102) | fix(client): community on v4 lobby shell (SSOT /client/community) | - | O | O | 없음 | - |
| [#1103](https://github.com/beta0629/MindGarden/pull/1103) | fix(client): Clinic-OS shared web header SSOT (no LNB) | - | O | - | 없음 | - |
| [#1104](https://github.com/beta0629/MindGarden/pull/1104) | fix: PortOne amount/status SSOT — client + admin pending-deposit/orders | O | O | - | 없음 | - |
| [#1106](https://github.com/beta0629/MindGarden/pull/1106) | fix(admin-shop): fail-closed online-order delete on live/in-flight payments | O | O | - | 없음 | - |
| [#1105](https://github.com/beta0629/MindGarden/pull/1105) | fix(admin): eliminate full-page remount via shared soft refresh | - | O | - | 없음 | O |
| [#1101](https://github.com/beta0629/MindGarden/pull/1101) | feat(client): Clinic-OS 내담자 대시보드 v4 「상담실 로비」 | - | O | - | 없음 | - |
| [#1072](https://github.com/beta0629/MindGarden/pull/1072) | ci(dev): BE deploy workflow를 ubuntu-latest로 정렬 (self-hosted OOM/오프라인 핫픽스) | - | - | - | 없음 | O |
| [#1066](https://github.com/beta0629/MindGarden/pull/1066) | feat(shop): public client catalog; login only at checkout | O | O | - | 없음 | O |
| [#1063](https://github.com/beta0629/MindGarden/pull/1063) | fix(pg): 상품·구매면 이용기간·일시불 SSOT 고지 (P0 PG review) | O | O | - | 없음 | - |
| [#1062](https://github.com/beta0629/MindGarden/pull/1062) | fix(fe): resolve @portone/browser-sdk/v2 for eslint import | - | O | - | 없음 | O |
| [#1061](https://github.com/beta0629/MindGarden/pull/1061) | feat(pg): PortOne V2 test-mode for PG onboarding review | O | O | - | 없음 | O |
| [#1050](https://github.com/beta0629/MindGarden/pull/1050) | fix(ci): harden BE .dev JAR verify (false Apple OAuth miss) | - | - | - | 없음 | - |
| [#1048](https://github.com/beta0629/MindGarden/pull/1048) | ci: deploy triggers release/dev + release/prod | - | - | - | 없음 | - |
| [#1047](https://github.com/beta0629/MindGarden/pull/1047) | ci: deploy workflows runs-on → [self-hosted, linux, deploy] | - | - | - | 없음 | O |
| [#1027](https://github.com/beta0629/MindGarden/pull/1027) | CI·Deploy 허브 통합 (ci.yml / deploy.yml) — Actions 분·진입점 정리 | - | - | - | 없음 | O |
| [#1026](https://github.com/beta0629/MindGarden/pull/1026) | Actions 분 절감 — 헬스 cron·CI push 이중 제거 | - | - | - | 없음 | O |

## 2. PR 없이 release/dev 에 직접 들어간 커밋 중 운영 patch-id 가 없는 것 (25건)

| 커밋 | 제목 | BE | FE | DB 마이그레이션 | 운영에 같은 patch-id |
|------|------|----|----|----------------|---------------------|
| `055e8ac0e` | fix(oauth): release/dev에 rotateWebOAuthSession·raw Set-Cookie 제거 포팅 | O | - | - | 없음 |
| `da0987af7` | fix(oauth): web OAuth JWT 발급·FE 검증 및 세션 테스트 격리 | O | O | - | 없음 |
| `b2d72e6df` | fix(upload): share shop-catalog thumbnails and logos across blue/green | O | - | - | 없음 |
| `e2417c6ab` | test(session): align background 401 checks with keep-user=false default | - | O | - | 없음 |
| `dcd144e1a` | fix(frontend): soft-refresh client/consultant dashboards; SPA post-auth navigate | - | O | - | 없음 |
| `5dfea5c17` | fix(session): block phantom SNS OAuth login via server-verify switches | O | O | O | 없음 |
| `ae3977e8f` | fix(dev): port session soft-fail stack from release/prod for LNB | - | O | - | 없음 |
| `b9ac7854f` | fix(dev): sync unpaid soft schedule helper from release/prod | - | O | - | 없음 |
| `7f4abdb63` | fix(dev): sync adminListFetch SSOT for prod IMS cold-load | - | O | - | 없음 |
| `10260a1e1` | fix(dev): align integrated schedule sidebar with release/prod SSOT | - | O | - | 없음 |
| `0e38c79a0` | fix(mapping): keep deposit checkout on unpaid provisional cards | O | O | - | 없음 |
| `b4727cb16` | fix(mapping): drop a completed single session from new assignment | O | O | - | 없음 |
| `12a0bd614` | fix(mapping): consume a completed single session as remaining 0 | O | O | - | 없음 |
| `df38dcf4b` | fix(stats): aggregate consultation completion by tenant | O | O | - | 없음 |
| `647dfc0a5` | feat(shop): expose package fee rows instead of a second product form | O | O | O | 없음 |
| `66a82b0fe` | fix(admin): P0 DB-page with-mapping-info/mappings/schedules + hotpath indexes | O | O | O | 없음 |
| `eadbff0a4` | fix(shop): replace DELIMITER-procedure with PREPARE/EXECUTE in V20260919_001/002 | O | - | O | 없음 |
| `a681b8862` | fix(session): restore User.userSocialAccounts JPA mapping after #1174 | O | - | - | 없음 |
| `f72d7507b` | Merge branch 'cursor/admin-shop-orders-soft-refresh-dfbd' into release/dev | - | O | - | 없음 |
| `282405dc7` | chore(dev): noop comment to retrigger Onboarding BE .dev deploy | O | - | - | 없음 |
| `639203240` | merge(dev): remove duplicate resolveOrderLineSessionCount (BE compile) | O | - | - | 없음 |
| `a3e76e2b6` | merge(dev): Clinic-OS ship tip (#1096–#1100) | O | O | O | 없음 |
| `09d088647` | chore(deploy): retrigger Core FE+BE after runner shutdown (#1058 20260916T035248Z) | - | - | - | 없음 |
| `1fbbb78f4` | fix(ci): repair deploy-backend-dev.yml YAML (python heredoc) | - | - | - | 없음 |
| `7023fd137` | chore(dev): noop comment to retrigger Core BE .dev deploy | O | - | - | 없음 |

## 부록 — 운영에 이미 같은 patch-id 로 들어간 것 (건수만)

- PR: 12건 (모든 커밋의 patch-id 가 운영 이력에 있음)
- 직접 커밋: 15건

## 재생성

```bash
git fetch origin release/dev release/prod
git merge-base --is-ancestor origin/release/prod origin/release/dev && echo ancestor
git rev-list --no-merges origin/release/prod..origin/release/dev | wc -l
git log --first-parent --format="%H %P%x09%s" origin/release/prod..origin/release/dev
git log --no-merges -p --since=2025-06-01 origin/release/prod | git patch-id --stable
gh pr list --state merged --base release/dev --limit 500 --json number,title
```
