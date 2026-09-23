/**
 * AdminShopOrdersPage — UnifiedModal actions·paymentId 노출 스모크
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import fs from 'fs';
import path from 'path';

const pagePath = path.join(__dirname, '..', 'AdminShopOrdersPage.js');
const source = fs.readFileSync(pagePath, 'utf8');

describe('AdminShopOrdersPage modal actions & paymentId', () => {
  test('UnifiedModal uses actions= (not footer=) for detail/refund/cancel', () => {
    expect(source).not.toMatch(/\bfooter=\{/);
    expect(source).toMatch(/import ModalFormActions from ['"].*ModalFormActions['"]/);
    expect(source).toMatch(/actions=\{\(/);
    expect(source).toMatch(/submitText="환불 실행"/);
    expect(source).toMatch(/submitText="취소 실행"/);
    expect(source).toMatch(/onSubmit=\{handleRefund\}/);
    expect(source).toMatch(/onSubmit=\{handleCancelUnpaid\}/);
    expect(source).toMatch(/loading=\{refunding\}/);
    expect(source).toMatch(/loading=\{cancellingUnpaid\}/);
    expect(source).toMatch(/cancelVariant="ghost"/);
    expect(source).toMatch(/submitVariant="primary"/);
  });

  test('OrderDetailBody shows PortOne paymentId when present', () => {
    expect(source).toMatch(/detail\.paymentId/);
    expect(source).toMatch(/결제 ID:/);
    expect(source).toMatch(/결제 상태:/);
    expect(source).toMatch(/toDisplayString\(detail\.paymentId/);
    expect(source).toMatch(/toDisplayString\(detail\.paymentStatus/);
  });
});
