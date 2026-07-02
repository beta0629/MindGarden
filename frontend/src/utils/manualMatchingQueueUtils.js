/**
 * Admin manual matching queue — client eligibility helpers.
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

export const MANUAL_MATCHING_EXCLUDED_LIFECYCLE_STATES = Object.freeze([
  'DELETED_BY_ADMIN',
  'ANONYMIZED',
  'HARD_DELETED'
]);

/**
 * @param {Object|null|undefined} client
 * @returns {boolean}
 */
export function isEligibleForManualMatching(client) {
  if (!client || typeof client !== 'object') {
    return false;
  }
  if (client.isDeleted === true) {
    return false;
  }
  if (client.isActive === false) {
    return false;
  }
  const lifecycleState = client.lifecycleState;
  if (lifecycleState && MANUAL_MATCHING_EXCLUDED_LIFECYCLE_STATES.includes(lifecycleState)) {
    return false;
  }
  return (client.mappingCount ?? 0) === 0;
}

/**
 * @param {Array<Object>|null|undefined} clients
 * @returns {Array<Object>}
 */
export function filterManualMatchingQueueClients(clients) {
  if (!Array.isArray(clients)) {
    return [];
  }
  return clients.filter(isEligibleForManualMatching);
}
