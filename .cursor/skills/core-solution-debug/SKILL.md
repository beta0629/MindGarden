---
name: core-solution-debug
description: Core Solution(MindGarden) 디버그 전용 스킬. 에러·500·예외 원인 분석, 로그·스택트레이스 해석, 재현 절차·수정 제안·체크리스트 작성. core-debugger 서브에이전트와 함께 사용.
---

# Core Solution 디버그 스킬

에러·오류 원인 분석·수정 제안 시 **core-debugger** 서브에이전트와 함께 이 스킬을 적용하세요. 코드 직접 수정은 하지 않고, 분석·제안만 수행 후 **core-coder**에게 수정을 위임합니다.

## 적용 시점

- 500 Internal Server Error, 400 Bad Request 등 API 오류 원인 파악
- "상담사 수정 시 오류 발생", "등록 후 저장이 안 돼요" 등 현상 디버깅
- 스택트레이스·콘솔 로그 해석 및 원인 가설 수립
- 프론트↔백엔드 payload·DTO 불일치 추적

## 참조 문서

- `docs/standards/ERROR_HANDLING_STANDARD.md` — 예외 처리·로깅
- `docs/standards/LOGGING_STANDARD.md` — 로그 규칙
- `docs/standards/API_CALL_STANDARD.md`, `docs/standards/API_INTEGRATION_STANDARD.md`
- 에이전트 정의: `.cursor/agents/core-debugger.md`

## 디버깅 체크리스트

### 1. 증상 수집

- [ ] HTTP 상태 코드·URL·메서드
- [ ] 요청 body/쿼리(필요 시 샘플)
- [ ] 에러 메시지(브라우저 콘솔·Network 탭·백엔드 로그)
- [ ] 재현 단계(어떤 화면에서 어떤 조작 후 발생)

### 2. 백엔드 추적

- [ ] Controller → Service → Repository/외부 호출 경로
- [ ] DTO 필드명·타입과 프론트 전송 필드 일치 여부
- [ ] null/blank 처리: Request getter가 null일 때 set 호출 여부
- [ ] Bean Validation(@NotBlank 등)과 실제 전달 값

### 3. 프론트엔드 추적

- [ ] API 호출: `StandardizedApi` 사용 여부, endpoint·메서드
- [ ] 전송 payload: formData vs requestPayload, 배열→문자열 변환(specialization 등)
- [ ] 응답 처리: success/error 분기, response 구조

### 4. 산출물

- [ ] **원인 분석 요약**: 증상, 추적 경로, 근본 원인(가설)
- [ ] **재현 절차**: 단계별로 정리
- [ ] **수정 제안**: 파일·라인·변경 방향
- [ ] **core-coder용 태스크 설명** 초안(선택): "다음 수정을 적용해주세요" + 구체 지시

## 서버 로그·DB 확인 (shell 서브에이전트 연계)

백엔드/500 오류 원인 분석 시 **shell 서브에이전트**와 연계해 다음을 수행하도록 합니다.

- **서버 로그 확인**: 부모 에이전트에게 shell 서브에이전트 실행을 요청해, 배포 환경 또는 로컬의 애플리케이션 로그·스택트레이스를 확인합니다.  
  예: `tail -n 300 logs/spring.log`, `journalctl -u <서비스명> -n 200 --no-pager`, 또는 프로젝트 내 `build/`, `logs/` 등 로그 경로 확인 후 tail/cat.
- **DB 확인**: 필요 시 shell 서브에이전트로 DB 접속 정보가 있는 환경에서 읽기 전용 쿼리 실행을 요청합니다.  
  예: 해당 엔티티 존재 여부(`SELECT id, ... FROM users WHERE id = ?`), unique 제약 관련 데이터 확인.  
  (DB 비밀번호 등 민감 정보는 명령어에 직접 넣지 않고, 환경 변수·설정 파일 참조를 안내.)
- **연계 방식**: core-debugger는 코드 수정을 하지 않으므로, "shell 서브에이전트로 다음 명령 실행 요청: …" 형태로 **실행할 명령과 목적**을 구체적으로 정리해 부모 에이전트(또는 사용자)에게 전달합니다. 부모가 **mcp_task(subagent_type: shell)** 로 해당 명령을 실행하고, 결과를 디버거 분석에 활용할 수 있습니다.

## 수정 위임

분석·제안까지 수행한 뒤, 실제 코드 수정은 반드시 **core-coder** 서브에이전트를 호출해 위임합니다. 전달 시 수정 제안·체크리스트·(선택) 태스크 설명을 함께 넘기세요.
