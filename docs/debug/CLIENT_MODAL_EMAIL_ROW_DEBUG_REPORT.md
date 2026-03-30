# ClientModal 이메일 영역 수정 미적용 디버그 보고서

**일자**: 2026-03  
**현상**: 내담자 등록 모달에서 이메일 입력란을 크게·중복확인 버튼을 작게 수정했으나, **이메일 영역이 여전히 작게 보임** (수정이 안 됨).

---

## 1. 원인: CSS 덮어쓰기 (특이도 동일, 로드 순서로 공통 스타일이 우선)

### 1.1 ClientModal 측 스타일 (의도한 스타일)

**파일**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css`

- `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row`  
  → display: flex, align-items: center, gap: 12px, width: 100%
- `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-form-input`  
  → **flex: 1, min-width: 320px, padding: 10px 14px, font-size: 15px** (이메일 영역 크게)
- `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact`  
  → compact 버튼

ClientModal.js에서 `import './ClientModal.css'` 로 로드됨.

### 1.2 덮어쓰는 쪽: AdminDashboardB0KlA.css

**파일**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` (L981~989)

```css
.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-form-input {
  flex: 1;
}
```

- **선택자 특이도**: ClientModal.css와 **동일** (클래스 2개 + 1개).
- **나중에 번들에 포함되면** AdminDashboardB0KlA.css 규칙이 ClientModal.css를 덮어씀.
- 결과: 이메일 input에는 **flex: 1만** 적용되고, **min-width: 320px, padding, font-size**는 적용되지 않음.

---

## 2. 결론

| 구분 | 내용 |
|------|------|
| **원인** | AdminDashboardB0KlA.css의 `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-form-input { flex: 1; }` 가 ClientModal.css와 같은 선택자로 나중에 적용되어, 이메일 입력란 확대 스타일이 무시됨. |
| **해결** | ClientModal 전용 스타일이 **항상 우선**하도록 **선택자 특이도를 높인다**. (예: `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row` — ClientModal 구조상 .mg-v2-modal-body 안에만 폼이 있음) |

---

## 3. 수정 제안 (core-coder 적용)

ClientModal.css에서 이메일 행 관련 선택자를 **더 구체적인 경로**로 변경:

- `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row`  
  → `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row`
- `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-form-input`  
  → `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row .mg-v2-form-input`
- 버튼 관련도 동일하게 `.mg-modal__body .mg-v2-modal-body` 포함.

이렇게 하면 ClientModal(모달 본문에 .mg-v2-modal-body 사용)에서만 해당 스타일이 적용되고, AdminDashboardB0KlA.css의 공통 규칙보다 **특이도가 높아** 이메일 영역 확대·compact 버튼이 정상 적용됨.
