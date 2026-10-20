package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.ShopClientOfferConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferCreateRequest;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.repository.ShopClientOfferPaidLookupRepository;
import com.coresolution.consultation.repository.ShopClientOfferRepository;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 내담자별 결제 상품 지정 — 비활성·삭제·익명화 내담자에게는 지정하지 않는다 (ClientVisibilityPolicy).
 */
@ExtendWith(MockitoExtension.class)
class ShopClientOfferCreateVisibilityTest {

    private static final String TENANT = "t1";
    private static final Long ADMIN = 1L;
    private static final Long CLIENT = 7L;

    @Mock
    private ShopClientOfferRepository offerRepository;
    @Mock
    private ShopClientOfferPaidLookupRepository paidLookupRepository;
    @Mock
    private ShopCatalogSkuRepository skuRepository;
    @Mock
    private ShopCatalogPackageOfferResolver packageOfferResolver;
    @Mock
    private ClientShopCatalogService clientShopCatalogService;
    @Mock
    private ClientShopConsultantMappingService consultantMappingService;
    @Mock
    private UserRepository userRepository;

    static Stream<Arguments> invisibleClients() {
        return Stream.of(
                Arguments.of("isActive=false", (Consumer<User>) u -> u.setIsActive(false)),
                Arguments.of("isDeleted=true", (Consumer<User>) u -> u.setIsDeleted(true)),
                Arguments.of("DELETED_BY_ADMIN", (Consumer<User>) u -> u.setLifecycleState(LifecycleState.DELETED_BY_ADMIN)),
                Arguments.of("ANONYMIZED", (Consumer<User>) u -> u.setLifecycleState(LifecycleState.ANONYMIZED)),
                Arguments.of("HARD_DELETED", (Consumer<User>) u -> u.setLifecycleState(LifecycleState.HARD_DELETED)));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("invisibleClients")
    void rejectsInvisibleClient(String label, Consumer<User> mutate) {
        ShopClientOfferService service = new ShopClientOfferService(offerRepository, paidLookupRepository,
                skuRepository, packageOfferResolver, clientShopCatalogService, consultantMappingService, userRepository);
        User client = new User();
        client.setId(CLIENT);
        client.setTenantId(TENANT);
        client.setRole(UserRole.CLIENT);
        mutate.accept(client);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT)).thenReturn(Optional.of(client));

        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> service.create(TENANT, ADMIN, new ShopClientOfferCreateRequest(
                        CLIENT, "SRC-1", ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, 1000L)));
        assertEquals(ShopClientOfferConstants.MSG_CLIENT_NOT_FOUND, e.getMessage());
        verify(skuRepository, never()).findActiveByTenantAndSkuCode(any(), any());
    }
}
