import {
  mapProfileImageToSessionFields,
  resolveProfileImageFromApiResponse,
  mergeDualRoleProfileResponses,
  buildConsultantOnlyUpdatePayload
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

describe('mergeDualRoleProfileResponses', () => {
  test('merges client identity with consultant professional fields', () => {
    const merged = mergeDualRoleProfileResponses(
      {
        name: '홍길동',
        nickname: '길동',
        email: 'a@b.com',
        phone: '010-1234-5678',
        notificationChannelPreference: 'TENANT_DEFAULT'
      },
      {
        specialty: '아동',
        memo: '메모',
        notificationChannelPreference: 'KAKAO'
      }
    );
    expect(merged.userId).toBe('홍길동');
    expect(merged.specialty).toBe('아동');
    expect(merged.memo).toBe('메모');
    expect(merged.notificationChannelPreference).toBe('KAKAO');
  });
});

describe('buildConsultantOnlyUpdatePayload', () => {
  test('includes professional fields only', () => {
    const payload = buildConsultantOnlyUpdatePayload({
      userId: '홍길동',
      specialty: '가족',
      memo: '비고',
      notificationChannelPreference: 'SMS'
    });
    expect(payload.specialty).toBe('가족');
    expect(payload.memo).toBe('비고');
    expect(payload.notificationChannelPreference).toBe('SMS');
    expect(payload.name).toBeUndefined();
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
