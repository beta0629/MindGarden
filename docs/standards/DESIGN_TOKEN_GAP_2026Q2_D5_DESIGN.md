# D5 디자이너 트랙 합의서 — 톤 분리·다크 톤·브랜드 색상 결정 (2026 Q2)

> **작성**: 2026-05-21 (core-designer)
> **유형**: 의사결정 합의서 (코드 무수정, 디자인 트랙 단일 합의서)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md` §6 (사용자 컨펌 완료)
> **참조**: `frontend/src/styles/unified-design-tokens.css`, `PENCIL_DESIGN_GUIDE.md`

---

## §1. T-E alias 톤 분리 합의 (D5 합의서 §4 P1-b 입력)

현재 `--mg-color-background-main`으로 일괄 매핑된 5종의 alias에 대해, PENCIL_DESIGN_GUIDE 및 샘플 대시보드 구조에 맞춰 톤을 분리합니다.

| 토큰명 (Alias) | 시맨틱 정의 | 라이트 톤 결정 (Hex) | 다크 톤 결정 (Hex) | 사용처 가이드 | 시각 회귀 위험 |
|---|---|---|---|---|---|
| `--mg-color-surface-main` | 카드/모달 등 표면 영역 | `#F5F3EF` | `#262626` | 카드 배경, 모달, 리스트 아이템, 칩 배경 | Low (기존 대비 약간 어두워져 영역 구분이 명확해짐) |
| `--mg-color-background-base` | 페이지 기본 배경 | `#FAF9F7` | `#1A1A1A` | 전체 페이지 배경, 메인 컨테이너 | Low (기존 `#FAF9F7` 유지) |
| `--mg-color-background-muted` | 한 단계 음영 처리 배경 | `#F2EDE8` | `#2C2C2C` | LNB(사이드바) 배경, 푸터, 비활성 탭 | Med (weekend `.fc-non-business` 등 캘린더 영역 대비 변동 가능) |
| `--mg-color-background-secondary` | 보조/분할 영역 | `#EBE6E0` | `#232323` | Split layout의 보조 패널, 우측 사이드바 | Low |
| `--mg-color-background-sub` | 하위 그룹 음영 (Nested) | `#E0DBD5` | `#333333` | 카드 내 중첩된 블록, 테이블 헤더 영역 | Low |

**시각 회귀 위험 평가**:
기존에 모두 `#FAF9F7`로 동일했던 톤이 계층적으로 분리되면서, 카드의 경계나 사이드바 배경이 좀 더 뚜렷하게 보입니다. 특히 weekend 달력의 비영업일(`fc-non-business`) 표시에 사용될 경우 배경과 확연히 구분되도록 보완됩니다.

---

## §2. T-B 다크 톤 재조정 (D4 §2 추정치 6종 컨펌)

D4에서 추정치로 도입되었던 6종의 다크 톤을 검토 및 확정합니다. WCAG AA 대비비를 충족하며 어드민/임상 환경에 적합하므로 추정치를 그대로 채택합니다.

| 토큰명 | 라이트 톤 | 다크 톤 결정 | 결정 사유 (대비비 등) |
|---|---|---|---|
| `--mg-color-info-bg` | `#f0f9ff` | `#082f49` | 채택 (Tailwind sky-900급 톤, 다크에서 눈부심 방지) |
| `--mg-color-info-dark` | `#1e40af` | `#bae6fd` | 채택 (Tailwind sky-200급 톤, 어두운 배경 위 가독성 확보) |
| `--mg-color-error-50` | `#fef2f2` | `#450a0a` | 채택 (Tailwind red-950급 톤, 에러 배경의 낮은 명도 유지) |
| `--mg-color-error-dark` | `#991b1b` | `#fca5a5` | 채택 (Tailwind red-300급 톤, 텍스트 가독성 확보) |
| `--mg-color-success-600` | `#059669` | `#6ee7b7` | 채택 (Tailwind emerald-300급 톤, 다크모드 강조 대비) |
| `--mg-color-brand-olive` | `#6b7c32` | `#d9f99d` | 채택 (라임 계열, 다크 배경에서 포인트 컬러 대비비 충족) |

**다크 모드 UAT 우선 점검 화면**:
1. 임상 모듈 `RiskAlertBadge` (에러/경고/정보 배경 및 텍스트)
2. 어드민 메인 대시보드 (`/admin` 메트릭 카드 및 뱃지)
3. `SOAPNoteEditor` (보조 패널의 background 톤 및 에러 표시)

---

## §3. brand-olive 공식 편입 정의 (C3 확정)

`#6b7c32` (`--mg-color-brand-olive`)를 브랜드 팔레트에 공식 편입합니다.

- **브랜드 팔레트 내 위치**: **Accent (포인트 색상)**
- **사용 컨텍스트 가이드**:
  - **권장**: B0KlA 기반의 프리미엄 상담 상품 태그, 마케팅 배너 강조 텍스트, 프로모션 뱃지, 특수 상태를 나타내는 지표 포인트.
  - **금지**: 시스템 피드백(성공/저장 완료 등)에는 사용 불가(Success 토큰 사용). 기본 액션 버튼(Primary 토큰 사용)에 사용 지양.
- **다크 hex**: `#d9f99d` (라임-200 톤 대비)
- **SSOT 정합**: `unified-design-tokens.css` 내에서 기존 D4 신규 블록에 존재하나, `brand` 팔레트 카테고리(`--mg-color-primary-main` 근처)로 위치를 재정렬할 것을 권장합니다.

---

## §4. emerald-600 vs success 통합 결정 (C4 컨펌)

신설된 `#059669`(`--mg-color-success-600`)와 기존 성공 색상 `#81C784`(`--mg-color-success`)의 통합 여부.

- **결정**: **옵션 A (통합)** — `success`를 `#059669` 톤으로 재정의하고, `success-600`을 `success`로 일괄 병합.
- **시각 영향 평가**:
  - 기존 `#81C784`는 다소 흐릿한 파스텔톤 그린으로, 라이트 모드 화이트 배경 위 텍스트로 사용 시 WCAG 대비비(AA)에 미달하는 경우가 잦았습니다.
  - 짙은 `#059669`로 톤을 낮추면 텍스트 가독성이 비약적으로 상승하고 버튼 대비가 강해집니다. 사용자 체감 변화는 있으나 긍정적 사용성(Accessibility) 향상으로 이어집니다.
- **권장안**:
  - 기존 `--mg-color-success`의 값을 `#059669`로 수정 (다크는 `#6ee7b7`로 매핑).
  - `--mg-color-success-600` 토큰은 삭제 및 `success`로 치환 통합.
  - 연관 100/500/800 토큰들도 향후 D6 라운드에서 emerald 스케일 기반으로 재정비 권장.

---

## §5. 후속 위임 권장 (`core-coder`, `core-tester` 전달 사항)

### To `core-coder`
1. **§1 톤 분리 반영**: `unified-design-tokens.css` 내의 `--mg-color-background-base` ~ `--mg-color-surface-main` 5종을 찾아, 본 문서 §1의 라이트/다크 hex 값으로 일괄 수정하세요. (기존의 `var(--mg-color-background-main)` 참조를 끊고 실제 hex 값 적용)
2. **§2 다크 톤 정합**: `:root[data-theme="dark"]` 블록 내의 다크 토큰 6종 값을 확정치로 유지/정리하세요.
3. **§3 brand-olive 정렬**: `--mg-color-brand-olive` 정의를 `/* 2026 Q2 D4 합의서 신규 토큰 */` 임시 블록에서 기본 `brand` 팔레트 정의 블록으로 이동하여 정합성을 맞추세요.
4. **§4 success 통합**: `--mg-color-success`를 `#059669`(라이트) / `#6ee7b7`(다크)로 수정하고, `unified-design-tokens.css` 및 코드베이스 전반에 있는 `--mg-color-success-600`을 `--mg-color-success`로 모두 치환한 후 토큰을 제거하세요.

### To `core-tester`
1. **weekend 캘린더 점검**: `surface-main`, `background-muted` 분리 적용 후 ERP/캘린더의 `.fc-non-business` 등 비영업일/주말 영역이 적절한 대비를 이루는지 확인하세요.
2. **어드민 메인 대시보드 (`/admin`) 점검**: 카드 배경(`surface-main`)과 전체 배경(`background-base`)이 분리되며 생기는 경계선 확인.
3. **성공 상태 점검**: `RiskAlertBadge`, `Toast` 등 기존 success(`#81C784`)를 쓰던 곳이 emerald(`#059669`)로 바뀌었을 때 시각적으로 과도하게 튀지 않는지 확인하세요.

---

## §6. 추가 사용자 컨펌 필요 항목

- **B0KlA 펜슬 디자인 시스템 수정 (별도 작업)**: `brand-olive`가 추가되었으므로 `mindgarden-design-system.pen` 파일의 아토믹 색상 팔레트 에셋 업데이트가 필요합니다. 이는 코드 변경 외의 디자인 툴 내 작업이므로 해당 파트에 위임이 필요합니다.