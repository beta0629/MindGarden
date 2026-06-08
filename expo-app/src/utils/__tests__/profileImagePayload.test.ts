import {
  extractPhoneFromProfileResponse,
  extractProfileImageUrlFromPutResponse,
  resolveProfileGetEndpoint,
  resolveProfileImageExtractRole,
} from '../profileImagePayload';

describe('extractProfileImageUrlFromPutResponse', () => {
  it('reads profileImage for client role', () => {
    const raw = { success: true, data: { profileImage: 'data:image/png;base64,abc' } };
    expect(extractProfileImageUrlFromPutResponse('client', raw)).toBe('data:image/png;base64,abc');
  });

  it('reads profileImageUrl for consultant role with profileImage fallback', () => {
    const raw = { success: true, data: { profileImageUrl: 'https://cdn.example/a.png' } };
    expect(extractProfileImageUrlFromPutResponse('consultant', raw)).toBe(
      'https://cdn.example/a.png',
    );
    const fallback = { success: true, data: { profileImage: 'data:image/jpeg;base64,xyz' } };
    expect(extractProfileImageUrlFromPutResponse('consultant', fallback)).toBe(
      'data:image/jpeg;base64,xyz',
    );
  });

  it('returns null for empty strings', () => {
    expect(extractProfileImageUrlFromPutResponse('client', { data: { profileImage: '  ' } })).toBe(
      null,
    );
  });
});

describe('resolveProfileImageExtractRole', () => {
  it('maps consultant vs other app roles', () => {
    expect(resolveProfileImageExtractRole('consultant')).toBe('consultant');
    expect(resolveProfileImageExtractRole('client')).toBe('client');
    expect(resolveProfileImageExtractRole('admin')).toBe('client');
    expect(resolveProfileImageExtractRole('staff')).toBe('client');
  });
});

describe('resolveProfileGetEndpoint', () => {
  it('uses userProfile for consultant and CLIENT_PROFILE otherwise', () => {
    expect(resolveProfileGetEndpoint('consultant', 7)).toBe('/api/v1/users/profile/7');
    expect(resolveProfileGetEndpoint('admin', 7)).toBe('/api/v1/clients/profile');
  });
});

describe('extractPhoneFromProfileResponse', () => {
  it('phone 키 우선', () => {
    const raw = { success: true, data: { phone: '01012345678' } };
    expect(extractPhoneFromProfileResponse(raw)).toBe('01012345678');
  });

  it('phoneNumber 키 호환', () => {
    const raw = { phoneNumber: '010-1234-5678' };
    expect(extractPhoneFromProfileResponse(raw)).toBe('010-1234-5678');
  });

  it('mobile 키 호환 (네이버 응답 호환성)', () => {
    const raw = { success: true, data: { mobile: '01098765432' } };
    expect(extractPhoneFromProfileResponse(raw)).toBe('01098765432');
  });

  it('빈 문자열·공백·null·undefined·비객체 입력은 null', () => {
    expect(extractPhoneFromProfileResponse({ data: { phone: '' } })).toBeNull();
    expect(extractPhoneFromProfileResponse({ data: { phone: '   ' } })).toBeNull();
    expect(extractPhoneFromProfileResponse(null)).toBeNull();
    expect(extractPhoneFromProfileResponse(undefined)).toBeNull();
    expect(extractPhoneFromProfileResponse('not-an-object')).toBeNull();
  });

  it('success === false 응답은 null', () => {
    expect(extractPhoneFromProfileResponse({ success: false, data: { phone: '01012345678' } })).toBeNull();
  });
});
