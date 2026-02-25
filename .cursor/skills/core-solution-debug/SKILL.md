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

## 수정 위임

분석·제안까지 수행한 뒤, 실제 코드 수정은 반드시 **core-coder** 서브에이전트를 호출해 위임합니다. 전달 시 수정 제안·체크리스트·(선택) 태스크 설명을 함께 넘기세요.
