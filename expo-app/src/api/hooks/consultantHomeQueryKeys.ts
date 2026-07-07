/**
 * 상담사 홈 React Query 키 SSOT
 *
 * @author MindGarden
 * @since 2026-07-07
 */
export const CONSULTANT_HOME_QUERY_KEYS = {
  all: ['consultantHome'] as const,
  stats: () => [...CONSULTANT_HOME_QUERY_KEYS.all, 'stats'] as const,
  incompleteRecords: (consultantId: string | number) =>
    [...CONSULTANT_HOME_QUERY_KEYS.all, 'incompleteRecords', consultantId] as const,
  highPriorityClients: (consultantId: string | number) =>
    [...CONSULTANT_HOME_QUERY_KEYS.all, 'highPriorityClients', consultantId] as const,
  upcomingPreparation: (consultantId: string | number) =>
    [...CONSULTANT_HOME_QUERY_KEYS.all, 'upcomingPreparation', consultantId] as const,
};
