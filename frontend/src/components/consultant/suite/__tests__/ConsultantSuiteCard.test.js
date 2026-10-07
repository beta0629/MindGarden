/**
 * ConsultantSuiteCard / Pill / avatar initials
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ConsultantSuiteCard, {
  CONSULTANT_SUITE_CARD_VARIANT,
  ConsultantSuitePill,
  toConsultantSuiteAvatarInitials
} from '../ConsultantSuiteCard';
import { CONSULTANT_SUITE_CLASS } from '../../../../constants/consultantSuite';
import { resolveConsultantMessageType, CONSULTANT_MESSAGE_TYPE_FILTER } from '../../../../constants/consultantSuite';

describe('toConsultantSuiteAvatarInitials', () => {
  it('한글·영문 이니셜', () => {
    expect(toConsultantSuiteAvatarInitials('이민지')).toBe('이민');
    expect(toConsultantSuiteAvatarInitials('Jane Doe')).toBe('JD');
    expect(toConsultantSuiteAvatarInitials('')).toBe('—');
  });
});

describe('resolveConsultantMessageType', () => {
  it('PAYMENT_COMPLETION 은 GENERAL 로 폴스루하지 않는다', () => {
    expect(resolveConsultantMessageType('PAYMENT_COMPLETION'))
      .toBe(CONSULTANT_MESSAGE_TYPE_FILTER.PAYMENT_COMPLETION);
    expect(resolveConsultantMessageType('UNKNOWN_X'))
      .toBe(CONSULTANT_MESSAGE_TYPE_FILTER.GENERAL);
  });
});

describe('ConsultantSuiteCard', () => {
  it('card variant · title/body/foot · pill', () => {
    render(
      <ConsultantSuiteCard
        title="2026-10-01"
        body={<span>3회기</span>}
        foot={<ConsultantSuitePill>완료</ConsultantSuitePill>}
        testId="suite-card"
      />
    );
    const card = screen.getByTestId('suite-card');
    expect(card).toHaveClass(CONSULTANT_SUITE_CLASS.CARD);
    expect(card).not.toHaveClass(CONSULTANT_SUITE_CLASS.CARD_ROW);
    expect(screen.getByText('2026-10-01')).toHaveClass(CONSULTANT_SUITE_CLASS.CARD_TITLE);
    expect(screen.getByText('완료')).toHaveClass(CONSULTANT_SUITE_CLASS.PILL);
  });

  it('row variant + onClick → button', () => {
    const onClick = jest.fn();
    render(
      <ConsultantSuiteCard
        variant={CONSULTANT_SUITE_CARD_VARIANT.ROW}
        title="월요일 · 매주"
        onClick={onClick}
        testId="suite-row"
      />
    );
    const row = screen.getByTestId('suite-row');
    expect(row.tagName).toBe('BUTTON');
    expect(row).toHaveClass(CONSULTANT_SUITE_CLASS.CARD_ROW);
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalled();
  });
});
