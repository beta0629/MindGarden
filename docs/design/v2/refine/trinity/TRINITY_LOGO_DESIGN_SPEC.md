# Trinity Logo Design Spec

## 1. 브랜드 포지셔닝 (Brand Positioning)
Trinity는 **회사(법인, 운영 주체)**를 나타내며, Core Solution은 **제품(B2B SaaS)** 브랜드를 나타냅니다.
두 로고는 명확히 구분되어야 하며, 혼동을 유발하지 않아야 합니다.

*   **Trinity**: 신뢰, 기업, 근간, 안정성 (법적 주체, 온보딩 헤더/푸터 적용)
*   **Core Solution**: 제품, 혁신, 해결책 (MindGarden 모티프, 블랙홀/그록 슬래시 활용)

### 제약 사항 (Constraints)
*   **금지**: MindGarden 모티프 사용 금지, Core Solution 전용 심볼(블랙홀 링, 그록 슬래시, 쎄타) 재사용 금지
*   **톤앤매너**: Enterprise B2B SaaS에 걸맞는 전문적이고 무게감 있는 톤 (장난스럽거나 과도한 그라데이션 지양)

---

## 2. 최종 확정 로고 (Selected Concept)
사용자 피드백을 거쳐 **F1 (Horizontal rule + typographic lockup)** 컨셉이 최종 확정되었습니다.

### F1. Horizontal rule + typographic lockup
*   **키워드**: 정제됨, 신뢰, 무게감
*   **설명**: 얇은 가로선(Rule)과 자간을 넓게 배치한 `TRINITY` 워드마크의 조합. B2B 기업의 근간과 안정성을 강조합니다.

### 최종 프로덕션 자산 (Production Assets)
파일 위치: `docs/design/v2/refine/trinity/assets/final/`

| 용도 | 파일명 | 설명 |
| :--- | :--- | :--- |
| **Primary** | `trinity-logo-primary.svg` | 밝은 배경용 기본 로고 (Dark Navy 텍스트 `#0A1628`) |
| **Inverse** | `trinity-logo-inverse.svg` | 어두운 배경용 반전 로고 (White 텍스트 `#FAF9F7`, 온보딩 패널용) |
| **Icon** | `trinity-logo-icon.svg` | 파비콘 및 좁은 영역용 축약 아이콘 (Rule + T) |

### 디자인 스펙 (Design Specifications)
*   **색상 (Colors)**:
    *   Dark Navy (Primary Text): `#0A1628`
    *   White (Inverse Text): `#FAF9F7`
    *   Accent Gold/Brown (Rule): `#8B7355`
*   **타이포그래피 (Typography)**: `Helvetica Neue`, `Helvetica`, `Arial`, `sans-serif` (Light/300 weight, wide tracking `0.45em`)
*   **최소 크기 (Minimum Size)**:
    *   워드마크 포함 로고: 넓이 120px
    *   아이콘(파비콘): 32x32px
*   **여백 (Clear Space)**: 로고 높이의 50%를 상하좌우 최소 여백으로 확보할 것.

---

## 3. 프론트엔드 연동 가이드 (Frontend Integration Guide)
`frontend-trinity` 코드베이스에 로고를 적용하기 위한 핸드오프 가이드입니다.

*   **자산 이동 경로**:
    *   `docs/design/v2/refine/trinity/assets/final/*.svg` 파일을 `frontend-trinity/public/assets/` 디렉토리로 복사합니다.
*   **적용 위치**:
    *   **온보딩 사이드 패널**: `frontend-trinity` 온보딩 화면의 좌측 40% Dark Panel (`--trinity-v2-panel-bg` 계열). `trinity-logo-inverse.svg` 사용.
    *   **GNB / 글로벌 헤더**: 밝은 배경의 헤더 영역. `trinity-logo-primary.svg` 사용.
    *   **파비콘**: `public/favicon.ico` 또는 메타 태그. `trinity-logo-icon.svg` 사용.
*   **상수 확인**: `frontend-trinity/constants/trinity.ts` 내 `COMPANY.NAME = 'Trinity'` 확인.

---

## 4. 이전 이터레이션 (Archived Concepts)

| 버전 | 컨셉 | 상태 | 사유 |
| :--- | :--- | :--- | :--- |
| **v3** | F2. Negative space mark | Rejected | F1의 정제된 형태가 더 적합함 |
| **v3** | F3. Stacked lockup | Rejected | F1의 가로형 락업이 더 범용적임 |
| **v2** | E1. Refined Wordmark | Rejected | 너무 일반적이고 밋밋함 |
| **v2** | E2. Abstract Knot / Link | Rejected | 클리셰적인 형태 |
| **v2** | E3. Portal Frame | Rejected | 직관성이 떨어짐 |
| **v1** | A, B, C, D | Rejected | B2B SaaS 온보딩 맥락에 부족함 |
