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

/**
 * 푸시 멱등 청구 구현.
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
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean tryClaim(String tenantId, String pushType, String entityId, String timeBucket) {
        String tid = tenantId == null ? "" : tenantId.trim();
        if (tid.isEmpty() || pushType == null || pushType.isBlank() || entityId == null || entityId.isBlank()
                || timeBucket == null || timeBucket.isBlank()) {
            log.warn("푸시 멱등 청구 생략: 필수 인자 누락");
            return false;
        }
        try {
            mobilePushDispatchDedupRepository.save(
                    MobilePushDispatchDedup.newRow(tid, pushType.trim(), entityId.trim(), timeBucket.trim()));
            return true;
        } catch (DataIntegrityViolationException ex) {
            log.debug("푸시 멱등 충돌(이미 청구됨): tenantId={} type={} entityId={} bucket={}", tid, pushType, entityId,
                    timeBucket);
            return false;
        }
    }
}
