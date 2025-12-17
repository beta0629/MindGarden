# 보안/개인정보/AI 안전 (CoreSolution, 2025-12 기준)

## 1) 목표

CoreSolution은 멀티테넌트 SaaS로서 다음을 목표로 합니다.

- **테넌트 데이터 격리** 및 최소권한 원칙 준수
- **개인정보/민감정보 처리 최소화** 및 암호화
- 운영 관점에서 **감사/추적 가능성** 확보(로그/이력)
- AI 기능 도입 시 **오판/환각 방지** 및 **사람 검수 플로우** 내재화

## 2) 표준화 문서 근거(필수)

- 보안/인증: `docs/standards/SECURITY_AUTHENTICATION_STANDARD.md`, `docs/standards/SECURITY_STANDARD.md`
- 암호화: `docs/standards/ENCRYPTION_STANDARD.md`
- 파일 저장: `docs/standards/FILE_STORAGE_STANDARD.md`
- 로깅/마스킹: `docs/standards/LOGGING_STANDARD.md`
- 환경변수/키 관리: `docs/standards/ENVIRONMENT_VARIABLE_STANDARD.md`
- 에러 처리: `docs/standards/ERROR_HANDLING_STANDARD.md`, `docs/standards/API_ERROR_HANDLING_STANDARD.md`
- 권한/세션: `docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md`, `docs/standards/PERMISSION_SYSTEM_STANDARD.md`, `docs/standards/SESSION_STANDARD.md`
- 배포: `docs/standards/DEPLOYMENT_STANDARD.md`

## 3) 인증/권한(요약)

- **인증**: JWT 기반 토큰 전략(표준 문서에 정의된 키 길이/만료/발급자 원칙 준수)
- **권한**: 역할 기반 + 동적 권한(테넌트별 역할/권한) 원칙
- **테넌트 컨텍스트**: 요청/세션에서 테넌트 컨텍스트를 확보하고, 모든 주요 데이터 접근은 `tenant_id`로 제한

## 4) 민감정보/문서 처리(심리검사 AI 포함)

### 4.1 심리검사 원본 PDF
- **저장**: 원본 스캔 PDF는 **암호화 저장(AES-GCM)** 후 파일 시스템/스토리지에 저장
- **키 관리**: 암호화 키는 환경변수/시스템 설정으로만 관리(하드코딩 금지), 키 버전 관리 가능
- **접근 제어**: 권한이 있는 관리자만 업로드/조회 가능(추후 역할 세분화 가능)

### 4.2 추출/지표/리포트 데이터
- **최소 수집**: LLM 입력은 “OCR 원문 전체”가 아니라 **표준화된 지표(metrics)** 중심으로 구성(불필요한 원문 투입 최소화)
- **표준화 저장**: 지표는 척도 코드/라벨/점수/백분위 등 구조화된 컬럼/엔티티로 저장
- **감사성**: 리포트에는 생성 버전(룰/프롬프트/모델), evidence(근거 연결) 등 추적 가능한 메타데이터를 포함

## 5) AI 안전(오판/환각 방지) 정책

심리검사 AI는 임상/민감 도메인 특성상 “LLM 출력”을 그대로 채택하지 않습니다.

### 5.1 오판 방어 원칙
- **구조 검증**: 출력 JSON 스키마/필수 섹션을 만족해야 채택
- **근거 기반**: report의 핵심 문장은 evidence로 연결되어야 하며, evidence의 `scaleCode`는 입력 metrics에 존재해야 함(환각 방지)
- **금지 문구 차단**: 확정 진단/법적 결론 등 위험 표현 탐지 시 자동 거절
- **언어/형식 강제**: 한국어 출력/코드펜스 금지 등 정책 준수
- **폴백**: 검증 실패 시 **규칙 기반 리포트로 자동 폴백** + `needsReview=true`(사람 검수 필요)

### 5.2 책임있는 출력(문구 정책)
- 확정 진단을 피하고, **가능성/참고/추가 평가 권고** 형태로 표현
- 자·타해 위험 등 안전 이슈는 “가능성”을 전제로 **전문가 평가/안전계획 권고**를 명시

## 6) 운영/배포/로그(요약)

- **배포**: GitHub Actions 자동 배포, 개발/운영 환경 분리(표준 문서 준수)
- **로그**: 민감정보(키/비밀번호/원문 등) 로그 금지, 필요한 경우 마스킹/요약만 기록
- **오류 대응**: 표준 에러 응답/중앙 예외 처리로 운영 대응 일관성 확보


