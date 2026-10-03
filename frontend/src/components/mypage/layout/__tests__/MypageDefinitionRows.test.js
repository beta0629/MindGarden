/**
 * MypageDefinitionRows — 빈 값 접기 · clamp
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MypageDefinitionRows, { isMypageRowValueEmpty } from '../MypageDefinitionRows';

describe('MypageDefinitionRows', () => {
  test('empty rows without action collapse into one 「입력하지 않은 항목」 row', () => {
    render(
      <MypageDefinitionRows
        rows={[
          { key: 'name', label: '이름', value: '홍길동' },
          { key: 'nickname', label: '닉네임', value: '' },
          { key: 'gender', label: '성별', value: null },
          { key: 'address', label: '주소', value: '   ' }
        ]}
      />
    );

    expect(screen.getByTestId('mypage-row-name')).toHaveTextContent('홍길동');
    expect(screen.queryByTestId('mypage-row-nickname')).toBeNull();
    const collapsed = screen.getByTestId('mypage-row-empty-collapsed');
    expect(collapsed).toHaveTextContent('입력하지 않은 항목');
    expect(collapsed).toHaveTextContent('닉네임 · 성별 · 주소');
    expect(screen.getAllByTestId('mypage-row-empty-collapsed')).toHaveLength(1);
  });

  test('empty row with action stays visible (e.g. 휴대전화 + 변경)', () => {
    render(
      <MypageDefinitionRows
        rows={[{ key: 'phone', label: '휴대전화', value: '', action: <button type="button">변경</button> }]}
      />
    );
    expect(screen.getByTestId('mypage-row-phone')).toHaveTextContent('—');
    expect(screen.queryByTestId('mypage-row-empty-collapsed')).toBeNull();
  });

  test('clamp rows get the 3-line clamp class; view rows contain no inputs', () => {
    const { container } = render(
      <MypageDefinitionRows rows={[{ key: 'intro', label: '소개', value: '긴 글'.repeat(50), clamp: true }]} />
    );
    expect(container.querySelector('.mg-mypage-rows__value--clamp')).toBeTruthy();
    expect(container.querySelector('input, select, textarea')).toBeNull();
  });

  test('isMypageRowValueEmpty', () => {
    expect(isMypageRowValueEmpty(undefined)).toBe(true);
    expect(isMypageRowValueEmpty([])).toBe(true);
    expect(isMypageRowValueEmpty(' ')).toBe(true);
    expect(isMypageRowValueEmpty(0)).toBe(false);
    expect(isMypageRowValueEmpty(['a'])).toBe(false);
  });
});
