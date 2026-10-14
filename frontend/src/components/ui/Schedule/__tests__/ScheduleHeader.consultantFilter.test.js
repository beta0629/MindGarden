/**
 * ScheduleHeader — 상담사 필터 커스텀 드롭다운 + getTeacherColor 점
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, options) => {
      if (options && typeof options === 'object' && options.defaultValue) {
        if (typeof options.count === 'number') {
          return String(options.defaultValue).replace('{{count}}', String(options.count));
        }
        return options.defaultValue;
      }
      return key;
    }
  })
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: ({ className } = {}) => className || '',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../../common/MGButton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, onClick, ...rest }) => (
      React.createElement('button', { type: 'button', onClick, ...rest }, children)
    )
  };
});

import ScheduleHeader from '../ScheduleHeader';
import { getTeacherColor } from '../../../../utils/getTeacherColor';

const consultants = [
  { id: 2, name: '이차' },
  { id: 1, name: '일상담' }
];

describe('ScheduleHeader — 상담사 필터 색 점', () => {
  test('전체 상담사 트리거에는 점이 없고 옵션에는 getTeacherColor 점이 있다', () => {
    const onConsultantChange = jest.fn();
    render(
      <ScheduleHeader
        userRole="ADMIN"
        consultants={consultants}
        selectedConsultantId=""
        loadingConsultants={false}
        onConsultantChange={onConsultantChange}
        onRefresh={jest.fn()}
        hideTitle
      />
    );

    const trigger = screen.getByRole('button', { name: '상담사 필터' });
    expect(trigger.querySelector('.mg-v2-teacher-dot')).toBeNull();
    expect(trigger).toHaveTextContent('전체 상담사');

    fireEvent.click(trigger);
    const listbox = screen.getByRole('listbox', { name: '상담사 필터' });
    const options = within(listbox).getAllByRole('option');
    // 전체 + 2명
    expect(options).toHaveLength(3);
    expect(options[0].querySelector('.mg-v2-teacher-dot')).toBeNull();

    const optionOne = within(listbox).getByRole('option', { name: '일상담' });
    const optionTwo = within(listbox).getByRole('option', { name: '이차' });
    expect(optionOne.querySelector('.mg-v2-teacher-dot')).not.toBeNull();
    expect(optionTwo.querySelector('.mg-v2-teacher-dot')).not.toBeNull();

    // id 오름차순: 1 → palette-1, 2 → palette-2 (목록 표시 순서와 무관)
    const expectedFirst = getTeacherColor({ consultantId: 1, consultants });
    expect(expectedFirst.paletteIndex).toBe(0);
    expect(optionOne.querySelector('.mg-v2-teacher-dot--palette-1')).not.toBeNull();
    expect(optionTwo.querySelector('.mg-v2-teacher-dot--palette-2')).not.toBeNull();

    fireEvent.click(optionOne);
    expect(onConsultantChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '1' } })
    );
  });

  test('칩·필터 동일 헬퍼 — 소스에 getTeacherColor 만', () => {
    const fs = require('fs');
    const path = require('path');
    const header = fs.readFileSync(
      path.resolve(__dirname, '..', 'ScheduleHeader.js'),
      'utf8'
    );
    const filter = fs.readFileSync(
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'admin',
        'mapping-management',
        'integrated-schedule',
        'molecules',
        'ConsultantFilterSelect.jsx'
      ),
      'utf8'
    );
    expect(header).toContain('ConsultantFilterSelect');
    expect(header).not.toMatch(/<select[\s\S]*전체 상담사/);
    expect(filter).toContain('getTeacherColor');
    expect(filter).not.toContain('getConsultantColor');
  });
});
