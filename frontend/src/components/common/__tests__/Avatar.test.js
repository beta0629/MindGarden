/**
 * Avatar 컴포넌트 단위 테스트 — SSOT 정규화 동작 회귀 검증
 *
 * 핵심 회귀:
 *  - 상대 path 가 들어오면 `resolveAvatarSourceUri` 가 절대 URL 로
 *    바꾸어 `<img src>` 에 반영된다.
 *  - profileImageUrl/uri/imageUrl alias 모두 동등하게 동작한다.
 *  - 이미지 src 가 없거나 로드 실패하면 이니셜 fallback 으로 렌더된다.
 *
 * @author Core Solution
 * @since 2026-06-10
 */

jest.mock('../../../constants/api', () => ({
  __esModule: true,
  getApiBaseUrl: () => 'http://api.test.local',
  API_BASE_URL: 'http://api.test.local'
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Avatar, { getAvatarInitial } from '../Avatar';

describe('Avatar — SSOT 정규화', () => {
  test('절대 URL 은 그대로 src 에 반영된다', () => {
    const { container } = render(
      <Avatar profileImageUrl="https://cdn.example.com/p.png" displayName="홍길동" />
    );
    const img = container.querySelector('img.mg-v2-avatar-img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/p.png');
  });

  test('상대 path 는 apiBaseUrl prefix 가 붙어 src 에 반영된다', () => {
    const { container } = render(
      <Avatar
        profileImageUrl="/api/v1/files/profile-images/abc.png"
        displayName="김상담"
      />
    );
    const img = container.querySelector('img.mg-v2-avatar-img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(
      'http://api.test.local/api/v1/files/profile-images/abc.png'
    );
  });

  test('uri prop alias 도 동일하게 동작한다 (RN ↔ web 호환)', () => {
    const { container } = render(
      <Avatar uri="/uploads/x.png" displayName="이내담" />
    );
    const img = container.querySelector('img.mg-v2-avatar-img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('http://api.test.local/uploads/x.png');
  });

  test('imageUrl prop alias 도 동일하게 동작한다 (V2 컴포넌트 호환)', () => {
    const { container } = render(
      <Avatar imageUrl="/uploads/y.png" displayName="박관리" />
    );
    const img = container.querySelector('img.mg-v2-avatar-img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('http://api.test.local/uploads/y.png');
  });

  test("'null' 문자열 등 잘못된 값은 이니셜 fallback 으로 렌더된다", () => {
    const { container, getByText } = render(
      <Avatar profileImageUrl="null" displayName="홍길동" />
    );
    const img = container.querySelector('img.mg-v2-avatar-img');
    expect(img).toBeNull();
    expect(getByText('홍')).toBeTruthy();
  });

  test('이미지 로드 실패 시 이니셜 fallback 으로 전환된다', () => {
    const { container, getByText } = render(
      <Avatar profileImageUrl="https://cdn.example.com/broken.png" displayName="홍길동" />
    );
    const img = container.querySelector('img.mg-v2-avatar-img');
    expect(img).not.toBeNull();
    fireEvent.error(img);
    expect(container.querySelector('img.mg-v2-avatar-img')).toBeNull();
    expect(getByText('홍')).toBeTruthy();
  });

  test('size prop 은 --avatar-size CSS 변수로 반영된다', () => {
    const { container } = render(
      <Avatar profileImageUrl="https://cdn.example.com/p.png" size={48} />
    );
    const root = container.querySelector('.mg-v2-avatar');
    expect(root.style.getPropertyValue('--avatar-size')).toBe('48px');
  });
});

describe('getAvatarInitial', () => {
  test('한글 단일 → 첫 글자', () => {
    expect(getAvatarInitial('홍길동')).toBe('홍');
  });

  test('한글 두 단어 → 각 첫 글자', () => {
    expect(getAvatarInitial('홍 길동')).toBe('홍길');
  });

  test('영문 → 대문자 첫 글자', () => {
    expect(getAvatarInitial('alice')).toBe('A');
  });

  test('빈 값 → ?', () => {
    expect(getAvatarInitial('')).toBe('?');
    expect(getAvatarInitial(null)).toBe('?');
    expect(getAvatarInitial(undefined)).toBe('?');
  });
});
