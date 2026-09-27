/**
 * AdminCommonLayout — 초기 로딩만 UnifiedLoading 으로 자식을 가린다.
 * 이미 보인 편집 폼은 이후 loading=true 에도 언마운트하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import React, { useMemo, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { AdminShellContext } from '../../../contexts/AdminShellContext';
import AdminCommonLayout from '../AdminCommonLayout';

jest.mock('../../../utils/menuApi', () => ({
  getLnbMenus: jest.fn(() => Promise.resolve({ success: true, data: [] }))
}));

jest.mock('../../dashboard-v2/templates', () => ({
  DesktopLayout: ({ children }) => <div>{children}</div>,
  MobileLayout: ({ children }) => <div>{children}</div>
}));

jest.mock('../../common/UnifiedLoading', () => ({ text }) => (
  <div data-testid="unified-loading">{text}</div>
));

const LOADING_TEXT = '데이터를 불러오는 중...';

const Shell = ({ children }) => {
  const value = useMemo(() => ({
    isInsideAdminShell: true,
    setShellMeta: () => {}
  }), []);
  return (
    <AdminShellContext.Provider value={value}>
      {children}
    </AdminShellContext.Provider>
  );
};

const EditorHarness = () => {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  return (
    <Shell>
      <button type="button" onClick={() => setLoading(false)}>show-content</button>
      <button type="button" onClick={() => setLoading(true)}>background-loading</button>
      <AdminCommonLayout loading={loading} loadingText={LOADING_TEXT}>
        <input
          data-testid="editor-title"
          aria-label="편집"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </AdminCommonLayout>
    </Shell>
  );
};

describe('AdminCommonLayout soft refresh loading', () => {
  it('초기 로드는 로딩 문구를 보여주고 폼을 가린다', () => {
    render(<EditorHarness />);
    expect(screen.getByTestId('unified-loading')).toHaveTextContent(LOADING_TEXT);
    expect(screen.queryByTestId('editor-title')).not.toBeInTheDocument();
  });

  it('콘텐츠가 보인 뒤 loading 이 다시 켜져도 입력 폼을 언마운트하지 않는다', () => {
    render(<EditorHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'show-content' }));

    const input = screen.getByTestId('editor-title');
    fireEvent.change(input, { target: { value: '작성중' } });
    expect(input).toHaveValue('작성중');

    fireEvent.click(screen.getByRole('button', { name: 'background-loading' }));

    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('editor-title')).toBe(input);
    expect(screen.getByTestId('editor-title')).toHaveValue('작성중');
  });

  it('SimpleLayout 도 같은 초기-only 가드를 쓴다', () => {
    const src = fs.readFileSync(path.join(__dirname, '../SimpleLayout.js'), 'utf8');
    expect(src).toContain('useInitialOnlyBlockingLoading');
    expect(src).not.toMatch(/\{loading \? \(/);
  });
});
