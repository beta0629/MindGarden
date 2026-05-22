# D7-1 색상 하드코딩 치환 2차 시각 회귀 검수 보고서 (`core-tester`)

## §0 결론
**PASS**. codemod 재실행을 통해 i18n Phase 2.1b 병합 누락 없이 CSS 21건 및 JS 1건의 색상 토큰 56건 치환이 정상적으로 적용되었습니다.

## §1 코드 변경 정합
- **파일 정합**: D7-1 대상 CSS 21 파일 + `MGForm.js` 1 파일 등 총 22개 파일 수정 확인 (i18n 병합 트랙과 분리 유지).
- **매핑 정합**: `convert-hardcoded-colors.js` 내 신규 12라인 6쌍 매핑 일치 확인.
- **산출물 정합**: `docs/COLOR_CONVERSION_REPORT.md` 신규 생성 및 갱신 내역 일치.
- **SSOT 보호**: SSOT(`unified-design-tokens.css`) 및 합의서 본문 무수정 상태 유지 확인.

## §2 T-D 가드
**PASS**. `check:token-ssot` 재검증 결과: 
- 24 매핑 / ✅19 / ⚠️5 / ❌0 / 🚨0 (운영 cascade 영향 없음)

## §3 영역별 정성 평가 (22 파일)
각 그룹별 치환된 hex가 `var(--mg-color-*)` 형태로 정확히 변환되었음을 확인함.
- **A. 임상 모듈 (5건 - HIGH)**: `SOAPNoteEditor`, `DiagnosticReportEditor` 등 핵심 모듈의 상태 컬러 변환 정상.
- **B. 빌링 (3건 - MEDIUM)**: 결제 및 구독 화면의 error/success 테두리 및 배경색 변환 정상.
- **C. 이모션 (3건 - LOW)**: 대시보드 및 트렌드 차트의 상태 컬러 정상 변환 확인.
- **D. 테넌트·인증 (5건 - HIGH)**: 통합 로그인, 테넌트 설정 등의 UI 및 경고 컬러 변환 정상.
- **E. 기타 (6건 - MEDIUM)**: `MGForm.js`의 Tailwind 임의값(`text-[#9CAF88]` → `text-[var(--mg-color-brand-olive-light)]`) 10건 치환 정상 적용 확인. `PrivacyPolicy.css`는 R-2 폴백만 잔존함.

## §4 라이트·다크 cascade 정합
**PASS**. 6개 토큰(`brand-olive-light`, `success-100`, `success-800`, `error-100`, `info-100`, `warning-dark`)의 라이트/다크 모드 컬러가 D6 P2-a 표준(`unified-design-tokens.css`)에 맞춰 정상 동작함.

## §5 D5 §1 background cascade 잠재 회귀
**PASS**. 통합 스케줄 weekend td, 홈페이지 헤더/푸터 hover, 로그인 hero panel 영역 모두 D7-1의 국소적 변경으로부터 독립적으로 안전하게 cascade가 유지됨을 확인함.

## §6 빌드/린트
**PASS**. `lint:check` 실행 결과 eslint 에러 없음.

## §7 카운트 측정 (D6 §8 시나리오 대조)
- 적용 전 (T-B 정착): 662건
- 적용 후 (D7-1 실측): **606건 (-56건 감소)**
- codemod report canonical 출력과 정확히 일치 확인.

## §8 종합 판정 및 다음 라운드 권고
**PASS**. D7-1 분리 커밋 및 Push 가능 상태임. `core-deployer`에게 인계하여 해당 영역만 별도 커밋 후 운영 브랜치로 push할 것을 권고함.

## §9 D7-2 이월 항목 재확인
D7-2 라운드에서 Pink·NAVER·Bootstrap·Top 50 색상 및 카운트 스크립트 신설(D6 §11 기반) 작업이 필요함을 명시함. 잔여 606건의 hex 코드는 이월 트랙에서 지속적으로 추적/치환 진행 요망.