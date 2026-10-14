package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.AdminClientSearchConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.admin.client.AdminClientSearchItem;
import com.coresolution.consultation.dto.admin.client.AdminClientSearchPage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.service.SensitiveDataMaskingService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminClientSearchServiceTest {

    private static final String TENANT = "t1";

    @Mock
    private UserRepository userRepository;
    @Mock
    private SensitiveDataMaskingService maskingService;
    @InjectMocks
    private AdminClientSearchService service;

    private static User user(long id, String name, String phone) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setPhone(phone);
        return u;
    }

    @BeforeEach
    void setUp() {
        when(userRepository.findByRole(TENANT, UserRole.CLIENT)).thenReturn(List.of(
                user(1L, "김민수", "010-1234-5678"),
                user(2L, "이영희", "01098761111"),
                user(3L, "박민지", null)));
        lenient().when(maskingService.maskPhone(anyString()))
                .thenAnswer(i -> ((String) i.getArgument(0)).replaceAll("\\d(?=\\d{4})", "*"));
    }

    @Test
    @DisplayName("이름 부분 일치")
    void searchByName() {
        AdminClientSearchPage page = service.search(TENANT, "민", 0, 10);
        assertEquals(List.of(1L, 3L), page.items().stream().map(AdminClientSearchItem::id).toList());
    }

    @Test
    @DisplayName("연락처 뒷자리 4자리 일치")
    void searchByTail() {
        AdminClientSearchPage page = service.search(TENANT, "1111", 0, 10);
        assertEquals(1, page.totalElements());
        assertEquals("1111", page.items().get(0).phoneLast4());
    }

    @Test
    @DisplayName("4자리가 아닌 숫자는 연락처로 찾지 않는다")
    void partialDigitsDoNotMatchPhone() {
        assertEquals(0, service.search(TENANT, "5678x", 0, 10).totalElements());
        assertEquals(0, service.search(TENANT, "345678", 0, 10).totalElements());
    }

    @Test
    @DisplayName("응답에 전체 연락처가 없다 — 마스킹이 꺼진 환경에서도")
    void neverExposesFullPhone() {
        when(maskingService.maskPhone(anyString())).thenAnswer(i -> i.getArgument(0));
        AdminClientSearchItem item = service.search(TENANT, "김", 0, 10).items().get(0);
        assertEquals("5678", item.phoneLast4());
        assertEquals(AdminClientSearchConstants.MASKED_PHONE_PREFIX + "5678", item.maskedPhone());
        assertFalse(item.toString().contains("12345678"));
        assertFalse(item.toString().contains("1234"));
    }

    @Test
    @DisplayName("연락처 없으면 뒷자리·마스킹 null, 빈 검색어는 전체 + 페이지")
    void emptyQueryPaged() {
        AdminClientSearchPage page = service.search(TENANT, "", 1, 2);
        assertEquals(3, page.totalElements());
        assertEquals(1, page.items().size());
        assertNull(service.search(TENANT, "박", 0, 10).items().get(0).phoneLast4());
    }

    @Test
    @DisplayName("size 는 최대값으로 제한")
    void sizeCapped() {
        assertEquals(AdminClientSearchConstants.MAX_PAGE_SIZE,
                service.search(TENANT, null, 0, Integer.MAX_VALUE).size());
    }
}
