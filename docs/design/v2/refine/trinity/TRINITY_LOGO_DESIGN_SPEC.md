# Trinity (e-trinity) Logo Design Spec

## 1. 브랜드 포지셔닝 (Brand Positioning)
Trinity는 **회사(법인, 운영 주체)**를 나타내며, Core Solution은 **제품(B2B SaaS)** 브랜드를 나타냅니다.
두 로고는 명확히 구분되어야 하며, 혼동을 유발하지 않아야 합니다.

*   **Trinity**: 신뢰, 기업, 근간, 안정성 (법적 주체, 온보딩 헤더/푸터 적용)
*   **Core Solution**: 제품, 혁신, 해결책 (MindGarden 모티프, 블랙홀/그록 슬래시 활용)

### 제약 사항 (Constraints)
*   **금지**: MindGarden 모티프 사용 금지, Core Solution 전용 심볼(블랙홀 링, 그록 슬래시, 쎄타) 재사용 금지
*   **톤앤매너**: Enterprise B2B SaaS에 걸맞는 전문적이고 무게감 있는 톤 (장난스럽거나 과도한 그라데이션 지양)

---

## 2. 디자인 적용 범위 (Application)
*   **온보딩 사이드 패널**: `frontend-trinity` 온보딩 화면의 좌측 40% Dark Panel (Navy: `--trinity-v2-panel-bg` 계열). 로고 슬롯(높이 72px 영역 내)에 배치.
*   **법적 표기 영역**: 약관 화면, 글로벌 푸터 등.
*   **파비콘(Favicon)**: 32x32px 최소 크기, 앱 아이콘 용도.

---

## 3. 컬러 팔레트 (Color Palette)
Trinity의 기본 팔레트는 신뢰를 주는 Navy/Slate 기반으로 구성됩니다.

| 형태 | 배경색 (Background) | 심볼/워드마크 색상 | 비고 |
| :--- | :--- | :--- | :--- |
| **Dark Theme** | Dark Navy (`#1A2233`) | White (`#FAF9F7`), Primary Green (`#3D5246`) | 온보딩 좌측 패널용 |
| **Light Theme** | White (`#FAF9F7`) | Dark Navy (`#1A2233`), Primary Green (`#3D5246`) | 서류, 약관, 푸터용 |
| **Monochrome** | Any | Black or White | 워터마크, 흑백 인쇄용 |

---

## 4. 로고 컨셉 (4가지 방향성)

### A. Trinity Triad (기하학적 3원소)
*   **키워드**: 균형, 테넌트, 연결, 성장
*   **설명**: 3개의 기하학적 요소(원 혹은 삼각형)를 배치하여 'Trinity(삼위일체)'의 의미를 내포함과 동시에, 기업과 고객이 연결되는 Enterprise 구조를 단순화하여 표현합니다.
*   **자산**: `assets/trinity-logo-concept-a-triad.svg`

### B. Enterprise Wordmark (세련된 타이포그래피)
*   **키워드**: 신뢰성, 미니멀, 플랫폼
*   **설명**: 불필요한 심볼을 제거하고 "e-trinity"라는 글자 자체를 세련된 Sans-serif로 디자인합니다. 철자 'i'의 점들을 미세한 선으로 연결해 네트워크(플랫폼) 속성을 은유합니다.
*   **자산**: `assets/trinity-logo-concept-b-wordmark.svg`

### C. Gateway Mark (아치/문형 메타포)
*   **키워드**: 입구, 온보딩, 환영
*   **설명**: B2B SaaS의 '온보딩(입구)'을 나타내는 아치(Arch) 형태의 심볼을 활용해, 고객이 시스템에 진입하는 게이트웨이를 은유합니다.
*   **자산**: `assets/trinity-logo-concept-c-gateway.svg`

### D. Monogram eT (파비콘 최적화)
*   **키워드**: 실용성, 파비콘, 앱 아이콘
*   **설명**: 둥근 사각형 기반 안에 소문자 'e'와 대문자 'T'를 결합한 모노그램으로, 32x32 이하의 작은 해상도(파비콘)에서도 가독성이 무너지지 않는 실용적 형태입니다.
*   **자산**: `assets/trinity-logo-concept-d-monogram.svg`

---

## 5. Mockup / 시뮬레이션
*   **목업 에셋**: `/Users/mind/.cursor/projects/Users-mind-mindGarden/assets/trinity-onboarding-mockup.png`
*   **설명**: 온보딩 40/60 Split 화면 (좌측 Dark Navy)에 Trinity 로고가 상단에 배치되었을 때의 UI/UX 시각적 대비를 확인하기 위한 목업입니다.

---

## 6. 다음 단계 (Next Steps)
사용자(기획/이해관계자)의 컨셉 선택 대기:
*   [ ] 컨셉 A (Triad)
*   [ ] 컨셉 B (Wordmark)
*   [ ] 컨셉 C (Gateway)
*   [ ] 컨셉 D (Monogram)

선택된 컨셉을 바탕으로 SVG 스펙을 확정하고, `frontend-trinity` 코드베이스(Phase 2)에 실제 반영을 위한 에셋 추출을 진행합니다.
