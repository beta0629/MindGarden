# MindGarden 프론트 — 공통 표시 경계(React #130) 구조 개선 회의 결과

**일자**: 2026-03-22 · **주관**: core-component-manager · **실행·합의**: core-coder, core-planner, core-tester  
**배경**: API 필드를 JSX에 직접 넣는 패턴 확산으로 React 오류 #130(객체를 자식으로 렌더)가 다화면에서 반복됨. `safeDisplay.js`, `SafeErrorDisplay`, `ContentKpiRow.safeKpiChild`, 일부 차트/스케줄 보강이 이미 존재함.

---

## 1. 결론 요약

| 안건 | 결론 |
|------|------|
| **(A) 표시 경계** | **둘 다(분층)** 권고. **① 데이터 경계(선택·도메인별)**: fetch/mapper에서 스CALAR·DTO로 좁히기. **② 렌더 경계(필수·전역)**: JSX로 나가기 직전에는 스칼라·안전 자식만 두고, 알고리즘 **SSOT**는 `frontend/src/utils/safeDisplay.js` 로 고정. Atom **`SafeText`**(가칭) 또는 **`DisplayString` 래퍼**는 `toDisplayString`의 얇은 뷰 계층으로만 둔다. 수치는 **`toSafeNumber`** / **`SafeStatValue`·`SafePercent`** 등 Molecule. 오류는 **`toErrorMessage` + `SafeErrorDisplay`**. |
| **(B) 코어 Atom/Molecule** | 1) Atom **`SafeText`** — 한 줄, 내부 `toDisplayString`만. 2) **`SafeNumeric`**(가칭) — 카운트/퍼센트, 내부 `toSafeNumber` + 표준 포맷. 3) **`CustomSelect`** — 현재 `toDisplayString` 유지, 문서로 “라벨 경로” 명시. 4) **차트** — 어댑터에서 라벨·툴팁 문자열 `toDisplayString`. 5) **배지 숫자** — `NotificationBadge`의 `toSafeNumber` 패턴을 **코어 규칙**으로 문서화. |
| **(C) core-coder 규칙 5줄** | ① JSX에 API 원본 필드를 직접 넣지 않는다. ② 임의 `String(x)`/`JSON.stringify` 산발 금지 — 텍스트 `toDisplayString`, 수치 `toSafeNumber`, 에러 `toErrorMessage`/`SafeErrorDisplay`. ③ 로컬 `safeXxx` 신규 금지 — Atom/`safeDisplay` 통일(`safeKpiChild`는 점진 흡수). ④ 도메인 mapper는 중첩 제거, 렌더 안전은 코어 책임(이중 방어 허용). ⑤ 차트·셀렉트·스케줄은 **진입 어댑터**에서 라벨·수치 정규화. |
| **(D) core-planner 배치** | **Phase 1** SSOT·문서 편입. **Phase 2** `SafeText`(±`SafeNumeric`) + export 경로 합의. **Phase 3** #130 고발 화면 치환. **Phase 4** 기존 컴포넌트는 내부 유틸 유지, 외부 호출만 점검. **Phase 5** core-tester 회귀. |

---

## 2. SSOT · 중복 방지

- **SSOT(알고리즘)**: `safeDisplay.js` — 임의 새 헬퍼 파일 확산 금지; 확장은 동일 파일 또는 명시 서브모듈.
- **`StatCard`, `CustomSelect`, `ScheduleHeader`, `ScheduleLegend`**: 이미 `toDisplayString` 사용 중 → **충돌 없음**; 향후 **`SafeText`로 치환** 가능.
- **`Badge` vs 숫자**: 스타일은 `Badge`, 수치 정규화 로직은 SSOT 단일 호출.
- **`ContentKpiRow.safeKpiChild`**: 장기 **`SafeText`로 흡수**.
- **`Chart`/`MGChart`**: 라벨·툴팁은 **차트 전용 어댑터** 한 곳에서 정규화.

---

## 3. 액션 아이템

| # | 액션 | 담당 |
|---|------|------|
| 1 | `safeDisplay`·Atom 표준 문서화·코더 규칙 반영 | component-manager(초안) → core-coder(PR) |
| 2 | `SafeText` / `SafeNumeric` 도입·아토믹 경로 결정 | core-coder (+ planner 승인) |
| 3 | #130 우선 치환 PR 분할 | core-planner + core-coder |
| 4 | 대시보드·ERP·알림·스케줄 스모크 | core-tester |
| 5 | 인벤토리 “표시 경계” 절 갱신 | component-manager |

---

## 4. 리스크

- `toDisplayString`의 객체 → JSON 노출·민감 정보 UX — mapper·대체 문구 정책 병행.
- `toSafeNumber` 후 로케일/통화 포맷 분산 — **포맷 SSOT** 한 단계 유지.
- ESLint 미도입 시 재유입 — 제한적 린트 또는 리뷰 체크리스트(planner).

---

## 5. 다음 회의

- **조건부**: Atom **디렉터리·이름**(`SafeText` vs `DisplayString`) 및 **숫자 포맷 SSOT 위치** 이견 시 **짧은 결정 회의**.

---

*코드 변경은 core-coder에게 위임한다. 본 문서는 core-component-manager 회의 산출물이다.*
