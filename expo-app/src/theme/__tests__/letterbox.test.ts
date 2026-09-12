/**
 * letterbox 토큰·헬퍼 단위 테스트 (Build 1.0.9, Apple G4 대응).
 *
 * <p>iPad 임계 화면 폭(744pt) 기준 isLetterboxEnabled 분기와, 디자이너 SSOT
 * (P3-D 스펙 §3.2 / §5) 의 고정 수치(LETTERBOX_BORDER_WIDTH=1, MIN_SIDE_GUTTER=24,
 * CONTENT_MAX_WIDTH=440) 회귀를 막는다.</p>
 *
 * <p>회귀 의의: 본 값들이 ContentLetterbox · UnifiedModal · CredentialSheet 의 가운데 정렬
 * 동작 및 iPad mini(744)/Air(820)/Pro 12.9(1024) 의 좌·우 여백 계산 (deviceWidth-440)/2 에
 * 직접 영향한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
/**
 * 본 테스트는 node 환경에서 동작하므로, letterbox.ts → loginAnimationConstants.ts 가 끌어오는
 * `import { Easing } from 'react-native'` 의존을 mock 으로 무력화한다.
 * 기존 login 테스트(LogoSection.test.ts)와 동일 패턴.
 */
import {
  isLetterboxEnabled,
  LETTERBOX_ACTIVATION_WIDTH,
  LETTERBOX_BORDER_WIDTH,
  LETTERBOX_CONTENT_MAX_WIDTH,
  LETTERBOX_MIN_SIDE_GUTTER,
} from '../letterbox';

jest.mock('react-native', () => ({
  Easing: {
    out: jest.fn((curve: unknown) => curve),
    inOut: jest.fn((curve: unknown) => curve),
    cubic: 'cubic',
    ease: 'ease',
    sin: 'sin',
  },
}));

describe('letterbox tokens (P3-D spec §3.2 / §5)', () => {
  describe('상수 — 디자이너 SSOT 와 동일 값 유지', () => {
    it('LETTERBOX_CONTENT_MAX_WIDTH 는 440pt (iPhone 14 Pro Max 430+α, HIG 가독선)', () => {
      expect(LETTERBOX_CONTENT_MAX_WIDTH).toBe(440);
    });

    it('LETTERBOX_ACTIVATION_WIDTH 는 744pt (iPad mini portrait)', () => {
      expect(LETTERBOX_ACTIVATION_WIDTH).toBe(744);
    });

    it('LETTERBOX_MIN_SIDE_GUTTER 는 24pt (기존 모바일 좌우 여백)', () => {
      expect(LETTERBOX_MIN_SIDE_GUTTER).toBe(24);
    });

    it('LETTERBOX_BORDER_WIDTH 는 1pt (HiDPI iPad 시각 분리감 보장)', () => {
      expect(LETTERBOX_BORDER_WIDTH).toBe(1);
    });
  });

  describe('isLetterboxEnabled', () => {
    it('iPhone SE (375pt) 에서 false', () => {
      expect(isLetterboxEnabled(375)).toBe(false);
    });

    it('iPhone 14 Pro Max (430pt) 에서 false', () => {
      expect(isLetterboxEnabled(430)).toBe(false);
    });

    it('임계 직전 (743pt) 에서 false', () => {
      expect(isLetterboxEnabled(743)).toBe(false);
    });

    it('iPad mini 6th portrait (744pt) 에서 true — 임계값 포함', () => {
      expect(isLetterboxEnabled(744)).toBe(true);
    });

    it('iPad Air 11" M3 portrait (820pt) 에서 true — Apple G4 심사 디바이스', () => {
      expect(isLetterboxEnabled(820)).toBe(true);
    });

    it('iPad Pro 12.9" portrait (1024pt) 에서 true', () => {
      expect(isLetterboxEnabled(1024)).toBe(true);
    });
  });

  describe('좌·우 여백 시각 검증 — (deviceWidth - max)/2', () => {
    type Device = {
      readonly name: string;
      readonly width: number;
      readonly expectedGutter: number;
    };
    const devices: readonly Device[] = [
      { name: 'iPad mini 6th', width: 744, expectedGutter: 152 },
      { name: 'iPad Air 11" M3', width: 820, expectedGutter: 190 },
      { name: 'iPad Pro 12.9"', width: 1024, expectedGutter: 292 },
    ];

    it.each(devices)(
      '$name ($width pt) 좌·우 여백 각 $expectedGutter pt',
      ({ width, expectedGutter }) => {
        const gutter = (width - LETTERBOX_CONTENT_MAX_WIDTH) / 2;
        expect(gutter).toBe(expectedGutter);
      },
    );
  });
});
