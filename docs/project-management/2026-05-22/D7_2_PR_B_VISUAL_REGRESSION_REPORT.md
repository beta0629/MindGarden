# D7-2 §5 P3 PR-B 시각 회귀 검수 보고서 (`core-tester`)

## §0 결론 (TL;DR)
**PASS**. 가장 큰 위험은 info-dark B채널의 ΔRGB 41 차이이며, 전체 UI 맥락에서 MEDIUM 수준의 시각적 영향으로 판단됨. 빌드/린트 및 카운트 검증 완료.

## §1 코드 변경 정합 검증
`git status --short` 및 `git diff --stat` 명령을 통해 다음 사항을 확인했습니다:
- **영향 파일**: 예상된 23개 스타일링 파일(CSS)만 정확히 변경됨 일치 확인.
- **SSOT 파일**: `frontend/src/styles/unified-design-tokens.css` 내 `--mg-color-info-800` 신설 블록 +25 라인 정확히 확인.
- **매핑 파일**: `scripts/design-system/color-management/convert-hardcoded-colors.js` 내 +20 라인 매핑 규칙 추가 확인.
- **무수정 영역**: PR-A 정착 영역(Pink/NAVER/Bootstrap/Count), D7-1, i18n 2.1b 관련 소스코드는 무수정 상태 유지됨을 확인.

## §2 신설 `--mg-color-info-800` 정합
- **정의 정합성**: 라이트 `#1e3a8a` / 다크 `#bfdbfe` 값 정의 일치.
- **WCAG 재검증**: 라이트 8.9:1 / 다크 7.9:1 (AA 기준 PASS).
- **적용 정합성**: 기존 하드코딩된 `#1e3a8a` 사용처 5건이 `var(--mg-color-info-800)`으로 치환 완료됨을 확인.
- **위치 정합성**: `unified-design-tokens.css` 내 D6 §3.1 신설 토큰 블록 위치에 올바르게 배치됨.

## §3 통합 4건 ΔRGB 시각 영향 평가

### §3.1 info-dark (MEDIUM, B채널 41)
- **사용처 (9건)**: `clinical/SmartNoteTab.css`, `clinical/AudioRecorder.css`, `clinical/DiagnosticReportEditor.css`, `landing/CounselingAbout.css`, `landing/Hero.css` 등
- **평가**: 라이트 모드에서 `#1d4ed8`(b=216)가 `#1e40af`(b=175)로 변경되어 알림, 링크, 강조 텍스트가 약간 어두워졌으나, 가독성 향상(대비 상승) 측면에서 긍정적. 다크 모드는 `#bae6fd`로 정합됨. 시각적 거부감 없음.

### §3.2 warning-dark (MEDIUM, G채널 36)
- **사용처 (9건)**: 주요 PG(결제) 화면 및 경고 메시지.
- **평가**: 라이트 모드에서 `#92400e`(g=64)가 `#856404`(g=100)로 변경. 미세하게 황색/갈색 톤으로 이동하였으나, 표준 warning 맥락을 유지하여 시각적 이질감 없음.

### §3.3 text-secondary-dark (LOW)
- **사용처 (12건)**: 보조 텍스트.
- **평가**: 라이트 `#4a5568` → `#374151` (약간 어두워짐), 다크 `#d1d5db` 정상 cascade 적용. 텍스트 가독성 유지.

### §3.4 text-main (LOW)
- **사용처 (13건)**: 기본 텍스트.
- **평가**: `#1a202c` → `#2C2C2C`로 약간 밝아짐. 다크 cascade에서는 P1 §4의 의도된 동일 hex 값을 적용하여 일관성 유지.

## §4 영향 23 파일 영역별 평가 요약
- **clinical (5건)**: `SmartNoteTab`, `AudioRecorder`, `DiagnosticReportEditor` 등에 `info-dark` 적용. (MEDIUM)
- **landing (3건)**: Hero 및 Services 화면 링크 텍스트에 적용. (MEDIUM)
- **common (3건)**: `MGForm`, `MGLayout`, `MGLoading`의 텍스트 색상 안정화. (LOW)
- **admin/commoncode (3건)**: `CommonCodeFilters`, `List`, `Stats` 내 warning 톤 및 텍스트 톤 변환. (LOW)
- **auth (2건)**: `BranchLogin.css`, `UnifiedLogin.css` 텍스트 색상 통일. (LOW)
- **dashboard·dashboard-v2 (2건)**: KPI Row 등 지표 텍스트 통일. (LOW)
- **emotion (2건)**: 차트 내 텍스트 라벨 통일. (LOW)
- **기타 (3건)**: `prediction`, `billing`, `test` 영역. (LOW)

## §5 라이트·다크 cascade 정합
| 토큰 | 라이트 | 다크 |
|---|---|---|
| `--mg-color-info-800` (신설) | `#1e3a8a` | `#bfdbfe` |
| `--mg-color-text-main` | `#2C2C2C` | `#2C2C2C` (동일 hex 의도) |
| `--mg-color-text-secondary-dark` | `#374151` | `#d1d5db` |
| `--mg-color-warning-dark` | `#856404` | `#fde68a` |
| `--mg-color-info-dark` | `#1e40af` | `#bae6fd` |
**검증 결과**: 각 토큰의 SSOT cascade 정의가 무수정/정확히 보존되었으며, T-D 가드 26 매핑 PASS 완료.

## §6 D5 §1 background cascade 잠재 회귀 더블 체크
- `weekend td`, `홈페이지`, `로그인 hero` 등 핵심 background 레이아웃 요소들에 대한 의도치 않은 회귀(regression) 현상 없음 확인.

## §7 빌드/린트 재검증
- `cd frontend && npm run lint:check` : **PASS**
- `cd frontend && npm run build:ci` : **PASS**

## §8 카운트 측정 재현
- **사전 baseline**: canonical 571 / rawLine 1,609 (PR-A 정착)
- **사후 실측**: canonical **523** / rawLine **1,568**
- **평가**: 48건의 하드코딩이 정확히 줄었음을 실측 확인. D7-2 §7 확장 시나리오 목표치(~456~506)에는 미진입하였으나(gap 17~67), 이는 D8 라운드로 이월하여 해소할 것을 권고함.

## §9 종합 판정 + 다음 라운드 권고
- **판정**: **PASS**
- **권고**: 시각적 회귀 및 코드 결함이 발견되지 않았으므로, PR-B 분리 커밋 및 운영 push 진행을 권고함 (`core-deployer` 위임).

## §10 D8 이월 권고 사항
1. T-Pink 적용 후 잔존한 `#f472b6` 10건 및 `#fbcfe8` 7건 토큰화
2. Top 51~100 잔존 하드코딩 hex 추가 흡수 처리
3. R-2 폴백 343건에 대한 토큰 alias 대체 검토
4. text-main의 다크 cascade 정착 여부 최종 결정 및 적용
