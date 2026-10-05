package com.coresolution.testsupport;

import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

import com.coresolution.core.context.TenantContextHolder;

/**
 * 모든 테스트 전후에 {@link TenantContextHolder} 를 비운다.
 *
 * <p>surefire 는 fork 를 재사용({@code reuseForks=true})하므로 앞 테스트가 남긴 ThreadLocal 테넌트 값이
 * 다음 테스트 클래스로 새어 순서 의존 실패를 만든다. {@code junit-platform.properties} 의 extension
 * autodetection 과 {@code META-INF/services/org.junit.jupiter.api.extension.Extension} 으로 전역 등록된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public class TenantContextIsolationExtension implements BeforeEachCallback, AfterEachCallback {

    @Override
    public void beforeEach(ExtensionContext context) {
        TenantContextHolder.clear();
    }

    @Override
    public void afterEach(ExtensionContext context) {
        TenantContextHolder.clear();
    }
}
