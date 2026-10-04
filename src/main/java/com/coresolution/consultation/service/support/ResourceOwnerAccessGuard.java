package com.coresolution.consultation.service.support;

import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.entity.Account;
import com.coresolution.consultation.entity.Budget;
import com.coresolution.consultation.entity.ConsultantAvailability;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Item;
import com.coresolution.consultation.entity.MultimodalEmotionReport;
import com.coresolution.consultation.entity.PurchaseOrder;
import com.coresolution.consultation.entity.PurchaseRequest;
import com.coresolution.consultation.entity.RecurringExpense;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.settlement.Settlement;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.AccountRepository;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.BudgetRepository;
import com.coresolution.consultation.repository.ConsultantAvailabilityRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ItemRepository;
import com.coresolution.consultation.repository.MultimodalEmotionReportRepository;
import com.coresolution.consultation.repository.PurchaseOrderRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.repository.RecurringExpenseRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.erp.accounting.AccountingEntryRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.repository.erp.settlement.SettlementRepository;
import com.coresolution.consultation.util.ServerErrorResponses;
import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.repository.ErdDiagramRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataAccessException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 자원 id(문서·평가·상담기록·음성파일·리포트·가용시간·재무 거래·ERP 조달/예산/반복 지출·정산·할인 매핑·상담사 급여·ERD)로
 * 접근하는 API 의 소유자 가드.
 *
 * <p>자원을 세션 테넌트 범위로 먼저 읽고, 그 소유 내담자/상담사에 {@link ClientPathAccessGuard} 와
 * 같은 규칙(내담자 본인 · 매칭 상담사 · 같은 테넌트 관리자/사무원)을 적용한다. 소유자가 테넌트 자체인 ERP 자원은
 * 테넌트 범위 조회까지만 하고, 역할 검사는 해당 컨트롤러의 기존 ERP 권한 검사에 맡긴다.</p>
 *
 * <p>자원 id 로 인한 거부는 사유와 무관하게 하나의 문구({@link #DENIAL_RESOURCE_UNAVAILABLE})로 403 을
 * 돌려준다. 없는 자원·타인 자원·조회 실패가 서로 다른 상태 코드나 문구로 구분되면 그 자체가 존재 여부를
 * 드러내기 때문이다. 조회 중 DB 오류가 나도 500 으로 흘리지 않고 같은 403 으로 거부하며, 원인 예외는
 * 추적 id 와 함께 로그에만 남긴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ResourceOwnerAccessGuard {

    /** 자원 id 기반 거부 공통 문구 (없음·타인·조회 실패를 구분하지 않는다) */
    public static final String DENIAL_RESOURCE_UNAVAILABLE = "접근할 수 없는 자료입니다.";
    public static final String DENIAL_CLIENT_RATING_ONLY = "내담자 본인만 평가를 등록할 수 있습니다.";

    private final ClientPathAccessGuard clientPathAccessGuard;
    private final PsychAssessmentDocumentRepository psychDocumentRepository;
    private final ConsultantRatingRepository ratingRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final ConsultationAudioFileRepository audioFileRepository;
    private final MultimodalEmotionReportRepository multimodalReportRepository;
    private final ConsultantAvailabilityRepository availabilityRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final ItemRepository itemRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ConsultantSalaryProfileRepository salaryProfileRepository;
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final ErdDiagramRepository erdDiagramRepository;
    private final AccountingEntryRepository accountingEntryRepository;
    private final AccountRepository accountRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final SettlementRepository settlementRepository;
    private final ObjectProvider<BranchRepository> branchRepositoryProvider;

    /**
     * 심리검사 문서(및 그 리포트) 접근 검증. 내담자 미지정 문서는 같은 테넌트 관리자·사무원만.
     *
     * @param session    HTTP 세션
     * @param documentId 문서 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 문서가 없거나 소유 내담자에 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public User requirePsychDocumentAccess(HttpSession session, Long documentId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        PsychAssessmentDocument document = load(caller, "documentId", documentId,
            () -> psychDocumentRepository.findByTenantIdAndId(tenantId, documentId));
        if (document.getClientId() == null) {
            if (!clientPathAccessGuard.isTenantManager(caller)) {
                throw denyResource(caller, "documentId", documentId);
            }
            return caller;
        }
        assertClientAccess(caller, document.getClientId(), "documentId", documentId);
        return caller;
    }

    /**
     * 평가 등록 검증. 세션 내담자 본인만 등록할 수 있다.
     *
     * @param session           HTTP 세션
     * @param requestedClientId 요청 본문 clientId (null 이면 세션 내담자로 강제)
     * @return 평가를 등록할 내담자 ID (세션 사용자 ID)
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 내담자가 아니거나 요청 clientId 가 세션 사용자와 다를 때
     */
    public Long requireRatingSubmitter(HttpSession session, Long requestedClientId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        if (!caller.getRole().isClient()) {
            ClientPathAccessGuard.deny(DENIAL_CLIENT_RATING_ONLY, caller, "clientId", requestedClientId);
        }
        if (requestedClientId != null && !Objects.equals(caller.getId(), requestedClientId)) {
            ClientPathAccessGuard.deny(DENIAL_CLIENT_RATING_ONLY, caller, "clientId", requestedClientId);
        }
        return caller.getId();
    }

    /**
     * 평가 변경·삭제 검증. 작성 내담자 본인, {@code allowManager} 이면 같은 테넌트 관리자·사무원도 허용.
     *
     * @param session           HTTP 세션
     * @param ratingId          평가 ID
     * @param requestedClientId 요청 clientId (null 허용. 값이 있으면 평가 작성자와 같아야 함)
     * @param allowManager      관리자·사무원 허용 여부
     * @return 평가 작성 내담자 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 평가가 없거나 작성자·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public Long requireRatingOwner(HttpSession session, Long ratingId, Long requestedClientId,
            boolean allowManager) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultantRating rating = load(caller, "ratingId", ratingId,
            () -> ratingRepository.findByTenantIdAndId(tenantId, ratingId));
        Long ownerId = rating.getClient() != null ? rating.getClient().getId() : null;
        if (ownerId == null) {
            throw denyResource(caller, "ratingId", ratingId);
        }
        if (requestedClientId != null && !Objects.equals(ownerId, requestedClientId)) {
            throw denyResource(caller, "ratingId", ratingId);
        }
        boolean owner = caller.getRole().isClient() && Objects.equals(caller.getId(), ownerId);
        boolean manager = allowManager && clientPathAccessGuard.isTenantManager(caller);
        if (!owner && !manager) {
            throw denyResource(caller, "ratingId", ratingId);
        }
        return ownerId;
    }

    /**
     * 상담 기록 id 기반 감정 분석 접근 검증 (기록의 내담자에 본인·매칭·관리자 규칙 적용).
     *
     * @param session              HTTP 세션
     * @param consultationRecordId 상담 기록 ID
     * @return 테넌트 범위로 조회한 상담 기록
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 기록이 없거나 기록의 내담자에 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public ConsultationRecord requireConsultationRecordAccess(HttpSession session, Long consultationRecordId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        return loadAccessibleRecord(caller, consultationRecordId);
    }

    /**
     * {@link #requireConsultationRecordAccess} + 기록의 내담자가 경로 내담자와 같은지 검증.
     *
     * @param session              HTTP 세션
     * @param consultationRecordId 상담 기록 ID
     * @param clientId             경로 내담자 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 접근 불가 또는 기록 내담자 불일치
     */
    @Transactional(readOnly = true)
    public void requireConsultationRecordOfClient(HttpSession session, Long consultationRecordId, Long clientId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        ConsultationRecord record = loadAccessibleRecord(caller, consultationRecordId);
        if (!Objects.equals(record.getClientId(), clientId)) {
            throw denyResource(caller, "consultationRecordId", consultationRecordId);
        }
    }

    /**
     * 상담 음성 파일 id 기반 접근 검증.
     *
     * @param session     HTTP 세션
     * @param audioFileId 음성 파일 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 파일·기록이 없거나 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public void requireAudioFileAccess(HttpSession session, Long audioFileId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationAudioFile audioFile = load(caller, "audioFileId", audioFileId,
            () -> audioFileRepository.findByTenantIdAndId(tenantId, audioFileId));
        loadAccessibleRecord(caller, audioFile.getConsultationRecordId());
    }

    /**
     * 멀티모달 감정 리포트 id 기반 접근 검증.
     *
     * @param session  HTTP 세션
     * @param reportId 리포트 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 리포트·기록이 없거나 접근할 수 없을 때
     */
    @Transactional(readOnly = true)
    public void requireMultimodalReportAccess(HttpSession session, Long reportId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        MultimodalEmotionReport report = load(caller, "reportId", reportId,
            () -> multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, reportId));
        loadAccessibleRecord(caller, report.getConsultationRecordId());
    }

    /**
     * 상담 가능 시간 id 기반 변경 검증 (해당 상담사 본인 또는 같은 테넌트 관리자·사무원).
     *
     * @param session        HTTP 세션
     * @param availabilityId 상담 가능 시간 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 자원이 없거나 소유 상담사·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public void requireAvailabilityWrite(HttpSession session, Long availabilityId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultantAvailability availability = load(caller, "availabilityId", availabilityId,
            () -> availabilityRepository.findByTenantIdAndId(tenantId, availabilityId));
        assertConsultantAccess(caller, availability.getConsultantId(), "availabilityId", availabilityId);
    }

    /**
     * 재무 거래 id 기반 접근 검증 (같은 테넌트 관리자·사무원만).
     *
     * @param session       HTTP 세션
     * @param transactionId 거래 ID
     * @return 테넌트 범위로 조회한 거래
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 거래가 없거나 관리자·사무원이 아닐 때
     */
    @Transactional(readOnly = true)
    public FinancialTransaction requireFinancialTransactionAccess(HttpSession session, Long transactionId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        FinancialTransaction transaction = load(caller, "transactionId", transactionId,
            () -> financialTransactionRepository.findByTenantIdAndId(tenantId, transactionId));
        if (!clientPathAccessGuard.isTenantManager(caller)) {
            throw denyResource(caller, "transactionId", transactionId);
        }
        return transaction;
    }

    /**
     * 상담사 id 로 읽는 자원(급여 프로필·급여 계산 등) 접근 검증. 상담사 본인 또는 같은 테넌트 관리자·사무원.
     *
     * @param session      HTTP 세션
     * @param consultantId 상담사 ID
     * @return 세션 사용자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 테넌트 내 상담사가 아니거나 본인·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public User requireConsultantResourceAccess(HttpSession session, Long consultantId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        if (consultantId == null) {
            throw denyResource(caller, "consultantId", null);
        }
        assertConsultantAccess(caller, consultantId, "consultantId", consultantId);
        return caller;
    }

    /**
     * ERP 아이템 id 기반 접근 검증 (세션 테넌트의 활성 아이템만).
     *
     * @param session HTTP 세션
     * @param itemId  아이템 ID
     * @return 테넌트 범위로 조회한 아이템
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 아이템이 없을 때
     */
    @Transactional(readOnly = true)
    public Item requireErpItemAccess(HttpSession session, Long itemId) {
        return loadInCallerTenant(session, "itemId", itemId,
            tenantId -> itemRepository.findByTenantIdAndIdAndActive(tenantId, itemId));
    }

    /**
     * 구매 요청 id 기반 접근 검증 (세션 테넌트 범위).
     *
     * @param session           HTTP 세션
     * @param purchaseRequestId 구매 요청 ID
     * @return 테넌트 범위로 조회한 구매 요청
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 구매 요청이 없을 때
     */
    @Transactional(readOnly = true)
    public PurchaseRequest requirePurchaseRequestAccess(HttpSession session, Long purchaseRequestId) {
        return loadInCallerTenant(session, "purchaseRequestId", purchaseRequestId,
            tenantId -> purchaseRequestRepository.findByTenantIdAndIdWithDetails(tenantId, purchaseRequestId));
    }

    /**
     * 구매 주문 id 기반 접근 검증 (세션 테넌트 범위).
     *
     * @param session         HTTP 세션
     * @param purchaseOrderId 구매 주문 ID
     * @return 테넌트 범위로 조회한 구매 주문
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 구매 주문이 없을 때
     */
    @Transactional(readOnly = true)
    public PurchaseOrder requirePurchaseOrderAccess(HttpSession session, Long purchaseOrderId) {
        return loadInCallerTenant(session, "purchaseOrderId", purchaseOrderId,
            tenantId -> purchaseOrderRepository.findByTenantIdAndIdWithDetails(tenantId, purchaseOrderId));
    }

    /**
     * 예산 id 기반 접근 검증 (세션 테넌트 범위).
     *
     * @param session  HTTP 세션
     * @param budgetId 예산 ID
     * @return 테넌트 범위로 조회한 예산
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 예산이 없을 때
     */
    @Transactional(readOnly = true)
    public Budget requireBudgetAccess(HttpSession session, Long budgetId) {
        return loadInCallerTenant(session, "budgetId", budgetId,
            tenantId -> budgetRepository.findByTenantIdAndIdWithManager(tenantId, budgetId));
    }

    /**
     * 반복 지출 id 기반 접근 검증 (세션 테넌트 범위).
     *
     * @param session          HTTP 세션
     * @param recurringExpenseId 반복 지출 ID
     * @return 테넌트 범위로 조회한 반복 지출
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 반복 지출이 없을 때
     */
    @Transactional(readOnly = true)
    public RecurringExpense requireRecurringExpenseAccess(HttpSession session, Long recurringExpenseId) {
        return loadInCallerTenant(session, "recurringExpenseId", recurringExpenseId,
            tenantId -> recurringExpenseRepository.findByTenantIdAndId(tenantId, recurringExpenseId));
    }

    /**
     * 회계 분개 id 기반 접근 검증 (세션 테넌트 범위).
     *
     * @param session        HTTP 세션
     * @param journalEntryId 분개 ID
     * @return 테넌트 범위로 조회한 분개
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 분개가 없을 때
     */
    @Transactional(readOnly = true)
    public AccountingEntry requireJournalEntryAccess(HttpSession session, Long journalEntryId) {
        return loadInCallerTenant(session, "journalEntryId", journalEntryId,
            tenantId -> accountingEntryRepository.findByTenantIdAndId(tenantId, journalEntryId));
    }

    /**
     * 원장 계정 id 기반 접근 검증 (세션 테넌트 범위).
     *
     * @param session   HTTP 세션
     * @param accountId 계정 ID
     * @return 테넌트 범위로 조회한 계정
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 계정이 없을 때
     */
    @Transactional(readOnly = true)
    public Account requireLedgerAccountAccess(HttpSession session, Long accountId) {
        return loadInCallerTenant(session, "accountId", accountId,
            tenantId -> accountRepository.findByTenantIdAndId(tenantId, accountId));
    }

    /**
     * 매핑 id 기반 회계 자원(할인 회계 등) 접근 검증 (세션 테넌트 범위).
     *
     * @param session   HTTP 세션
     * @param mappingId 매핑 ID
     * @return 테넌트 범위로 조회한 매핑
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 매핑이 없을 때
     */
    @Transactional(readOnly = true)
    public ConsultantClientMapping requireMappingAccountingAccess(HttpSession session, Long mappingId) {
        return loadInCallerTenant(session, "mappingId", mappingId,
            tenantId -> mappingRepository.findByTenantIdAndId(tenantId, mappingId));
    }

    /**
     * 매핑 id 기반 관리자 전용 자원(할인 적용·환불·상태 변경, 적용 가능 할인 조회) 접근 검증.
     * 세션 테넌트 관리자만, 매핑이 세션 테넌트에 있을 때만 허용한다.
     *
     * @param session   HTTP 세션
     * @param mappingId 매핑 ID (요청 본문·파라미터 값. null 이면 거부)
     * @return 테넌트 범위로 조회한 매핑
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아니거나 세션 테넌트에 매핑이 없을 때
     */
    @Transactional(readOnly = true)
    public ConsultantClientMapping requireMappingAdminAccess(HttpSession session, Long mappingId) {
        User caller = requireTenantAdmin(session, "mappingId", mappingId);
        return loadMappingInCallerTenant(caller, mappingId);
    }

    /**
     * {@link #requireMappingAdminAccess} 와 같은 검증 후, 감사 필드(적용자·처리자·변경자)에 기록할 세션 관리자를 돌려준다.
     *
     * @param session   HTTP 세션
     * @param mappingId 매핑 ID (요청 본문 값. null 이면 거부)
     * @return 세션 관리자 (요청 본문의 작업자 값은 쓰지 않는다)
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아니거나 세션 테넌트에 매핑이 없을 때
     */
    @Transactional(readOnly = true)
    public User requireMappingAdminActor(HttpSession session, Long mappingId) {
        User caller = requireTenantAdmin(session, "mappingId", mappingId);
        loadMappingInCallerTenant(caller, mappingId);
        return caller;
    }

    /**
     * 감사 필드 문자열 값. 세션 사용자 id 를 쓴다 (승인자 id 기록과 같은 기준).
     *
     * @param actor 세션 사용자
     * @return 사용자 id 문자열
     */
    public static String auditActorOf(User actor) {
        return String.valueOf(actor.getId());
    }

    /**
     * 자원 id 없이 테넌트 전체를 읽거나 바꾸는 관리자 API(할인 통계·프로시저 상태·급여 배치 상태·급여 계산 방식 등) 검증.
     * 세션 테넌트 관리자만 허용하며, 서비스·프로시저 호출 전에 부른다.
     *
     * @param session HTTP 세션
     * @return 세션 관리자
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아니거나 세션 테넌트가 없을 때
     */
    public User requireTenantAdminAccess(HttpSession session) {
        return requireTenantAdmin(session, "tenantAdmin", null);
    }

    /**
     * 세션 테넌트 범위로 자원을 읽고 호출자 접근 가능 여부를 검사한다 (일정 등 자원별 접근 규칙을 서비스가 가진 자원용).
     * 없는 id·조회 실패·접근 불가를 모두 {@link #DENIAL_RESOURCE_UNAVAILABLE} 403 으로 수렴시킨다.
     *
     * @param session    HTTP 세션
     * @param field      로그용 필드 이름
     * @param resourceId 자원 ID
     * @param lookup     세션 테넌트 ID 로 자원을 찾는 함수
     * @param canAccess  읽은 자원에 호출자가 접근할 수 있는지
     * @param <T>        자원 타입
     * @return 접근 가능한 자원
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 자원이 없거나 접근할 수 없을 때
     */
    public <T> T requireAccessibleResource(HttpSession session, String field, Long resourceId,
            Function<String, Optional<T>> lookup, Predicate<T> canAccess) {
        User caller = clientPathAccessGuard.requireCaller(session);
        T resource = loadInCallerTenant(session, field, resourceId, lookup);
        if (!canAccess.test(resource)) {
            throw denyResource(caller, field, resourceId);
        }
        return resource;
    }

    /**
     * 지점 코드로 읽는 관리자 API(할인 무결성 검증 등) 검증. 세션 테넌트 관리자만, 지점이 세션 테넌트 소속일 때만 허용한다.
     * 지점 기능이 꺼져 있으면 거부한다.
     *
     * @param session    HTTP 세션
     * @param branchCode 요청 지점 코드 (null 이면 거부)
     * @return 세션 테넌트에서 확인한 지점 코드
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아니거나 세션 테넌트에 지점이 없을 때
     */
    @Transactional(readOnly = true)
    public String requireTenantBranchAdminAccess(HttpSession session, String branchCode) {
        User caller = requireTenantAdmin(session, "branchCode", branchCode);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        BranchRepository branchRepository = branchRepositoryProvider.getIfAvailable();
        if (branchRepository == null) {
            throw denyResource(caller, "branchCode", branchCode);
        }
        return load(caller, "branchCode", branchCode,
            () -> branchRepository.findByTenantIdAndBranchCodeAndIsDeletedFalse(tenantId, branchCode))
            .getBranchCode();
    }

    /**
     * 정산 승인 검증. 세션 테넌트 관리자만, 정산이 세션 테넌트에 있을 때만 허용한다.
     *
     * @param session      HTTP 세션
     * @param settlementId 정산 ID
     * @return 승인자(세션 사용자)
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아니거나 세션 테넌트에 정산이 없을 때
     */
    @Transactional(readOnly = true)
    public User requireSettlementApproval(HttpSession session, Long settlementId) {
        User caller = requireTenantAdmin(session, "settlementId", settlementId);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        load(caller, "settlementId", settlementId,
            () -> settlementRepository.findByTenantIdAndId(tenantId, settlementId));
        return caller;
    }

    /**
     * 급여 프로필 id 기반 접근 검증. 프로필의 상담사 본인 또는 같은 테넌트 관리자·사무원.
     *
     * @param session   HTTP 세션
     * @param profileId 급여 프로필 ID
     * @return 테넌트 범위로 조회한 급여 프로필
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 프로필이 없거나 본인·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public ConsultantSalaryProfile requireSalaryProfileAccess(HttpSession session, Long profileId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultantSalaryProfile profile = load(caller, "salaryProfileId", profileId,
            () -> salaryProfileRepository.findByTenantIdAndId(tenantId, profileId));
        assertConsultantAccess(caller, profile.getConsultantId(), "salaryProfileId", profileId);
        return profile;
    }

    /**
     * 급여 계산 id 기반 접근 검증. 계산의 상담사 본인 또는 같은 테넌트 관리자·사무원.
     *
     * @param session       HTTP 세션
     * @param calculationId 급여 계산 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 세션 테넌트에 계산이 없거나 본인·관리자가 아닐 때
     */
    @Transactional(readOnly = true)
    public void requireSalaryCalculationAccess(HttpSession session, Long calculationId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        SalaryCalculation calculation = load(caller, "calculationId", calculationId,
            () -> salaryCalculationRepository.findByTenantIdAndId(tenantId, calculationId));
        Long consultantId = calculation.getConsultant() != null ? calculation.getConsultant().getId() : null;
        assertConsultantAccess(caller, consultantId, "calculationId", calculationId);
    }

    /**
     * 테넌트 ERD 접근 검증. 세션 테넌트의 관리자만, 경로 테넌트가 세션 테넌트와 같을 때만 허용한다.
     *
     * @param session      HTTP 세션
     * @param pathTenantId 경로 테넌트 ID (세션 테넌트와 대조만 하고 조회 기준으로 쓰지 않는다)
     * @return 세션 테넌트 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아니거나 다른 테넌트 경로일 때
     */
    public String requireOwnTenantErdAccess(HttpSession session, String pathTenantId) {
        return assertOwnTenantAdmin(clientPathAccessGuard.requireCaller(session), pathTenantId);
    }

    /**
     * 테넌트 ERD 다이어그램 접근 검증. {@link #requireOwnTenantErdAccess} + 다이어그램이 세션 테넌트 소유이거나
     * 테넌트 없는 공개 다이어그램일 때만 허용한다.
     *
     * @param session      HTTP 세션
     * @param pathTenantId 경로 테넌트 ID
     * @param diagramId    다이어그램 ID
     * @throws UnauthorizedException 로그인 사용자가 없을 때
     * @throws AccessDeniedException 관리자가 아니거나 다른 테넌트 경로·다이어그램일 때
     */
    @Transactional(readOnly = true)
    public void requireErdDiagramAccess(HttpSession session, String pathTenantId, String diagramId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = assertOwnTenantAdmin(caller, pathTenantId);
        ErdDiagram diagram = load(caller, "diagramId", diagramId,
            () -> erdDiagramRepository.findByDiagramId(diagramId));
        boolean owned = Objects.equals(tenantId, diagram.getTenantId());
        boolean sharedPublic = diagram.getTenantId() == null && Boolean.TRUE.equals(diagram.getIsPublic());
        if (!owned && !sharedPublic) {
            throw denyResource(caller, "diagramId", diagramId);
        }
    }

    /** 세션 테넌트 관리자이고 경로 테넌트가 세션 테넌트와 같은지 검증한다. 조회 기준은 항상 세션 테넌트다. */
    private String assertOwnTenantAdmin(User caller, String pathTenantId) {
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        if (!caller.getRole().isAdmin() || !Objects.equals(tenantId, pathTenantId)) {
            throw denyResource(caller, "tenantId", pathTenantId);
        }
        return tenantId;
    }

    /**
     * 세션 테넌트 관리자인지 검증한다. 자원 조회 전에 호출해 관리자가 아닌 사용자에게는 id 존재 여부를 드러내지 않는다.
     */
    private User requireTenantAdmin(HttpSession session, String field, Object resourceId) {
        User caller = clientPathAccessGuard.requireCaller(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        if (!caller.getRole().isAdmin()) {
            throw denyResource(caller, field, resourceId);
        }
        return caller;
    }

    private ConsultantClientMapping loadMappingInCallerTenant(User caller, Long mappingId) {
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        return load(caller, "mappingId", mappingId,
            () -> mappingRepository.findByTenantIdAndId(tenantId, mappingId));
    }

    /** 세션 테넌트 범위로 자원을 읽는다 (소유자가 테넌트 자체인 자원용). */
    private <T> T loadInCallerTenant(HttpSession session, String field, Long resourceId,
            Function<String, Optional<T>> lookup) {
        User caller = clientPathAccessGuard.requireCaller(session);
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        return load(caller, field, resourceId, () -> lookup.apply(tenantId));
    }

    private ConsultationRecord loadAccessibleRecord(User caller, Long consultationRecordId) {
        String tenantId = clientPathAccessGuard.requireCallerTenantId(caller);
        ConsultationRecord record = load(caller, "consultationRecordId", consultationRecordId,
            () -> consultationRecordRepository.findByTenantIdAndId(tenantId, consultationRecordId));
        if (record.getClientId() == null) {
            throw denyResource(caller, "consultationRecordId", consultationRecordId);
        }
        assertClientAccess(caller, record.getClientId(), "consultationRecordId", consultationRecordId);
        return record;
    }

    /**
     * 테넌트 범위로 자원을 읽는다.
     *
     * <p>id 누락·테넌트 내 미존재·조회 실패를 모두 같은 403 으로 수렴시킨다. 조회 실패(스키마 불일치 등)를
     * 500 으로 흘리면 없는 id 와 읽을 수 있는 id 의 상태 코드가 갈려 존재 여부가 드러난다.</p>
     */
    private <T> T load(User caller, String field, Object resourceId, Supplier<Optional<T>> lookup) {
        if (resourceId == null) {
            throw denyResource(caller, field, null);
        }
        Optional<T> found;
        try {
            found = lookup.get();
        } catch (DataAccessException e) {
            log.error("[security] 자원 조회 실패 — 403 으로 거부: traceId={}, {}={}",
                ServerErrorResponses.newTraceId(), field, resourceId, e);
            throw denyResource(caller, field, resourceId);
        }
        return found.orElseThrow(() -> denyResource(caller, field, resourceId));
    }

    /** 소유 내담자 접근 검증. 거부 사유를 자원 공통 문구로 바꿔 존재 여부를 숨긴다. */
    private void assertClientAccess(User caller, Long clientId, String field, Long resourceId) {
        try {
            clientPathAccessGuard.assertCanAccessClient(caller, clientId);
        } catch (AccessDeniedException e) {
            throw denyResource(caller, field, resourceId);
        }
    }

    /** 소유 상담사 접근 검증. 거부 사유를 자원 공통 문구로 바꿔 존재 여부를 숨긴다. */
    private void assertConsultantAccess(User caller, Long consultantId, String field, Long resourceId) {
        try {
            clientPathAccessGuard.assertCanAccessConsultant(caller, consultantId);
        } catch (AccessDeniedException e) {
            throw denyResource(caller, field, resourceId);
        }
    }

    private static AccessDeniedException denyResource(User caller, String field, Object resourceId) {
        return ClientPathAccessGuard.denied(DENIAL_RESOURCE_UNAVAILABLE, caller, field, resourceId);
    }
}
