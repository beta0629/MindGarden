package com.coresolution.core.service.impl;

import com.coresolution.core.repository.TenantComponentRepository;
import com.coresolution.core.service.TenantComponentActivationService;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link TenantComponentActivationService} 구현.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantComponentActivationServiceImpl implements TenantComponentActivationService {

    private final TenantComponentRepository tenantComponentRepository;

    @Override
    public boolean isComponentActive(String tenantId, String componentCode) {
        if (tenantId == null || tenantId.isBlank() || componentCode == null || componentCode.isBlank()) {
            return false;
        }
        return tenantComponentRepository.existsActiveByTenantIdAndComponentCode(
                tenantId.trim(), componentCode.trim());
    }

    @Override
    public List<String> listActiveComponentCodes(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Collections.emptyList();
        }
        return tenantComponentRepository.findActiveComponentCodesByTenantId(tenantId.trim());
    }
}
