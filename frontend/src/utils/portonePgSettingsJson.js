/**
 * 포트원 PG settings_json 파싱·병합 유틸 (폼·단위테스트 공용).
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import {
  PORTONE_SETTINGS_KEY_CHANNEL_KEY,
  PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST,
  PORTONE_SETTINGS_KEY_WEBHOOK_SECRET
} from '../constants/portonePgConfiguration';

/**
 * settings_json 에서 포트원 전용 키를 분리한다.
 *
 * @param {string|null|undefined} settingsJson
 * @returns {{ webhookSecret: string, channelKey: string, channelKeyTest: string, rest: Object }}
 */
export const parsePortoneSettingsJson = (settingsJson) => {
  const empty = { webhookSecret: '', channelKey: '', channelKeyTest: '', rest: {} };
  if (!settingsJson || !String(settingsJson).trim()) {
    return empty;
  }
  try {
    const obj = JSON.parse(String(settingsJson));
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return empty;
    }
    const webhookSecret = Object.prototype.hasOwnProperty.call(obj, PORTONE_SETTINGS_KEY_WEBHOOK_SECRET)
      ? String(obj[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET] ?? '')
      : '';
    const channelKey = Object.prototype.hasOwnProperty.call(obj, PORTONE_SETTINGS_KEY_CHANNEL_KEY)
      ? String(obj[PORTONE_SETTINGS_KEY_CHANNEL_KEY] ?? '')
      : '';
    const channelKeyTest = Object.prototype.hasOwnProperty.call(obj, PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST)
      ? String(obj[PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST] ?? '')
      : '';
    const rest = { ...obj };
    delete rest[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET];
    delete rest[PORTONE_SETTINGS_KEY_CHANNEL_KEY];
    delete rest[PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST];
    return { webhookSecret, channelKey, channelKeyTest, rest };
  } catch {
    return empty;
  }
};

/**
 * 포트원 필드 + 나머지 키 병합 후 JSON 문자열.
 *
 * @param {string} webhookSecretInput
 * @param {string} channelKeyInput
 * @param {string} channelKeyTestInput
 * @param {Object} rest
 * @returns {string|null}
 */
export const buildSettingsJsonFromPortoneFields = (
  webhookSecretInput,
  channelKeyInput,
  channelKeyTestInput,
  rest
) => {
  const obj = { ...(rest || {}) };
  const webhook = webhookSecretInput != null ? String(webhookSecretInput).trim() : '';
  const liveKey = channelKeyInput != null ? String(channelKeyInput).trim() : '';
  const testKey = channelKeyTestInput != null ? String(channelKeyTestInput).trim() : '';
  if (webhook !== '') {
    obj[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET] = webhook;
  }
  if (liveKey !== '') {
    obj[PORTONE_SETTINGS_KEY_CHANNEL_KEY] = liveKey;
  }
  if (testKey !== '') {
    obj[PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST] = testKey;
  }
  if (Object.keys(obj).length === 0) {
    return null;
  }
  return JSON.stringify(obj);
};

/**
 * testMode 에 따라 사용할 channelKey 를 선택한다.
 *
 * @param {{ channelKey?: string, channelKeyTest?: string }} fields
 * @param {boolean} testMode
 * @returns {string}
 */
export const resolvePortoneChannelKey = (fields, testMode) => {
  const live = fields?.channelKey != null ? String(fields.channelKey).trim() : '';
  const test = fields?.channelKeyTest != null ? String(fields.channelKeyTest).trim() : '';
  return testMode ? test : live;
};

/**
 * 표시용 채널 키 마스킹 (앞 6·뒤 4, 짧으면 ***).
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
export const maskPortoneChannelKey = (value) => {
  const s = value != null ? String(value).trim() : '';
  if (!s) {
    return '-';
  }
  if (s.length <= 10) {
    return '***';
  }
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
};

/**
 * 포트원 웹훅 시크릿 설정 여부.
 * API 의 {@code portoneWebhookSecretConfigured} 를 우선하고,
 * 없으면 settings_json 키 존재만으로 판별한다(값은 노출하지 않음).
 *
 * @param {{ portoneWebhookSecretConfigured?: boolean, settingsJson?: string }|null|undefined} config
 * @returns {boolean}
 */
export const isPortoneWebhookSecretConfigured = (config) => {
  if (config == null || typeof config !== 'object') {
    return false;
  }
  if (typeof config.portoneWebhookSecretConfigured === 'boolean') {
    return config.portoneWebhookSecretConfigured;
  }
  const parsed = parsePortoneSettingsJson(config.settingsJson);
  return Boolean(parsed.webhookSecret && String(parsed.webhookSecret).trim());
};
