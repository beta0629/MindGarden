/**
 * KoreanMobileDuplicateField — mode 분기 스모크
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';

import KoreanMobileDuplicateField from '../KoreanMobileDuplicateField';

describe('KoreanMobileDuplicateField', () => {
  test('inputOnly: 중복확인 버튼 없음, children 렌더', () => {
    render(
      <KoreanMobileDuplicateField
        mode="inputOnly"
        label="휴대폰"
        id="phone"
        name="phone"
        value=""
        onChange={() => {}}
      >
        <small data-testid="help">도움말</small>
      </KoreanMobileDuplicateField>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTestId('help')).toHaveTextContent('도움말');
    expect(screen.getByLabelText('휴대폰')).toBeInTheDocument();
  });

  test('withDuplicate: 중복확인 버튼 노출', () => {
    render(
      <KoreanMobileDuplicateField
        label="휴대폰"
        id="phone"
        name="phone"
        value="010"
        onChange={() => {}}
        onDuplicateClick={() => {}}
        duplicateButtonLabel="중복확인"
      />
    );

    const btn = screen.getByRole('button', { name: '중복확인' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('data-action', 'phone-duplicate-check');
  });

  test('withDuplicate: duplicateButtonDataAction이 버튼 data-action에 반영됨', () => {
    render(
      <KoreanMobileDuplicateField
        label="휴대폰"
        id="phone"
        name="phone"
        value="010"
        onChange={() => {}}
        onDuplicateClick={() => {}}
        duplicateButtonDataAction="custom-screen-phone-dup"
        duplicateButtonLabel="중복확인"
      />
    );

    expect(screen.getByRole('button', { name: '중복확인' })).toHaveAttribute(
      'data-action',
      'custom-screen-phone-dup'
    );
  });
});
