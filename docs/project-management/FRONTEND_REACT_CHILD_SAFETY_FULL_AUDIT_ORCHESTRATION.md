# 프론트엔드 React 자식 안전성 전역 점검 — 기획 주관 오케스트레이션

**문서 버전**: 1.0.0  
**작성일**: 2026-02-12  
**주관**: core-planner  

---

## 1. 배경·문제 인식

- 일부 화면에서 **React minified error #130** 등으로 인해 **객체·비정상 값이 JSX 자식으로 렌더**되는 패턴이 의심됨.
- ERP/관리자 대시보드에 **방어 코드**를 넣은 뒤에도, **동일 유형 이슈가 다른 파일에 광범위**할 수 있음.
- **“어디를 고쳤는지”보다 “전체에서 어디가 위험한지”**를 한 번에 정리하고, **우선순위·일괄 검증**이 필요하다는 요청에 대응한다.

---

## 2. 목표 (완료 기준)

| ID | 목표 | 검증 |
|----|------|------|
| G1 | **API 응답 필드**를 그대로 `{value}`로 넣는 위험 구간 목록화 | 표 또는 스프레드시트 + 코드 경로 |
| G2 | **차트 `labels` / 툴팁 / 범례**에 비문자열이 들어갈 수 있는 경로 점검 | 목록 + 샘플 응답 타입 |
| G3 | **`error` / `message` / `detail`** 를 JSX에 직접 출력하는 컴포넌트 점검 | 문자열 보장 정책 합의 |
| G4 | **KPI·배지·테이블 셀**의 `value`/`badge`/동적 필드 타입 가드 | 위젯·대시보드 우선 |
| G5 | **운영 빌드 전** 스모크 시나리오(관리자·ERP·상담사·내담자 주요 라우트) | core-tester 체크리스트 |

---

## 3. 위험 패턴 정의 (검색 키워드)

기획은 아래를 **정적 검색 + 샘플 수동 확인**에 활용한다.

1. **직접 렌더**
   - `{someApiField}` 중 `someApiField`가 배열/객체일 수 있는 경우 (특히 `description`, `message`, `payload`, `data`, `meta`, `period`, `label` 동적 키).
2. **에러 UI**
   - `{error}`, `{err}`, `{e.message}` 가 아닌 `{e}` 또는 `{response}` 전체.
3. **차트**
   - `labels: ...map(x => x.? )` 에서 `x`의 필드가 스키마 미고정인 경우.
4. **JSON 그대로**
   - 개발용 `console.log`는 괜찮으나, UI에 `{obj}` 노출 시도는 제거 또는 `String`/`format`.

**권장 ripgrep 예시** (탐색 에이전트가 실행; 결과는 이슈로만 정리):

```text
# JSX에서 err/error 전체 참조 (샘플)
rg "<p>\{[^}]*error[^}]*\}</p>" frontend/src --glob "*.js"
rg "\{error\}" frontend/src/components --glob "*.js"

# API 필드 직접 출력 (수동 필터링 필요)
rg "\{[a-zA-Z]+\.(description|message|detail|payload|data)\}" frontend/src --glob "*.js"
```

※ 정규식은 **거짓 양성**이 많으므로 **core-explore**가 결과를 분류하고 **core-debugger**가 “실제 런타임 위험”만 표시한다.

---

## 4. 서브에이전트 분배 (전체 체크)

### 4.1 core-planner (필수)

- 본 문서 유지, Phase 나누기, 일정·우선순위, **사용자 보고 한 장**으로 취합.

### 4.2 explore (1단계 — 인벤토리)

- [ ] `frontend/src` 기준 위험 패턴 스캔, **파일·라인·짧은 설명** CSV/표.
- [ ] 라우트 단위 묶음: `App.js` 라우트 ↔ 대표 컴포넌트 매핑 (어느 URL이 어느 트리인지).
- 산출물: `docs/project-management/attachments/` 또는 본 문서 **부록 A** (링크만 있어도 됨).

### 4.3 core-debugger (2단계 — 위험도 판정)

- [ ] explore 산출물에서 **High / Medium / Low** 분류.
- [ ] 실제 API 샘플(가능 시)로 “객체 자식” 재현 여부 판단.
- 산출물: **core-coder에게 줄 수정 작업 목록** (파일·라인·권장 패턴: `safeText()`, `chartLabelFromPeriod()` 등).

### 4.4 core-coder (3단계 — 배치 수정)

- [ ] **배치 1**: 대시보드·차트·위젯 (`components/dashboard*`, `components/admin`, `widgets`, `Chart.js`, `MGChart.js`).
- [ ] **배치 2**: ERP·결제·매핑 등 수치·테이블 많은 영역.
- [ ] **배치 3**: 공통 컴포넌트 (`Badge`, `BaseWidget`, `ContentKpiRow`, 모달 본문).
- [ ] **공통 유틸 도입 검토**: 예) `frontend/src/utils/safeDisplay.js` — `toDisplayString(value, fallback='—')` 단일화 (기획·코더 합의 후).

### 4.5 core-tester (4단계 — 회귀)

- [ ] 역할별 로그인 → **주요 메뉴 순회**, 콘솔 #130/uncaught error 0건.
- [ ] CI: 가능하면 `npm test` / E2E 스모크에 “콘솔 에러 허용 0” 규칙(단계적 도입) 검토.

### 4.6 core-component-manager (병행, 선택)

- [ ] 동일 패턴 반복 시 **공통 컴포넌트화·적재적소** 제안 → core-coder 실행.

---

## 5. Phase 로드맵 (제안)

| Phase | 내용 | 담당 |
|-------|------|------|
| P0 | explore 스캔 + debugger 위험도 표 | 1~2일치 작업량으로 계획 |
| P1 | 대시보드·차트·위젯 배치 수정 + PR | core-coder |
| P2 | ERP·운영 화면 배치 수정 + PR | core-coder |
| P3 | 공통 `safeDisplay` 도입 및 치환 (선택) | core-coder + 문서 generalPurpose |
| P4 | 전역 스모크 + 문서 갱신 | core-tester + planner |

---

## 6. 연관 문서

- `docs/project-management/ERP_ADMIN_DASHBOARD_REACT_ERROR_130_ORCHESTRATION.md` — 최초 발화 지점·부분 수정 이력.
- `.cursor/skills/core-solution-rules/SKILL.md` — 서브에이전트 호출 원칙.
- `docs/standards/SUBAGENT_USAGE.md`

---

## 7. 기획 → 사용자 보고 템플릿

1. **스캔 요약**: 파일 수 / High 건수 / Medium 건수  
2. **즉시 조치 PR**: 번호·범위  
3. **잔여 리스크**: API 스키마 불확실 구간  
4. **다음 스프린트**: 공통 유틸·CI 여부  

---

## 8. 부록 — 인벤토리 산출물

- **Phase 1 스캔 결과(요약·파일 목록·배치 계획)**:  
  [`attachments/FRONTEND_REACT_CHILD_INVENTORY_20260212.md`](attachments/FRONTEND_REACT_CHILD_INVENTORY_20260212.md)

---

## 9. 변경 이력

| 버전 | 일자 | 내용 |
|------|------|------|
| 1.0.1 | 2026-02-12 | Phase 1 인벤토리 첨부; `safeDisplay.js` + BaseWidget/MGChart/AdminMetricsVisualization 에러 문자열화(배치 0 착수) |
| 1.0.0 | 2026-02-12 | 초안: 전역 React 자식 안전성 감사 오케스트레이션 |
