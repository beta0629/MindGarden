# 상담사 별 통합데이터 카드 — 뷰별 레이아웃·비주얼 스펙

**참조**: `docs/project-management/CONSULTANT_INTEGRATED_DATA_VIEW_PLAN.md`  
**대상**: 관리자 대시보드 V2 "상담사 별 통합데이터" 카드  
**기준**: B0KlA·MindGarden 어드민 대시보드 샘플, `mindgarden-design-system.pen`, `unified-design-tokens.css`, `AdminDashboardB0KlA.css`  
**산출**: 레이아웃·비주얼 스펙만 (코드 없음)

---

## 1. 카드 전체 레이아웃 (§6 반영)

- **구성 순서**: `[제목·부제]` → `[뷰 전환 UI]` → `[본문: 테이블 | 그래프 | 프로그레스 중 하나]`
- **카드 컨테이너**: 기존 `mg-v2-ad-b0kla__card` 유지 (배경 `var(--ad-b0kla-card-bg)`, 테두리 `var(--ad-b0kla-border)`, border-radius `var(--ad-b0kla-radius)`, 패딩 1.5rem).
- **정보 노출**: 동일 데이터(상위 10명, 순위·상담사명·평점·완료 건수·완료율). 뷰에 따라 강조만 다름.
- **사용성**: 관리자가 한 화면에서 "순위 확인 → 숫자(테이블) / 막대(그래프) / 비율(프로그레스)" 중 선호 뷰로 전환.

---

## 2. 뷰 전환 UI

### 2.1 배치

- **위치**: 카드 상단에서 **제목·부제 아래**, **본문(테이블/그래프/프로그레스 영역) 바로 위**.
- **수직 간격**:
  - 제목(`mg-v2-ad-b0kla__counselor-title`) ~ 부제(`mg-v2-ad-b0kla__counselor-subtitle`): 기존 유지.
  - 부제 ~ 뷰 전환 UI: **12px~16px** (예: `var(--mg-spacing-md)` 또는 1rem).
  - 뷰 전환 UI ~ 본문: **16px~20px** (예: `var(--mg-spacing-lg)`).

### 2.2 형태·비주얼 (B0KlA pill 토글 재사용)

- **컨테이너**: 기존 **pill 토글** 패턴 사용 권장.
  - 클래스: `mg-v2-ad-b0kla__pill-toggle` (또는 동일 스타일 적용).
  - 스타일: 배경 `var(--ad-b0kla-bg)`, 테두리 1px `var(--ad-b0kla-border)`, border-radius 9999px, padding 6px, 내부 gap 6px.
- **선택지**: "테이블" | "그래프" | "프로그레스" 세 개.
- **버튼(또는 탭) 비주얼**:
  - **비선택**: 배경 투명, 텍스트 `var(--ad-b0kla-text-secondary)`, font-size 14px, font-weight 600, padding 12px 20px, min-height 44px, border-radius 9999px. 호버 시 텍스트 `var(--ad-b0kla-title-color)`, 배경 `var(--ad-b0kla-card-bg)`.
  - **선택**: 배경 `var(--ad-b0kla-green)`, 텍스트 #ffffff(또는 `var(--mg-color-surface-main)`), box-shadow `var(--ad-b0kla-shadow)`. 호버 시 동일 유지, 필요 시 brightness(1.05).
- **클래스 참고**: `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` (AdminDashboardB0KlA.css 388~415행).
- **접근성**: 선택된 뷰에 `aria-pressed="true"` 또는 `aria-selected="true"`, 역할에 맞는 라벨. 터치 영역 최소 44px 높이 유지.

### 2.3 데이터 없음 시

- 뷰 전환 UI는 **그대로 노출** (비활성 처리 vs 유지 중 하나로 통일 권장: **유지** — 클릭 시 빈 본문만 보이게 하면 일관됨).
- 본문 empty 문구: 기존 "상담사 통합 데이터가 없습니다." 유지, 클래스 `mg-v2-ad-b0kla__counselor-empty`, `mg-v2-ad-b0kla__integrated-data-empty`.

---

## 3. 테이블 뷰

- **레이아웃**: 기존 `mg-v2-ad-b0kla__integrated-data-wrap` → `_header` + `_list` 구조 유지.
- **컬럼 추가**: 헤더·행 모두 **맨 앞**에 **순위** 컬럼 추가.
  - 순위 표기: "1", "2", … "10" 또는 "1위", "2위" 형태(디스플레이 정책은 기획·코더에서 결정). 스펙상 **숫자만(1~10)** 또는 **숫자+위** 둘 다 허용.
- **컬럼 순서**: **순위 | 상담사명 | 평점 | 완료 건수 | 완료율**.
- **비주얼**: 헤더/셀 텍스트 색상 기존 유지 — 헤더 `var(--ad-b0kla-text-secondary)`, 셀 본문 `var(--ad-b0kla-title-color)` / 숫자·보조 `var(--ad-b0kla-text-secondary)`. 순위 컬럼 너비는 좁게(예: 40~48px 또는 2ch).
- **그리드**: 기존 `grid-template-columns: 1fr auto auto auto` → 순위 추가 시 `auto 1fr auto auto auto` 등으로 확장. gap·padding 기존 유지.

---

## 4. 그래프 뷰

### 4.1 차트 종류·데이터

- **타입**: 막대 그래프(세로 막대). 1차 지표: **완료 건수**(또는 완료율 선택 가능 시 완료 건수 기본).
- **데이터**: 동일 상위 10명, 정렬 순서 = 순위(1~10).

### 4.2 축·라벨

- **X축(가로)**:
  - 항목: 상담사명(또는 상담사명 축약/이니셜 — 공간에 따라). 1~10위 순서대로 왼쪽→오른쪽.
  - 라벨 폰트: Noto Sans KR, 12px, `var(--ad-b0kla-text-secondary)` 또는 `var(--mg-color-text-secondary)`.
  - 회전: 공간 부족 시 45° 등 기존 B0KlA 차트 패턴 따름.
- **Y축(세로)**:
  - 스케일: 완료 건수(또는 완료율 0~100%). 0부터 시작, 적절한 눈금 간격.
  - 라벨: 12px, `var(--ad-b0kla-text-secondary)`.
- **차트 제목/캡션**(선택): "완료 건수 상위 10명" 등 시 차트 상단 또는 좌측 상단, 14px, `var(--ad-b0kla-title-color)`.

### 4.3 막대·색상 (B0KlA·unified-design-tokens)

- **막대 색상**: B0KlA·기존 Chart 패턴 준수. 단일 지표이므로 아래 중 하나 적용 권장.
  - **단일 색**: `var(--ad-b0kla-green)` 또는 `var(--mg-color-primary-main)` (#3D5246 계열). 막대 채우기 전부 동일.
  - **순위별 그라데이션**(선택): 1위가 가장 진하게, 10위가 가장 연하게. 주조색 계열로 `var(--ad-b0kla-green)` / `var(--ad-b0kla-green-bg)` 사이 또는 `var(--mg-success-600)` ~ `var(--mg-success-200)` 활용.
- **막대 형태**: border-radius 4px(상단만 또는 상하 모두). 막대 간 gap 일정(예: 8px).
- **막대 높이**: 값에 비례, Y축 스케일에 맞춤. 최소 높이(값 0이 아닌 경우)는 시인성 위해 4% 등 적용 가능(기존 ConsultantDashboardV2 주간 차트 참고).

### 4.4 순위 표시 (1위~10위)

- **방식**: 각 막대에 **순위 라벨** 노출해 "누가 1위인지" 즉시 인지.
  - **옵션 A**: 막대 **위쪽** 또는 **막대 상단 내부**에 "1위"~"10위" 텍스트. 폰트 11~12px, font-weight 600, `var(--ad-b0kla-title-color)` 또는 막대가 진한 색이면 #fff.
  - **옵션 B**: X축 라벨 앞에 "1."~"10." 접두어로 순위 표기.
- **권장**: 옵션 A(막대 위/내부 "1위"~"10위") — 그래프만 봐도 순위 파악 가능.

### 4.5 컨테이너·레이아웃

- **래퍼**: 카드 본문 영역 내 전용 차트 래퍼. 기존 `mg-v2-ad-b0kla__chart-wrapper`, `mg-v2-ad-b0kla__chart-placeholder` 패턴 참고. min-height 200px, 배경 `var(--ad-b0kla-bg)`, 테두리 `var(--ad-b0kla-border)`, border-radius 16px.
- **기존 클래스 활용**: `mg-v2-chart-*`(unified-design-tokens), `mg-v2-ad-b0kla__chart-*`(B0KlA) 중 Bar 차트용으로 일관되게 적용.

---

## 5. 프로그레스 바 뷰

### 5.1 행 구성

- **한 행 요소**: **순위** | **상담사명** | **완료율 프로그레스 바** | **수치(선택)**.
- **데이터**: 동일 상위 10명, 완료율(0~100%) 기준 시각화. 순위 = 정렬 순서(1~10).

### 5.2 배치 (좌→우)

1. **순위**
   - 위치: 행 **맨 왼쪽**.
   - 표기: "1위"~"10위" 또는 "1"~"10".
   - 폰트: 12px, font-weight 600, `var(--ad-b0kla-title-color)`. 너비 고정(예: 36~44px).

2. **상담사명**
   - 위치: 순위 오른쪽.
   - 폰트: 14px, `var(--ad-b0kla-title-color)`. 잘림 시 말줄임표. 최소 너비 확보.

3. **프로그레스 바**
   - 위치: 상담사명 오른쪽, 가용 공간을 채우며 **flex-grow** 또는 **grid 1fr**.
   - **트랙**: 배경 `var(--ad-b0kla-bg)` 또는 `var(--color-bg-secondary)`(unified-design-tokens), height 24px(또는 20px), border-radius 8px(또는 `var(--ad-b0kla-radius-sm)`).
   - **채우기**: width = 완료율(%), 배경 `var(--ad-b0kla-green)` 또는 `var(--mg-color-primary-main)`, border-radius 동일. transition width 0.3s ease.
   - 기존 클래스 참고: `mg-v2-chart-bar`, `mg-v2-chart-fill`, `--chart-width`, `--chart-color`(unified-design-tokens 15744~15768행).

4. **수치**
   - 위치: 막대 **오른쪽 끝**(행 내).
   - 표기: "85%" 등 완료율 + "%". 보조로 "완료 건수/전체 건수" 텍스트 노출 시 12px, `var(--ad-b0kla-text-secondary)`.
   - 폰트: 14px, font-weight 600, `var(--ad-b0kla-title-color)`.

### 5.3 행 간격·구분

- 행 간 **세로 간격**: 8px~12px(예: `var(--mg-spacing-sm)` ~ `var(--mg-spacing-md)`).
- 구분선: 선택 사항. 사용 시 1px `var(--ad-b0kla-border)`, 마지막 행 제외.

### 5.4 그리드 레이아웃 예시(개념)

- `display: grid`, `grid-template-columns: auto minmax(80px, 1fr) 1fr auto` 등. 순위 | 이름 | 바 | 수치.
- 또는 flex: 순위 고정폭 + 이름 min-width + 바 flex-grow + 수치 고정폭.

### 5.5 접근성

- 프로그레스 바에 `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label`(예: "OOO 상담사 완료율 85%") 제공 권장.

---

## 6. 토큰·클래스 참조 요약

| 용도           | 토큰/클래스 |
|----------------|-------------|
| 카드 배경      | `var(--ad-b0kla-card-bg)` |
| 카드 테두리    | `var(--ad-b0kla-border)` |
| 제목 색        | `var(--ad-b0kla-title-color)` |
| 부제/보조 텍스트 | `var(--ad-b0kla-text-secondary)` |
| 뷰 전환 컨테이너 | `mg-v2-ad-b0kla__pill-toggle` |
| 뷰 전환 버튼   | `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active` |
| 주조/막대·강조 | `var(--ad-b0kla-green)` 또는 `var(--mg-color-primary-main)` |
| 차트 배경/트랙 | `var(--ad-b0kla-bg)` |
| 프로그레스 바 채우기 | `var(--ad-b0kla-green)` 또는 `var(--chart-color, var(--mg-primary-500))` |

---

## 7. 체크리스트 (디자이너·코더 전달용)

- [ ] 카드 구조: 제목·부제 → 뷰 전환 UI → 본문(한 뷰만) 순서 적용
- [ ] 뷰 전환: pill 토글 형태, B0KlA 색·간격·radius 적용, 44px 터치 영역
- [ ] 테이블: 순위 컬럼 맨 앞, 순위|상담사명|평점|완료 건수|완료율
- [ ] 그래프: X=상담사(1~10), Y=완료 건수(또는 완료율), 막대 색 B0KlA·토큰, 순위 라벨(1위~10위) 표시
- [ ] 프로그레스: 행별 순위 | 상담사명 | 완료율 바 | 수치(%), 바 트랙/채우기 토큰
- [ ] 데이터 없음: 뷰 전환은 유지, 본문에만 empty 문구
- [ ] 접근성: aria-pressed/aria-selected, progressbar role·aria-valuenow

---

*본 스펙은 코드를 포함하지 않으며, core-coder는 이 문서와 `CONSULTANT_INTEGRATED_DATA_VIEW_PLAN.md`를 참고하여 구현합니다.*
