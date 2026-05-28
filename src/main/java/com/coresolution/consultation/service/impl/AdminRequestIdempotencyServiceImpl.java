package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.AdminRequestIdempotency;
import com.coresolution.consultation.exception.MappingAlreadyProcessedException;
import com.coresolution.consultation.repository.AdminRequestIdempotencyRepository;
import com.coresolution.consultation.service.AdminRequestIdempotencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link AdminRequestIdempotencyService} 구현체 — RDB UNIQUE 제약 기반 fail-fast 멱등성 가드.
 *
 * <p>옵션 B v2.0 합의서 §4·§6 Q11 (2026-05-28).</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminRequestIdempotencyServiceImpl implements AdminRequestIdempotencyService {

    private final AdminRequestIdempotencyRepository idempotencyRepository;

    /**
     * reservation 은 항상 별도 트랜잭션(REQUIRES_NEW) 에서 commit 되어야 race-condition fast-fail 이 보장된다.
     * 부모 트랜잭션이 rollback 되어도 reservation row 는 유지하여 사용자 재시도를 차단한다.
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdminRequestIdempotency reserve(
            String tenantId, String requestId, String operation, Long mappingId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(AdminServiceUserFacingMessages.MSG_TENANT_INFO_MISSING);
        }
        if (requestId == null || requestId.isBlank()) {
            log.debug("멱등성 검사 생략: requestId 미지정 (tenantId={}, operation={}, mappingId={})",
                    tenantId, operation, mappingId);
            return null;
        }
        if (operation == null || operation.isBlank()) {
            throw new IllegalArgumentException("operation 은 필수입니다.");
        }

        Optional<AdminRequestIdempotency> existing =
                idempotencyRepository.findByTenantIdAndRequestIdAndOperation(tenantId, requestId, operation);
        if (existing.isPresent()) {
            AdminRequestIdempotency duplicate = existing.get();
            log.warn("🔁 멱등성 가드 발동 (조회): tenantId={}, requestId={}, operation={}, mappingId={}, resultStatus={}",
                    tenantId, requestId, operation, duplicate.getMappingId(), duplicate.getResultStatus());
            throw new MappingAlreadyProcessedException(
                    duplicate.getMappingId(),
                    requestId,
                    MappingAlreadyProcessedException.Reason.DUPLICATE_REQUEST_ID,
                    AdminServiceUserFacingMessages.MSG_MAPPING_ALREADY_PROCESSED);
        }

        LocalDateTime now = LocalDateTime.now();
        AdminRequestIdempotency reservation = AdminRequestIdempotency.builder()
                .tenantId(tenantId)
                .requestId(requestId)
                .operation(operation)
                .mappingId(mappingId)
                .resultStatus("IN_PROGRESS")
                .expiresAt(now.plusSeconds(DEFAULT_TTL_SECONDS))
                .build();
        try {
            return idempotencyRepository.saveAndFlush(reservation);
        } catch (DataIntegrityViolationException e) {
            // 동시 요청 race-condition: UNIQUE 제약 위반 → 두 번째 요청은 즉시 실패.
            log.warn("🔁 멱등성 가드 발동 (UNIQUE 충돌): tenantId={}, requestId={}, operation={}, mappingId={}",
                    tenantId, requestId, operation, mappingId);
            throw new MappingAlreadyProcessedException(
                    mappingId,
                    requestId,
                    MappingAlreadyProcessedException.Reason.DUPLICATE_REQUEST_ID,
                    AdminServiceUserFacingMessages.MSG_MAPPING_ALREADY_PROCESSED);
        }
    }

    /**
     * audit 보강용 — reservation 의 처리 결과를 별도 트랜잭션으로 마킹.
     * 결과 마킹 실패는 무시한다 (감사 보조용).
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markResult(AdminRequestIdempotency reservation, String resultStatus) {
        if (reservation == null || reservation.getId() == null) {
            return;
        }
        try {
            reservation.setResultStatus(resultStatus);
            idempotencyRepository.save(reservation);
        } catch (Exception e) {
            log.warn("멱등성 reservation 결과 마킹 실패 (무시): id={}, resultStatus={}, message={}",
                    reservation.getId(), resultStatus, e.getMessage());
        }
    }
}
