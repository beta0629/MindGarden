package com.coresolution.consultation.service.impl;

import org.springframework.stereotype.Service;

import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.MappingUpdateService;
import com.coresolution.consultation.service.support.DeferredExternalCalls;

import lombok.RequiredArgsConstructor;

/**
 * 매칭 수정 — 이 클래스는 트랜잭션을 열지 않는다. {@link AdminService#updateMapping} 이 매칭 변경과 조정 전표를 한
 * 트랜잭션으로 처리하고, 그 안에서 미룬 외부 호출은 커밋·커넥션 반환 뒤 실행된다(롤백이면 버린다).
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Service
@RequiredArgsConstructor
public class MappingUpdateServiceImpl implements MappingUpdateService {

    private final AdminService adminService;

    @Override
    public ConsultantClientMappingResponse update(Long id, ConsultantClientMappingCreateRequest request,
            String updatedBy) {
        return DeferredExternalCalls.run(() -> adminService.updateMapping(id, request, updatedBy));
    }
}
