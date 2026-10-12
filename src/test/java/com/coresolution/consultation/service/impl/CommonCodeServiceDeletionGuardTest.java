package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.exception.CommonCodeInUseException;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeDeletionGuard;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * DELETE /api/v1/common-codes/{id} 경로(CommonCodeServiceImpl)도 공통 삭제 가드를 거치는지 검증.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodeServiceImpl 삭제 가드")
class CommonCodeServiceDeletionGuardTest {

    private static final String TENANT = "t-guard";
    private static final Long CODE_ID = 77L;

    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private CodeGroupMetadataRepository codeGroupMetadataRepository;
    @Mock
    private CommonCodePermissionService permissionService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommonCodeDeletionGuard commonCodeDeletionGuard;
    @InjectMocks
    private CommonCodeServiceImpl service;

    private CommonCode code;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
        code = new CommonCode();
        code.setId(CODE_ID);
        code.setTenantId(TENANT);
        code.setCodeGroup(ConsultationPackageCodeConstants.CODE_GROUP);
        code.setCodeValue("PACKAGE001");
        code.setIsActive(true);
        when(commonCodeRepository.findByTenantIdAndId(TENANT, CODE_ID)).thenReturn(Optional.of(code));
        doThrow(new CommonCodeInUseException(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_ORDERS))
                .when(commonCodeDeletionGuard).assertDeletable(code);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("표준 삭제(delete)는 이력이 있으면 409 예외, 비활성화·삭제 저장 없음")
    void standardDeleteBlocked() {
        when(permissionService.canDeleteCode(any(), any())).thenReturn(true);
        assertThrows(CommonCodeInUseException.class, () -> service.delete(CODE_ID, null));
        verify(commonCodeRepository, never()).save(any());
    }

    @Test
    @DisplayName("하드 삭제(deleteCommonCode)도 이력이 있으면 409 예외, 삭제 없음")
    void hardDeleteBlocked() {
        assertThrows(CommonCodeInUseException.class, () -> service.deleteCommonCode(CODE_ID));
        verify(commonCodeRepository, never()).delete(any(CommonCode.class));
    }
}
