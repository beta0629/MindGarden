package com.coresolution.core.service.ops;

import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.core.domain.Tenant;

/**
 * Ops 테넌트 목록·종료 응답에 공통으로 쓰는 항목.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class TenantOpsListItem {

    public static final String TENANT_ID = "tenantId";
    public static final String NAME = "name";
    public static final String BUSINESS_TYPE = "businessType";
    public static final String STATUS = "status";
    public static final String SUBDOMAIN = "subdomain";
    public static final String CONTACT_EMAIL = "contactEmail";
    public static final String CONTACT_PHONE = "contactPhone";
    public static final String CONTACT_PERSON = "contactPerson";

    private TenantOpsListItem() {
    }

    /**
     * @param tenant 테넌트
     * @return 목록 항목
     */
    public static Map<String, Object> from(Tenant tenant) {
        Map<String, Object> tenantMap = new LinkedHashMap<>();
        tenantMap.put(TENANT_ID, tenant.getTenantId());
        tenantMap.put(NAME, tenant.getName());
        tenantMap.put(BUSINESS_TYPE, tenant.getBusinessType());
        tenantMap.put(STATUS, tenant.getStatus() != null ? tenant.getStatus().name() : null);
        tenantMap.put(SUBDOMAIN, tenant.getSubdomain());
        tenantMap.put(CONTACT_EMAIL, tenant.getContactEmail());
        tenantMap.put(CONTACT_PHONE, tenant.getContactPhone());
        tenantMap.put(CONTACT_PERSON, tenant.getContactPerson());
        return tenantMap;
    }
}
