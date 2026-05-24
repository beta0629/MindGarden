/**
 * ChipMultiSelect 단위 테스트 — 옵션 겹침 회귀 가드 포함.
 *
 * <ul>
 *   <li>기본 렌더링 (트리거 + placeholder)</li>
 *   <li>옵션 열기/닫기, 옵션 토글, 칩 추가·제거</li>
 *   <li>키보드 네비 (Arrow Down / Up / Enter / Escape)</li>
 *   <li>회귀 가드: ChipMultiSelect.css 에 글로벌 `[role="listbox"] &gt; *` 의
 *       `position: fixed` 영향을 무력화하는 override 규칙이 존재하는지</li>
 * </ul>
 *
 * <p>JSDOM 은 외부 CSS 의 layout 을 계산하지 않으므로, 시각적 겹침 자체는
 * `getBoundingClientRect` 로 검증할 수 없다. 대신 CSS 파일 텍스트를 직접
 * 읽어 핵심 override 셀렉터·속성이 존재하는지 정규식으로 가드한다.</p>
 *
 * @author Core Solution
 * @author MindGarden
 * @since 2026-05-24
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import ChipMultiSelect from '../ChipMultiSelect';

// 테스트 fixture (실제 운영 데이터에 가까운 한글 라벨로 회귀 가드)
const ROLE_OPTION_LABEL_ADMIN = '원장 (ADMIN)';
const ROLE_OPTION_LABEL_PLAY = '놀이치료 선생님 (PLAY_THERAPIST)';
const ROLE_OPTION_LABEL_SPEECH = '언어치료 선생님 (SPEECH_THERAPIST)';
const ROLE_OPTION_LABEL_ART = '미술치료 선생님 (ART_THERAPIST)';
const ARIA_LABEL_ROLE_SELECT = '역할 선택';
const ARIA_LABEL_ROLE_SHORT = '역할';
const PLACEHOLDER_TEXT = '대상 역할을 선택하세요';

const OPTIONS = [
  { value: 'ADMIN', label: ROLE_OPTION_LABEL_ADMIN },
  { value: 'PLAY_THERAPIST', label: ROLE_OPTION_LABEL_PLAY },
  { value: 'SPEECH_THERAPIST', label: ROLE_OPTION_LABEL_SPEECH },
  { value: 'ART_THERAPIST', label: ROLE_OPTION_LABEL_ART }
];

const renderChip = (override = {}) => {
  const onChange = jest.fn();
  const utils = render(
    <ChipMultiSelect
      id="test-chip"
      options={OPTIONS}
      value={[]}
      onChange={onChange}
      ariaLabel={ARIA_LABEL_ROLE_SELECT}
      {...override}
    />
  );
  return { ...utils, onChange };
};

describe('ChipMultiSelect 기본 렌더링', () => {
  test('트리거(combobox) 와 placeholder 가 렌더링된다', () => {
    renderChip({ placeholder: PLACEHOLDER_TEXT });
    expect(screen.getByRole('combobox', { name: ARIA_LABEL_ROLE_SELECT })).toBeInTheDocument();
    expect(screen.getByText(PLACEHOLDER_TEXT)).toBeInTheDocument();
  });

  test('value 가 있으면 칩이 표시된다', () => {
    renderChip({ value: ['ADMIN', 'PLAY_THERAPIST'] });
    expect(screen.getByText(ROLE_OPTION_LABEL_ADMIN)).toBeInTheDocument();
    expect(screen.getByText(ROLE_OPTION_LABEL_PLAY)).toBeInTheDocument();
  });
});

describe('ChipMultiSelect 드롭다운 열기·옵션 렌더링', () => {
  test('트리거 클릭 시 listbox 가 열리고 옵션 4개가 모두 li 로 렌더링된다', () => {
    renderChip();
    fireEvent.click(screen.getByRole('combobox'));

    const listbox = screen.getByRole('listbox', { name: ARIA_LABEL_ROLE_SELECT });
    expect(listbox).toBeInTheDocument();
    expect(listbox.tagName.toLowerCase()).toBe('ul');

    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(OPTIONS.length);
    options.forEach((li, idx) => {
      expect(li.tagName.toLowerCase()).toBe('li');
      expect(li.className).toMatch(/mg-chip-multi-select__option/);
      expect(li).toHaveTextContent(OPTIONS[idx].label);
    });
  });

  test('옵션이 모두 동일한 listbox 의 직계 자식이다 (겹침 회귀 가드 — DOM 구조)', () => {
    renderChip();
    fireEvent.click(screen.getByRole('combobox'));

    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    options.forEach((li) => {
      expect(li.parentElement).toBe(listbox);
    });
  });
});

describe('ChipMultiSelect 옵션 토글', () => {
  test('옵션 클릭 시 onChange 가 추가된 value 배열로 호출된다', () => {
    const { onChange } = renderChip();
    fireEvent.click(screen.getByRole('combobox'));

    const option = screen.getByText(ROLE_OPTION_LABEL_ADMIN);
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith(['ADMIN']);
  });

  test('이미 선택된 옵션을 클릭하면 제거된다', () => {
    const onChange = jest.fn();
    render(
      <ChipMultiSelect
        options={OPTIONS}
        value={['ADMIN', 'PLAY_THERAPIST']}
        onChange={onChange}
        ariaLabel={ARIA_LABEL_ROLE_SHORT}
      />
    );
    fireEvent.click(screen.getByRole('combobox'));
    const adminOption = screen.getByRole('option', { name: new RegExp(ROLE_OPTION_LABEL_ADMIN.replace(/[()]/g, '\\$&')) });
    fireEvent.click(adminOption);

    expect(onChange).toHaveBeenCalledWith(['PLAY_THERAPIST']);
  });

  test('칩 × 버튼 클릭 시 해당 값이 제거된다', () => {
    const onChange = jest.fn();
    render(
      <ChipMultiSelect
        options={OPTIONS}
        value={['ADMIN', 'PLAY_THERAPIST']}
        onChange={onChange}
        ariaLabel={ARIA_LABEL_ROLE_SHORT}
      />
    );
    const removeLabel = `${ROLE_OPTION_LABEL_ADMIN} 제거`;
    fireEvent.click(screen.getByRole('button', { name: removeLabel }));
    expect(onChange).toHaveBeenCalledWith(['PLAY_THERAPIST']);
  });
});

describe('ChipMultiSelect 키보드 네비게이션', () => {
  test('Enter 로 listbox 가 열리고 ArrowDown → Enter 로 첫 옵션이 토글된다', () => {
    const { onChange } = renderChip();
    const trigger = screen.getByRole('combobox');

    fireEvent.keyDown(trigger, { key: 'Enter' });
    const listbox = screen.getByRole('listbox');

    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    fireEvent.keyDown(listbox, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toContain(OPTIONS[1].value);
  });

  test('Escape 로 listbox 가 닫힌다', () => {
    renderChip();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('ChipMultiSelect CSS 회귀 가드 — 옵션 겹침 방지', () => {
  // 글로벌 `_dropdowns.css` 의 `[role="listbox"] > *` 가 자식에 `position: fixed`
  // 를 강제하여 옵션 li 들이 같은 좌표에 겹치는 회귀를 재발하지 않도록
  // ChipMultiSelect.css 가 컴포넌트 스코프에서 명시적으로 override 하는지 검증.
  const cssPath = path.resolve(__dirname, '..', 'ChipMultiSelect.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  test('listbox 가 명시적으로 flex-direction: column 으로 세로 정렬된다', () => {
    expect(css).toMatch(/\.mg-chip-multi-select__listbox\s*\{[^}]*flex-direction:\s*column/);
  });

  test('listbox 자식 옵션에 position: static override 가 존재한다', () => {
    const overridePattern = /\.mg-chip-multi-select__listbox\s*>\s*\.mg-chip-multi-select__option[\s\S]*?position:\s*static/;
    expect(css).toMatch(overridePattern);
  });

  test('listbox 자식 옵션에 transform: none override 가 존재한다', () => {
    const overridePattern = /\.mg-chip-multi-select__listbox\s*>\s*\.mg-chip-multi-select__option[\s\S]*?transform:\s*none/;
    expect(css).toMatch(overridePattern);
  });
});
