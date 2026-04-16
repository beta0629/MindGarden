import { isConsultantUserProfileRole } from '../constants/mypageProfileRoles';

/**
 * DB PK(숫자만)는 실명 입력칸에 표시하지 않는다. (UserProfileResponse.userId 등과 혼동 방지)
 * @param {*} value
 * @returns {boolean}
 */
export function isLikelyNumericPrimaryKey(value) {
  if (value === null || value === undefined) {
    return false;
  }
  const s = String(value).trim();
  if (s === '') {
    return false;
  }
  return /^\d+$/.test(s);
}

/**
 * API 응답에서 실명(이름) 폼 값만 추출. userId(PK)는 절대 폴백하지 않음.
 * @param {object} response
 * @returns {string}
 */
function resolveDisplayNameFromProfileApiResponse(response) {
  if (!response) {
    return '';
  }
  const candidates = [response.name, response.displayName];
  for (const c of candidates) {
    if (c == null) {
      continue;
    }
    const s = String(c).trim();
    if (s === '' || isLikelyNumericPrimaryKey(s)) {
      continue;
    }
    return s;
  }
  return '';
}

/**
 * 세션/로컬 사용자 객체에서 이름 필드 폴백 (PK 숫자는 제외)
 * @param {object} user
 * @returns {string}
 */
export function pickSessionProfileNameForForm(user) {
  if (!user) {
    return '';
  }
  const candidates = [user.name, user.nickname, user.userId];
  for (const c of candidates) {
    if (c == null) {
      continue;
    }
    const s = String(c).trim();
    if (s === '' || isLikelyNumericPrimaryKey(s)) {
      continue;
    }
    return s;
  }
  return '';
}

/**
 * MyPageUpdateRequest / UserProfileUpdateRequest 에 맞게 요청 본문 구성
 */

function stripUndefinedDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 폼 state의 userId(실명 표시용 레거시 키)가 PK 숫자면 빈 문자열로 치환해 입력/API 오전송 방지
 * @param {object} formData
 * @returns {object}
 */
export function normalizeProfileFormNameField(formData) {
  if (!formData || !isLikelyNumericPrimaryKey(formData.userId)) {
    return formData;
  }
  return { ...formData, userId: '' };
}

function trimNameForPayload(raw) {
  if (raw == null || raw === '') {
    return raw === '' ? '' : undefined;
  }
  const t = String(raw).trim();
  if (t === '') {
    return '';
  }
  if (isLikelyNumericPrimaryKey(t)) {
    return '';
  }
  return t;
}

/**
 * MyPageUpdateRequest.name 과 동일: 폼의 `userId` 필드에 표시명(이름) 저장.
 * UserProfileUpdateRequest 의 name, nickname, phone, 주소 필드와 세션 마이페이지 경로와 키를 맞춤.
 */
function buildIdentityAndAddressPayload(data) {
  return {
    name: trimNameForPayload(data.userId),
    nickname: data.nickname,
    phone: data.phone,
    gender: data.gender,
    postalCode: data.postalCode,
    address: data.address,
    addressDetail: data.addressDetail,
    addressType: data.addressType || 'HOME',
    isPrimary: true
  };
}

function buildSessionMyPagePayload(data) {
  const payload = {
    ...buildIdentityAndAddressPayload(data)
  };
  const img = data.profileImage;
  if (img && typeof img === 'string' && img !== '/default-avatar.svg') {
    payload.profileImage = img;
  }
  return stripUndefinedDeep(payload);
}

function buildConsultantUserProfilePayload(data) {
  const payload = {
    ...buildIdentityAndAddressPayload(data),
    memo: data.memo,
    specialty: data.specialty,
    qualifications: data.qualifications,
    experience: data.experience,
    availableTime: data.availableTime,
    detailedIntroduction: data.detailedIntroduction,
    education: data.education,
    awards: data.awards,
    research: data.research
  };
  // hourlyRate: DTO에는 있으나 UserProfileServiceImpl 에서 자가 수정 시 미반영(로그만) — 전송 생략
  const img = data.profileImage;
  if (img && typeof img === 'string' && img !== '/default-avatar.svg') {
    payload.profileImageUrl = img;
  }
  return stripUndefinedDeep(payload);
}

/**
 * @param {string} role
 * @param {object} data 폼 상태
 * @returns {object}
 */
export function buildProfileUpdatePayload(role, data) {
  if (isConsultantUserProfileRole(role)) {
    return buildConsultantUserProfilePayload(data);
  }
  return buildSessionMyPagePayload(data);
}

function mapMyPageResponseToForm(response) {
  return {
    userId: resolveDisplayNameFromProfileApiResponse(response),
    nickname: response.nickname || '',
    email: response.email || '',
    phone: response.phone || response.phoneNumber || '',
    gender: response.gender || '',
    postalCode: response.postalCode || '',
    address: response.address || '',
    addressDetail: response.addressDetail || '',
    addressType: response.addressType || 'HOME',
    profileImage: response.profileImage || response.profileImageUrl || null,
    profileImageType: response.profileImageType || 'DEFAULT_ICON',
    socialProvider: response.socialProvider || null,
    socialProfileImage: response.socialProfileImage || null,
    memo: '',
    specialty: '',
    qualifications: '',
    experience: '',
    availableTime: '',
    detailedIntroduction: '',
    education: '',
    awards: '',
    research: '',
    hourlyRate: null
  };
}

function mapUserProfileResponseToForm(response) {
  return {
    userId: resolveDisplayNameFromProfileApiResponse(response),
    nickname: response.nickname || '',
    email: response.email || '',
    phone: response.phone || '',
    gender: response.gender || '',
    postalCode: response.postalCode || '',
    address: response.address || '',
    addressDetail: response.addressDetail || '',
    addressType: 'HOME',
    profileImage: response.profileImageUrl || null,
    profileImageType: response.profileImageType || 'DEFAULT_ICON',
    socialProvider: response.socialProvider || null,
    socialProfileImage: response.socialProfileImage || null,
    memo: response.memo || '',
    specialty: response.specialty || '',
    qualifications: response.qualifications || '',
    experience: response.experience || '',
    availableTime: response.availableTime || '',
    detailedIntroduction: response.detailedIntroduction || '',
    education: response.education || '',
    awards: response.awards || '',
    research: response.research || '',
    hourlyRate: response.hourlyRate ?? null
  };
}

/**
 * @param {string} role
 * @param {object} response API 응답
 * @returns {object} formData 초기값
 */
export function mapProfileLoadResponseToForm(role, response) {
  if (!response) {
    return null;
  }
  if (isConsultantUserProfileRole(role)) {
    return mapUserProfileResponseToForm(response);
  }
  return mapMyPageResponseToForm(response);
}
