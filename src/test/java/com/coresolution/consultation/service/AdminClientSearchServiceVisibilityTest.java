package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.admin.client.AdminClientSearchItem;
import com.coresolution.consultation.dto.admin.client.AdminClientSearchPage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.service.SensitiveDataMaskingService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 관리자 내담자 검색 — with-mapping-info 와 같은 가시성 필터(ClientVisibilityPolicy).
 */
@ExtendWith(MockitoExtension.class)
class AdminClientSearchServiceVisibilityTest {

    private static final String TENANT = "t1";

    @Mock
    private UserRepository userRepository;
    @Mock
    private SensitiveDataMaskingService maskingService;
    @InjectMocks
    private AdminClientSearchService service;

    private static User user(long id, String name) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setRole(UserRole.CLIENT);
        return u;
    }

    @Test
    @DisplayName("비활성·관리자삭제·익명화·완전삭제 내담자는 검색·총계에서 빠진다")
    void excludesInvisibleClients() {
        User visible = user(1L, "가나");
        User inactive = user(2L, "가다");
        inactive.setIsActive(false);
        User deletedByAdmin = user(3L, "가라");
        deletedByAdmin.setLifecycleState(LifecycleState.DELETED_BY_ADMIN);
        User anonymized = user(4L, "가마");
        anonymized.setLifecycleState(LifecycleState.ANONYMIZED);
        User hardDeleted = user(5L, "가바");
        hardDeleted.setLifecycleState(LifecycleState.HARD_DELETED);
        User dormant = user(6L, "가사");
        dormant.setLifecycleState(LifecycleState.DORMANT);
        when(userRepository.findByRole(TENANT, UserRole.CLIENT))
                .thenReturn(List.of(visible, inactive, deletedByAdmin, anonymized, hardDeleted, dormant));
        lenient().when(maskingService.maskPhone(anyString())).thenReturn(null);

        AdminClientSearchPage all = service.search(TENANT, null, 0, 1000);
        assertEquals(2, all.totalElements());
        assertEquals(List.of(1L, 6L), all.items().stream().map(AdminClientSearchItem::id).toList());

        AdminClientSearchPage byName = service.search(TENANT, "가", 0, 1000);
        assertEquals(2, byName.totalElements());
    }
}
