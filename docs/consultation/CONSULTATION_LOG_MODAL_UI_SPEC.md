# 상담일지 작성 — 큰 모달(Large/XL) UI/UX 스펙

**버전**: 1.0.0  
**작성**: core-designer  
**참조**: CONSULTATION_LOG_LARGE_MODAL_PLAN.md, PENCIL_DESIGN_GUIDE.md, 어드민 대시보드 샘플  
**산출 목적**: 코더가 추측 없이 구현할 수 있는 블록·토큰·반응형 요구 명시 (코드 작성 없음)

---

## 1. 개요

### 1.1 목표

- 상담일지 작성 기능을 **큰 모달(Large/XL)** 하나로 통일한다.
- 스케줄에서 "상담일지 작성" 클릭 시 **한 화면**에서 내담자 정보 확인과 일지 작성이 가능하다.
- **상단 블록**(내담자 정보·중요 코멘트·심리검사)은 스크롤 시에도 인지 가능하도록 배치한다.

### 1.2 적용 대상

- **ConsultationLogModal**: 스케줄 → 상담일지 작성으로 열리는 모달.
- 진입: `UnifiedScheduleComponent` → `ScheduleDetailModal` → `onConsultationLogOpen(scheduleData)` → ConsultationLogModal.
- 역할: CONSULTANT(상담사) 중심. ADMIN 재사용 시 동일 레이아웃.

### 1.3 디자인 기준

- **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`
- **비주얼 언어**: B0KlA 팔레트·섹션 블록·타이포·어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)과 동일 톤

---

## 2. 모달 기본 사양

### 2.1 크기·컨테이너

| 항목 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 모달 크기 | **Large** 고정. 콘텐츠가 많을 경우 **XL** 옵션 검토(UnifiedModal 확장 시) | `UnifiedModal` `size="large"` (또는 `"xl"`) |
| 클래스 | B0KlA 어드민 스타일 적용 | `className="mg-v2-ad-b0kla"` |
| 본문 배경 | 메인 배경과 동일 | `var(--mg-color-background-main)` 또는 `#FAF9F7` |
| 본문 패딩 | 상·하·좌우 일관 | 24px (데스크톱), `--mg-spacing-lg` 또는 24px |

### 2.2 스크롤·고정 영역

- **모달 본문**: 세로 스크롤 가능. 전체 높이는 뷰포트에 맞춤(예: max-height: 85vh).
- **상단 고정(Sticky) 영역**: 아래 순서의 블록들을 **모달 본문 상단에 배치**하고, **스크롤 시 상단에 고정(sticky)** 하여 항상 보이도록 한다.
  - 구현 옵션: (A) 상단 블록들을 하나의 wrapper로 묶고 `position: sticky; top: 0; z-index: 1; background: var(--mg-color-background-main);` 적용.  
  - 또는 (B) 모달 구조를 "헤더(고정) + 스크롤 영역"으로 나누어, 헤더 영역에 내담자·중요 코멘트·심리검사를 넣고, 스크롤 영역에만 일지 폼을 넣는다.
- **스크롤 영역**: 일지 작성 폼 + (하단) 액션 버튼. 액션 버튼은 모달 푸터에 고정(UnifiedModal `actions` prop)하여 스크롤과 무관하게 항상 노출.

---

## 3. 레이아웃 구조(블록 순서)

아래 순서를 **반드시** 준수한다.

1. **내담자 프로필 요약** (섹션 블록)
2. **중요 코멘트** (강조 블록 — 시각적으로 구분)
3. **심리검사** (있을 때만, 섹션 블록)
4. **(스크롤) 상담일지 작성 폼** (섹션 블록)
5. **액션 버튼** (모달 푸터 고정 — 취소, 저장, 완료)

---

## 4. 블록별 상세 스펙

### 4.1 내담자 프로필 요약

**역할**: 상담사가 상담 전/중에 한눈에 볼 수 있는 내담자 기본 정보.

**레이아웃**

- 하나의 **섹션 블록**으로 감싼다.
- **섹션 제목**: 왼쪽 **세로 악센트 바** (폭 4px, 주조색, radius 2px) + 제목 텍스트.
- **내부**: 그리드 또는 플렉스로 항목 배치. 라벨(캡션)·값 구분.

**디자인 토큰**

| 요소 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 블록 배경 | 서페이스 | `var(--mg-color-surface-main)` (#F5F3EF) |
| 블록 테두리 | 1px | `var(--mg-color-border-main)` (#D4CFC8), border-radius 16px |
| 블록 패딩 | 24px | `--mg-spacing-lg` 또는 24px |
| 섹션 제목 악센트 바 | 폭 4px, 주조색 | `var(--mg-color-primary-main)` (#3D5246), border-radius 2px |
| 섹션 제목 텍스트 | 16px, 굵게 | `var(--mg-color-text-main)`, font-weight 600 |
| 라벨(캡션) | 12px, 보조 텍스트 | `var(--mg-color-text-secondary)` (#5C6B61) |
| 값 텍스트 | 14px | `var(--mg-color-text-main)` (#2C2C2C) |

**노출 필드(우선순위 순)**

- 이름, 연락처(전화·이메일), 성별, 등급/상태, 메모(notes) 요약(1~2줄 말줄임 가능), 주소 요약, 매칭·패키지 요약.
- 데이터 소스: `GET /api/v1/admin/clients/with-stats/{clientId}` → client, User(memo, notes) 등.

**그리드**

- 데스크톱: 2~4열 그리드, gap 16px.  
- 태블릿 이하: 2열 또는 1열.  
- 클래스 예: `mg-v2-card`, `mg-grid`, `mg-grid-cols-2`(또는 `repeat(auto-fit, minmax(200px, 1fr))`).

---

### 4.2 중요 코멘트

**역할**: 내담자 메모·이전 일지 특이사항·상담 시 주의사항(매칭/일정 notes 등)을 **반드시 인지**하도록 눈에 띄게 표시.

**레이아웃**

- **시각적 구분 필수**: 일반 섹션 블록보다 강하게 구분.
  - **배경**: 연한 경고/강조 톤 (예: 연한 노랑/베이지 또는 연한 포인트 배경).  
    토큰 예: `var(--mg-warning-50)` 또는 B0KlA 포인트 계열 연한 배경.  
    없으면 `#FFF9E6` 또는 `rgba(139, 115, 85, 0.08)` 수준 명시.
  - **테두리**: 좌측 **굵은 악센트 바**(4px 이상, 포인트 또는 경고 색).  
    예: `var(--mg-color-accent-main)` (#8B7355) 또는 `var(--mg-warning-500)`.
  - **아이콘**: 제목 왼쪽에 경고/정보 아이콘(예: AlertTriangle, Info).  
    아이콘 색: `var(--mg-color-accent-main)` 또는 `var(--mg-warning-500)`.
- **제목**: 예) "상담 시 주의사항", "중요 코멘트". 14~16px, font-weight 600.
- **내용**: 리스트 또는 단락. 14px, 본문 색. 여러 소스(내담자 메모, 매칭 notes, 일정 notes, 이전 일지 특이사항)를 구분해 표시할 경우 소스 라벨(예: "내담자 메모", "이전 일지")을 작게 붙인다.

**디자인 토큰**

| 요소 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 블록 배경 | 연한 강조 | `var(--mg-warning-50)` 또는 지정 연한 배경 (스펙에 hex 대신 토큰 우선) |
| 좌측 악센트 바 | 4px, 포인트/경고 | `var(--mg-color-accent-main)` 또는 `var(--mg-warning-500)` |
| 테두리 | 1px | `var(--mg-color-border-main)` (또는 경고 계열 연한 테두리) |
| border-radius | 16px | 동일 |
| 패딩 | 24px | 24px |
| 제목+아이콘 | 16px bold, 주조/포인트 | `var(--mg-color-text-main)`, 아이콘 `var(--mg-color-accent-main)` |

**데이터 소스**

- 내담자 notes, 매칭 notes, Schedule.notes, Consultation.preparation_notes, 이전 상담일지 특이사항 등.  
- 내용이 없으면 블록 자체를 **비표시**하거나 "주의사항 없음" 한 줄 표시.

---

### 4.3 심리검사 (있을 때만)

**역할**: 해당 내담자의 심리검사 문서 목록·요약·위험도·핵심 해석을 상담일지 작성 맥락에서 바로 확인.

**레이아웃**

- 하나의 **섹션 블록** (일반 섹션과 동일 스타일).
- **섹션 제목**: 왼쪽 **세로 악센트 바**(4px, 보조색 권장) + "심리검사" 제목.
- **내용**:
  - **문서 목록**: 문서별로 카드/행. 문서명(또는 originalFilename) + 링크(상세/리포트 보기).
  - **우선 노출**: 요약문(reportSummary), **위험도**(있을 경우 뱃지/텍스트로 강조), **핵심 해석**(있을 경우 별도 줄 또는 블록).
- "중요한 내용이니 잘 설계해서 보여줘" 요구 반영: 위험도·핵심 해석이 있으면 **문서 목록 상단 또는 해당 문서 블록 내 상단**에 배치하고, 텍스트 스타일(굵게, 색상)로 강조.

**디자인 토큰**

| 요소 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 블록 | 섹션 블록 동일 | `var(--mg-color-surface-main)`, 1px `var(--mg-color-border-main)`, radius 16px, padding 24px |
| 악센트 바 | 4px, 보조 | `var(--mg-color-secondary-main)` (#6B7F72) |
| 문서 링크 | 14px, 주조색, hover 밑줄 | `var(--mg-color-primary-main)` |
| 요약문 텍스트 | 14px, 보조 텍스트 | `var(--mg-color-text-secondary)` |
| 위험도 뱃지 | 경고/위험 수준에 따라 색상 | `var(--mg-error-500)`(위험), `var(--mg-warning-500)`(주의) 등 |
| 핵심 해석 강조 | 14px, font-weight 600, 본문 색 | `var(--mg-color-text-main)` |

**데이터 소스**

- `GET /api/v1/assessments/psych/documents/by-client/{clientId}`.  
- reportSummary, 위험도·핵심 해석은 API 확장 시 DTO 필드로 전달.

**없을 때**

- 심리검사 문서가 없으면 이 블록 **전체 비표시**.

---

### 4.4 상담일지 작성 폼

**역할**: 기존 ConsultationLogModal / ConsultationRecordScreen과 동일한 폼 필드. 세션 일자, 세션 번호, 내담자 상태, 주요 이슈, 개입 방법, 내담자 반응, 위험도 평가, 진행 평가 등.

**레이아웃**

- 하나의 **섹션 블록**으로 감싼다.
- **섹션 제목**: 세로 악센트 바(4px, 주조) + "상담일지 작성".
- **폼 그리드**: 2열(데스크톱)·1~2열(태블릿)·1열(모바일). gap 20px.  
  필수 입력 안내는 블록 상단에 작은 알림(경고 아이콘 + 문구)으로 유지.

**디자인 토큰**

| 요소 | 스펙 | 토큰/클래스 |
|------|------|-------------|
| 블록 | 섹션 블록 | 동일: surface, border, radius 16px, padding 24px |
| 라벨 | 12px, 보조 | `var(--mg-color-text-secondary)`, `mg-v2-label` |
| 입력 필드 | 14px, 테두리 | `var(--mg-color-border-main)`, focus 시 `var(--mg-color-primary-main)` |
| 필수 안내 박스 | 연한 경고 배경·테두리 | 기존 `mg-v2-bg-yellow-50`, `mg-v2-border-yellow-200` 등 유지 가능 |

---

### 4.5 액션 버튼 (모달 푸터)

- **위치**: UnifiedModal의 `actions` prop으로 전달 — 모달 하단 고정, 스크롤과 무관.
- **버튼 순서(우측 정렬)**: [취소] [저장] [완료].
- **스타일**:  
  - 취소: 아웃라인. `var(--mg-color-border-main)` 테두리.  
  - 저장: 주조. `var(--mg-color-primary-main)` 배경, `var(--mg-color-background-main)` 계열 텍스트.  
  - 완료: 성공 강조. `var(--mg-success-500)` 또는 주조 유지.  
- 높이 40px, padding 10–20px, border-radius 10px.  
- 클래스: 기존 `mg-modal__actions`, `mg-v2-modal-footer-inline` 및 Button variant 활용.

---

## 5. 반응형 요구사항

- **데스크톱(1280px~)**: 모달 너비 Large(또는 XL) 기준. 상단 블록 2~4열 그리드, 일지 폼 2열.
- **태블릿(768px~1280px)**: 모달이 뷰포트 대비 비율 유지. 상단 블록 2열, 일지 폼 2열 또는 1열.
- **모바일(375px~768px)**: 모달 풀너비 또는 근접. 상단 블록 1열, 일지 폼 1열. 터치 영역 최소 44px. 스크롤 시 sticky 영역이 너무 크면 상단만 고정하고 "내담자 요약" 한 줄 접기 옵션 검토 가능(구현 시 결정).

**브레이크포인트·패딩**

- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` 기준.  
- 모달 내부 섹션 패딩: 데스크톱 24px, 태블릿 20px, 모바일 16px.

---

## 6. 요약 체크리스트 (코더 전달용)

- [ ] 모달: `UnifiedModal` `size="large"` (또는 XL), `className="mg-v2-ad-b0kla"`.
- [ ] 본문 배경: `var(--mg-color-background-main)`.
- [ ] 블록 순서: 내담자 프로필 요약 → 중요 코멘트 → 심리검사(있을 때) → 상담일지 폼.
- [ ] 상단 블록들: 스크롤 시 상단 고정(sticky) 또는 항상 먼저 보이도록 구조.
- [ ] 내담자·심리검사·일지 폼 블록: 섹션 블록(배경 surface, 테두리 border, radius 16px, 좌측 악센트 바 4px).
- [ ] 중요 코멘트: 연한 강조 배경 + 좌측 굵은 악센트 바 + 아이콘으로 시각적 구분.
- [ ] 심리검사: 문서 목록 + 요약·위험도·핵심 해석 우선 노출, 없으면 블록 비표시.
- [ ] 액션: 모달 푸터 고정, 취소/저장/완료, B0KlA 버튼 스타일.
- [ ] 색·타이포·간격: `var(--mg-*)` 및 PENCIL_DESIGN_GUIDE 팔레트 준수.
- [ ] 반응형: 375px~3840px 브레이크포인트 고려, 패딩·그리드 열 수 조정.

---

## 7. 참조 문서·파일

| 문서/파일 | 용도 |
|-----------|------|
| CONSULTATION_LOG_LARGE_MODAL_PLAN.md | 기획·범위·Phase |
| docs/design-system/PENCIL_DESIGN_GUIDE.md | B0KlA 팔레트·섹션 블록·타이포·체크리스트 |
| docs/design-system/RESPONSIVE_LAYOUT_SPEC.md | 브레이크포인트·패딩·그리드 |
| frontend/src/styles/unified-design-tokens.css | 토큰명 참고 |
| ConsultationRecordScreen.js | 내담자 카드·심리검사 섹션 구조 참고 |
| ConsultationLogModal.js | 현재 모달 구조·폼 필드 |
| UnifiedModal.js | size, actions, className |

---

**문서 끝.**
