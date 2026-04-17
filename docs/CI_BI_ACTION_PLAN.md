# 🎯 CI/BI 변경 대응 액션 플랜

> **생성일**: 2026-04-17T05:41:31.070Z  
> **긴급도**: 🚨 매우 긴급  
> **예상 작업 시간**: 1-2주

---

## 📊 현황 요약

- **총 영향 파일**: 283개
- **중요 파일**: 15개  
- **총 하드코딩 색상**: 4926개

---

## 🚀 단계별 실행 계획

### Phase 1: 긴급 대응 (1-2일) 🔥
**중요 파일 15개 우선 처리**

1. `frontend/src/styles/mindgarden-design-system.css`
2. `frontend/src/styles/themes/mobile-theme.css`
3. `frontend/src/styles/themes/light-theme.css`
4. `frontend/src/styles/themes/ios-theme.css`
5. `frontend/src/styles/themes/high-contrast-theme.css`
6. `frontend/src/styles/themes/dark-theme.css`
7. `frontend/src/styles/01-settings/_theme-variables.css`
8. `frontend/src/styles/01-settings/_colors.css`
9. `frontend/src/utils/resolveCssColorVarToHex.js`
10. `frontend/src/utils/cssThemeHelper.js`
11. `frontend/src/themes/defaultTheme.js`
12. `frontend/src/hooks/useTheme.js`
13. `frontend/src/hooks/useTenantBranding.js`
14. `frontend/src/constants/css-variables.js`
15. `frontend/src/components/ui/ThemeSelector/ThemeSelector.test.js`

**작업 내용**:
- [ ] CSS 변수로 변환
- [ ] 중복 색상 통합  
- [ ] 네이밍 규칙 적용

### Phase 2: 전체 적용 (3-5일) ⚠️
**나머지 268개 파일 처리**

**작업 내용**:
- [ ] 컴포넌트별 색상 변수화
- [ ] JavaScript 로직 수정
- [ ] 테스트 및 검증

### Phase 3: 자동화 (1-2일) 📈
**재발 방지 시스템 구축**

**작업 내용**:
- [ ] 하드코딩 탐지 CI/CD 통합
- [ ] 자동 변환 스크립트
- [ ] 코드 리뷰 가이드라인

---

## 🛠️ 실행 스크립트

```bash
# 1. 현재 상태 재검사
node scripts/detect-hardcoded-colors.js

# 2. 중요 파일 자동 변환
node scripts/convert-critical-files.js

# 3. 전체 파일 변환
node scripts/convert-all-hardcoded.js

# 4. 검증
node scripts/validate-no-hardcoding.js
```

---

## ⏰ 타임라인

| 단계 | 기간 | 완료 기준 |
|------|------|-----------|
| Phase 1 | 1-2일 | 중요 파일 15개 변수화 완료 |
| Phase 2 | 3-5일 | 전체 283개 파일 변수화 완료 |  
| Phase 3 | 1-2일 | 자동화 시스템 구축 완료 |
| **총 기간** | **5-9일** | **CI/BI 적용 준비 완료** |

---

## 🎯 성공 기준

- [ ] 하드코딩된 색상 **0개** 달성
- [ ] CI/BI 색상 **1회 변경**으로 전체 적용
- [ ] 자동 탐지 시스템으로 **재발 방지**

**💡 CI/BI 작업 시작 전 Phase 1-2 완료 필수!**
