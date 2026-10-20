/**
 * PG 설정 시크릿 공란 허용 정책 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-10-16
 */

import {
  areProviderSecretsRequiredOnSave,
  canOmitApiSecretOnEdit,
  isIamportApiSecretRequired
} from '../pgConfigurationSecretPolicy';
import { PG_CONFIGURATION_SECRET_COPY } from '../../constants/pgConfigurationSecretPolicy';

describe('pgConfigurationSecretPolicy', () => {
  describe('canOmitApiSecretOnEdit', () => {
    test('create 는 공란 생략 불가', () => {
      expect(canOmitApiSecretOnEdit({ mode: 'create', apiSecretConfigured: true })).toBe(false);
    });

    test('edit + apiSecretConfigured true → 허용', () => {
      expect(canOmitApiSecretOnEdit({ mode: 'edit', apiSecretConfigured: true })).toBe(true);
    });

    test('edit + apiSecretConfigured false → 불가', () => {
      expect(canOmitApiSecretOnEdit({ mode: 'edit', apiSecretConfigured: false })).toBe(false);
    });

    test('edit + 플래그 없음 → mode=edit 프록시로 허용 (PENDING 포함)', () => {
      expect(canOmitApiSecretOnEdit({ mode: 'edit' })).toBe(true);
      expect(canOmitApiSecretOnEdit({ mode: 'edit', apiSecretConfigured: undefined })).toBe(true);
    });
  });

  describe('isIamportApiSecretRequired', () => {
    test('testMode ON 이면 create/edit 모두 비필수', () => {
      expect(isIamportApiSecretRequired({ mode: 'create', testMode: true })).toBe(false);
      expect(isIamportApiSecretRequired({ mode: 'edit', testMode: true })).toBe(false);
    });

    test('testMode OFF + create 이면 필수', () => {
      expect(isIamportApiSecretRequired({ mode: 'create', testMode: false })).toBe(true);
    });

    test('testMode OFF + edit + 저장본 → 비필수 (ACTIVE/PENDING 공통)', () => {
      expect(
        isIamportApiSecretRequired({
          mode: 'edit',
          testMode: false,
          apiSecretConfigured: true
        })
      ).toBe(false);
      expect(
        isIamportApiSecretRequired({
          mode: 'edit',
          testMode: false
        })
      ).toBe(false);
    });

    test('testMode OFF + edit + 저장본 없음 → 필수', () => {
      expect(
        isIamportApiSecretRequired({
          mode: 'edit',
          testMode: false,
          apiSecretConfigured: false
        })
      ).toBe(true);
    });
  });

  describe('areProviderSecretsRequiredOnSave', () => {
    test('create 필수, edit+저장본 비필수', () => {
      expect(areProviderSecretsRequiredOnSave({ mode: 'create' })).toBe(true);
      expect(
        areProviderSecretsRequiredOnSave({ mode: 'edit', apiSecretConfigured: true })
      ).toBe(false);
    });
  });

  describe('PG_CONFIGURATION_SECRET_COPY', () => {
    test('수정 힌트 카피가 정의되어 있다', () => {
      expect(PG_CONFIGURATION_SECRET_COPY.EDIT_SECRET_HINT).toContain('운영 저장값');
      expect(PG_CONFIGURATION_SECRET_COPY.EDIT_SECRET_PLACEHOLDER).toBeTruthy();
    });
  });
});
