import {
  mapProfileImageToSessionFields,
  resolveProfileImageFromApiResponse
} from '../mypageProfilePayload';

describe('resolveProfileImageFromApiResponse', () => {
  test('client prefers profileImage', () => {
    expect(
      resolveProfileImageFromApiResponse('CLIENT', {
        profileImage: 'data:image/png;base64,a',
        profileImageUrl: 'https://ignored'
      })
    ).toBe('data:image/png;base64,a');
  });

  test('consultant prefers profileImageUrl', () => {
    expect(
      resolveProfileImageFromApiResponse('CONSULTANT', {
        profileImageUrl: 'https://cdn.example/b.png',
        profileImage: 'data:image/png;base64,a'
      })
    ).toBe('https://cdn.example/b.png');
  });
});

describe('mapProfileImageToSessionFields', () => {
  test('mirrors profileImage and profileImageUrl', () => {
    expect(mapProfileImageToSessionFields('https://cdn.example/c.png')).toEqual({
      profileImage: 'https://cdn.example/c.png',
      profileImageUrl: 'https://cdn.example/c.png'
    });
  });

  test('returns null pair for empty input', () => {
    expect(mapProfileImageToSessionFields('')).toEqual({
      profileImage: null,
      profileImageUrl: null
    });
  });
});
