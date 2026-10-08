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
import {
  CONSULTANT_MESSAGE_TYPE_FILTER,
  CONSULTANT_SUITE_CLASS,
  resolveConsultantMessageType
} from '../../../../constants/consultantSuite';

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

  it('row + onClick → article(role=button), native BUTTON 아님', () => {
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
    expect(row.tagName).not.toBe('BUTTON');
    expect(row.tagName).toBe('ARTICLE');
    expect(row).toHaveAttribute('role', 'button');
    expect(row).toHaveAttribute('tabIndex', '0');
    expect(row).toHaveClass(CONSULTANT_SUITE_CLASS.CARD_ROW);
    expect(row).toHaveClass(CONSULTANT_SUITE_CLASS.CARD_INTERACTIVE);
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Enter / Space 키가 onClick 을 발동한다', () => {
    const onClick = jest.fn();
    render(
      <ConsultantSuiteCard
        title="메시지"
        onClick={onClick}
        testId="suite-key"
      />
    );
    const card = screen.getByTestId('suite-key');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('foot 안 실제 button 클릭은 카드 onClick 과 분리(중첩 버튼 없음)', () => {
    const onCardClick = jest.fn();
    const onFootClick = jest.fn();
    render(
      <ConsultantSuiteCard
        title="기록"
        onClick={onCardClick}
        testId="suite-nested"
        foot={(
          <button type="button" onClick={onFootClick}>열기</button>
        )}
      />
    );
    const card = screen.getByTestId('suite-nested');
    expect(card.tagName).not.toBe('BUTTON');
    expect(card.querySelector('button')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(onFootClick).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('row + body 는 CARD_ROW 클래스(패딩 16/24)를 유지한다', () => {
    render(
      <ConsultantSuiteCard
        variant={CONSULTANT_SUITE_CARD_VARIANT.ROW}
        title="제목"
        body={<span>미리보기</span>}
        testId="suite-msg"
      />
    );
    const card = screen.getByTestId('suite-msg');
    expect(card).toHaveClass(CONSULTANT_SUITE_CLASS.CARD_ROW);
    expect(card.querySelector(`.${CONSULTANT_SUITE_CLASS.CARD_BODY}`)).toBeTruthy();
  });
});
