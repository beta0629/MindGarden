# D8 PR-B & D5 P1-b 시각 회귀 검수 보고서

> **작성자**: core-tester 서브에이전트
> **작성일**: 2026-05-23
> **목적**: D8 PR-B 단계 1 (mg-* alias 60건 흡수) 및 D5 P1-b 라운드의 광역 시각 회귀 검수 및 운영 게이트 판정.

## 1. 종합 판정
**판정**: ✅ **PASS** (운영 게이트 기준 충족, 치명적 시각 회귀 없음)

## 2. 빌드·테스트·가드 결과
- **운영 게이트 카운트**: 
  - canonical: 458건 (유지)
  - withR2: 741건 (-60건 정확히 감소)
  - rawLine: 1,485건
  - r2Protected: 283건
- **T-D 가드 (`lint:codemod-mappings`)**: ✅ **PASS** (충돌 및 누락 없음, 다크 정의 없는 4건은 D9 이월 정상 인지)
- **프론트엔드 빌드**: ✅ **PASS** (회귀 0건, 정상 번들링)
- **단위 테스트 (ThemeSelector 등)**: ✅ **PASS** (1 Suites, 8 Tests)
- **HARD_EXCLUDE 패턴**: ✅ **유지** (`HARD_EXCLUDE_PATTERNS` / `VAR_FALLBACK_PROTECTION` diff 0줄 확인)

## 3. 검수 영역별 결과 표

| 검수 영역 | 대상 | 시각 영향 및 검증 결과 | 판정 |
| --- | --- | --- | :---: |
| **HIGH** | PG 결제 운영 화면 (`ops/PG`) | 보조 텍스트 `#4b5563` → `#5C6B61` (mossy gray) 톤 시프트 발생. 명도 차이가 미미하며 라이트 모드 가독성(WCAG AA) 충족. 다크 모드 가시성은 동일 유지. | ✅ PASS |
| **MEDIUM** | 어드민 대시보드 편집기 | 위젯 편집 UI 보조 텍스트 라이트·다크 시각 등가성 정상 확인. | ✅ PASS |
| **MEDIUM** | 테넌트 PG 구성 | PG 카드 리스트 및 상세 메타 정보 보조 텍스트 톤 시프트 정상 적용. | ✅ PASS |
| **MEDIUM** | 대시보드 위젯 (공통) | 헤더·캡션 보조 텍스트 톤 시프트 정상 (다크 모드 가시성 대폭 향상됨). | ✅ PASS |
| **MEDIUM** | 공통 코드 관리 | 보조 텍스트 톤 변경 정상 수용됨. | ✅ PASS |
| **LOW** | 기타 5영역 | Consultant Dashboard, Privacy Policy, Atomic 컴포넌트 등 정상 적용 확인. | ✅ PASS |
| **D5 P1-b 사후 검수** | `weekend` 캘린더 `.fc-non-business` | 라이트/다크 톤 차이 미반영 회귀 없음 확인 (0건). | ✅ PASS |
| **D5 P1-b 사후 검수** | 어드민 메인 대시보드 표면 분리 | `surface-main` vs `background-main` 톤 차이 명확성 유지. | ✅ PASS |
| **D5 §1 cascade 확인** | `background-main/muted/sub` 등 | mg-* alias 흡수 시 cascade 간섭 없음, `unified-design-tokens.css` SSOT 변경 0줄 정상 확인. | ✅ PASS |

## 4. 운영 push 권고
**권고**: 🚀 **즉시 push 가능**
- 시맨틱 매칭이 완벽한 SAFE 60건에 대해서만 치환되었으므로 시각 회귀 위험은 낮습니다. 부수적으로 발생한 다크 모드 cascade 적용은 기존의 비가독성을 개선하는 긍정적인 효과(예: `#111827` 검정 → `#E5E5E5` 밝은 회색)를 가져옵니다.

## 5. D9 라운드 권장 후속 작업
본 검수를 통해 확인된 보류 및 미해결 잔여 건에 대한 우선순위는 다음과 같습니다.

1. **HOLD 13건 (시맨틱 시프트) 처리 결정 (P1)**:
   - `--mg-bg-hover` (4건): hover 상태 토큰 신설 vs `background-main` 통합 여부 확정.
   - `--mg-text-tertiary` (3건): `#666` tier 시프트 허용 또는 개별 매핑.
   - `--mg-primary-light` (2건): 브랜드 컬러 패밀리와 info 패밀리간의 분리/통합 결정.
2. **manual-review 77건 매핑 확정 (P1)**:
   - `--mg-primary` + `#4a90e2` (15건): 기존 primary blue에 대한 신설 후보 혹은 통합.
   - `--mg-color-surface-main` + `#f5f3ef` (8건): 따뜻한 표면색을 위한 토큰 신설.
3. **`unified-design-tokens.css` 다크 모드 누락 보완 (P2)**:
   - `lint:codemod-mappings`에서 경고(WARN)가 발생한 4개 토큰(`--mg-color-border-main`, `--mg-color-error`, `--mg-color-info`, `--mg-color-text-secondary`)의 다크 정의 추가.