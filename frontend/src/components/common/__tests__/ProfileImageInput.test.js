/**
 * ProfileImageInput — Clinic-OS 프로필 사진 슬롯 SSOT 단위 테스트
 *
 * @author Core Solution
 * @since 2026-09-02
 */

jest.mock('../../../constants/api', () => ({
  __esModule: true,
  getApiBaseUrl: () => 'http://api.test.local',
  API_BASE_URL: 'http://api.test.local'
}));

jest.mock('../../../utils/imageResizeCrop', () => ({
  processProfileImage: jest.fn()
}));

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ProfileImageInput from '../ProfileImageInput';

describe('ProfileImageInput', () => {
  test('빈 상태는 조용한 원형 슬롯만 렌더하고 SVG/아이콘이 없다', () => {
    const { container } = render(
      <ProfileImageInput value="" onChange={jest.fn()} />
    );

    expect(container.querySelector('.mg-v2-profile-photo-preview')).not.toBeNull();
    expect(container.querySelector('.mg-v2-profile-photo-placeholder')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByText('프로필 사진')).toBeTruthy();
    expect(screen.getByRole('button', { name: '사진 선택' })).toBeTruthy();
  });

  test('value 가 있으면 미리보기 이미지를 표시하고 제거 버튼을 노출한다', () => {
    const { container } = render(
      <ProfileImageInput
        value="https://cdn.example.com/p.png"
        onChange={jest.fn()}
      />
    );

    const img = container.querySelector('img.mg-v2-profile-photo-img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/p.png');
    expect(screen.getByRole('button', { name: '제거' })).toBeTruthy();
  });

  test('상대 path value 는 resolveAvatarSourceUri 로 절대 URL 이 된다', () => {
    const { container } = render(
      <ProfileImageInput
        value="/api/v1/files/profile-images/abc.png"
        onChange={jest.fn()}
      />
    );

    const img = container.querySelector('img.mg-v2-profile-photo-img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(
      'http://api.test.local/api/v1/files/profile-images/abc.png'
    );
  });

  test('disabled=true 이면 액션 버튼을 숨긴다', () => {
    render(
      <ProfileImageInput
        value="https://cdn.example.com/p.png"
        onChange={jest.fn()}
        disabled
      />
    );

    expect(screen.queryByRole('button', { name: '사진 선택' })).toBeNull();
    expect(screen.queryByRole('button', { name: '제거' })).toBeNull();
  });

  test('제거 클릭 시 onChange 에 빈 문자열을 전달한다', () => {
    const onChange = jest.fn();
    render(
      <ProfileImageInput
        value="https://cdn.example.com/p.png"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '제거' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  test('hideLabel=true 이면 라벨을 숨긴다', () => {
    render(
      <ProfileImageInput value="" onChange={jest.fn()} hideLabel />
    );
    expect(screen.queryByText('프로필 사진')).toBeNull();
  });
});
