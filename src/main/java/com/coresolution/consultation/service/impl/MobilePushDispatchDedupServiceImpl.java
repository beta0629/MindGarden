package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.MobilePushDispatchDedup;
import com.coresolution.consultation.repository.MobilePushDispatchDedupRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 푸시 멱등 청구 구현.
 *
 * <p>unique 충돌({@code uk_mpd_dedup})은 "이미 청구됨"으로만 처리한다.
 * catch 후에도 세션이 rollback-only인 채 commit 되면 {@code UnexpectedRollbackException}이
 * outer로 전파되므로, 충돌 시 local rollback-only를 명시하고 false만 반환한다.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MobilePushDispatchDedupServiceImpl implements MobilePushDispatchDedupService {

    private final MobilePushDispatchDedupRepository mobilePushDispatchDedupRepository;

    @Override
    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = DataIntegrityViolationException.class)
    public boolean tryClaim(String tenantId, String pushType, String entityId, String timeBucket) {
        String tid = tenantId == null ? "" : tenantId.trim();
        if (tid.isEmpty() || pushType == null || pushType.isBlank() || entityId == null || entityId.isBlank()
                || timeBucket == null || timeBucket.isBlank()) {
            log.warn("푸시 멱등 청구 생략: 필수 인자 누락");
            return false;
        }
        String type = pushType.trim();
        String entity = entityId.trim();
        String bucket = timeBucket.trim();
        if (mobilePushDispatchDedupRepository.existsByTenantIdAndPushTypeAndEntityIdAndTimeBucket(
                tid, type, entity, bucket)) {
            log.debug("푸시 멱등 이미 청구됨(선조회): tenantId={} type={} entityId={} bucket={}", tid, type, entity,
                    bucket);
            return false;
        }
        try {
            mobilePushDispatchDedupRepository.save(MobilePushDispatchDedup.newRow(tid, type, entity, bucket));
            return true;
        } catch (DataIntegrityViolationException ex) {
            log.debug("푸시 멱등 충돌(이미 청구됨): tenantId={} type={} entityId={} bucket={}", tid, type, entity,
                    bucket);
            markLocalRollbackOnlyIfActive();
            return false;
        }
    }

    /**
     * unique 충돌 후 실패한 세션에 대해 commit을 시도하지 않도록 local rollback-only를 표시한다.
     * (silent rollback → UnexpectedRollbackException 미전파)
     */
    private static void markLocalRollbackOnlyIfActive() {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
    }
}
