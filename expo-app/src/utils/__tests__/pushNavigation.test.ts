import {
  PUSH_SCENARIOS,
  PUSH_SCENARIOS_P1_TO_P12_ORDERED,
  PUSH_SCENARIO_SERVER_TYPES,
} from '../../constants/pushScenarios';
import {
  collectPushRouteParams,
  resolvePushNavigationRoute,
  resolvePushRouteWithFallback,
} from '../pushNavigation';

describe('pushNavigation P1–P12', () => {
  it('covers all 12 canonical server types', () => {
    expect(PUSH_SCENARIO_SERVER_TYPES).toHaveLength(12);
    for (const scenario of PUSH_SCENARIOS_P1_TO_P12_ORDERED) {
      expect(PUSH_SCENARIO_SERVER_TYPES).toContain(scenario.type);
    }
  });

  it.each([
    {
      label: 'P1 client',
      type: PUSH_SCENARIOS.BOOKING_REMINDER.type,
      role: 'client' as const,
      data: { scheduleId: 'sch-1' },
      route: '/(client)/(sessions)/sch-1',
    },
    {
      label: 'P1 consultant',
      type: PUSH_SCENARIOS.BOOKING_REMINDER.type,
      role: 'consultant' as const,
      data: { id: 'sch-2' },
      route: '/(consultant)/(schedule)/sch-2',
    },
    {
      label: 'P2 client',
      type: PUSH_SCENARIOS.BOOKING_CONFIRMED.type,
      role: 'client' as const,
      data: { consultationId: 'c-9' },
      route: '/(client)/(sessions)/c-9',
    },
    {
      label: 'P3 client list',
      type: PUSH_SCENARIOS.BOOKING_CANCELLED.type,
      role: 'client' as const,
      data: {},
      route: '/(client)/(sessions)',
    },
    {
      label: 'P3 consultant list',
      type: PUSH_SCENARIOS.BOOKING_CANCELLED.type,
      role: 'consultant' as const,
      data: {},
      route: '/(consultant)/(schedule)',
    },
    {
      label: 'P4 session started',
      type: PUSH_SCENARIOS.SESSION_STARTED.type,
      role: 'client' as const,
      data: { id: 'sess-1' },
      route: '/(client)/(sessions)/sess-1',
    },
    {
      label: 'P5 review',
      type: PUSH_SCENARIOS.SESSION_COMPLETED.type,
      role: 'client' as const,
      data: { scheduleId: 'rev-1' },
      route: '/(client)/(sessions)/review/rev-1',
    },
    {
      label: 'P6 payment',
      type: PUSH_SCENARIOS.PAYMENT_COMPLETED.type,
      role: 'client' as const,
      data: { mappingId: 'map-7' },
      route: '/(client)/(more)/sessions-payment/map-7',
    },
    {
      label: 'P7 payment failed list',
      type: PUSH_SCENARIOS.PAYMENT_FAILED.type,
      role: 'client' as const,
      data: {},
      route: '/(client)/(more)/sessions-payment',
    },
    {
      label: 'P8 session low',
      type: PUSH_SCENARIOS.SESSION_LOW.type,
      role: 'client' as const,
      data: {},
      route: '/(client)/(more)/sessions-payment',
    },
    {
      label: 'P9 record reminder',
      type: PUSH_SCENARIOS.CONSULTATION_RECORD_REMINDER.type,
      role: 'consultant' as const,
      data: { scheduleId: 'sch-rec' },
      route: '/(consultant)/(records)/create/sch-rec',
    },
    {
      label: 'P10 message client',
      type: PUSH_SCENARIOS.NEW_MESSAGE.type,
      role: 'client' as const,
      data: { conversationId: 'conv-3' },
      route: '/(client)/(more)/messages/conv-3',
    },
    {
      label: 'P10 message consultant',
      type: PUSH_SCENARIOS.NEW_MESSAGE.type,
      role: 'consultant' as const,
      data: { threadId: 'thr-8' },
      route: '/(consultant)/(more)/messages/thr-8',
    },
    {
      label: 'P11 mood',
      type: PUSH_SCENARIOS.MOOD_REMINDER.type,
      role: 'client' as const,
      data: {},
      route: '/(client)/(wellness)/mood-journal',
    },
    {
      label: 'P12 notice client',
      type: PUSH_SCENARIOS.SYSTEM_NOTICE.type,
      role: 'client' as const,
      data: {},
      route: '/(client)/(more)/notifications',
    },
    {
      label: 'P12 notice consultant',
      type: PUSH_SCENARIOS.SYSTEM_NOTICE.type,
      role: 'consultant' as const,
      data: {},
      route: '/(consultant)/(more)/notifications',
    },
  ])('$label → $route', ({ type, role, data, route }) => {
    const result = resolvePushNavigationRoute(type, data, role);
    expect(result).toEqual({ ok: true, route });
  });

  it('rejects consultant-only scenario for client shell role', () => {
    const result = resolvePushNavigationRoute(
      PUSH_SCENARIOS.CONSULTATION_RECORD_REMINDER.type,
      { scheduleId: 'x' },
      'client',
    );
    expect(result).toEqual({ ok: false, reason: 'role_mismatch' });
  });

  it('rejects unknown type', () => {
    expect(resolvePushNavigationRoute('not_a_push_type', {}, 'client')).toEqual({
      ok: false,
      reason: 'unknown_type',
    });
  });

  it('resolves alias types via canonical map', () => {
    const result = resolvePushNavigationRoute('appointment_reminder', { id: 'a1' }, 'client');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.route).toBe('/(client)/(sessions)/a1');
    }
  });
});

describe('collectPushRouteParams', () => {
  it('maps shop orderPublicId', () => {
    const params = collectPushRouteParams(PUSH_SCENARIOS.SHOP_ORDER_PAID, {
      orderPublicId: 'ord-99',
    });
    expect(params.orderPublicId).toBe('ord-99');
  });
});

describe('resolvePushRouteWithFallback', () => {
  it('falls back when id placeholder remains', () => {
    const route = resolvePushRouteWithFallback(
      PUSH_SCENARIOS.BOOKING_REMINDER,
      '/(client)/(sessions)/{id}',
      'client',
    );
    expect(route).toBe('/(client)/(sessions)');
  });
});
