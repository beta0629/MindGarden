/**
 * ProfileCard — P1 핫픽스 (2026-06-10) 회귀 테스트.
 *
 * 컴포넌트 전체 렌더는 react-native 환경이 필요하므로 본 테스트는
 * pure helper `shouldRenderProfileCardAvatar` 만 검증한다.
 * 회귀 방지: `users.profile_image_url` 이 비어 있지 않을 때 ProfileCard 가
 * 공통 Avatar 분기를 타도록 보장한다 (운영 P1 — user id=20 사례).
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { shouldRenderProfileCardAvatar } from '@/components/molecules/profileCardAvatarMode';

describe('shouldRenderProfileCardAvatar — 더보기 상단 카드 원격 이미지 분기', () => {
  test('null/undefined → placeholder 분기 (false)', () => {
    expect(shouldRenderProfileCardAvatar(null)).toBe(false);
    expect(shouldRenderProfileCardAvatar(undefined)).toBe(false);
  });

  test('빈 문자열/공백만 있는 문자열 → placeholder 분기 (false)', () => {
    expect(shouldRenderProfileCardAvatar('')).toBe(false);
    expect(shouldRenderProfileCardAvatar('   ')).toBe(false);
    expect(shouldRenderProfileCardAvatar('\n\t')).toBe(false);
  });

  test('운영 P1: BE 저장 상대 path(/api/v1/files/profile-images/...) → 원격 분기 (true)', () => {
    expect(
      shouldRenderProfileCardAvatar('/api/v1/files/profile-images/tenant_20_xxx.jpg'),
    ).toBe(true);
  });

  test('https 절대 URL (카카오 CDN 등) → 원격 분기 (true)', () => {
    expect(shouldRenderProfileCardAvatar('https://cdn.example.com/p.png')).toBe(true);
    expect(shouldRenderProfileCardAvatar('http://k.kakaocdn.net/dn/abc/profile.jpg')).toBe(true);
  });

  test('expo-image-picker 로컬 URI (file:, content:) → 원격 분기 (true)', () => {
    expect(shouldRenderProfileCardAvatar('file:///tmp/a.jpg')).toBe(true);
    expect(shouldRenderProfileCardAvatar('content://media/external/0/1')).toBe(true);
  });

  test('숫자/객체 등 비문자열 입력 → placeholder 분기 (false) (런타임 방어)', () => {
    // 런타임 안전: TS 에서 차단되지만 unknown 캐스팅 시나리오 대비
    expect(shouldRenderProfileCardAvatar(0 as unknown as string)).toBe(false);
    expect(shouldRenderProfileCardAvatar({} as unknown as string)).toBe(false);
  });
});
