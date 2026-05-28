package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.dto.StaffRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantTransferRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;

/**
 * 관리자 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface AdminService {

    /**
     * 상담사 등록
     */
    User registerConsultant(ConsultantRegistrationRequest request);

    /**
     * 내담자 등록
     */
    Client registerClient(ClientRegistrationRequest request);

    /**
     * 스태프(사무원) 등록 - 신규 사용자 생성 후 role=STAFF 부여
     */
    User registerStaff(StaffRegistrationRequest request);

    /**
     * 상담사-내담자 매칭 생성
     */
    ConsultantClientMapping createMapping(ConsultantClientMappingCreateRequest request);

    /**
     * 모든 상담사 조회
     */
    List<User> getAllConsultants();
    
    /**
     * 모든 상담사 조회 (전문분야 상세 정보 포함)
     */
    List<Map<String, Object>> getAllConsultantsWithSpecialty();
    
    /**
     * 휴무 정보를 포함한 상담사 목록 조회 (관리자 스케줄링용)
     */
    List<Map<String, Object>> getAllConsultantsWithVacationInfo(String date);

    /**
     * 모든 내담자 조회
     */
    List<Client> getAllClients();

    /**
     * 통합 내담자 데이터 조회 (매칭 정보, 결제 상태, 남은 세션 등 포함)
     */
    List<Map<String, Object>> getAllClientsWithMappingInfo();

    /**
     * 모든 매칭 조회
     */
    List<ConsultantClientMapping> getAllMappings();

    /**
     * 상담사·내담자 쌍 중 {@code fromDate}(포함) 이후 점유 상담 일정이 있는 쌍의 키 집합
     * ({@code consultantId + "_" + clientId}). 통합 스케줄 «일정 등록» 중복 진입 방지용.
     */
    Set<String> getConsultantClientKeysWithOccupyingSchedulesOnOrAfter(String tenantId, LocalDate fromDate);

    /**
     * 상담사 정보 수정
     */
    User updateConsultant(Long id, ConsultantRegistrationRequest request);

    /**
     * 상담사 등급 업데이트
     */
    User updateConsultantGrade(Long id, String grade);

    /**
     * 내담자 정보 수정
     */
    Client updateClient(Long id, ClientRegistrationRequest request);

    /**
     * 매칭 정보 수정
     */
    ConsultantClientMapping updateMapping(Long id, ConsultantClientMappingCreateRequest request, String updatedBy);

    /**
     * 상담사 삭제 (USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5 — 7일 보존 윈도우 진입).
     *
     * <p>Phase 2-β 정착(v1.1) 이후 본 메서드는 하드/소프트 삭제를 직접 수행하지 않고
     * {@code UserLifecycleService.transitionTo(..., DELETED_BY_ADMIN, ...)} 단일 진입점으로
     * 위임한다. 활성 매핑·미래 스케줄 가드는 기존대로 유지한다.</p>
     *
     * @param id            대상 상담사 users.id
     * @param adminUserId   강제 종료를 수행한 어드민 users.id (감사 추적 필수)
     * @param adminRoleCode 어드민 행위자 role 코드 (예: ADMIN / HQ_ADMIN / BRANCH_SUPER_ADMIN)
     * @param reason        강제 종료 사유 (audit_logs / destruction_logs 적재, 필수)
     */
    void deleteConsultant(Long id, Long adminUserId, String adminRoleCode, String reason);

    /**
     * 상담사 삭제 — 레거시 시그니처(기본 reason 자동 채움) 호환 위임.
     *
     * @deprecated Phase 2-β 이후 모든 호출은 {@link #deleteConsultant(Long, Long, String, String)}
     *     을 사용해야 한다. 본 시그니처는 컨트롤러 마이그레이션 동안 후방 호환만 유지하며,
     *     adminUserId/reason 누락 시 audit 추적이 약화되므로 호출 금지.
     */
    @Deprecated
    void deleteConsultant(Long id);

    /**
     * 상담사 삭제 (다른 상담사로 이전 포함)
     */
    void deleteConsultantWithTransfer(Long consultantId, Long transferToConsultantId, String reason);
    
    /**
     * 상담사 삭제 가능 여부 확인
     */
    Map<String, Object> checkConsultantDeletionStatus(Long consultantId);

    /**
     * 내담자 삭제 (USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5 — 7일 보존 윈도우 진입).
     *
     * <p>Phase 2-β 정착(v1.1) 이후 본 메서드는 하드/소프트 삭제를 직접 수행하지 않고
     * {@code UserLifecycleService.transitionTo(..., DELETED_BY_ADMIN, ...)} 단일 진입점으로
     * 위임한다. 활성 매핑·결제 대기·미래 스케줄 가드는 기존대로 유지한다.</p>
     *
     * @param id            대상 내담자 users.id
     * @param adminUserId   강제 종료를 수행한 어드민 users.id (감사 추적 필수)
     * @param adminRoleCode 어드민 행위자 role 코드 (예: ADMIN / HQ_ADMIN / STAFF / BRANCH_SUPER_ADMIN)
     * @param reason        강제 종료 사유 (audit_logs / destruction_logs 적재, 필수)
     */
    void deleteClient(Long id, Long adminUserId, String adminRoleCode, String reason);

    /**
     * 내담자 삭제 — 레거시 시그니처(기본 reason 자동 채움) 호환 위임.
     *
     * @deprecated Phase 2-β 이후 모든 호출은 {@link #deleteClient(Long, Long, String, String)}
     *     을 사용해야 한다. 본 시그니처는 컨트롤러 마이그레이션 동안 후방 호환만 유지하며,
     *     adminUserId/reason 누락 시 audit 추적이 약화되므로 호출 금지.
     */
    @Deprecated
    void deleteClient(Long id);
    
    /**
     * 내담자 삭제 가능 여부 확인
     */
    Map<String, Object> checkClientDeletionStatus(Long clientId);

    /**
     * 매칭 삭제
     */
    void deleteMapping(Long id);
    
    /**
     * 매칭 강제 종료 (환불 처리)
     */
    void terminateMapping(Long id, String reason);
    
    /**
     * 부분 환불 처리 (지정된 회기수만 환불)
     */
    void partialRefundMapping(Long id, int refundSessions, String reason);
    
    /**
     * 환불 통계 조회
     */
    Map<String, Object> getRefundStatistics(String period);
    
    /**
     * 환불 통계 조회 (지점별 필터링)
     */
    /**
     * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
     */
    @Deprecated
    Map<String, Object> getRefundStatistics(String period, String branchCode);
    
    /**
     * 환불 이력 조회
     */
    Map<String, Object> getRefundHistory(int page, int size, String period, String status);
    
    /**
     * 환불 이력 조회 (지점별 필터링)
     */
    /**
     * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
     */
    @Deprecated
    Map<String, Object> getRefundHistory(int page, int size, String period, String status, String branchCode);
    
    /**
     * ERP 동기화 상태 확인
     */
    Map<String, Object> getErpSyncStatus();
    
    // ==================== 휴가 통계 ====================
    
    /**
     * 상담사별 휴가 통계 조회
     */
    Map<String, Object> getConsultantVacationStats(String period);
    
    /**
     * 지점별 상담사 휴가 통계 조회
     */
    /**
     * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
     */
    @Deprecated
    Map<String, Object> getConsultantVacationStatsByBranch(String period, String branchCode);
    
    /**
     * 지점별 상담 완료 건수 통계 조회
     */
    /**
     * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
     */
    @Deprecated
    List<Map<String, Object>> getConsultationCompletionStatisticsByBranch(String period, String branchCode);

    // ==================== 입금 승인 시스템 ====================

    /**
     * 입금 확인 처리
     */
    ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference, Long paymentAmount);

    /**
     * 결제 확인 처리 (미수금 상태)
     */
    ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference);

    /**
     * 입금 확인 처리 (현금 수입)
     */
    ConsultantClientMapping confirmDeposit(Long mappingId, String depositReference);
    
    /**
     * 상담료 수입 거래 자동 생성 (독립적인 트랜잭션에서 실행)
     * 트랜잭션 커밋 후 별도로 호출하여 부모 트랜잭션에 영향을 주지 않음
     */
    void createConsultationIncomeTransactionAsync(ConsultantClientMapping mapping);

    /**
     * 관리자 승인
     */
    ConsultantClientMapping approveMapping(Long mappingId, String adminName);

    /**
     * 옵션 B (예약 우선 매칭) — 당일 카드 결제 단일 트랜잭션 진입점.
     * <p>
     * confirmPayment + confirmDeposit + approveMapping을 자동 연속 호출하여 매핑 상태를
     * PENDING_PAYMENT → PAYMENT_CONFIRMED → DEPOSIT_PENDING → ACTIVE로 전이시킨다.
     * confirmDeposit 직후 finalizeTentativeSchedulesAfterDepositConfirmed가 호출되어
     * TENTATIVE_PENDING_PAYMENT 가예약 일정 1건이 BOOKED로 전환되고 회기 1회가 즉시 차감된다.
     * (단회기 패키지: 잔여 0 + SESSIONS_EXHAUSTED 자동 전이 / n회 패키지: 잔여 n-1 + ACTIVE)
     *
     * @param mappingId 대상 매핑 ID
     * @param paymentMethod 결제 방식 (신용카드/체크카드/기타)
     * @param paymentReference 결제 승인번호 또는 참조
     * @param paymentAmount 결제 금액
     * @param sameDaySessionScheduleId 당일 가예약 일정 ID (nullable — 가예약 없이 회기 부여만 가능)
     * @return 최종 ACTIVE 또는 SESSIONS_EXHAUSTED 상태 매핑 (회기 카운터 반영)
     */
    ConsultantClientMapping checkoutSameDayCard(Long mappingId, String paymentMethod,
            String paymentReference, Long paymentAmount, Long sameDaySessionScheduleId);

    /**
     * 관리자 거부
     */
    ConsultantClientMapping rejectMapping(Long mappingId, String reason);

    /**
     * 회기 사용 처리
     */
    ConsultantClientMapping useSession(Long mappingId);

    /**
     * 회기 추가 (연장)
     */
    ConsultantClientMapping extendSessions(Long mappingId, Integer additionalSessions, String packageName, Long packagePrice);

    // ==================== 매칭 상태별 조회 ====================

    /**
     * 입금 대기 중인 매칭 목록 조회
     */
    List<ConsultantClientMapping> getPendingPaymentMappings();

    /**
     * 입금 확인된 매칭 목록 조회
     */
    List<ConsultantClientMapping> getPaymentConfirmedMappings();

    /**
     * 입금 확인 대기 중인 매칭 목록 조회 (결제 확인 완료, 입금 확인 대기)
     */
    List<ConsultantClientMapping> getPendingDepositMappings();

    /**
     * 활성 매칭 목록 조회 (승인 완료)
     */
    List<ConsultantClientMapping> getActiveMappings();

    /**
     * 회기 소진된 매칭 목록 조회
     */
    List<ConsultantClientMapping> getSessionsExhaustedMappings();

    /**
     * 회기관리 통계 조회
     */
    Map<String, Object> getSessionStatistics();

    /**
     * 회기관리 목록 조회
     */
    List<Map<String, Object>> getSessions();

    /**
     * 상담사별 매칭 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByConsultantId(Long consultantId);
    /**
     * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
     */
    @Deprecated
    List<ConsultantClientMapping> getMappingsByConsultantId(Long consultantId, String branchCode);
    
    /**
     * 상담사 이메일로 매칭 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByConsultantEmail(String consultantEmail);

    /**
     * 내담자별 매칭 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByClient(Long clientId);

    /**
     * 개별 매칭 조회
     */
    ConsultantClientMapping getMappingById(Long mappingId);

    /**
     * 옵션 B (예약 우선 매칭) — 결제 전 매핑의 가예약/대기 일정 목록 조회.
     * <p>
     * CheckoutSameDayModal의 일정 선택 드롭다운에서 사용된다.
     * 테넌트 격리(tenantId)를 적용하고, mapping_id 일치 또는 legacy(null mapping_id + 동일 상담사·내담자)도 포함한다.
     *
     * @param mappingId 대상 매핑 ID
     * @return TENTATIVE_PENDING_PAYMENT/BOOKED 상태의 일정 목록 (date asc, startTime asc)
     */
    List<com.coresolution.consultation.entity.Schedule> getPendingSchedulesForMapping(Long mappingId);

    // ==================== 상담사 변경 시스템 ====================

    /**
     * 상담사 변경 처리
     */
    ConsultantClientMapping transferConsultant(ConsultantTransferRequest request);

    /**
     * 내담자별 상담사 변경 이력 조회
     */
    List<ConsultantClientMapping> getTransferHistory(Long clientId);

    /**
     * 상담사별 스케줄 조회
     */
    List<Map<String, Object>> getSchedulesByConsultantId(Long consultantId);

    /**
     * 상담사별 상담 완료 건수 통계 조회
     */
    List<Map<String, Object>> getConsultationCompletionStatistics(String period);

    /**
     * 최근 N개월 월별 상담 완료 건수 추이 (전체 상담사 합계, tenantId 기준)
     *
     * @param lastMonths 최근 개월 수 (예: 6)
     * @return period("YYYY-MM"), completedCount 포함 Map 리스트 (과거→현재 순)
     */
    List<Map<String, Object>> getConsultationMonthlyTrend(int lastMonths);

    /**
     * 최근 N주 주간 상담 완료 건수 추이 (전체 상담사 합계, tenantId 기준)
     *
     * @param lastWeeks 최근 주 수 (예: 6)
     * @return period("MM/dd"), completedCount 포함 Map 리스트 (과거→현재 순)
     */
    List<Map<String, Object>> getConsultationWeeklyTrend(int lastWeeks);

    /**
     * 해당 월의 테넌트 전체 완료율 조회 (해당 월 스케줄 중 완료 건수 / 해당 월 전체 스케줄)
     * TenantContextHolder의 tenantId 사용.
     *
     * @param year  연도
     * @param month 월 (1–12)
     * @return 완료율 (0–100, 소수 첫째자리)
     */
    double getCompletionRateForMonth(int year, int month);

    /**
     * 모든 스케줄 조회
     */
    List<Map<String, Object>> getAllSchedules();

    /**
     * 스케줄 상태별 통계 조회
     */
    Map<String, Object> getScheduleStatistics();
    
    /**
     * 스케줄 상태별 통계 조회 (지점별 필터링)
     */
    /**
     * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
     */
    @Deprecated
    Map<String, Object> getScheduleStatisticsByBranch(String branchCode);
    
    /**
     * 스케줄 자동 완료 처리 (상담일지 미작성 시 메시지 발송 포함)
     */
    Map<String, Object> autoCompleteSchedulesWithReminder();
    
    /**
     * 사용자 목록 조회
     */
    /**
     * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
     */
    @Deprecated
    List<User> getUsers(boolean includeInactive, String role, String branchCode);
    
    /**
     * 사용자 ID로 사용자 조회
     */
    User getUserById(Long id);
    
    /**
     * 사용자 역할 변경
     */
    User changeUserRole(Long userId, String newRole);

    /**
     * 관리자(ADMIN) 계정의 상담 겸직(counseling_enabled) 플래그를 설정합니다.
     *
     * @param userId 사용자 PK
     * @param counselingEnabled 겸직 여부
     * @return 저장된 사용자
     */
    User updateCounselingEnabled(Long userId, boolean counselingEnabled);
    
    /**
     * 중복 매칭 통합
     */
    Map<String, Object> mergeDuplicateMappings();
    
    /**
     * 중복 매칭 조회
     */
    List<Map<String, Object>> findDuplicateMappings();
}
