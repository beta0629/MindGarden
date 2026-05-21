# 감정일기 공유 푸시 알림 UX Handoff

**작성일**: 2026-05-21  
**갱신**: 2026-05-22 (core-planner · 라우트·푸시 type 코드 정합)  
**작성자**: core-designer  
**상태**: **DONE** — 구현·`pushScenarios.ts`·`MobilePushDispatchServiceImpl`과 일치 확인

## § Push (푸시 알림 및 토스트)

- **OS 푸시 카피 (상담사 수신)**
  - **Title**: 「감정 일기 공유」 *(코드 SSOT: `MobilePushDispatchServiceImpl.dispatchMoodJournalShared`)*
  - **Body**: 「{name}님이 {date} 감정 일기를 공유했어요.」 *(memo snippet 있으면 date+snippet 변형)*
- **인앱 토스트 (내담자 발신 시)**: 「상담사에게 감정일기를 공유했어요.」 *(Expo 구현 시 handoff 카피 — 서버 푸시와 별도)*
- **Type 설명**: `mood_journal_shared` (`MobilePushCanonicalTypes.MOOD_JOURNAL_SHARED`) — 내담자 `sharedWithConsultant` **false→true** 1회 시 CONSULTANT fanout
- **랜딩 (Landing)**: 상담사 앱 **감정 일기 수신함** — `/(consultant)/(more)/mood-journal-inbox` (`MOOD_JOURNAL_SHARED_SCENARIO` in `pushScenarios.ts`)
- **UX 흐름**: 내담자 공유 ON 저장 → (선택) 인앱 토스트 → 상담사 OS 푸시 수신 → 탭 시 **감정 일기 수신함** 랜딩 → 공유 일기(mood·emoji·tags·memo) 확인

> **마음날씨와 분리**: `mind_weather_shared` → `/(consultant)/(more)/mind-weather-inbox` 는 **별도** 시나리오(V4 회귀). 감정일기는 **전용 type·전용 inbox** — 혼합·리다이렉트 없음.

## § Inbox (상담사 수신함)

| 항목 | 값 |
|------|-----|
| API | `GET /api/v1/mood-journals/inbox` |
| Expo 화면 | `app/(consultant)/(more)/mood-journal-inbox.tsx` |
| 더보기 | `CONSULTANT_MOOD_JOURNAL_INBOX_COPY.MENU_TITLE` — 「감정 일기 수신함」 (`BookHeart`) |
| 페이지 타이틀 | 「감정 일기 수신함」 |
| 고지 | 「일기 내용은 상담 참고용이며 의학적 진단이 아닙니다.」 |

**SSOT 기획**: [`MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md`](./MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md)
