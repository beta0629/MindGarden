# scripts/i18n — i18n 추출·리포트 도구

본 디렉터리는 i18n Phase 2 진입 후 **빈도 상위 한글 문자열 추출**을 자동화하기 위한
도구를 보관합니다. 합의서는 SSOT 로 따릅니다:

- `docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md`
  - 특히 **§3 namespace 분할**, **§5 마이그레이션 단계**, **§6.1 C-i3 컨펌 결과 (자동 추출 + 휴먼 리뷰)**

## 도구 목록

| 스크립트 | 목적 | 모드 |
| --- | --- | --- |
| `extract-hangul-strings.js` | `frontend/src/**/*.{js,jsx,ts,tsx}` 에서 한글 문자열 후보를 추출, namespace 휴리스틱 적용, JSON 리포트 생성 | **dry-run 전용** (소스/locales 무수정) |

## 실행

루트(`/Users/mind/mindGarden`)에서:

```bash
npm run i18n:extract            # 추출 후 리포트 JSON 생성
npm run i18n:extract:report     # 동일 (dry-run 명시 alias)
```

직접 실행:

```bash
node scripts/i18n/extract-hangul-strings.js
node scripts/i18n/extract-hangul-strings.js --report-only
```

## 출력

- 리포트 파일: `scripts/i18n/reports/extracted-hangul-{YYYYMMDD-HHmm}.json`
- 디렉터리 `scripts/i18n/reports/` 는 매 실행 시 자동 생성됩니다.
- 본 디렉터리 산출물(JSON)은 `.gitignore` 처리합니다. (CI 노이즈 방지)

### 리포트 구조 (요약)

```json
{
  "generatedAt": "...ISO8601...",
  "summary": {
    "filesScanned": 1234,
    "totalUniqueStrings": 0,
    "totalOccurrences": 0,
    "byNamespace": { "common": 0, "admin": 0, "...": 0 }
  },
  "topByNamespace": {
    "common": [
      { "text": "확인", "occurrences": 87, "files": ["..."], "suggestedKey": "common.actions.confirm" }
    ]
  },
  "all": [ "...(전체 정렬 목록)..." ]
}
```

- `suggestedKey` 는 **휴리스틱 자동 초안**입니다. 자동 적용 금지 — 휴먼 리뷰가 최종 결정합니다.

## 절대 금지 (Phase 2.1a 단계 제한)

- **소스 코드 치환 금지** (`t('key')` 변환 작업은 본 임무 외)
- **`frontend/src/locales/ko/*.json` 수정 금지**
- **자동 키 생성 결과의 자동 적용 금지**
- **신규 외부 라이브러리 추가 금지** (Node 내장 + 정규식 폴백 정책 유지)

## 휴먼 리뷰 절차 (다음 라운드 입력)

1. 본 스크립트로 리포트 생성.
2. 리포트 JSON 의 `topByNamespace.<ns>` Top 50 검토.
3. `core-planner` 위임으로 다음 라운드(`Phase 2.1b common` 치환 1차) 분배실행 수립.
4. `core-coder` 가 검토된 키만 `common.json`/`admin.json` 에 추가하고 사용처 치환.
5. `core-tester` 회귀 검증(0건) 후 다음 namespace 로 진행.

## 분류 휴리스틱 (참고)

| 디렉터리 패턴 | namespace |
| --- | --- |
| `components/admin/**` | `admin` |
| `components/auth/**`, `pages/auth/**` | `auth` |
| `components/client/**` | `client` |
| `components/wellness/**`, `components/meditation/**` | `wellness` |
| `components/erp/**`, `components/billing/**`, `components/payment/**` | `erp` |
| `components/consultation/**`, `components/clinical/**`, `components/psych/**` | `clinical` |
| 그 외 (`components/common/**`, `components/base/**`, `components/ui/**`, `hooks/**`, `utils/**`, `constants/**`, ...) | `common` |

분류는 **자동 추정**이며, 휴먼 리뷰에서 namespace 이동을 결정할 수 있습니다.
