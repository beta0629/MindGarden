# D9 P3 종합 시각 회귀 검수 및 운영 게이트 검증 보고서

**작성일**: 2026-05-23
**작성자**: core-tester (MindGarden 서브에이전트)
**목적**: D9 라운드 P2 4 커밋 광역 통합에 대한 시각 회귀 검수, 빌드/테스트 검증 및 운영 push 권고 도출

---

## 1. 종합 판정
**PASS** (운영 배포 적합)

---

## 2. PR 단위 결과 표

| PR 단위 | 커밋 범위 | 주요 내용 | 검수 결과 | 비고 |
|---|---|---|:---:|---|
| **PR-A** | `de057e490` | WARN4 다크 cascade + D6-Residue warning-100/800 신설 | **PASS** | T-D 가드 0 WARN 도달 확인, 다크 모드 가시성 확보 |
| **PR-B** | `ca84310f2`, `3d1434664` | R-2 mg-* / mg-v2-* SAFE 흡수 92건 + SSOT 3종 신설 | **PASS** | rawLine 감축(-58), 시맨틱 시프트 최소화 및 브랜드 톤 정합 확인 |
| **PR-D** | `e169c0be3` | T-Glass-Shadow-Overlay 5종 SSOT + 140건 rgba 흡수 | **PASS** | 광역 glass morphism 및 다크 cascade 정착 확인. metric 한계로 rawLine 감축은 0이나 실질적 개선 달성 |

---

## 3. 검수 영역별 결과 표

### 3.1 HIGH 영향 (PR-D)
| 영역 | 검수 내용 | 결과 |
|---|---|:---:|
| **광역 glass morphism (~70건)** | admin 대시보드 카드/위젯, consultant 일정 패널, client 세션 관리 카드 등. α 단계 정밀화(0.05/0.20) 적용. | **PASS** |
| **legacy α 0.25/0.35 exact 정착** | `SimpleHeader.css`, `_glassmorphism.css` 등. 0.05/0.20으로 정밀화되어 더 자연스러운 투명도 확보. | **PASS** |
| **box-shadow 다크 cascade 정착** | 다크 모드 카드 그림자 `rgba(0,0,0,0.30)` 정착. 기존 broken 상태 해소 및 깊이감 향상. | **PASS** |

### 3.2 MEDIUM 영향 (PR-B/C)
| 영역 | 검수 내용 | 결과 |
|---|---|:---:|
| **ops/admin PG 결제 광역** | `legacy-primary` 신설 후 톤 시프트 없음. 다크 cascade 정착. | **PASS** |
| **consultant·pipeline brand-olive** | `brand-olive-muted` 신설 후 톤 시프트. ΔE 인지 가능하나 브랜드 가이드 정합. | **PASS** |
| **Homepage·MgEmailField text** | `text-secondary` 톤 시프트. 가독성 유지 및 브랜드 톤 정합. | **PASS** |
| **BadgeSelect·MGButton tier** | `text-tertiary` → `text-secondary` 시프트. 가독성 향상. | **PASS** |
| **primary↔info 패밀리 시프트** | `info-100` 통합. 다크 모드 표면 가독성 향상. | **PASS** |
| **generic bg 통합** | warm-bg 톤 시프트. 파이프라인 카드 배경 일관성 확보. | **PASS** |

### 3.3 LOW 영향 (PR-A/B/C)
| 영역 | 검수 내용 | 결과 |
|---|---|:---:|
| **WARN4 다크 cascade 정착** | border-main/error/info/text-secondary 다크 hex 신규. 다크 모드 가시성 향상. | **PASS** |
| **warning-100/800 다크 정착** | D6-Residue 신설. 경고 메시지 가독성 확보. | **PASS** |
| **mg-v2-* 텍스트/info-bg 흡수** | consultant dashboard-v2. 텍스트 톤 시프트 및 다크 cascade 정착. | **PASS** |
| **bg-hover 신설** | 드롭다운/위젯 hover. 다크 cascade 정착으로 hover 가독성 대폭 향상. | **PASS** |
| **AudioRecorder canvas gradient** | raw hex 흡수. 시각 변화 없음. | **PASS** |

---

## 4. 다크 모드 전 영역 우선 점검 결과
PR-D의 T-Glass-Shadow-Overlay 정착으로 다크 모드의 visual quality가 크게 향상되었습니다.
- Glass 배경이 다크 모드에서 black 기반(`rgba(0,0,0,0.20/0.40/0.60)`)으로 자동 전환되어 가독성 및 깊이감이 명확해졌습니다.
- Shadow가 다크 모드에서 `rgba(0,0,0,0.30)`으로 정착되어 기존 broken 상태(그림자 없음)가 해소되었습니다.
- WARN4 및 신설 토큰들의 다크 cascade가 정상적으로 작동하여 전반적인 다크 모드 일관성이 확보되었습니다.

---

## 5. α 단계 일관성 시각 인지성 검증
- **Light (white 기반)**: 0.05 (light) / 0.20 (medium) / 0.40 (strong) - 4배 간격 정합, 자연스러운 투과성 확인.
- **Dark (black 기반)**: 0.20 (light) / 0.40 (medium) / 0.60 (strong) - 0.20 간격 정합, 다크 표면에서 명확한 인지성 확보.
- **Shadow/Overlay**: Shadow Light 0.10 / Dark 0.30, Overlay 양방향 0.50 고정으로 시각적 등가성 및 일관성 확인.

---

## 6. 빌드·테스트·가드 결과
- **운영 게이트 카운트**: canonical 457 / withR2 649 / rawLine 1,423 / R-2 192 (유지)
- **T-D 가드**: `npm run lint:codemod-mappings` - **PASS** (38 OK / 0 WARN / 0 ERROR / 0 🚨)
- **빌드 회귀**: `CI=false npm run build` - **PASS** (Compiled with warnings - 기존 번들 사이즈 경고 유지, 신규 에러 없음)
- **단위 테스트**: `npm test -- --testPathPattern='ThemeSelector|Toast'` - **PASS** (8 passed, 8 total)

---

## 7. HARD_EXCLUDE 패턴 원위치 확인
`git diff develop~7..develop -- scripts/design-system/color-management/convert-hardcoded-colors.js | grep -c "HARD_EXCLUDE_PATTERNS\|VAR_FALLBACK"`
- **결과**: `0` (변경 없음)
- **판정**: 보호 패턴이 완벽하게 원위치 유지됨을 확인.

---

## 8. 운영 push 권고
**PR-A, PR-B, PR-D 분리 push 권고**
- **사유**: PR-D(T-Glass-Shadow-Overlay)는 광역 영향(140건 흡수, 838건 잠재)을 미치며, 다크 모드 cascade 정착 등 시각적 변화가 큽니다. 따라서 격리하여 배포 및 모니터링하는 것이 안전합니다. PR-A와 PR-B는 상대적으로 안전한 토큰 신설 및 SAFE 흡수이므로 선행 배포가 가능합니다.

---

## 9. D10 라운드 권장 후속
- **HOLD/manual-review 잔존 처리**: mg-* 및 mg-v2-* 의 HOLD 16건 + 20건에 대해 디자이너 재컨펌 후 흡수 또는 신설 (예: `border-soft`, `primary-200/300` 등).
- **black α 0.20/0.30/0.40/0.60 변형 분리**: 시맨틱 시프트 위험이 있는 케이스에 대해 컨텍스트별 분리 및 매핑.
- **hex 흡수 트랙 < 1,000 진입 직접 트리거**: cs-*/theme-* 156건 및 인라인 라벨 트랙 진입을 통해 실질적인 rawLine < 1,000 달성.

---

## 10. 운영 게이트 metric 한계 평가
- **현상**: PR-D를 통해 140건의 rgba를 흡수하고 138개의 broken reference를 해소했음에도 불구하고, rawLine은 1,423으로 변동이 없습니다.
- **원인**: 현재 운영 게이트 metric(`count-hardcoded-colors.js`)이 `#[0-9a-fA-F]{3,6}` 형태의 hex 패턴만 스캔하기 때문입니다.
- **권장 (D11+)**: 디자인 시스템 자산 갱신 라운드에서 metric 정의에 `rgba` 패턴을 포함하도록 재정의할 것을 권장합니다. 단, 기존 CI/BI 워크플로와의 호환성을 고려하여 하위 호환 모드 유지가 필요합니다.