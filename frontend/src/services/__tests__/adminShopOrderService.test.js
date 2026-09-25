/**
 * adminShopOrderService — reconcileShopOrderPayment URL/body
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import StandardizedApi from '../../utils/standardizedApi';
import {
  buildAdminShopOrderReconcilePaymentPath,
  buildAdminShopReconcilePaymentBody
} from '../../constants/adminShopApi';
import { reconcileShopOrderPayment } from '../adminShopOrderService';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
  }
}));

describe('adminShopOrderService reconcileShopOrderPayment', () => {
  const ORDER_ID = 'f886895a-170a-4f72-a8ea-4730a4e0ce3a';
  const PAYMENT_ID = 'PAY_1789716701414_178df348';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('buildAdminShopOrderReconcilePaymentPath — reconcile-payment URL', () => {
    expect(buildAdminShopOrderReconcilePaymentPath(ORDER_ID)).toBe(
      `/api/v1/admin/shop/orders/${encodeURIComponent(ORDER_ID)}/reconcile-payment`
    );
  });

  test('buildAdminShopReconcilePaymentBody — paymentId only', () => {
    expect(buildAdminShopReconcilePaymentBody({ paymentId: PAYMENT_ID })).toEqual({
      paymentId: PAYMENT_ID
    });
  });

  test('reconcileShopOrderPayment posts URL and body', async() => {
    StandardizedApi.post.mockResolvedValueOnce({
      success: true,
      data: {
        orderPublicId: ORDER_ID,
        paymentId: PAYMENT_ID,
        orderStatus: 'PAID'
      }
    });

    const result = await reconcileShopOrderPayment(ORDER_ID, { paymentId: PAYMENT_ID });

    expect(StandardizedApi.post).toHaveBeenCalledWith(
      `/api/v1/admin/shop/orders/${encodeURIComponent(ORDER_ID)}/reconcile-payment`,
      { paymentId: PAYMENT_ID }
    );
    expect(result.orderPublicId).toBe(ORDER_ID);
    expect(result.paymentId).toBe(PAYMENT_ID);
  });

  test('reconcileShopOrderPayment rejects missing paymentId and approval', async() => {
    await expect(reconcileShopOrderPayment(ORDER_ID, {})).rejects.toThrow(
      'paymentId 또는 cardApprovalNumber가 필요합니다.'
    );
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });
});
