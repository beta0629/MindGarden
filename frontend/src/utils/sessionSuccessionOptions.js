/**
 * 회기 승계·Side Peek 공통 — 내담자/상담사 옵션 매핑.
 *
 * @author CoreSolution
 * @since 2026-09-03
 */

import { asArray } from './apiResponseNormalize';
import { toDisplayString } from './safeDisplay';

/**
 * with-mapping-info 응답 → CustomSelect options.
 * 소스 CLIENT와 동일인은 제외(스펙).
 *
 * @param {*} payload StandardizedApi.get 결과
 * @param {string|number|null} sourceClientId 이전 당사자 id
 * @returns {{ value: string, label: string }[]}
 */
export const mapSessionSuccessionClientOptions = (payload, sourceClientId) => {
  const clients = asArray(payload, 'clients');
  return clients
    .filter((c) => c?.id != null && String(c.id) !== String(sourceClientId))
    .map((c) => ({
      value: String(c.id),
      label: toDisplayString(c.name || c.clientName, `내담자 #${c.id}`)
    }));
};

/**
 * with-stats 응답 → CustomSelect options.
 * API 실체: `{ consultants: [{ consultant: { id, name, ... }, ... }], count }`.
 *
 * @param {*} payload StandardizedApi.get 결과
 * @returns {{ value: string, label: string }[]}
 */
export const mapSessionSuccessionConsultantOptions = (payload) => {
  const consultants = asArray(payload, 'consultants');
  return consultants
    .map((item) => {
      const c = item?.consultant && typeof item.consultant === 'object' ? item.consultant : item;
      if (c?.id == null) {
        return null;
      }
      return {
        value: String(c.id),
        label: toDisplayString(c.name || c.consultantName, `상담사 #${c.id}`)
      };
    })
    .filter(Boolean);
};
