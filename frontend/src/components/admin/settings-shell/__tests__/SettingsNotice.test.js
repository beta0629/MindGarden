import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsNotice, SettingsSummaryStrip } from '..';

const CSS = fs.readFileSync(path.resolve(__dirname, '../SettingsSuite.css'), 'utf8');

describe('SettingsNotice', () => {
  it('톤별 클래스·역할과 자식·액션을 렌더한다', () => {
    render(
      <SettingsNotice tone="danger" testId="notice" actions={<button type="button">다시 시도</button>}>
        <p>불러오지 못했어요</p>
      </SettingsNotice>
    );
    const notice = screen.getByTestId('notice');
    expect(notice).toHaveClass('mg-v2-settings-notice', 'mg-v2-settings-notice--danger');
    expect(notice).toHaveAttribute('role', 'alert');
    expect(screen.getByText('불러오지 못했어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('info·warning 은 note 역할', () => {
    render(<SettingsNotice tone="warning" testId="warn">주의</SettingsNotice>);
    expect(screen.getByTestId('warn')).toHaveAttribute('role', 'note');
  });

  it('톤 색은 semantic 토큰만 사용한다', () => {
    ['info', 'warning', 'danger'].forEach((tone) => {
      const match = CSS.match(new RegExp(`\\.mg-v2-settings-notice--${tone}\\s*\\{([^}]*)\\}`));
      expect(match).not.toBeNull();
      expect(match[1]).toMatch(/var\(--mg-v2-color-semantic-/);
    });
  });
});

describe('SettingsSummaryStrip caption · testId', () => {
  it('셀 testId·보조 문구와 루트 testId 를 렌더한다', () => {
    render(
      <SettingsSummaryStrip
        testId="strip"
        items={[{ key: 'a', label: '성공', value: '12건', caption: 'SMS 80%', testId: 'cell-a' }]}
      />
    );
    expect(screen.getByTestId('strip')).toBeInTheDocument();
    expect(screen.getByTestId('cell-a')).toHaveTextContent('12건');
    expect(screen.getByText('SMS 80%')).toHaveClass('mg-v2-settings-summary__caption');
  });

  it('caption 이 없으면 보조 문구 요소를 만들지 않는다', () => {
    const { container } = render(<SettingsSummaryStrip items={[{ key: 'a', label: '전체', value: 3 }]} />);
    expect(container.querySelector('.mg-v2-settings-summary__caption')).toBeNull();
    expect(screen.getByTestId('settings-summary-strip')).toBeInTheDocument();
  });
});
