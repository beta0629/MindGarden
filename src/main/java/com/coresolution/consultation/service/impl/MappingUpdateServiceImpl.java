package com.coresolution.consultation.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.dto.MappingPackageChange;
import com.coresolution.consultation.exception.MappingErpSyncFailedException;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.MappingPackageLedgerService;
import com.coresolution.consultation.service.MappingUpdateService;
import com.coresolution.consultation.service.support.DeferredExternalCalls;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 매칭 수정 — 판정·감액 하한·매칭 변경·차액 조정 전표를 한 트랜잭션(한 커넥션)에서 처리한다.
 *
 * <p>어느 단계든 실패하면 전부 롤백되고 422(오류 코드 포함)로 응답한다. 부분 성공은 없다. 트랜잭션 안에서 미룬 외부
 * 호출은 커밋·커넥션 반환 뒤 실행되고, 롤백이면 버린다({@link DeferredExternalCalls}).</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MappingUpdateServiceImpl implements MappingUpdateService {

    private final AdminService adminService;
    private final MappingPackageLedgerService mappingPackageLedgerService;
    private final PlatformTransactionManager transactionManager;

    @Override
    public ConsultantClientMappingResponse update(Long id, ConsultantClientMappingCreateRequest request,
            String updatedBy) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        return DeferredExternalCalls.run(() -> template.execute(status -> updateInTransaction(id, request, updatedBy)));
    }

    private ConsultantClientMappingResponse updateInTransaction(Long id, ConsultantClientMappingCreateRequest request,
            String updatedBy) {
        MappingPackageChange change = adminService.inspectMappingPackageChange(id, request);
        if (change.isLedgerDecrease()) {
            mappingPackageLedgerService.assertDecreaseAllowed(change.mapping(), change.newPackagePrice());
        }
        ConsultantClientMappingResponse response = adminService.updateMapping(id, request, updatedBy);
        if (change.ledgerAdjustment()) {
            String actor = updatedBy != null && !updatedBy.isEmpty()
                    ? updatedBy
                    : AdminServiceUserFacingMessages.ERP_MAPPING_PROCEDURE_ACTOR_FALLBACK;
            try {
                mappingPackageLedgerService.recordPackagePriceAdjustment(change.mapping(), change.oldPackagePrice(),
                        change.newPackagePrice(), change.baseVersion(), actor);
            } catch (RuntimeException e) {
                log.error("❌ 패키지 금액 조정 전표 기록 실패 — 매칭 수정 롤백: mappingId={}", id, e);
                throw MappingErpSyncFailedException.of(id, e);
            }
        }
        return response;
    }
}
