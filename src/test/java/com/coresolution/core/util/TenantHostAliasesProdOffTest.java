package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.core.config.TenantHostAliasesInitializer;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Arrays;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Profile;

/**
 * 운영(Initializer 없음)에서는 TENANT_HOST_ALIASES 가 있어도 별칭이 꺼져 있는지 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-13
 */
class TenantHostAliasesProdOffTest {

    private static final String KEY = "TENANT_HOST_ALIASES";
    private static final String ALIAS_HOST = "mindgarden-dev.core-solution.co.kr";

    @AfterEach
    void cleanup() {
        System.clearProperty(KEY);
        TenantHostSubdomainUtil.configureHostAliases(null);
    }

    @Test
    @DisplayName("시스템 프로퍼티가 있어도 새로 로드한 util 은 별칭을 적용하지 않는다")
    void freshClassLoadIgnoresSystemProperty() throws Exception {
        System.setProperty(KEY, ALIAS_HOST + ":mindgarden");
        URL root = TenantHostSubdomainUtil.class.getProtectionDomain().getCodeSource().getLocation();
        try (URLClassLoader isolated = new URLClassLoader(new URL[] {root}, null) {
            @Override
            protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
                if (name.equals(TenantHostSubdomainUtil.class.getName())) {
                    synchronized (getClassLoadingLock(name)) {
                        Class<?> c = findLoadedClass(name);
                        return c != null ? c : findClass(name);
                    }
                }
                return TenantHostAliasesProdOffTest.class.getClassLoader().loadClass(name);
            }
        }) {
            Class<?> fresh = isolated.loadClass(TenantHostSubdomainUtil.class.getName());
            assertThat(fresh).isNotSameAs(TenantHostSubdomainUtil.class);
            Method extract = fresh.getMethod("extractTenantSubdomain", String.class);
            Method isAlias = fresh.getMethod("isConfiguredAliasHost", String.class);
            assertThat(extract.invoke(null, ALIAS_HOST)).isEqualTo("mindgarden-dev");
            assertThat(isAlias.invoke(null, ALIAS_HOST)).isEqualTo(false);
            assertThat(extract.invoke(null, "mindgarden.core-solution.co.kr")).isEqualTo("mindgarden");
            assertThat(extract.invoke(null, "app.core-solution.co.kr")).isNull();
        }
    }

    @Test
    @DisplayName("util 에는 환경변수 자동 로드 메서드가 없다")
    void noEnvironmentAutoLoadMethod() {
        assertThat(Arrays.stream(TenantHostSubdomainUtil.class.getDeclaredMethods())
                .map(Method::getName))
                .doesNotContain("refreshHostAliasesFromEnvironment");
    }

    @Test
    @DisplayName("별칭 주입 Initializer 는 dev 프로필 전용")
    void initializerIsDevProfileOnly() {
        Profile profile = TenantHostAliasesInitializer.class.getAnnotation(Profile.class);
        assertThat(profile).isNotNull();
        assertThat(profile.value()).containsExactly("dev");
    }
}
