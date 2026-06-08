package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.service.impl.CommunityContentFilterServiceImpl;
import com.coresolution.consultation.service.impl.CommunityUserBlockServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Apple T2 (1.2 UGC) 빈 부팅 회귀 테스트.
 *
 * <p>T1 hotfix #2 (PR #151) 와 동일 패턴 — Apple T2 신규 빈 클래스의 생성자 패턴이
 * Spring 생성자 선택 정책에 부합하는지 단위 인스턴스화로 검증한다. {@code @SpringBootTest} 부팅
 * 없이도 컴파일 + 단일 생성자 보장만으로 회귀 게이트가 성립한다.</p>
 *
 * <p>본 PR 의 신규 빈:
 * <ul>
 *     <li>{@link CommunityUserBlockServiceImpl} — 단일 생성자({@code @RequiredArgsConstructor})</li>
 *     <li>{@link CommunityContentFilterServiceImpl} — no-args + {@code @PostConstruct} 패턴</li>
 * </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@DisplayName("Apple T2 UGC 빈 부팅 회귀")
class CommunityModerationContextLoadTest {

    @Test
    @DisplayName("CommunityUserBlockServiceImpl — Lombok @RequiredArgsConstructor 단일 생성자")
    void communityUserBlockServiceImpl_hasSingleRequiredArgsConstructor() {
        java.lang.reflect.Constructor<?>[] constructors = CommunityUserBlockServiceImpl.class.getDeclaredConstructors();
        assertThat(constructors)
                .as("Apple T2 hotfix 회귀 차단 — 다중 생성자가 추가되면 @Autowired 명시 필요")
                .hasSize(1);
        java.lang.reflect.Constructor<?> ctor = constructors[0];
        assertThat(ctor.getParameterCount())
                .as("Lombok @RequiredArgsConstructor 가 final 필드 2개를 받음")
                .isEqualTo(2);
    }

    @Test
    @DisplayName("CommunityContentFilterServiceImpl — no-args 생성자 직접 호출 가능")
    void communityContentFilterServiceImpl_canInstantiate() {
        CommunityContentFilterServiceImpl filter = new CommunityContentFilterServiceImpl();
        // @PostConstruct 메서드는 Spring 외에서는 직접 호출해야 한다.
        filter.loadDictionaries();
        assertThat(filter.dictionarySize()).isGreaterThan(0);
    }
}
