/**
 * 수동 발송 폼 테스트 공용 i18n — 실제 ko(admin) 문구로 키를 풀어 화면과 같은 텍스트로 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */

import koAdmin from '../locales/ko/admin.json';

const lookup = (key) => {
  const value = String(key).split('.').reduce(
    (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
    koAdmin
  );
  return typeof value === 'string' ? value : undefined;
};

/**
 * react-i18next 의 t 와 같은 시그니처(키, 기본값|옵션, 옵션).
 * @param {string} key
 * @param {(string|object)} [defOrOpts]
 * @param {object} [opts]
 * @returns {string}
 */
export const translateKo = (key, defOrOpts, opts) => {
  const hasDefault = typeof defOrOpts === 'string';
  const variables = hasDefault ? (opts || {}) : (defOrOpts || {});
  const fallback = lookup(key) || (hasDefault ? defOrOpts : (variables.defaultValue || key));
  return Object.entries(variables).reduce(
    (acc, [name, value]) => acc.replace(new RegExp(`{{${name}}}`, 'g'), String(value)),
    fallback
  );
};
