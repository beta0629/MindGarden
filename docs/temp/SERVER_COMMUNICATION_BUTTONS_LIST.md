# 서버 통신 버튼 → MGButton 변경 대상 목록

검색 일자: 2026-03-04  
목적: API 호출하는 모든 버튼을 MGButton으로 통일 (2중클릭 방지, 로딩 표시)

---

## StandardizedApi 사용

| 파일 | 라인 | 버튼 설명 | API |
|------|------|-----------|-----|
| PsychAssessmentManagement.js | 292 | 새로고침 | get |
| PsychAssessmentManagement.js | 325-326 | (PsychUploadSection 등으로 전달) | postFormData, post, get |
| PsychUploadSection.js | 257 | 업로드 | postFormData |
| PsychDocumentListBlock.js | 75, 119 | 리포트 보기 (테이블/카드) | onViewReport → get |
| MappingManagementPage.js | 577 | 환불 처리 | post |
| PackagePricingListPage.js | 164 | 활성/비활성 토글 | put |
| PackagePricingDetailPage.js | 312 | 저장 | post/put |
| ScheduleModal.js | 341 | 스케줄 생성 | post |
| MappingEditModal.js | 239 | 수정 완료 | fetch PUT |
| AdminDashboardV2.js | 992, 1007, 1206 | 스케줄 자동완료, 완료+알림, 중복매칭 통합 | fetch/csrfTokenManager |
| AdminDashboard.js | 1243, 1250 | 스케줄 자동완료, 완료+알림 | csrfTokenManager.post |

## fetch / form submit

| 파일 | 라인 | 버튼 설명 |
|------|------|-----------|
| BranchMappingModal.js | 156 | 지점 매핑 제출 |
| AccountForm.js | 152 | 계좌 등록/수정 제출 |
| AccountTable.js | 109, 117, 126, 135 | 수정, 활성토글, 주계좌, 삭제 |
| PaymentConfirmationModal.js | 310, 319 | 결제 취소, 결제 확인 |
| ApiPerformanceMonitoring.js | 92, 104 | 보고서 다운로드, 통계 초기화 |
| SocialSignupModal.js | 629 | 회원가입/지점 매핑 제출 |

## axios

| 파일 | 라인 | 버튼 설명 |
|------|------|-----------|
| QuickExpenseForm.js | 177 | 빠른 지출 등록 |
| FinancialTransactionForm.js | 124 | 수입/지출 등록 |
| WidgetBasedAdminDashboard.js | 244 | 위젯 삭제 |
| SalaryConfigModal.js | 255 | 저장 |

## 기타 (모달 내 확인)

| 파일 | 설명 |
|------|------|
| ClientComprehensiveManagement.js | 비밀번호 초기화 확인 |
| ConsultantComprehensiveManagement.js | 비밀번호 초기화 확인 |

---

**참고**: PsychDocumentListBlock의 "리포트 생성"은 이미 MGButton 적용됨. "리포트 보기"는 버튼 → MGButton 변경 대상.
