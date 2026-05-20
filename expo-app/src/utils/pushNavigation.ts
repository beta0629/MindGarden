/**
 * 푸시 알림 탭·토스트 → expo-router 경로 해석 (순수 함수)
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import {
  getRouteTemplateForRole,
  getScenarioByType,
  prefixRoleForMoreRoute,
  resolveRoute,
  routeMatchesRole,
  type PushScenario,
} from '../constants/pushScenarios';

export type PushShellRole = 'client' | 'consultant';

export type PushNavigationResult =
  | { ok: true; route: string }
  | { ok: false; reason: 'unknown_type' | 'role_mismatch' };

/**
 * 푸시 data에서 라우트 파라미터 추출 (id·scheduleId 등 서버 키 편차 흡수)
 */
export function collectPushRouteParams(
  scenario: PushScenario,
  data: Record<string, unknown>,
): Record<string, string | number> {
  const firstString = (...vals: unknown[]): string | undefined => {
    for (const v of vals) {
      if (v != null && String(v).trim() !== '') {
        return String(v);
      }
    }
    return undefined;
  };

  const params: Record<string, string | number> = {};

  const orderPublicId = firstString(data.orderPublicId, data.id);
  if (orderPublicId != null) {
    params.orderPublicId = orderPublicId;
  }

  if (scenario.category === 'record') {
    const sid = firstString(data.scheduleId, data.consultationId, data.id);
    if (sid != null) {
      params.scheduleId = sid;
    }
    return params;
  }

  if (scenario.category === 'booking' || scenario.category === 'session') {
    const sid = firstString(data.scheduleId, data.consultationId, data.id);
    if (sid != null) {
      params.id = sid;
    }
  } else if (scenario.category === 'payment') {
    const pid = firstString(
      data.mappingId,
      data.consultantClientMappingId,
      data.paymentId,
      data.orderPublicId,
      data.id,
    );
    if (pid != null) {
      params.id = pid;
    }
  } else {
    const oid = firstString(data.id, data.conversationId, data.threadId, data.userId);
    if (oid != null) {
      params.id = oid;
    }
  }

  const scheduleExtra = firstString(data.scheduleId, data.consultationId);
  if (scheduleExtra != null && params.id == null) {
    params.scheduleId = scheduleExtra;
  }

  return params;
}

/**
 * 미치환 `{placeholder}` 가 남을 때 역할·시나리오별 안전 폴백 경로
 */
export function resolvePushRouteWithFallback(
  scenario: PushScenario,
  route: string,
  role: PushShellRole,
): string {
  if (!/\{[^}]+\}/.test(route)) {
    return route;
  }
  if (route.includes('sessions)/review')) {
    return role === 'consultant' ? '/(consultant)/(schedule)' : '/(client)/(sessions)';
  }
  if (route.includes('records)/create')) {
    return '/(consultant)/(records)';
  }
  if (scenario.route.includes('(shop)/orders')) {
    return role === 'consultant' ? '/(consultant)/(more)' : '/(client)/(shop)/orders';
  }
  if (scenario.route.includes('sessions-payment')) {
    return role === 'consultant' ? '/(consultant)/(more)' : '/(client)/(more)/sessions-payment';
  }
  if (scenario.route.includes('(sessions)')) {
    return role === 'consultant' ? '/(consultant)/(schedule)' : '/(client)/(sessions)';
  }
  if (scenario.route.includes('(schedule)')) {
    return '/(consultant)/(schedule)';
  }
  if (scenario.route.includes('notifications')) {
    return role === 'consultant'
      ? '/(consultant)/(more)/notifications'
      : '/(client)/(more)/notifications';
  }
  if (scenario.route.includes('messages')) {
    return role === 'consultant' ? '/(consultant)/(more)/messages' : '/(client)/(more)/messages';
  }
  return role === 'consultant' ? '/(consultant)/(home)' : '/(client)/(home)';
}

/**
 * 서버 `data.type` + payload → expo-router 경로 (탭·토스트 공통)
 */
export function resolvePushNavigationRoute(
  type: string,
  data: Record<string, unknown>,
  role: PushShellRole,
): PushNavigationResult {
  const scenario = getScenarioByType(type);
  if (!scenario) {
    return { ok: false, reason: 'unknown_type' };
  }

  const params = collectPushRouteParams(scenario, data);
  const template = getRouteTemplateForRole(scenario, role);
  let route = resolveRoute(template, params);
  route = prefixRoleForMoreRoute(route, role);

  if (!routeMatchesRole(route, role)) {
    return { ok: false, reason: 'role_mismatch' };
  }

  route = resolvePushRouteWithFallback(scenario, route, role);
  return { ok: true, route };
}
