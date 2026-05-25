package com.coresolution.core.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.lang.reflect.Field;
import javax.sql.DataSource;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link ShedLockConfig} 의 슬롯 식별자(locked_by) 주입 검증 (핫픽스 2026-05-25, N1 후속).
 *
 * <p>blue/green 양 슬롯이 동일 hostname 으로 {@code locked_by} 컬럼에 기록되어 슬롯 식별이
 * 불가능했던 문제를 {@code app.instance.id} 환경변수 주입으로 해소했는지 검증한다.</p>
 *
 * <p>검증 범위:</p>
 * <ul>
 *   <li>{@code instanceId} 필드의 {@link Value} 어노테이션이
 *       {@code "${app.instance.id:default}"} 키와 default 값을 가리키는지(미설정 시 fallback).</li>
 *   <li>{@link ShedLockConfig#lockProvider(DataSource)} 가 instance id 별로
 *       {@link JdbcTemplateLockProvider} 빈을 정상 생성하는지(blue/green/default).</li>
 * </ul>
 *
 * <p>{@code shedlock.locked_by} 컬럼에 실제 값이 기록되는 통합 검증은 실 DB·2 인스턴스가
 * 필요하므로 (deployer 후속 작업) 운영 정착 후 별도 확인 대상이다.</p>
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@DisplayName("ShedLockConfig — locked_by 슬롯 식별자 주입 검증")
class ShedLockConfigTest {

    @Test
    @DisplayName("instanceId 필드 @Value 키는 'app.instance.id' 이고 기본값은 'default'")
    void instanceIdField_hasExpectedValueAnnotation() throws NoSuchFieldException {
        Field field = ShedLockConfig.class.getDeclaredField("instanceId");
        Value valueAnnotation = field.getAnnotation(Value.class);

        assertThat(valueAnnotation)
            .as("instanceId 는 @Value 로 주입되어야 한다")
            .isNotNull();
        assertThat(valueAnnotation.value())
            .as("키 'app.instance.id' + 미설정 fallback 'default' (application.yml 정합)")
            .isEqualTo("${app.instance.id:default}");
    }

    @Test
    @DisplayName("instanceId 미설정 시 'default' 으로 LockProvider 빈이 정상 생성된다")
    void lockProvider_createsWithDefaultInstanceIdWhenUnset() {
        ShedLockConfig config = new ShedLockConfig();
        ReflectionTestUtils.setField(config, "instanceId", "default");
        DataSource dataSource = mock(DataSource.class);

        LockProvider lockProvider = config.lockProvider(dataSource);

        assertThat(lockProvider)
            .as("기본값 'default' 으로 LockProvider 가 정상 생성되어야 한다")
            .isNotNull()
            .isInstanceOf(JdbcTemplateLockProvider.class);
    }

    @Test
    @DisplayName("blue 슬롯 식별자 주입 시 LockProvider 빈이 정상 생성된다")
    void lockProvider_createsForBlueSlot() {
        ShedLockConfig config = new ShedLockConfig();
        ReflectionTestUtils.setField(config, "instanceId", "blue");
        DataSource dataSource = mock(DataSource.class);

        LockProvider lockProvider = config.lockProvider(dataSource);

        assertThat(lockProvider).isInstanceOf(JdbcTemplateLockProvider.class);
    }

    @Test
    @DisplayName("green 슬롯 식별자 주입 시 LockProvider 빈이 정상 생성된다")
    void lockProvider_createsForGreenSlot() {
        ShedLockConfig config = new ShedLockConfig();
        ReflectionTestUtils.setField(config, "instanceId", "green");
        DataSource dataSource = mock(DataSource.class);

        LockProvider lockProvider = config.lockProvider(dataSource);

        assertThat(lockProvider).isInstanceOf(JdbcTemplateLockProvider.class);
    }
}
