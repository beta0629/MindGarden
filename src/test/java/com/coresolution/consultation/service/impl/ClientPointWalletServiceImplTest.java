package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.PointLedgerEntryType;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;
import com.coresolution.consultation.dto.shop.ShopPointLedgerEntryResponse;
import com.coresolution.consultation.entity.ClientPointLedgerEntry;
import com.coresolution.consultation.entity.ClientPointWallet;
import com.coresolution.consultation.repository.ClientPointLedgerEntryRepository;
import com.coresolution.consultation.repository.ClientPointWalletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

/**
 * {@link ClientPointWalletServiceImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientPointWalletServiceImpl")
class ClientPointWalletServiceImplTest {

    @Mock
    private ClientPointWalletRepository clientPointWalletRepository;

    @Mock
    private ClientPointLedgerEntryRepository clientPointLedgerEntryRepository;

    @InjectMocks
    private ClientPointWalletServiceImpl service;

    @Test
    @DisplayName("지갑 없으면 잔액 0")
    void getBalance_noWallet_returnsZero() {
        when(clientPointWalletRepository.findByTenantIdAndUserId("tenant-a", 42L)).thenReturn(Optional.empty());
        ShopPointBalanceResponse b = service.getBalance("tenant-a", 42L);
        assertEquals(0L, b.getAvailableMinor());
        assertEquals(0L, b.getHeldMinor());
    }

    @Test
    @DisplayName("hold 금액이 가용을 초과하면 예외")
    void hold_insufficient_throws() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse("t", "k1"))
                .thenReturn(false);
        ClientPointWallet w = ClientPointWallet.builder()
                .userId(1L)
                .availableMinor(100L)
                .heldMinor(0L)
                .build();
        w.setTenantId("t");
        when(clientPointWalletRepository.lockByTenantIdAndUserId("t", 1L)).thenReturn(Optional.of(w));
        assertThrows(IllegalArgumentException.class,
                () -> service.hold("t", 1L, "order-1", 200L, "k1"));
        verify(clientPointLedgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("commitHold는 held에서 차감·COMMIT 원장 기록")
    void commitHold_reducesHeldAndPersistsLedger() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        "t", ShopCheckoutConstants.pointCommitKey("order-1")))
                .thenReturn(false);
        ClientPointWallet w = ClientPointWallet.builder()
                .userId(1L)
                .availableMinor(0L)
                .heldMinor(500L)
                .build();
        w.setTenantId("t");
        when(clientPointWalletRepository.lockByTenantIdAndUserId("t", 1L)).thenReturn(Optional.of(w));

        service.commitHold("t", 1L, "order-1", 500L, ShopCheckoutConstants.pointCommitKey("order-1"));

        assertEquals(0L, w.getHeldMinor());
        verify(clientPointLedgerEntryRepository).save(any(ClientPointLedgerEntry.class));
    }

    @Test
    @DisplayName("creditEarn은 available 증가·EARN 원장 기록")
    void creditEarn_increasesAvailableAndPersistsLedger() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        "t", ShopCheckoutConstants.pointEarnKey("order-1")))
                .thenReturn(false);
        ClientPointWallet w = ClientPointWallet.builder()
                .userId(1L)
                .availableMinor(200L)
                .heldMinor(0L)
                .build();
        w.setTenantId("t");
        when(clientPointWalletRepository.lockByTenantIdAndUserId("t", 1L)).thenReturn(Optional.of(w));

        service.creditEarn("t", 1L, "order-1", 150L, ShopCheckoutConstants.pointEarnKey("order-1"));

        assertEquals(350L, w.getAvailableMinor());
        verify(clientPointLedgerEntryRepository).save(any(ClientPointLedgerEntry.class));
    }

    @Test
    @DisplayName("creditEarn 멱등 키 중복 시 no-op")
    void creditEarn_duplicateIdempotency_skips() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        eq("t"), eq(ShopCheckoutConstants.pointEarnKey("order-1"))))
                .thenReturn(true);
        service.creditEarn("t", 1L, "order-1", 150L, ShopCheckoutConstants.pointEarnKey("order-1"));
        verify(clientPointWalletRepository, never()).lockByTenantIdAndUserId(any(), any());
    }

    @Test
    @DisplayName("clawbackEarn — 가용 잔액만큼 회수(마이너스 금지)")
    void clawbackEarn_clawsUpToAvailable() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        "t", ShopCheckoutConstants.pointClawbackKey("order-1")))
                .thenReturn(false);
        ClientPointWallet w = ClientPointWallet.builder()
                .userId(1L)
                .availableMinor(80L)
                .heldMinor(0L)
                .build();
        w.setTenantId("t");
        when(clientPointWalletRepository.lockByTenantIdAndUserId("t", 1L)).thenReturn(Optional.of(w));

        long clawed = service.clawbackEarn(
                "t", 1L, "order-1", 200L, ShopCheckoutConstants.pointClawbackKey("order-1"));

        assertEquals(80L, clawed);
        assertEquals(0L, w.getAvailableMinor());
        verify(clientPointLedgerEntryRepository).save(any(ClientPointLedgerEntry.class));
    }

    @Test
    @DisplayName("clawbackEarn 멱등 키 중복 시 no-op")
    void clawbackEarn_duplicateIdempotency_skips() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        eq("t"), eq(ShopCheckoutConstants.pointClawbackKey("order-1"))))
                .thenReturn(true);
        long clawed = service.clawbackEarn(
                "t", 1L, "order-1", 200L, ShopCheckoutConstants.pointClawbackKey("order-1"));
        assertEquals(0L, clawed);
        verify(clientPointWalletRepository, never()).lockByTenantIdAndUserId(any(), any());
    }

    @Test
    @DisplayName("restoreRedeemOnRefund — 가용 잔액 복원·COMMIT_REVERSAL 원장")
    void restoreRedeemOnRefund_increasesAvailable() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        "t", ShopCheckoutConstants.pointCommitReversalKey("order-1")))
                .thenReturn(false);
        ClientPointWallet w = ClientPointWallet.builder()
                .userId(1L)
                .availableMinor(100L)
                .heldMinor(0L)
                .build();
        w.setTenantId("t");
        when(clientPointWalletRepository.lockByTenantIdAndUserId("t", 1L)).thenReturn(Optional.of(w));

        service.restoreRedeemOnRefund(
                "t", 1L, "order-1", 500L, ShopCheckoutConstants.pointCommitReversalKey("order-1"));

        assertEquals(600L, w.getAvailableMinor());
        verify(clientPointLedgerEntryRepository).save(any(ClientPointLedgerEntry.class));
    }

    @Test
    @DisplayName("commitHold 멱등 키 중복 시 no-op")
    void commitHold_duplicateIdempotency_skips() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        eq("t"), eq(ShopCheckoutConstants.pointCommitKey("order-1"))))
                .thenReturn(true);
        service.commitHold("t", 1L, "order-1", 500L, ShopCheckoutConstants.pointCommitKey("order-1"));
        verify(clientPointWalletRepository, never()).lockByTenantIdAndUserId(any(), any());
    }

    @Test
    @DisplayName("hold 멱등 키 중복 시 no-op")
    void hold_duplicateIdempotency_skips() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse("t", "k-hold"))
                .thenReturn(true);
        service.hold("t", 1L, "order-1", 500L, "k-hold");
        verify(clientPointWalletRepository, never()).lockByTenantIdAndUserId(any(), any());
        verify(clientPointLedgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("releaseHold 멱등 키 중복 시 no-op")
    void releaseHold_duplicateIdempotency_skips() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        eq("t"), eq(ShopCheckoutConstants.pointReleaseKey("order-1"))))
                .thenReturn(true);
        service.releaseHold("t", 1L, "order-1", 300L, ShopCheckoutConstants.pointReleaseKey("order-1"));
        verify(clientPointWalletRepository, never()).lockByTenantIdAndUserId(any(), any());
        verify(clientPointLedgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("releaseHold는 held→available 복구")
    void releaseHold_restoresAvailable() {
        when(clientPointLedgerEntryRepository.existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(
                        "t", ShopCheckoutConstants.pointReleaseKey("order-1")))
                .thenReturn(false);
        ClientPointWallet w = ClientPointWallet.builder()
                .userId(1L)
                .availableMinor(0L)
                .heldMinor(300L)
                .build();
        w.setTenantId("t");
        when(clientPointWalletRepository.lockByTenantIdAndUserId("t", 1L)).thenReturn(Optional.of(w));

        service.releaseHold("t", 1L, "order-1", 300L, ShopCheckoutConstants.pointReleaseKey("order-1"));

        assertEquals(300L, w.getAvailableMinor());
        assertEquals(0L, w.getHeldMinor());
    }

    @Test
    @DisplayName("listRecentLedger — tenant·userId로 조회 (테넌트 격리)")
    void listRecentLedger_scopedByTenantAndUser() {
        ClientPointLedgerEntry entry = ClientPointLedgerEntry.builder()
                .userId(42L)
                .orderPublicId("order-a")
                .entryType(PointLedgerEntryType.EARN)
                .amountMinor(1000L)
                .idempotencyKey("k1")
                .build();
        entry.setTenantId("tenant-a");
        entry.setCreatedAt(LocalDateTime.of(2026, 5, 19, 10, 0));

        when(clientPointLedgerEntryRepository.findByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        eq("tenant-a"), eq(42L), any(Pageable.class)))
                .thenReturn(List.of(entry));

        List<ShopPointLedgerEntryResponse> rows = service.listRecentLedger("tenant-a", 42L, 20);

        assertEquals(1, rows.size());
        assertEquals(PointLedgerEntryType.EARN, rows.get(0).getType());
        assertEquals(1000L, rows.get(0).getAmountMinor());
        assertEquals("order-a", rows.get(0).getOrderPublicId());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(clientPointLedgerEntryRepository).findByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(
                eq("tenant-a"), eq(42L), pageableCaptor.capture());
        assertEquals(20, pageableCaptor.getValue().getPageSize());
    }

    @Test
    @DisplayName("listRecentLedger — 원장 없으면 빈 목록")
    void listRecentLedger_noEntries_returnsEmpty() {
        when(clientPointLedgerEntryRepository.findByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        eq("tenant-b"), eq(99L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        List<ShopPointLedgerEntryResponse> rows = service.listRecentLedger("tenant-b", 99L, 20);

        assertTrue(rows.isEmpty());
    }
}
