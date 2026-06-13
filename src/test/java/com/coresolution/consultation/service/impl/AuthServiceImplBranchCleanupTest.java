package com.coresolution.consultation.service.impl;

import java.lang.reflect.Method;

import com.coresolution.consultation.entity.User;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PR-A — AuthServiceImpl 의 branches 의존 정리 회귀 테스트.
 *
 * <p>PR-7 회귀 (#284, V20260612_002) 에서 AuthServiceImpl.deriveBranchName() 이
 * {@code user.getBranch().getBranchName()} 으로 LAZY proxy 를 강제로 로드해
 * "지난상담" 응답 본문 직렬화 시점에 NPE 가 터졌다. 본 테스트는 AuthServiceImpl
 * 가 더 이상 Branch 엔티티 객체를 통해 branchName 을 끌어오지 않음을 검증한다.
 *
 * <p>검증:
 * <ul>
 *   <li>deriveBranchName(null) → null (방어 로직 유지)</li>
 *   <li>deriveBranchName(user with branchId=null) → null</li>
 *   <li>deriveBranchName(user with branchId=123L) → null
 *       (branches 테이블 직접 조회 차단; 호출처는 별도 캐싱·비동기 조회로 채움)</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-13
 */
@DisplayName("PR-A — AuthServiceImpl branches 의존 정리 회귀 테스트")
class AuthServiceImplBranchCleanupTest {

    @Test
    @DisplayName("deriveBranchName 은 항상 null — branches 테이블 직접 조회 차단")
    void deriveBranchName_alwaysReturnsNull() throws Exception {
        AuthServiceImpl service = new AuthServiceImpl();
        Method method = AuthServiceImpl.class.getDeclaredMethod("deriveBranchName", User.class);
        method.setAccessible(true);

        // 1. null 입력 — null 반환
        assertThat(method.invoke(service, (Object) null))
                .as("deriveBranchName(null) 은 null 이어야 함")
                .isNull();

        // 2. branchId 없는 사용자 — null
        User userWithoutBranch = new User();
        assertThat(method.invoke(service, userWithoutBranch))
                .as("branchId 가 없는 사용자도 null 반환")
                .isNull();

        // 3. branchId 가 있는 사용자도 null — branches 테이블 미참조 정책 (PR-7 회귀 차단)
        User userWithBranch = new User();
        userWithBranch.setBranchId(123L);
        assertThat(method.invoke(service, userWithBranch))
                .as("branchId 가 있어도 branches 테이블 직접 조회를 차단하고 null 반환")
                .isNull();
    }
}
