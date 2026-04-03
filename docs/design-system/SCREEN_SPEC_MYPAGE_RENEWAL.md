# 마이페이지(MyPage) 전면 리뉴얼 — UI/UX 화면 스펙

**문서 유형**: 화면 설계서 (디자인 전달용)  
**대상 독자**: core-publisher(마크업), core-coder(React 구현)  
**비주얼 기준**: [어드민 대시보드 샘플](https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample) — B0KlA 톤(카드·타이포·간격·악센트)과 동일한 언어  
**레이아웃 제약**: **AdminCommonLayout을 사용하지 않음.** 역할별 앱 셸(클라이언트/상담사/스태프 등 기존 GNB·LNB) 안에서 본문만 아래 스펙으로 구성한다.  
**금지**: 기존 마이페이지 전용 레거시 CSS·클래스를 **참조·복제하지 않는다.** 구현은 `unified-design-tokens.css`·`dashboard-tokens-extension.css`의 토큰과 B0KlA(`mg-v2-ad-b0kla__*`) 및 공통 모듈만 사용한다.

---

## 1. 개요 및 배경

로그인 사용자가 **자신의 프로필·환경설정·보안·소셜 연동·개인정보 동의**를 한 곳에서 관리하도록 마이페이지를 전면 개편한다. 업무용 어드민과 동일한 **B0KlA 비주얼 언어**로 통일감을 주되, **일반 사용자 맥락**에서 쓰기 쉬운 탭 구조·카드형 섹션·위험 동작(비밀번호 변경·연동 해제 등)의 명확한 분리를 목표로 한다.

**해결하려는 문제**: 설정이 흩어져 있거나 시각 언어가 제각각이면 신뢰도·완료율이 떨어진다. 본 스펙은 **자주 하는 작업을 앞에 두고**, **민감 정보는 기본 마스킹**하며, **모달로 확인이 필요한 파괴적 동작**을 정리한다.

---

## 2. 사용자 중심 요구 (기획 0.4 정렬)

### 2.1 누가 쓰는가 (역할)

| 역할 | 전제 | 스펙상 차이 |
|------|------|-------------|
| 내담자(CLIENT) | 모바일 비중 높음 | 탭은 가로 스크롤 또는 드롭다운 보조 가능; 터치 타깃 44px |
| 상담사(CONSULTANT) | 프로필 노출·일정 연동 니즈 | 프로필 탭에 공개용 필드 강조(서비스 정책에 따름) |
| 스태프(STAFF) | 내부 도구와 병행 | 동일 UI 패턴 유지 |
| 관리자(ADMIN) | 어드민 레이아웃과 별도 | 본 화면은 **AdminCommonLayout 밖**에서도 동일 토큰·카드 규칙 적용 |

역할별로 **숨길 탭**이 있으면(예: 특정 테넌트에서 소셜 미사용) 해당 탭 항목 자체를 비노출한다. 빈 탭으로 두지 않는다.

### 2.2 사용 흐름·우선 동작

1. 진입 시 **기본 탭: 프로필** — 가장 자주 보는 요약(이름·연락처 마스킹·프로필 사진)을 최상단에 둔다.  
2. **설정** — 언어·알림 등 **매일 영향** 있는 항목을 두 번째로 둔다(제품 정책에 따라 순서 조정 가능하나, 스펙 기본안은 이 순서).  
3. **보안** — 비밀번호·세션 등 **민감**; 시각적으로 별 카드로 구획.  
4. **소셜 계정** — 연결/해제가 가끔 발생 → 독립 탭.  
5. **개인정보·동의** — 법적 문구·토글 모음; 스크롤이 길어질 수 있으므로 **섹션 앵커** 또는 카드 분할.

**자주 쓰는 액션을 카드 상단에**: 프로필 저장, 알림 on/off, 비밀번호 변경 진입 버튼 등.

### 2.3 정보 노출·마스킹 원칙

| 정보 유형 | 기본 표시 | 상세/복호 표시 |
|-----------|-----------|----------------|
| 이메일 | 마스킹 예: `ab***@example.com` | "표시" 토글 시에만 전체(짧은 세션 또는 재인증 후) |
| 휴대전화 | 마스킹 예: `010-****-5678` | 동일 |
| 주소 등 식별 정보 | 정책에 따라 요약 또는 비노출 | 편집 모달에서만 전체 입력 |
| 비밀번호 | 입력 필드에만(점/마스크), 저장된 값 **절대 미표시** | — |
| 소셜 연동 | 제공자명 + 마스킹된 식별자(이메일 일부) | 연동 해제는 확인 모달 |
| 세션 / 로그인 기기 | 기기명·대략적 위치·마지막 활동 시각 | IP는 끝 옥텟 마스킹(예: `192.168.1.*`) |
| 동의 항목 | 항목명·필수/선택·동의 시각 | 약관 전문은 링크·별도 모달 |

**권한**: 본인 데이터만; 테넌트 격리는 백엔드 책임이나 UI에는 "다른 센터 데이터는 보이지 않음"을 전제로 카피를 단순화한다.

---

## 3. 레이아웃 구조 (선정안 및 이유)

- **단일 컬럼 + 수평 탭**: 설정류 화면에서 **인지 부하가 가장 낮고**, 모바일에서도 패턴이 안정적이다.  
- **섹션 = 카드 블록**: 어드민 샘플과 동일하게 **구역을 시각적으로 끊어** 스캔 가능성을 높인다.  
- **모달**: 확인·폼·약관 뷰는 전부 **UnifiedModal** 쉘로 통일한다.

**아토믹 계층 (참고)**  
- **Template/Page**: 마이페이지 루트(역할 셸의 children).  
- **Organisms**: 탭 바, 프로필 헤더 카드, 설정 카드 묶음, 보안 카드, 소셜 리스트, 동의 리스트.  
- **Molecules**: 라벨+입력(FormInput), 토글 행, 연결된 계정 행.  
- **Atoms**: 버튼, Badge, 아이콘, 구분선.

---

## 4. 전역 페이지 골격

### 4.1 페이지 래퍼 (B0KlA 스코프)

- 본문 최상위에 **B0KlA 토큰이 적용되는 래퍼**를 둔다. 구현 시 아래 중 프로젝트 관례에 맞는 하나를 선택한다.  
  - 권장: 루트에 클래스 `mg-v2-ad-b0kla`(또는 동일 시각 규칙을 주는 래퍼)를 두고, 내부 컨테이너에 `mg-v2-ad-b0kla__container`를 사용해 **좌우 패딩·최대 너비**를 샘플과 맞춘다.  
- **페이지 배경**: `var(--mg-color-background-main)` (펜슬·가이드: 메인 배경).  
- **본문 상하 패딩**: `var(--mg-spacing-lg)` ~ `var(--mg-spacing-xl)` (24px~32px). 탭·카드 사이 **세로 gap**: `var(--mg-spacing-md)` ~ `var(--mg-spacing-lg)` (16px~24px).

### 4.2 페이지 헤더 (제목 영역)

- **페이지 제목**: "마이페이지" (또는 역할별 "내 정보").  
  - 타이포: `font-size` 페이지 타이틀 단계 — `var(--mg-font-xxl)` 또는 `var(--mg-font-size-2xl)` 계열, `font-weight: var(--mg-font-semibold)`, `color: var(--mg-color-text-main)`.  
- **부제(선택)**: 한 줄 설명, `var(--mg-font-sm)` ~ `var(--mg-font-md)`, `color: var(--mg-color-text-secondary)`.  
- **우측 보조 액션(선택)**: "고객센터", "로그아웃" 등은 **아웃라인/텍스트 버튼**으로 배치해 주조 버튼과 경쟁하지 않게 한다.

구현 시 **ContentHeader** 패턴(제목·부제·actions 슬롯) 재사용을 권장한다. (`docs/standards/COMMON_MODULES_USAGE_GUIDE.md` §1.1)

### 4.3 탭 내비게이션

- **위치**: 페이지 제목 바로 아래, 카드 본문 위.  
- **스타일**: 어드민 샘플의 **pill 토글**과 동일한 리듬. 구현 우선순위:  
  1. 기존 `mg-v2-ad-b0kla__pill-toggle` + `mg-v2-ad-b0kla__pill` / `mg-v2-ad-b0kla__pill--active` (대시보드 v2 관례)  
  2. 또는 **common/Badge** `variant="tab"` (탭 전용 pill)  
- **활성 탭**: 배경·테두리에 `var(--mg-color-primary-main)` 또는 pill active 클래스가 정의한 주조색; 텍스트 대비 WCAG 고려.  
- **비활성**: `color: var(--mg-color-text-secondary)`, 배경 투명 또는 서페이스 톤.  
- **모바일**: 탭이 많으면 **가로 스크롤**(스크롤바 최소화, 좌우 fade 선택), 또는 첫 탭 + "더보기" 메뉴.

**탭 순서(고정 라벨 제안)**  
1. 프로필  
2. 설정  
3. 보안  
4. 소셜 계정  
5. 개인정보·동의  

---

## 5. 섹션 블록(카드) 공통 규칙

모든 탭 본문의 하위 구역은 **동일한 카드 문법**을 따른다.

| 속성 | 토큰·값 |
|------|---------|
| 카드 배경 | `var(--mg-color-surface-main)` |
| 테두리 | `1px solid var(--mg-color-border-main)` |
| 모서리 | `border-radius: 16px` (필요 시 `var(--mg-radius-lg)`와 일치 여부 코드베이스에 맞춤) |
| 내부 패딩 | `var(--mg-spacing-lg)` (24px) |
| 카드 간 세로 간격 | `var(--mg-spacing-md)` ~ `var(--mg-spacing-lg)` |
| 그림자(호버·강조 선택) | `var(--ad-b0kla-shadow-hover)` 또는 `var(--cs-shadow-soft)` (카드 호버는 선택 사항; 터치 UI에서는 생략 가능) |

**섹션 제목 행**  
- 좌측 **세로 악센트 바**: 폭 4px, `background: var(--mg-color-primary-main)`, `border-radius: 2px`, 제목 텍스트와 `var(--mg-spacing-sm)` 간격.  
- 제목 텍스트: `font-size` 16px 수준(`var(--mg-font-md)` ~ `var(--mg-font-lg)`), `font-weight: var(--mg-font-semibold)`, `color: var(--mg-color-text-main)`.  
- 제목 우측에 **보조 액션**(예: "편집")은 텍스트 버튼 또는 아웃라인 소형.

**구분선**  
- 카드 내부 블록 사이: `border-top: 1px solid var(--mg-color-border-main)`, 위아래 `padding-top`/`margin`은 `var(--mg-spacing-md)`.

구현 시 **ContentSection** / **ContentCard** / **MGCard** 중 프로젝트 표준에 맞는 것을 선택하되, **위 시각 수치와 토큰**을 우선한다.

---

## 6. 탭별 상세 스펙

### 6.1 프로필 (Profile)

**목적**: 본인 정체성·연락 요약 확인 및 공개 프로필 편집.

**카드 A — 프로필 헤더**  
- 좌: 아바타(원형, 지름 72~96px, `border: 2px solid var(--mg-color-border-main)`).  
- 우: 표시 이름(큰 굵기), 역할 Badge(`StatusBadge` 또는 `Badge` status), 테넌트/센터명(보조 텍스트).  
- 하단 행: "사진 변경" — 파일 선택은 숨기고 **라벨 버튼**(주조 또는 아웃라인). 업로드 진행 시 해당 카드 내 **로딩** 표시.

**카드 B — 기본 정보**  
- 필드: 닉네임/이름, 소개(멀티라인), 생년월일 등 **제품 정책 필드**.  
- 각 행: **FormInput** 또는 라벨+입력; 라벨 `var(--mg-font-xs)`~`sm`, `var(--mg-color-text-secondary)`.  
- 이메일·전화: **읽기 전용 행** + 마스킹 + "변경" 시 **보안 탭** 또는 **인증 모달**로 유도(흐름은 기획·API와 합의).

**카드 하단 액션**  
- 주조 버튼: "저장" — 놀이 약 `40px`, `border-radius: 10px`, 배경 `var(--mg-color-primary-main)`, 텍스트 `var(--mg-color-background-main)` 또는 대비 확보 색.  
- "취소": 아웃라인, 테두리 `var(--mg-color-border-main)`.

---

### 6.2 설정 (Settings)

**목적**: 앱 동작·알림·표시 언어 등 **비민감** 환경 설정.

**카드 A — 일반**  
- 언어 선택: **CustomSelect** 또는 **BadgeSelect**(옵션이 소수일 때).  
- 시간대(있을 경우): 동일 컴포넌트.

**카드 B — 알림**  
- 항목별 **토글 스위치**(디자인 시스템 토큰 준수; 레거시 토글 클래스 금지).  
- 각 행: 제목 + 한 줄 설명(보조 색) + 우측 토글.  
- 푸시/이메일/SMS 등 채널이 나뉘면 **서브섹션 제목**으로 묶는다.

**카드 C — 표시(선택)**  
- 테마(라이트 고정이면 카드 생략).  

변경 시 **즉시 저장** 또는 **하단 "설정 저장"** 단일 주조 버튼 — 제품 정책 하나로 통일.

---

### 6.3 보안 (Security)

**목적**: 자격 증명·세션·로그인 이력 관리. **시각적 무게**를 두어 실수 클릭을 줄인다.

**카드 A — 비밀번호**  
- 현재 비밀번호 / 새 비밀번호 / 확인 — **모달 내 입력** 권장(목록 화면에는 "비밀번호 변경" 버튼만).  
- 버튼: 주조 "비밀번호 변경" → UnifiedModal 열림.

**카드 B — 2단계 인증(해당 시)**  
- 상태 Badge: 사용 중 / 미사용.  
- CTA: 켜기/끄기 — 끄기는 **ConfirmModal** 2차 확인.

**카드 C — 로그인된 기기·세션**  
- 리스트 행: 기기 아이콘 + 기기명 + 대략적 위치 + 마지막 활동.  
- 현재 세션: `Badge`로 "이 기기" 강조.  
- "다른 기기 모두 로그아웃": **위험** 색 `var(--mg-error-500)` 또는 `var(--ad-b0kla-danger)` 텍스트/아웃라인 + ConfirmModal.

**카드 D — 로그인 기록(옵션)**  
- 테이블 대신 **카드 리스트**로 반응형 대응. IP 마스킹 적용.

---

### 6.4 소셜 계정 (Social accounts)

**목적**: 외부 IdP 연결 상태 확인·연결·해제.

**단일 카드 또는 제공자별 서브카드**  
- 각 행: 제공자 로고(아토믹 아이콘 슬롯) + 이름 + 연결 상태 Badge(연결됨/미연결).  
- 연결됨: 마스킹 식별자 + "연결 해제"(아웃라인 또는 텍스트 위험색).  
- 미연결: 주조 "연결하기".  
- **해제·교체** 전 **UnifiedModal**로 영향 설명(로그인 불가 등).

---

### 6.5 개인정보·동의 (Privacy consent)

**목적**: 필수/선택 동의, 마케팅, 제3자 제공 등 **법적·정책 문구**와 사용자 선택의 접점.

**카드 A — 동의 요약**  
- 최종 업데이트 일시(보조 텍스트).  
- "전체 약관 보기" 링크: `color: var(--mg-color-primary-main)`, 밑줄 선택.

**카드 B — 항목 리스트**  
- 각 항목: 제목, 필수/선택 Badge, 짧은 설명, **토글 또는 동의함/철회** 버튼.  
- 필수 항목은 토글 비활성 또는 해제 시 경고 모달.  
- **약관 전문**은 행 클릭 시 UnifiedModal(스크롤 바디)로 표시.

**카드 C — 데이터 다운로드·탈퇴(정책 시)**  
- "내 데이터 요청", "회원 탈퇴" 등은 **카드 하단 분리 블록** + 위험 톤 버튼 + ConfirmModal.

---

## 7. 모달·다이얼로그 (필수 공통 모듈)

| 용도 | 컴포넌트 | 비고 |
|------|----------|------|
| 비밀번호 변경 폼 | **UnifiedModal** | 바디에 FormInput 세 필드; 푸터 주조 저장 / 아웃라인 취소 |
| 연결 해제·세션 종료·탈퇴 | **ConfirmModal** 또는 UnifiedModal 확인 패턴 | 파괴적 문구 명시 |
| 약관 전문 | **UnifiedModal** | 스크롤 영역 명시; 닫기만 |

커스텀 오버레이·포털 래퍼 신설 금지. (`docs/standards/MODAL_STANDARD.md`, UnifiedModal 스킬)

---

## 8. 상호작용·상태

| 상태 | 처리 |
|------|------|
| 초기 로딩 | 페이지 상단 또는 카드 골격 **Skeleton** 또는 **UnifiedLoading** (섹션 단위 권장) |
| 부분 저장 중 | 해당 카드 버튼에 로딩·disabled |
| 저장 성공 | 토스트(기존 UnifiedNotification) + 필드 read 모드 복귀 |
| 검증 오류 | 필드 하단 에러 문구 `var(--mg-error-600)`; 카드는 흔들림 등 애니메이션 선택 |
| 빈 소셜 | EmptyState 일러스트+문구+주조 CTA |
| API 실패 | 카드 내 인라인 알림 박스 배경 `var(--mg-error-50)`(토큰 존재 시), 재시도 버튼 |

---

## 9. 반응형

- **375px**: 단일 컬럼; 탭 가로 스크롤; 카드 패딩 `var(--mg-spacing-md)`로 축소 가능.  
- **768px+**: 동일 단일 컬럼 유지하되 max-width 컨테이너(예: 720~960px)로 가독성 확보.  
- **1280px+**: 컨테이너 중앙 정렬; 과도한 폭 늘리지 않음.  
- 터치 타깃 최소 **44px** (펜슬 가이드).

상세 그리드: `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`.

---

## 10. 사용 토큰·클래스 정리 (구현 체크리스트)

디자인 단일 소스: `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `mindgarden-design-system.pen`, `pencil-new.pen`.  
구현 시 **아래만** 우선 참조하고, 누락 변수는 `unified-design-tokens.css` / `dashboard-tokens-extension.css`에서 **가장 가까운 의미**로 매핑한다(신규 토큰은 별도 승인).

### 10.1 색상

- `var(--mg-color-background-main)` — 페이지 배경  
- `var(--mg-color-surface-main)` — 카드 배경  
- `var(--mg-color-border-main)` — 테두리·구분선  
- `var(--mg-color-text-main)` — 본문·제목  
- `var(--mg-color-text-secondary)` — 라벨·부가설명  
- `var(--mg-color-primary-main)` — 주조·악센트 바·주요 버튼  
- `var(--mg-color-primary-light)` — 호버 등(정의 시)  
- `var(--mg-color-secondary-main)` — 보조 강조  
- `var(--mg-color-accent-main)` — 포인트(선택 악센트 바 대체색)  
- 상태: `var(--mg-success-500)`, `var(--mg-error-500)`, `var(--mg-warning-500)`  
- B0KlA 보조: `var(--ad-b0kla-green)`, `var(--ad-b0kla-danger)` 등(의미 맞을 때만)

### 10.2 간격·타이포

- 간격: `var(--mg-spacing-xs)` ~ `var(--mg-spacing-xl)` (`dashboard-tokens-extension.css` 별칭)  
- 프로젝트 내 관례적 24/32 패딩: `var(--mg-spacing-24)`, `var(--mg-spacing-32)`가 스타일시트에 정의되어 있으면 사용 가능(미정의 시 `lg`/`xl`로 대체).  
- 폰트 크기·굵기: `var(--mg-font-sm)` ~ `var(--mg-font-xxl)`, `var(--mg-font-semibold)` 등

### 10.3 B0KlA 클래스 (참조용)

- 컨테이너: `mg-v2-ad-b0kla__container`  
- 카드: `mg-v2-ad-b0kla__card` (대시보드와 동일 리듬을 쓸 때)  
- 탭 pill: `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__pill`, `mg-v2-ad-b0kla__pill--active`  
- 모달 섹션(내부): 기존 `mg-v2-ad-modal__section` 등 **모달 표준** 클래스가 있으면 재사용

---

## 11. 공통 모듈 검토 결과 (필수)

| 영역 | 권장 모듈 | 경로(요약) |
|------|-----------|------------|
| 본문 래핑 | ContentArea, ContentHeader, ContentSection, ContentCard | `components/dashboard-v2/content` |
| 모달 | UnifiedModal, ConfirmModal | `components/common/modals` 등 |
| 폼 | FormInput, CustomSelect, BadgeSelect | `components/common` |
| 배지·탭 표시 | Badge (`variant=tab` / `status`), StatusBadge | `components/common` |
| 빈 상태 | EmptyState | `components/common` |
| 로딩 | UnifiedLoading | `components/common` |

신규 "마이페이지 전용" 래퍼는 **최소화**하고, 위 모듈 조합으로 구현한다.

---

## 12. 참조 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md`  
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`  
- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`  
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`  
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`  
- `frontend/src/styles/unified-design-tokens.css`  
- `frontend/src/styles/dashboard-tokens-extension.css`  
- `docs/design-system/v2/MATCHING_SCHEDULE_INTEGRATION_SPEC.md` — 섹션 블록·토큰 서술 방식 예시  

---

## 13. 완료 기준 (코더·퍼블리셔)

- [ ] AdminCommonLayout 없이 역할 셸만 사용하면서도 **카드·타이포·색·악센트 바**가 어드민 샘플과 동일 계열로 보인다.  
- [ ] 다섯 탭이 모두 스펙 순서·라벨대로 동작하며, 비활성 탭은 제품 정책대로 숨김 처리된다.  
- [ ] 민감 필드 마스킹·비밀번호 미노출·파괴적 액션 Confirm이 적용된다.  
- [ ] 모든 모달이 **UnifiedModal/ConfirmModal** 계열뿐이다.  
- [ ] 레거시 마이페이지 CSS 의존이 없고, 토큰·B0KlA·공통 모듈만 사용한다.  
- [ ] 모바일~데스크톱에서 탭·카드 레이아웃이 깨지지 않는다.  

---

**문서 끝**
