/**
 * 포트원 PG settings_json 파싱·채널키 해석 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import {
  buildSettingsJsonFromPortoneFields,
  isPortoneWebhookSecretConfigured,
  parsePortoneSettingsJson,
  resolvePortoneChannelKey
} from '../portonePgSettingsJson';
import {
  PORTONE_SETTINGS_KEY_CHANNEL_KEY,
  PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST,
  PORTONE_SETTINGS_KEY_WEBHOOK_SECRET
} from '../../constants/portonePgConfiguration';

describe('portonePgSettingsJson', () => {
  test('parse includes channel keys and webhook secret', () => {
    const json = JSON.stringify({
      [PORTONE_SETTINGS_KEY_WEBHOOK_SECRET]: 'whsec',
      [PORTONE_SETTINGS_KEY_CHANNEL_KEY]: 'live-ck',
      [PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST]: 'test-ck',
      other: 1
    });
    const parsed = parsePortoneSettingsJson(json);
    expect(parsed.webhookSecret).toBe('whsec');
    expect(parsed.channelKey).toBe('live-ck');
    expect(parsed.channelKeyTest).toBe('test-ck');
    expect(parsed.rest).toEqual({ other: 1 });
  });

  test('build merges channel keys into settings_json', () => {
    const built = buildSettingsJsonFromPortoneFields('sec', 'live', 'test', { keep: true });
    const obj = JSON.parse(built);
    expect(obj[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET]).toBe('sec');
    expect(obj[PORTONE_SETTINGS_KEY_CHANNEL_KEY]).toBe('live');
    expect(obj[PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST]).toBe('test');
    expect(obj.keep).toBe(true);
  });

  test('resolvePortoneChannelKey respects testMode', () => {
    expect(resolvePortoneChannelKey({ channelKey: 'L', channelKeyTest: 'T' }, true)).toBe('T');
    expect(resolvePortoneChannelKey({ channelKey: 'L', channelKeyTest: 'T' }, false)).toBe('L');
  });

  test('isPortoneWebhookSecretConfigured prefers API flag', () => {
    expect(isPortoneWebhookSecretConfigured({ portoneWebhookSecretConfigured: true })).toBe(true);
    expect(isPortoneWebhookSecretConfigured({ portoneWebhookSecretConfigured: false })).toBe(false);
  });

  test('isPortoneWebhookSecretConfigured falls back to settings_json presence', () => {
    expect(isPortoneWebhookSecretConfigured({
      settingsJson: JSON.stringify({ [PORTONE_SETTINGS_KEY_WEBHOOK_SECRET]: 'x' })
    })).toBe(true);
    expect(isPortoneWebhookSecretConfigured({
      settingsJson: JSON.stringify({ [PORTONE_SETTINGS_KEY_CHANNEL_KEY]: 'ck' })
    })).toBe(false);
  });
});
