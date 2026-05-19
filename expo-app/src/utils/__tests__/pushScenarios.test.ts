import {
  getScenarioByType,
  PUSH_SCENARIOS,
  resolveCanonicalPushType,
} from '../../constants/pushScenarios';

describe('pushScenarios shop types', () => {
  it('resolves canonical shop_order_paid', () => {
    expect(resolveCanonicalPushType('shop_payment_complete')).toBe('shop_order_paid');
    const scenario = getScenarioByType('shop_order_paid');
    expect(scenario?.type).toBe(PUSH_SCENARIOS.SHOP_ORDER_PAID.type);
    expect(scenario?.routeClient).toContain('{orderPublicId}');
  });

  it('resolves shop payment and point aliases', () => {
    expect(resolveCanonicalPushType('shop_point_earned')).toBe('point_earned');
    expect(getScenarioByType('shop_payment_failed')?.title).toBe('주문 결제 실패');
    expect(getScenarioByType('point_earned')?.settingsCategory).toBe('payment');
  });

  it('registers hold expired and fulfillment scenarios', () => {
    expect(getScenarioByType('shop_order_hold_expired')?.routeClient).toBe('/(client)/(shop)/orders');
    expect(getScenarioByType('shop_fulfillment_completed')?.routeConsultant).toBeDefined();
  });
});
