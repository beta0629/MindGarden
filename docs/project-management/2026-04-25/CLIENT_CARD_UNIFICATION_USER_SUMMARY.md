# 내담자 카드 UI 통일 — 사용자용 한 장 요약

**작성일**: 2026-04-25  
**근거**: `CLIENT_CARD_UNIFICATION_ORCHESTRATION.md` §7, `SCREEN_SPEC_CLIENT_CARD_UNIFICATION_v1.md`, `CLIENT_CARD_UNIFICATION_TEST_MATRIX.md`  
**범위**: B0KlA 관리자 스케줄 · 내담자 선택 모달의 카드 시각·정보 구조 통일(제품 관점 요약)

---

## 1) 한 줄 요약 (제품 관점)

관리자가 B0KlA 스케줄에서 내담자를 고를 때 보는 **카드 목록의 정보 순서·배지·간격·CTA**를 디자인 토큰과 공통 `ClientCard` 패턴에 맞춰 **한 화면 안에서 일관되게 읽히게** 정리했다.

---

## 2) 변경 범위 (파일·영역)

- **`frontend/src/components/ui/Card/ClientCard.js`** — B0KlA 선택 모드용 props(`scheduleClientSelectMode`, `selectDisabled` 등), 표시 경계(`toSafeNumber` / `toDisplayString` 등) 정합.
- **`frontend/src/components/schedule/ClientSelector.js`** — `detailed` 고정 및 위 props 전달 등 소비 패턴 정리.
- **`frontend/src/components/schedule/steps/ClientSelectionStep.js`** 및 **`ClientSelectionStep.css`** — 스텝·모달 내 마크업·스타일 앵커와의 정합.
- **`frontend/src/components/schedule/ScheduleB0KlA.css`** — `.mg-v2-ad-b0kla` 하위 그리드 gap, 카드 패딩·메타 간격, 배지·CTA·`:focus-visible`·disabled 등 스펙 §5~7 반영.
- **설계·검증 문서** — `docs/design-system/SCREEN_SPEC_CLIENT_CARD_UNIFICATION_v1.md`(Revision에 Phase D 반영 기록), `CLIENT_CARD_UNIFICATION_TEST_MATRIX.md`(소비처·시나리오).

---

## 3) 게이트 체크리스트 (`ORCHESTRATION` §7 대응)

| §7 항목 | 상태 | 비고 |
|--------|------|------|
| Phase A 인벤토리가 파일 단위로 H1~H5에 답함 | **완료** | 테스트 매트릭스 §1(소비처 표)·스펙 Revision·구현 경로로 근거 정리됨. (별도 `Phase_A_*.md` 단일 파일은 없을 수 있음.) |
| Phase B 1페이지 제안 있음, Phase D가 정면 위배 없이 구현 | **부분** | Revision에 component-manager 반영 문구 있음. 저장소에 **독립된 B 산출 1페이지 문서 경로**가 없으면 감사 시 **부분**으로 본다. |
| `SCREEN_SPEC_CLIENT_CARD_UNIFICATION_v1.md` 존재·스펙 드리프트 없음 | **완료** | v1 저장·§10 코더 체크리스트 [x]·Revision에 구현 동기화 기술. |
| Phase E **core-tester 통과** (콘솔 0·스모크·회귀 최소) | **미완** | 매트릭스 §4 기준 **대상 브랜치 병합 후** P0 수동 재실행·통과 표가 게이트. **사용자 로컬 검증 필요**(환경·역할·데이터 의존). |
| 사용자용 한 장 요약(변경 범위·잔여 리스크·다음 배치) | **완료** | 본 문서. |

---

## 4) 잔여 리스크 (3개 이내)

1. **`mapping.client` / DTO 스프레드** — 카드에 넘기는 필드가 늘면 JSX 직전 비스칼라·비문자 노출 위험이 다시 생길 수 있음. 표시 경계·화이트리스트 미준수 시 **React #130·콘솔 오류** 회귀 가능.
2. **회귀 범위** — 매트릭스상 공식 회귀 스모크는 `SessionManagement` 중심; 다른 경로의 `ClientCard`·유사 명칭 컴포넌트는 **샘플링 밖 이슈**가 남을 수 있음.
3. **수동 Phase E 미완** — 브라우저·테넌트·데이터 조합에 따른 **ellipsis·스크롤·탭 순서**는 자동화 없이 놓치기 쉬움.

---

## 5) 다음 배치 (선택)

- **ClientSelectionStep / 클라이언트 매핑 DTO 화이트리스트** — 카드로 내려가는 필드를 명시적으로 제한해 표시 경계와 맞춤.
- **Jest** — `ClientCard` / `ClientSelector` / `ClientSelectionStep`에 스냅샷 또는 렌더 스모크(매트릭스 §3: 현재 직접 참조 테스트 없음).
- **E2E** — 관리자 B0KlA 플로우에서 내담자 선택 모달 P0 시나리오(E-B0-01~07 등) 자동화.

---

*본 문서는 요약 전용이며 소스 코드를 수정하지 않는다.*
