package com.coresolution.consultation.service.impl;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.dto.MappingPackageErpSyncPlan;
import com.coresolution.consultation.exception.MappingErpSyncFailedException;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.MappingUpdateService;
import com.coresolution.consultation.service.StoredProcedureService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 매칭 수정 — 트랜잭션 없음. 판단(읽기 트랜잭션) → UpdateMappingInfo(트랜잭션·커넥션 점유 없음) → 매칭 저장(트랜잭션).
 *
 * <p>UpdateMappingInfo 는 프로시저 안에서 자체 COMMIT 하고 같은 매칭 행·version 을 고친다. JPA 트랜잭션 안에서 부르면
 * 행 잠금 대기나 낙관적 잠금 충돌이 나므로 저장 전에 따로 부르고, 실패하면 저장하지 않고 422 를 던진다.
 * 같은 요청을 다시 보내면 처음부터 다시 처리된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MappingUpdateServiceImpl implements MappingUpdateService {

    private final AdminService adminService;
    private final StoredProcedureService storedProcedureService;

    @Override
    public ConsultantClientMappingResponse update(Long id, ConsultantClientMappingCreateRequest request,
            String updatedBy) {
        adminService.planMappingPackageErpSync(id, request, updatedBy).ifPresent(this::syncToErp);
        return adminService.updateMapping(id, request, updatedBy);
    }

    private void syncToErp(MappingPackageErpSyncPlan plan) {
        Map<String, Object> result;
        try {
            log.info("🔄 패키지 금액·회기 변경, ERP 재무 거래 동기화 프로시저 호출: mappingId={}", plan.mappingId());
            result = storedProcedureService.updateMappingInfo(plan.mappingId(), plan.packageName(),
                    plan.packagePrice(), plan.totalSessions(), plan.updatedBy());
        } catch (RuntimeException e) {
            log.error("❌ ERP 재무 거래 동기화 실패 — 매칭 수정 중단: mappingId={}", plan.mappingId(), e);
            throw MappingErpSyncFailedException.of(plan.mappingId(), e);
        }
        if (result == null || !Boolean.TRUE.equals(result.get("success"))) {
            log.error("❌ ERP 재무 거래 동기화 실패 응답 — 매칭 수정 중단: mappingId={}, message={}",
                    plan.mappingId(), result != null ? result.get("message") : null);
            throw MappingErpSyncFailedException.of(plan.mappingId(), null);
        }
        log.info("✅ ERP 재무 거래 동기화 완료: mappingId={}", plan.mappingId());
    }
}
