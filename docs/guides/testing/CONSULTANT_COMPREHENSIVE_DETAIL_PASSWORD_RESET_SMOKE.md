# ConsultantComprehensiveManagement — 상세 조회 모달 비밀번호 초기화 수동 스모크

**대상**: 관리자 `ConsultantComprehensiveManagement` — `modalType === 'view'`(상담사 상세 정보)  
**스펙 SSOT**: `docs/project-management/2026-04-22/CONSULTANT_DETAIL_PASSWORD_RESET_SPEC.md`  
**목적**: 상세 모달 푸터에서 비밀번호 초기화 진입·`PasswordResetModal` 스택·취소/성공/실패 UX를 `core-coder` 구현 후 검증한다.  
**비고**: API 변경 없음. 검증 API: `PUT /api/v1/admin/user-management/{id}/reset-password`.

---

## 사전 조건

- [ ] **ADMIN**(또는 해당 화면·비밀번호 초기화 API 호출 권한) 계정으로 로그인
- [ ] 개발/스테이징 등 **비운영** 환경
- [ ] (권장) 브라우저 **네트워크** 탭 — 필터 `Fetch/XHR`
- [ ] 비밀번호 초기화를 시도해도 되는 **테스트용 상담사** 1명

---

## 체크리스트

1. [ ] 상담사 **상세 조회** 모달을 연다.
2. [ ] 푸터 버튼 **순서(좌→우)**: `닫기` → `비밀번호 초기화` → `수정`; `수정`만 primary, 나머지 secondary인지 확인한다.
3. [ ] `비밀번호 초기화` 클릭 시 **상세 모달 유지** + `PasswordResetModal`이 위에 열리는지 확인한다.
4. [ ] 비밀번호 모달에서 **취소/닫기** 시 비밀번호 모달만 닫히고 상세 모달은 열린 채인지 확인한다.
5. [ ] 초기화 **확정** 시 `PUT .../user-management/{id}/reset-password`가 **2xx**이고 **성공 토스트(또는 표준 성공 피드백)**가 표시되는지 확인한다.
6. [ ] 성공 후에도 **상세 조회 모달은 닫히지 않고** 목록 이탈이 없는지 확인한다.
7. [ ] API **실패**(403/500 등) 시 **에러 피드백**이 표시되고, **상세 모달은 유지**되는지 확인한다(비밀번호 모달 동작은 기존 패턴과 일치하는지).
8. [ ] `PasswordResetModal` 문구가 **상담사(`consultant`)** 맥락에 맞고, 버튼 라벨이 목록과 **동일 상수 체계**인지 확인한다.

---

## 자동화 후보 (선택)

- **경로**: `tests/e2e/tests/admin/consultant-comprehensive-detail-password-reset.spec.ts`
- **시나리오 한 줄**: 상담사 종합 관리 — 상세 조회 모달에서 비밀번호 초기화 모달 오픈·닫기 및 reset-password API 호출

데이터·권한 의존도가 높으면 E2E보다 **본 수동 스모크를 릴리스 게이트**로 우선한다.
