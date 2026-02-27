# 디버깅·원인 분석 문서 (debug/)

**용도**: 에러·권한·동작 이상 등에 대한 **원인 분석·재현 절차·수정 제안** 문서. core-debugger 산출물 및 유사 분석 문서를 둡니다.  
**문서 인덱스 진입점**: [docs/README.md](../README.md)

---

## 목차

| 문서 | 설명 |
|------|------|
| [DEBUG_ADMIN_SYSTEM_NOTIFICATION_PERMISSION_20260227.md](./DEBUG_ADMIN_SYSTEM_NOTIFICATION_PERMISSION_20260227.md) | 관리자 공지 화면 "권한이 필요하다"(403) 원인 분석·DB/캐시 확인·수정 제안 (2026-02-27) |
| [DEBUG_MESSAGE_MANAGEMENT_20260227.md](./DEBUG_MESSAGE_MANAGEMENT_20260227.md) | 메시지 관리 화면 오류·API 응답 처리 불일치·MESSAGE_MANAGE·tenant_id 원인·수정 제안 (2026-02-27) |
| [DEBUG_PSYCHOLOGY_TEST_AI_INFINITE_LOOP_20260227.md](./DEBUG_PSYCHOLOGY_TEST_AI_INFINITE_LOOP_20260227.md) | 심리검사 AI 무한루프·로그인 리다이렉트·useWidget immediate 호출 시점 원인·수정 제안 (2026-02-27) |
| [PASSWORD_BCRYPT_FLOW_ANALYSIS.md](./PASSWORD_BCRYPT_FLOW_ANALYSIS.md) | 비밀번호 bcrypt 흐름 분석 |
| [PASSWORD_RESET_AND_CLIENT_LOGIN_ANALYSIS.md](./PASSWORD_RESET_AND_CLIENT_LOGIN_ANALYSIS.md) | 비밀번호 재설정·클라이언트 로그인 분석 |

---

## 참조

- **장애 대응·모니터링**: [docs/troubleshooting/](../troubleshooting/)
- **서브에이전트(디버그 전담)**: [docs/standards/SUBAGENT_USAGE.md](../standards/SUBAGENT_USAGE.md) — core-debugger
- **문서 작성·정리 규칙**: [.cursor/skills/core-solution-documentation/SKILL.md](../../.cursor/skills/core-solution-documentation/SKILL.md)
