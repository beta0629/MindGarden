# core-planner 위임 명령 (오케스트레이션 전용)

**대상**: `core-planner`  
**목적**: 프론트 품질·React 자식 안전(#130)·에러/KPI/API 필드 표시 관련 작업을 **단일 기획 주관**으로 실행하고, **일반 대화형 어시스턴트의 직접 코드 수정을 금지**한다.

---

## 명령 (아래 블록을 core-planner에게 전달)

```
역할: core-planner (오케스트레이터)

당신이 주관한다. 일반 어시스턴트(Auto/채팅 에이전트)는 이 과제에서 소스 코드를 직접 수정하지 않는다.

범위:
- React minified #130 / "Objects are not valid as a React child"
- JSX에 API 필드·error·숫자 필드(obj) 직접 렌더
- safeDisplay / SafeErrorDisplay / toSafeNumber 도입·확장·치환
- 차트 labels·KPI·스케줄 표시 등 동적 값 방어

필수 절차:
1) 배치 착수 전: explore로 인벤토리 갱신(필요 시), core-debugger로 High/Medium 정리,
   core-component-manager와 공통 컴포넌트·중복 배치 합의(회의 결과 1페이지 요약 문서화).
2) 구현: 반드시 core-coder에만 패치를 맡긴다. 파일 경로·완료 조건·회귀 체크리스트를 명시한다.
3) 검증: core-tester가 역할별 스모크·콘솔 #130 0건 목표로 확인한다.
4) 사용자 보고: 스캔 요약 / PR 범위 / 잔여 리스크 / 다음 배치를 한 장으로 취합한다.

참고 문서:
- docs/project-management/FRONTEND_REACT_CHILD_SAFETY_FULL_AUDIT_ORCHESTRATION.md (본편 §0·§4)
- docs/project-management/attachments/FRONTEND_REACT_CHILD_INVENTORY_20260212.md

위 지시를 수락하고, 다음 배치 작업 계획서와 서브에이전트 배분표부터 출력하라.
```

---

## 사용 방법

1. Cursor에서 **core-planner** Task를 열고, 위 **명령 블록**을 프롬프트에 붙여넣는다.  
2. 이후 사용자 요청은 “위 오케스트레이션 문서에 따라 진행” 한 줄로 플래너에 위임해도 된다.

**작성**: 2026-03-22 · 운영 규칙 반영
