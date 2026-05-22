# 🎨 색상 변환 리포트

> **생성일**: 2026-05-22T03:03:27.578Z  
> **모드**: ACTUAL  
> **대상 영역**: 전체 (`frontend/src`)  
> **필터**: 전체 파일

---

## 📊 변환 결과

| 구분 | 수량 |
|------|------|
| 처리된 파일 | 0개 |
| 수정된 파일 | 0개 |
| 변환된 색상 | 0개 |
| 생성된 백업 | 0개 |
| R-2 폴백 보호 | 0건 |
| 오류 발생 | 0개 |

---

## 🛡️ R-2 — `var(--token, #hex)` 폴백 보호

> 시각 QA 보고서 §6 R-2 — 폴백 위치의 hex 가 nested var 로 잘못 치환되는 사고 방지.  
> 본 영역은 codemod 의 HEX 매핑에서 명시적으로 제외된다.  
> D3 적용 라운드처럼 매핑이 늘어나도 폴백 hex 는 안전.

- **보호된 폴백 총 건수**: 0건
- **보호된 폴백 고유 hex 종 수**: 0종

보호된 폴백 hex 없음 (영향 0건)

---

## 🔍 잔존 hex 색상 (매핑 외)

> 처리 후에도 변환되지 않고 남아 있는 hex 색상.  
> 회색 3자리(`#666`·`#333`·`#000`·`#ccc`·`#999`·`#eee` 등) 미매핑 항목과  
> 4·8자리 alpha 포함 hex 모두 포함. D3 합의서 작성/적용 라운드의 데이터 소스.

- **고유 종 수**: 0종
- **총 건수**: 0건

잔존 hex 없음 ✅

---

## 🎯 변환 규칙

### HEX 색상 변환
- `#007aff` → `var(--mg-primary-500)`
- `#007bff` → `var(--mg-primary-500)`
- `#2196F3` → `var(--mg-primary-500)`
- `#3b82f6` → `var(--mg-primary-500)`
- `#6c5ce7` → `var(--mg-consultant-dark)`
- `#667eea` → `var(--mg-primary-500)`
- `#28a745` → `var(--mg-success-500)`
- `#34c759` → `var(--mg-success-500)`
- `#4CAF50` → `var(--mg-success-500)`
- `#00b894` → `var(--mg-success-500)`
- `#10b981` → `var(--mg-success-500)`
- `#dc3545` → `var(--mg-error-500)`
- `#ff3b30` → `var(--mg-error-500)`
- `#F44336` → `var(--mg-error-500)`
- `#ff6b6b` → `var(--mg-error-500)`
- `#ef4444` → `var(--mg-error-500)`
- `#ffc107` → `var(--mg-warning-500)`
- `#ff9500` → `var(--mg-warning-500)`
- `#FF9800` → `var(--mg-warning-500)`
- `#f59e0b` → `var(--mg-warning-500)`
- `#f093fb` → `var(--mg-warning-500)`
- `#17a2b8` → `var(--mg-info-500)`
- `#74b9ff` → `var(--mg-info-500)`
- `#6c757d` → `var(--mg-secondary-500)`
- `#1976D2` → `var(--mg-secondary-600)`
- `#333333` → `var(--mg-gray-800)`
- `#666666` → `var(--mg-gray-600)`
- `#999999` → `var(--mg-gray-500)`
- `#e0e0e0` → `var(--mg-gray-300)`
- `#f8f9fa` → `var(--mg-gray-100)`
- `#f5f5f5` → `var(--mg-gray-100)`
- `#ffffff` → `var(--mg-white)`
- `#000000` → `var(--mg-black)`
- `#F5F5DC` → `var(--mg-cream)`
- `#FDF5E6` → `var(--mg-light-beige)`
- `#8B4513` → `var(--mg-cocoa)`
- `#808000` → `var(--mg-olive-green)`
- `#98FB98` → `var(--mg-mint-green)`
- `#B6E5D8` → `var(--mg-soft-mint)`
- `#5856d6` → `var(--mg-purple-500)`
- `#8b5cf6` → `var(--mg-purple-500)`
- `#a29bfe` → `var(--mg-consultant-primary)`
- `#f39c12` → `var(--mg-finance-primary)`
- `#e67e22` → `var(--mg-finance-dark)`
- `#3d5246` → `var(--mg-color-primary-main)`
- `#d4cfc8` → `var(--mg-color-border-main)`
- `#5c6b61` → `var(--mg-color-text-secondary)`
- `#faf9f7` → `var(--mg-color-background-main)`
- `#1a1a1a` → `var(--mg-dark-bg-900)`
- `#2c2c2c` → `var(--mg-dark-bg-800)`
- `#764ba2` → `var(--mg-gradient-primary-end)`
- `#1d1d1f` → `var(--mg-color-text-main)`
- `#0056b3` → `var(--mg-color-primary-dark)`
- `#87ceeb` → `var(--mg-info-500)`
- `#2c3e50` → `var(--mg-color-text-main)`
- `#6b7280` → `var(--mg-color-text-secondary)`
- `#1f2937` → `var(--mg-color-text-main)`
- `#f9fafb` → `var(--mg-color-background-main)`
- `#2563eb` → `var(--mg-color-info)`
- `#dc2626` → `var(--mg-color-error)`
- `#374151` → `var(--mg-color-text-secondary-dark)`
- `#4b5563` → `var(--mg-color-text-tertiary)`
- `#e5e7eb` → `var(--mg-color-border-main)`
- `#e9ecef` → `var(--mg-color-border-main)`
- `#495057` → `var(--mg-color-text-secondary)`
- `#fff` → `var(--mg-white)`
- `#666` → `var(--mg-color-text-secondary)`
- `#333` → `var(--mg-color-text-main)`
- `#f3f4f6` → `var(--mg-color-background-main)`
- `#f8fafc` → `var(--mg-color-background-main)`
- `#9ca3af` → `var(--mg-color-text-tertiary)`
- `#fef3c7` → `var(--mg-color-warning-bg)`
- `#fee2e2` → `var(--mg-color-error-bg)`
- `#e2e8f0` → `var(--mg-color-border-main)`
- `#d1d5db` → `var(--mg-color-border-main)`
- `#2d3748` → `var(--mg-color-text-main)`
- `#000` → `var(--mg-color-text-main)`
- `#ddd` → `var(--mg-color-border-main)`
- `#ccc` → `var(--mg-color-border-main)`
- `#bbb` → `var(--mg-color-text-tertiary)`
- `#aaa` → `var(--mg-color-text-tertiary)`
- `#999` → `var(--mg-color-text-tertiary)`
- `#eee` → `var(--mg-color-border-main)`
- `#f8d7da` → `var(--mg-color-error-bg)`
- `#fff3cd` → `var(--mg-color-warning-bg)`
- `#f0f9ff` → `var(--mg-color-info-bg)`
- `#1e40af` → `var(--mg-color-info-dark)`
- `#fef2f2` → `var(--mg-color-error-50)`
- `#991b1b` → `var(--mg-color-error-dark)`
- `#059669` → `var(--mg-color-success)`
- `#6b7c32` → `var(--mg-color-brand-olive)`
- `#9caf88` → `var(--mg-color-brand-olive-light)`
- `#d1fae5` → `var(--mg-color-success-100)`
- `#065f46` → `var(--mg-color-success-800)`
- `#fecaca` → `var(--mg-color-error-100)`
- `#dbeafe` → `var(--mg-color-info-100)`
- `#856404` → `var(--mg-color-warning-dark)`
- `#03c75a` → `var(--mg-color-naver-green)`
- `#03C75A` → `var(--mg-color-naver-green)`
- `#dee2e6` → `var(--mg-color-border-main)`
- `#DEE2E6` → `var(--mg-color-border-main)`
- `#721c24` → `var(--mg-color-error-dark)`
- `#721C24` → `var(--mg-color-error-dark)`
- `#d4edda` → `var(--mg-color-success-100)`
- `#D4EDDA` → `var(--mg-color-success-100)`
- `#1e3a8a` → `var(--mg-color-info-800)`
- `#1E3A8A` → `var(--mg-color-info-800)`
- `#1a202c` → `var(--mg-color-text-main)`
- `#1A202C` → `var(--mg-color-text-main)`
- `#4a5568` → `var(--mg-color-text-secondary-dark)`
- `#4A5568` → `var(--mg-color-text-secondary-dark)`
- `#92400e` → `var(--mg-color-warning-dark)`
- `#92400E` → `var(--mg-color-warning-dark)`
- `#1d4ed8` → `var(--mg-color-info-dark)`
- `#1D4ED8` → `var(--mg-color-info-dark)`

### RGB/RGBA 색상 변환  
- `rgb(0, 123, 255)` → `var(--mg-primary-500)`
- `rgb(40, 167, 69)` → `var(--mg-success-500)`
- `rgb(220, 53, 69)` → `var(--mg-error-500)`
- `rgb(255, 193, 7)` → `var(--mg-warning-500)`
- `rgb(23, 162, 184)` → `var(--mg-info-500)`
- `rgb(108, 117, 125)` → `var(--mg-secondary-500)`
- `rgba(255, 255, 255, 0.25)` → `var(--mg-glass-bg-light)`
- `rgba(255, 255, 255, 0.35)` → `var(--mg-glass-bg-medium)`
- `rgba(255, 255, 255, 0.45)` → `var(--mg-glass-bg-strong)`
- `rgba(0, 0, 0, 0.1)` → `var(--mg-shadow-light)`
- `rgba(0, 0, 0, 0.15)` → `var(--mg-shadow-medium)`
- `rgba(0, 0, 0, 0.5)` → `var(--mg-overlay)`

---

## 📋 다음 단계

1. **검증**: 변환된 파일들이 정상 동작하는지 확인
2. **테스트**: 전체 시스템 빌드 및 테스트 실행
3. **CSS 변수 정의**: 새로운 CSS 변수들이 실제로 정의되어 있는지 확인
4. **시각적 검토**: UI가 기존과 동일하게 표시되는지 확인

---

## 🚨 오류 목록

오류 없음 ✅

---

**💡 다음 실행**: `node scripts/validate-css-variables.js`로 CSS 변수 정의 확인
