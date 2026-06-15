package com.coresolution.core.constant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * Ops Portal — 본사(HQ) 테넌트 ID SSOT.
 *
 * <p>{@code ROLE_OPS} Authority 만으로는 외부 테넌트의 admin endpoint 호출을 차단할 수 없으므로,
 * "옵션 3+1 하이브리드" (Defense in Depth) 의 일환으로 본사 테넌트 ID 자체 검증을 병행한다.
 * 본 컴포넌트는 환경변수 {@code MINDGARDEN_HQ_TENANT_ID} 를 단일 소스로 주입받고,
 * 미설정 시 부트 자체를 실패(fail-fast)시켜 운영에서 가드가 fail-open 되는 위험을 차단한다.</p>
 *
 * <h3>주입 경로</h3>
 * <pre>
 *   mindgarden.hq.tenant-id : ${MINDGARDEN_HQ_TENANT_ID:}
 * </pre>
 *
 * <h3>표준 정합</h3>
 * <ul>
 *   <li>{@code docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md} §6.2 — 환경변수 + fail-fast 권장안</li>
 *   <li>{@code docs/standards/ROLE_STANDARD.md} §3.2 — 테넌트 가드 병행 패턴</li>
 *   <li>{@code docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md} — 멀티테넌트 격리</li>
 * </ul>
 *
 * <h3>금지</h3>
 * <ul>
 *   <li>HQ 테넌트 ID 의 코드 하드코딩 (환경별 다른 UUID — fail-open 위험)</li>
 *   <li>{@code OPS_ADMIN} 등 enum 신설 (4종 SSOT 외 추가 금지 — ROLE_STANDARD §6.1)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-15
 */
@Slf4j
@Component
public class OpsTenantConstants {

    /**
     * 본사(코어솔루션) 테넌트 ID — 환경변수 {@code MINDGARDEN_HQ_TENANT_ID} 로 주입.
     *
     * <p>{@code application.yml} 의 {@code mindgarden.hq.tenant-id} 키와 매핑된다.
     * 빈 문자열 / null 은 {@link #validate()} 가 부트 실패로 차단한다.</p>
     */
    @Value("${mindgarden.hq.tenant-id:#{null}}")
    private String hqTenantId;

    /**
     * 부트 시 HQ 테넌트 ID 환경변수 주입 검증 (fail-fast).
     *
     * <p>{@code MINDGARDEN_HQ_TENANT_ID} 가 미설정·빈 문자열인 경우 Spring 컨텍스트 초기화 자체를
     * 실패시켜 외부 테넌트 호출이 OPS 가드를 우회하는 fail-open 시나리오를 차단한다.</p>
     *
     * @throws IllegalStateException 환경변수 미설정 시
     */
    @PostConstruct
    public void validate() {
        if (hqTenantId == null || hqTenantId.isBlank()) {
            throw new IllegalStateException(
                "[OPS] mindgarden.hq.tenant-id 환경변수 미설정 — fail-fast "
                    + "(OPS_PORTAL_MIGRATION_PLAN.md §6.2). "
                    + "MINDGARDEN_HQ_TENANT_ID 환경변수에 본사 테넌트 UUID 를 주입하세요.");
        }
        log.info("[OPS] HQ 테넌트 ID 주입 완료 — Ops Portal 가드 활성");
    }

    /**
     * 주어진 테넌트 ID 가 본사 테넌트 인지 비교한다.
     *
     * @param tenantId 비교 대상 테넌트 ID (보통 {@code TenantContextHolder.getRequiredTenantId()} 결과)
     * @return 본사 테넌트 면 {@code true}, 그렇지 않으면 {@code false} ({@code null} 입력 시 항상 {@code false})
     */
    public boolean isHqTenant(String tenantId) {
        return hqTenantId.equals(tenantId);
    }

    /**
     * 본사 테넌트 ID 를 반환한다.
     *
     * <p>로그·진단 용도로만 사용한다. 외부 호출에서 비교 목적이면 {@link #isHqTenant(String)} 사용 권장.</p>
     *
     * @return 환경변수에서 주입된 본사 테넌트 UUID
     */
    public String getHqTenantId() {
        return hqTenantId;
    }
}
