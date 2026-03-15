# 스태프 등록 화면 기획 정리

**작성일**: 2026-02  
**목적**: 내담자/상담사와 동일하게 "스태프 신규 등록" 화면 필요 여부 확인 및 구현 방향.

---

## 1. 현행 비교

| 구분 | 내담자 | 상담사 | 스태프 (현재) |
|------|--------|--------|----------------|
| **목록 탭** | 있음 (ClientComprehensiveManagement) | 있음 (ConsultantComprehensiveManagement) | 있음 (StaffManagement) |
| **신규 등록** | 있음 – "새 내담자 등록" → 모달 폼 → POST /api/v1/admin/clients | 있음 – "새 상담사 등록" → 모달 폼 → POST /api/v1/admin/consultants | **없음** |
| **역할 지정** | 기존 사용자 → 내담자로 변경 (해당 없음, 등록 시 CLIENT) | 기존 사용자 → 상담사로 변경 (해당 없음, 등록 시 CONSULTANT) | 있음 – "스태프로 지정" → 기존 사용자 선택 → PUT .../role?newRole=STAFF |

**갭**: 내담자·상담사는 **신규 계정 등록(이메일/이름/비밀번호 등 입력)** 이 있고, 스태프는 **기존 사용자를 STAFF로 바꾸는 기능만** 있어, **스태프 전용 “신규 등록” 화면이 없음.**

---

## 2. 기획 결론

- **스태프 등록 화면이 필요함.**  
  - 내담자/상담사와 동일하게, **이메일·이름·비밀번호·전화번호** 등으로 **새 사용자를 STAFF 역할로 생성**하는 경로가 있어야 함.
- **구현 방향**
  - **백엔드**: POST /api/v1/admin/staff 추가 (StaffRegistrationRequest DTO, AdminService.registerStaff → User with role STAFF).
  - **프론트**: 사용자 관리 > 스태프 탭에 **「새 스태프 등록」** 버튼 + 등록 모달(내담자/상담사 등록과 유사한 최소 폼) + POST /api/v1/admin/staff 연동.

---

## 3. 참조

- `docs/troubleshooting/STAFF_ACCOUNT_GAP_ANALYSIS.md`
- 내담자 등록: POST /api/v1/admin/clients, ClientRegistrationRequest, AdminServiceImpl.registerClient
- 상담사 등록: POST /api/v1/admin/consultants, ConsultantRegistrationRequest, AdminServiceImpl.registerConsultant
