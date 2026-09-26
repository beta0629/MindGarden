package com.coresolution.core.config;

import com.coresolution.core.util.TenantLogoFileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 테넌트 로고 업로드 base-dir 을 Spring 설정에서 {@link TenantLogoFileUtils} 에 주입한다.
 *
 * <p>프로필 이미지·shop-catalog 썸네일과 동일하게 env
 * {@code TENANT_LOGO_UPLOAD_DIR} → {@code mindgarden.upload.logo.base-dir}.</p>
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@Component
public class TenantLogoUploadPathConfigurer {

    /**
     * @param baseDir 로고 업로드 루트 (운영 절대경로 / 개발 상대경로)
     */
    public TenantLogoUploadPathConfigurer(
            @Value("${mindgarden.upload.logo.base-dir:./uploads/logos/}") String baseDir) {
        TenantLogoFileUtils.configureBaseDir(baseDir);
    }
}
