/**
 * portonePgSettingsJson 유틸 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import {
  PORTONE_SETTINGS_KEY_CHANNEL_KEY,
  PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST,
  PORTONE_SETTINGS_KEY_WEBHOOK_SECRET
} from '../../constants/portonePgConfiguration';
import {
  buildSettingsJsonFromPortoneFields,
  maskPortoneChannelKey,
  parsePortoneSettingsJson,
  resolvePortoneChannelKey
} from '../portonePgSettingsJson';

describe('portonePgSettingsJson', () => {
  describe('parsePortoneSettingsJson', () => {
    test('빈 값은 empty 구조를 반환한다', () => {
      expect(parsePortoneSettingsJson(null)).toEqual({
        webhookSecret: '',
        channelKey: '',
        channelKeyTest: '',
        rest: {}
      });
      expect(parsePortoneSettingsJson('')).toEqual({
        webhookSecret: '',
        channelKey: '',
        channelKeyTest: '',
        rest: {}
      });
    });

    test('포트원 키를 분리하고 rest 에 남긴다', () => {
      const json = JSON.stringify({
        [PORTONE_SETTINGS_KEY_CHANNEL_KEY]: 'live-key',
        [PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST]: 'test-key',
        [PORTONE_SETTINGS_KEY_WEBHOOK_SECRET]: 'whsec',
        other: 1
      });
      const parsed = parsePortoneSettingsJson(json);
      expect(parsed.channelKey).toBe('live-key');
      expect(parsed.channelKeyTest).toBe('test-key');
      expect(parsed.webhookSecret).toBe('whsec');
      expect(parsed.rest).toEqual({ other: 1 });
    });

    test('잘못된 JSON 은 empty 를 반환한다', () => {
      expect(parsePortoneSettingsJson('{bad')).toEqual({
        webhookSecret: '',
        channelKey: '',
        channelKeyTest: '',
        rest: {}
      });
    });
  });

  describe('buildSettingsJsonFromPortoneFields', () => {
    test('비어 있지 않은 키만 병합하고 상수 키명을 사용한다', () => {
      const built = buildSettingsJsonFromPortoneFields(
        '  secret  ',
        'live-abc',
        '',
        { keep: true }
      );
      const obj = JSON.parse(built);
      expect(obj[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET]).toBe('secret');
      expect(obj[PORTONE_SETTINGS_KEY_CHANNEL_KEY]).toBe('live-abc');
      expect(obj).not.toHaveProperty(PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST);
      expect(obj.keep).toBe(true);
      expect(Object.keys(obj)).toEqual(
        expect.arrayContaining([
          PORTONE_SETTINGS_KEY_CHANNEL_KEY,
          PORTONE_SETTINGS_KEY_WEBHOOK_SECRET,
          'keep'
        ])
      );
    });

    test('모두 비어 있고 rest 없으면 null', () => {
      expect(buildSettingsJsonFromPortoneFields('', '', '', {})).toBeNull();
    });

    test('폼 save 페이로드 키가 BE TenantPgSettingsJsonKeys 와 일치한다', () => {
      const built = buildSettingsJsonFromPortoneFields(
        null,
        'channel-live',
        'channel-test',
        {}
      );
      const obj = JSON.parse(built);
      expect(obj).toHaveProperty('portoneChannelKey', 'channel-live');
      expect(obj).toHaveProperty('portoneChannelKeyTest', 'channel-test');
      expect(PORTONE_SETTINGS_KEY_CHANNEL_KEY).toBe('portoneChannelKey');
      expect(PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST).toBe('portoneChannelKeyTest');
    });
  });

  describe('resolvePortoneChannelKey', () => {
    test('testMode true 면 test 키를 선택한다', () => {
      expect(
        resolvePortoneChannelKey(
          { channelKey: 'live', channelKeyTest: 'test' },
          true
        )
      ).toBe('test');
    });

    test('testMode false 면 live 키를 선택한다', () => {
      expect(
        resolvePortoneChannelKey(
          { channelKey: 'live', channelKeyTest: 'test' },
          false
        )
      ).toBe('live');
    });
  });

  describe('maskPortoneChannelKey', () => {
    test('빈 값은 -', () => {
      expect(maskPortoneChannelKey('')).toBe('-');
      expect(maskPortoneChannelKey(null)).toBe('-');
    });

    test('짧으면 ***', () => {
      expect(maskPortoneChannelKey('short')).toBe('***');
    });

    test('길면 앞6·뒤4 마스킹', () => {
      expect(maskPortoneChannelKey('channel_key_abcdefgh')).toBe('channe…efgh');
    });
  });
});
