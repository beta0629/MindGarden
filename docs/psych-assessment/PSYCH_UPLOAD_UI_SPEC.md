# 심리검사 업로드 영역 UI/UX 스펙

**작성일**: 2026-03-02  
**참조**: `docs/psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md` §6 디자이너 전달 사항  
**적용 대상**: PsychUploadSection (관리 페이지·위젯 공통), B0KlA·unified-design-tokens·PsychUploadSection.css 기반

---

## 1. 업로드 영역 안내 문구 (한글)

아래 문구는 업로드 영역 **내부**에 표시한다. 코더는 기존 `.mg-upload-area` 내부 구조를 유지하고, 문구만 아래 규격으로 교체·추가한다.

### 1.1 메인 안내 (필수)

| 구분 | 문구 | 비고 |
|------|------|------|
| **메인** | PDF 1개 또는 이미지(JPG, PNG) 여러 장을 올려주세요. | 첫 줄. 사용자가 한 번에 이해할 수 있도록 짧게. |
| **순서 안내** | 여러 장 선택 시 선택한 순서대로 처리됩니다. | 두 번째 줄. 이미지 다중 선택 시에 해당. |

- **표시**: 업로드 드롭 영역(`.mg-upload-area`) 내부, 아이콘(또는 “파일을 여기에 놓으세요” 등) 아래.
- **스타일**: 기존 `.mg-upload-area p` 규칙 유지. 색상 `var(--ad-b0kla-text-secondary)` 또는 `var(--mg-color-text-secondary)`, 폰트 14px. 두 문장은 각각 `<p>` 또는 한 `<p>` 내 줄바꿈으로 구분 가능.

### 1.2 형식·용량 제한 문구 (필수)

| 구분 | 문구 | 비고 |
|------|------|------|
| **형식·용량** | 지원 형식: PDF, JPG, PNG / 파일당 최대 50MB | 업로드 영역 내부 맨 아래 또는 바로 아래 블록. |

- **표시**: 메인 안내 문구 바로 아래. 업로드 영역 내부에 두거나, 영역 직하단(같은 섹션 블록 안)에 작은 캡션으로 표시.
- **스타일**: 라벨/캡션용. 12px, `var(--mg-color-text-secondary)` 또는 `var(--ad-b0kla-text-secondary)`.

### 1.3 1건 정책 안내 (PDF와 이미지 혼합 불가)

| 구분 | 문구 | 비고 |
|------|------|------|
| **혼합 불가** | 한 번에 PDF만 또는 이미지만 올려주세요. (PDF와 이미지를 함께 선택할 수 없습니다.) | 에러가 아닌 사전 안내로 표시할 경우 사용. |

- **표시**: 형식·용량 문구와 함께 업로드 영역 내부 또는 직하단. 한 줄로 줄일 수 있으면: “PDF만 또는 이미지만 선택 가능합니다.”
- **선택**: 상단 메인 안내에 “PDF 1개 **또는** 이미지 여러 장”으로 이미 전달되어 있으면, 이 문구는 생략하거나 툴팁/접이식 안내로만 둘 수 있음.

---

## 2. 에러 메시지 목록 (한글)

에러 발생 시 **업로드 영역 바로 아래** 또는 **업로드 영역 내부**에 표시한다. 토스트/알림과 동시에 사용할 경우, 영역 아래 메시지는 “현재 선택/업로드 시도에 대한 오류”로 고정해 두는 것을 권장.

| 코드/상황 | 메시지 문구 | 표시 위치 |
|-----------|-------------|-----------|
| **형식 오류** | PDF 또는 이미지 파일(JPG, PNG)만 업로드할 수 있습니다. | 업로드 영역 직하단 또는 영역 내부 에러 블록 |
| **형식 오류 (간단)** | 지원하지 않는 파일 형식입니다. PDF, JPG, PNG만 가능합니다. | 동일 |
| **크기 초과** | 파일 크기가 제한을 초과합니다. 파일당 최대 50MB까지 가능합니다. | 동일 |
| **크기 초과 (간단)** | 파일 크기가 50MB를 초과했습니다. | 동일 |
| **파일명 오류** | 허용되지 않은 파일 이름입니다. 특수문자나 경로가 포함되지 않았는지 확인해 주세요. | 동일 |
| **혼합 선택 (PDF+이미지)** | 한 건에는 PDF만 또는 이미지만 올릴 수 있습니다. PDF와 이미지를 함께 선택하지 마세요. | 동일 |
| **PDF 다중 선택** | PDF는 1개만 선택할 수 있습니다. | 동일 |
| **선택 없음 / 빈 전송** | 업로드할 파일을 선택해 주세요. | 동일 |
| **기타/서버 에러** | 업로드 중 오류가 발생했습니다. 다시 시도해 주세요. | 동일 또는 토스트 |

- **스타일**: 에러 문구 영역은 `var(--mg-color-error-500)` 또는 `var(--cs-error-500)` 계열로 강조. 폰트 14px 또는 12px. 기존 `.mg-v2-psych-upload-section__hint` 아래에 `.mg-v2-psych-upload-section__error` 등 전용 블록을 두어, 에러 시에만 노출하도록 구현 가능.

---

## 3. 레이아웃·위치 설명

- **전제**: 기존 업로드 영역(드래그앤드롭 + 파일 선택 버튼) 레이아웃은 유지. `PsychUploadSection.css`의 `.mg-v2-psych-upload-section`, `.mg-upload-area`, `.mg-v2-psych-upload-section__body`, `__form-row` 구조를 따른다.

| 요소 | 위치 | 설명 |
|------|------|------|
| **드롭 영역** | 기존과 동일 | `.mg-upload-area`. dashed 테두리, 배경 `var(--ad-b0kla-card-bg)` / `var(--mg-color-surface-main)`, radius 12px. 드래그 오버 시 `.mg-upload-area--drag-over` 적용. |
| **메인 안내 문구** | 드롭 영역 **내부** | 아이콘(또는 “파일을 여기에 놓으세요”) 아래, 세로 중앙. 문구 2줄: “PDF 1개 또는 이미지(JPG, PNG) 여러 장을 올려주세요.” / “여러 장 선택 시 선택한 순서대로 처리됩니다.” |
| **형식·용량 문구** | 드롭 영역 **내부** 맨 아래 또는 **직하단** | “지원 형식: PDF, JPG, PNG / 파일당 최대 50MB”. 영역 내부면 메인 안내와 gap 0.5rem 유지; 직하단이면 `.mg-upload-area` 다음에 작은 캡션 블록. |
| **파일 선택 버튼** | 기존과 동일 | `__form-row` 내 input[type=file] 또는 버튼+input. 라벨 문구는 기획과 일치하도록 “파일 선택” 등 유지. |
| **에러 메시지** | 업로드 영역 **바로 아래** | `.mg-upload-area` 또는 `.mg-v2-psych-upload-section__body` 직하단. 한 줄 영역으로, 에러 시에만 표시. 여러 에러가 있으면 하나로 요약하거나 첫 번째 에러 메시지 표시. |
| **섹션 헤더** | 기존과 동일 | `.mg-v2-psych-upload-section__header`. 좌측 4px 악센트 바 `var(--ad-b0kla-green)`, 제목 1.125rem, 700. |

- **반응형**: 기존 PsychUploadSection·B0KlA 기준 유지. 모바일에서 터치 영역 44px 이상, 패딩·gap은 기존 CSS 변수(`--mg-layout-gap` 등) 준수.

---

## 4. 선택 시 피드백 문구 (PDF vs 이미지 여러 장)

파일 선택 직후(업로드 버튼 누르기 전) 사용자에게 “무엇이 선택되었는지” 알려주는 문구. 업로드 영역 **직하단** 또는 **form-row 옆**에 표시.

| 상황 | 피드백 문구 |
|------|-------------|
| **PDF 1개 선택** | PDF 1개가 선택되었습니다. |
| **이미지 1장 선택** | 이미지 1장이 선택되었습니다. |
| **이미지 N장 선택** | 이미지 N장이 선택되었습니다. 선택한 순서대로 처리됩니다. (N은 실제 개수) |

- **스타일**: 안내와 구분되도록 `var(--mg-color-text-main)` 또는 `var(--ad-b0kla-title-color)`, 14px. 에러가 있을 때는 이 피드백을 숨기고 에러 메시지만 표시하는 것을 권장.

---

## 5. 참조 스타일·토큰 (코더 구현용)

- **색상**: `var(--mg-color-text-secondary)`, `var(--mg-color-text-main)`, `var(--mg-color-border-main)`, `var(--mg-color-surface-main)`, `var(--mg-color-primary-main)`, `var(--mg-error-500)` 또는 `var(--cs-error-500)`. B0KlA 사용 시 `var(--ad-b0kla-text-secondary)`, `var(--ad-b0kla-title-color)`, `var(--ad-b0kla-border)`, `var(--ad-b0kla-card-bg)`, `var(--ad-b0kla-green)`.
- **간격·radius**: `var(--mg-layout-gap)`, `var(--ad-b0kla-radius-sm)` (12px). 업로드 영역 padding 2rem, 내부 gap 0.5rem 유지.
- **클래스**: `.mg-upload-area`, `.mg-upload-area--drag-over`, `.mg-v2-psych-upload-section`, `.mg-v2-psych-upload-section__header`, `__body`, `__form-row`, `__hint`. 에러용으로 `.mg-v2-psych-upload-section__error` 추가 권장.
- **타이포**: Noto Sans KR. 제목 1.125rem/700, 본문/안내 14px, 캡션/형식·용량 12px.

---

## 6. 체크리스트 (구현 완료 시)

- [ ] 메인 안내 2줄(PDF/이미지 + 순서) 업로드 영역 내부에 표시
- [ ] 형식·용량 문구(지원 형식: PDF, JPG, PNG / 파일당 최대 50MB) 표시
- [ ] 에러 메시지는 업로드 영역 직하단(또는 내부)에 명확히 표시
- [ ] 형식 오류·크기 초과·파일명 오류·혼합 선택·PDF 다중 선택 등 위 목록과 동일 문구 사용
- [ ] (선택) PDF 1개 / 이미지 N장 선택 시 피드백 문구 표시
- [ ] B0KlA·PsychUploadSection.css·unified-design-tokens 토큰/클래스 사용, 레이아웃 기존 구조 유지
