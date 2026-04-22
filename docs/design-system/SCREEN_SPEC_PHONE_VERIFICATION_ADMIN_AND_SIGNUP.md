# 화면설계서 — 전화번호 검증(소유 확인) UX

**문서 유형:** 디자인 시스템 / 화면설계서 (코더 전달용)  
**상태:** 초안  
**참조 정책:** `docs/project-management/2026-04-23/PHONE_VERIFICATION_POLICY.md` — 수치·허용 범위·문구 세부는 `[제품결정]`이며 본 스펙은 **UI 구조·상태·접근성**만 정의한다.  
**비주얼 기준:** `docs/design-system/PENCIL_DESIGN_GUIDE.md`, B0KlA 어드민 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), `frontend/src/styles/unified-design-tokens.css`의 `var(--mg-*)` 토큰  
**제외:** API 경로, DB 스키마, Java/JS 구현

---

## 1. 기획 정합성 (§0.4 요약)

| 항목 | 요약 |
|------|------|
| **사용성** | 전화 입력 → (정책상) SMS OTP 확인 → 성공 시 다음 단계로 자동 진행. 실패·만료·재전송은 **한 화면 내**에서 복구 동선을 명확히 한다. |
| **정보 노출(역할별)** | **본인(가입자·피등록자):** 입력·마스킹된 수신 안내 번호(예: 끝 4자리), OTP 필드, 타이머·한도 안내(정책 문구). **관리자:** 등록 폼 맥락에서 동일 플로우이되, 테넌트 내 중복 시 **관리자용 설명**(다른 프로필과 충돌 가능성)을 일반 사용자보다 구체적으로 보여줄지는 `[제품결정]` — UI 슬롯은 본 스펙 §3.2에 둔다. |
| **레이아웃** | 공개 가입: 로그인·온보딩 계열 **단일 컬럼 카드**(기존 `mg-v2-login-container` 톤과 조화). 어드민: **AdminCommonLayout** children + **ContentHeader** + 본문 섹션; 단계형 검증은 **등록 모달 내부 Step** 또는 **본문 ContentSection** 중 택1(§3.1). |

---

## 2. 공통 디자인 토큰·클래스 (코더 매핑)

정책 문서와 무관하게 **모든 화면 공통**으로 아래만 사용한다.

### 2.1 색·타이포

| 용도 | 토큰(우선) |
|------|-------------|
| 메인 배경 | `var(--mg-color-background-main)` |
| 섹션/카드 서페이스 | `var(--mg-color-surface-main)` |
| 테두리 | `var(--mg-color-border-main)` |
| 본문 텍스트 | `var(--mg-color-text-main)` |
| 보조 텍스트·라벨 | `var(--mg-color-text-secondary)` |
| 주조(Primary)·활성·주 버튼 | `var(--mg-color-primary-main)` |
| 주조 밝음(hover/강조 배경) | `var(--mg-color-primary-light)` |
| 성공 메시지·아이콘 | `var(--mg-success-500)` (또는 프로젝트 표준 success 토큰) |
| 오류 메시지·테두리 | `var(--mg-error-500)` |
| 경고(한도 임박 등) | `var(--mg-warning-500)` |

- **폰트:** Noto Sans KR  
- **섹션 제목:** 16px, `font-weight: 600`, `color: var(--mg-color-text-main)` + 좌측 세로 악센트 바 **4px**, `background: var(--mg-color-primary-main)`, `border-radius: 2px` (PENCIL §2.3)

### 2.2 간격·radius

| 요소 | 값 |
|------|-----|
| 섹션 블록 패딩 | 24px (`var(--mg-spacing-lg)` 등 프로젝트 spacing 토큰과 매핑) |
| 섹션 내부 gap | 16px |
| 섹션 블록 radius | 16px |
| 주 버튼 높이 | 40px, 좌우 패딩 10–20px, radius 10px |
| 터치 최소 높이(모바일) | 44px |

### 2.3 컴포넌트·클래스 (공통 모듈)

| 용도 | 모듈 / 클래스 힌트 |
|------|---------------------|
| 어드민 래퍼 | **AdminCommonLayout** — 본문은 children |
| 본문 영역 | **ContentArea** |
| 페이지 상단 제목·액션 | **ContentHeader** — 루트 `mg-v2-content-header`, `__left`(`__title`, `__subtitle`), `__right`(주 액션) |
| 섹션 그룹 | **ContentSection** 또는 **ContentCard** (B0KlA 섹션 블록 규칙 준수) |
| 모달 쉘 | **UnifiedModal** — 커스텀 오버레이 금지 (`/core-solution-unified-modal`) |
| 버튼 | `mg-v2-button`, `mg-v2-button--primary`, `mg-v2-button--secondary`(보조/아웃라인 톤), 비활성 시 `disabled` + 시각적 `mg-v2-button--disabled` 패턴 |
| 폼 필드 묶음 | **FormInput** (라벨·입력·에러 한 덩어리) |

---

## 3. 화면별 와이어·플로우

### 3.1 자가 회원가입 — 전화 입력 단계

**맥락:** 공개 영역. 기존 통합 로그인 카드와 동일한 **단일 컬럼**, 배경 `var(--mg-color-background-main)`.

**와이어(위→아래)**

1. **헤더 블록**  
   - 제목: "휴대전화 번호 확인" (또는 `[제품결정]` 카피)  
   - 부제: "가입을 위해 번호로 인증 문자를 보냅니다." (`var(--mg-color-text-secondary)`, 14px)

2. **번호 입력 행**  
   - 라벨: "휴대전화 번호" (12px, secondary)  
   - (선택) 국가코드 `[제품결정]` — UI 슬롯: 콤보 또는 고정 `+82` 텍스트 + 국내 번호 필드  
   - **FormInput** 기반 단일 입력: `inputmode="tel"`, `autocomplete="tel-national"` 권장(구현 시)  
   - 플레이스홀더: `010-0000-0000` 형태 표시용 vs 저장 정규화는 정책 문서 따름

3. **인라인 검증 영역**  
   - 형식 오류: 필드 하단, `color: var(--mg-error-500)`, `role="alert"` 또는 `aria-describedby`로 입력과 연결

4. **주 액션**  
   - `mg-v2-button mg-v2-button--primary` — "인증 문자 받기"  
   - 로딩: 버튼 `aria-busy="true"` + 스피너(기존 버튼 로딩 패턴)

5. **보조 링크**  
   - 텍스트 링크: "다른 방법으로 가입", "고객센터" 등 `[제품결정]` — `var(--mg-color-primary-main)` 밑줄 또는 버튼 secondary

**반응형**

- **375px~:** 단일 컬럼, 좌우 패딩 16–20px, 버튼 전폭(100% width) 권장  
- **768px+:** max-width 카드(예: 400–480px) 중앙 정렬

**접근성**

- 포커스 순서: 제목(읽기 스킵) → 번호 입력 → 주 버튼 → 보조 링크  
- 페이지 진입 시 포커스를 제목(`tabIndex=-1` + `ref`) 또는 첫 필드로 — `[제품결정]`  
- 형식 오류: **즉시 검증 시** `aria-invalid="true"` + `aria-describedby` → 에러 문단 id

---

### 3.2 자가 회원가입 — SMS OTP 단계

**와이어(위→아래)**

1. **수신 안내**  
   - 본문 14–16px: "`***-****-1234` 번호로 인증 번호를 보냈습니다."  
   - 번호 표시는 **마스킹**만(정책 §9·로그 원칙과 정합). 전체 번호 재표시 금지.

2. **OTP 입력**  
   - 6칸(또는 `[제품결정]` 자릿수) — **단일 필드** 또는 **분할 박스** UI 슬롯  
   - 라벨: "인증 번호"  
   - 보조 텍스트 줄: 남은 시간 "유효 시간 MM:SS" — `var(--mg-color-text-secondary)`  
   - 만료 임박 시 텍스트 색 `var(--mg-warning-500)` (선택)

3. **상태별 보조 블록** (동일 위치 교체, `aria-live`는 아래 참조)

| 상태 | 비주얼 | 버튼 |
|------|---------|------|
| **기본** | 타이머만 표시 | Primary: "확인", Secondary: "인증 문자 재전송" |
| **성공** | 녹색 체크 아이콘 + "인증이 완료되었습니다." (`var(--mg-success-500)`) | 자동 전환 또는 Primary: "다음" — `[제품결정]` |
| **실패(코드 불일치)** | `var(--mg-error-500)` 메시지: "인증 번호가 올바르지 않습니다." (내부 사유 과다 노출 금지 — 정책 §7) | Primary 재시도 가능, OTP 필드에 `aria-invalid` |
| **만료** | 경고 톤: "인증 시간이 지났습니다. 새 코드를 요청해 주세요." | Primary: "인증 문자 다시 받기", Secondary: "번호 변경" `[제품결정]` |
| **재전송 쿨다운** | "잠시 후 다시 요청할 수 있습니다. (N초)" | 재전송 버튼 `disabled`, `aria-disabled="true"` |
| **일일 한도/남용** | 단일 문구(일반화): "인증 요청 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요." `[제품결정]` | 보조 동선: 고객센터 링크 |
| **중복 번호(테넌트 내)** | "이미 가입된 번호입니다." + 로그인/비밀번호 찾기 링크 `[제품결정]` | Primary: "로그인으로 이동" |

**`aria-live`**

- **타이머 숫자만** 반복 갱신 시 `aria-live="off"` 또는 별도 **시각적**만 갱신(스크린 리더 스팸 방지).  
- **성공/실패/만료/한도** 등 **의미 변화** 메시지: 컨테이너에 `role="status"` + `aria-live="polite"` (긴급 차단은 `assertive`는 한도·보안 차단에만 `[제품결정]`).

**반응형**

- 375px: OTP 분할 박스는 **줄바꿈 없이** 가로 스크롤 방지 — 자간·박스 폭 조정 또는 단일 필드 우선 검토

---

### 3.3 관리자 — 내담자·상담사·스태프 등록 시 검증

**레이아웃 제안 (`[제품결정]` 전 코더·기획 확정 권장)**

| 옵션 | 적합한 경우 | 구조 |
|------|-------------|------|
| **A. UnifiedModal 내부 Step (권장)** | 등록이 기존 **모달 폼**으로 끝나는 화면 | 모달 상단 **스텝 인디케이터**(1 연락처 → 2 인증 → 3 나머지 폼). OTP는 모달 바디 안에서 동일 폭 유지. |
| **B. ContentSection 인라인** | **전용 등록 페이지**가 이미 있고 모달이 아닌 경우 | **AdminCommonLayout** → **ContentHeader**(예: 제목 "내담자 등록") → **ContentArea** → 폼 **ContentCard** 내에 전화 필드·OTP 블록을 순서대로 배치. |

**와이어(공통 블록 순서)**

1. **ContentHeader** (`mg-v2-content-header`): 좌측 제목·부제, 우측 선택 액션 "임시 저장" 등 `[제품결정]`  
2. **본문 ContentSection / ContentCard**  
   - 좌측 악센트 + 소제목: "연락처 확인"  
   - 전화 **FormInput** (관리자 입력)  
   - "인증 문자 발송" — `mg-v2-button--secondary` 또는 primary(주 동선이 발송인 경우)  
   - (발송 후) OTP 영역 — §3.2와 **동일 컴포넌트 패턴** 재사용(캡슐화)  
   - 관리자 전용 **중복·충돌 안내** 슬롯: 노란/주의 배경 `var(--mg-warning-500)` 경계선 또는 `var(--mg-color-surface-main)` + 좌측 accent warning `[제품결정]`

**정보 노출**

- 관리자에게도 수신 번호는 **마스킹** 동일 원칙. 다른 사용자 PII와 매칭된다는 설명만 텍스트로.

**모달 선택 시**

- **UnifiedModal** 헤더: 단계명 표시  
- 푸터: 이전/다음 — OTP 단계에서 "이전"은 번호 수정 가능하게 `[제품결정]`  
- 닫기(X): 미완료 검증 시 **ConfirmModal** 또는 인라인 경고 — `[제품결정]`

---

### 3.4 검증 전 계정 — 로그인 제한 안내 (와이어 수준)

**전제:** 정책 §8에 따라 미검증 계정의 로그인이 제한되는 경우.

**레이아웃:** 로그인 직후 또는 로그인 시도 결과 **전면 카드**(공개 영역) 또는 **대시보드 게이트** 빈 상태.

**와이어(위→아래)**

1. 일러스트 또는 아이콘 영역(선택, 64–80px)  
2. 제목: "휴대전화 인증이 필요합니다"  
3. 본문: "서비스 이용을 위해 번호 확인을 완료해 주세요." (상세는 `[제품결정]`)  
4. **ContentCard** 스타일 정보 박스: 마지막 발송·만료 안내 등 **최소 정보만**  
5. Primary: "인증 계속하기" → §3.1~3.2 플로우  
6. Secondary: "고객센터 문의" / "로그아웃" `[제품결정]`

**역할별**

- 내담자·상담사 등 동일 카드; 문구만 역할에 맞게 `[제품결정]`.

**접근성**

- `role="alert"`는 **차단 사유가 갑작스럽게 표시될 때만** 검토. 일반 안내는 `role="status"`, `aria-live="polite"`.

---

## 4. 상태별 버튼·상호작용 요약 (코더 체크리스트)

- [ ] Primary는 한 화면에 **하나의 주요 행동**만 강조(발송 / 확인 / 다음).  
- [ ] 재전송은 Secondary 또는 텍스트 버튼; 쿨다운 시 **disabled** + 남은 초 표시.  
- [ ] 로딩 중 중복 제출 방지: 버튼 disabled + `aria-busy`.  
- [ ] 성공 시 **포커스 이동**: 다음 단계 첫 필드 또는 완료 메시지 `[제품결정]`.  
- [ ] 모든 오류는 입력과 프로그램적으로 연결(`aria-describedby`).  
- [ ] 색만으로 상태를 구분하지 않기: 아이콘·텍스트 병행.

---

## 5. 반응형 브레이크포인트 (PENCIL 정렬)

| 브레이크포인트 | 이 플로우 적용 |
|----------------|----------------|
| **375px** | 단일 컬럼, 전폭 버튼, 터치 44px, OTP 필드 줄바꿈 없음 |
| **768px** | 어드민: LNB 드로어 유지, 본문 패딩 24px |
| **1280px+** | 어드민: LNB 260px 고정, 본문 max-width 컨테이너 |

---

## 6. 문서·정책 연계

- 정책 SSOT: `PHONE_VERIFICATION_POLICY.md` — TTL·쿨다운·한도·문구 일반화·OAuth 관계는 구현 전 제품 확정 필요.  
- 공통 모듈: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`  
- 어드민 레이아웃: `docs/layout/ADMIN_COMMON_LAYOUT.md`, 기획 `AdminCommonLayout` children 규칙

---

**문서 끝.**
