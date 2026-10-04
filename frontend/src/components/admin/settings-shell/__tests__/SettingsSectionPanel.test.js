import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsSectionPanel from '../SettingsSectionPanel';
import SettingsPageShell from '../SettingsPageShell';
import SettingsSummaryStrip from '../SettingsSummaryStrip';
import SettingsButton from '../SettingsButton';

const CSS = fs.readFileSync(path.resolve(__dirname, '../SettingsSuite.css'), 'utf8');
const TOKENS = fs.readFileSync(
  path.resolve(__dirname, '../../../../styles/tokens/design-v2-tokens.css'),
  'utf8'
);

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = CSS.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : '';
}

describe('SettingsSectionPanel', () => {
  it('제목·설명·액션과 form 본문을 렌더한다', () => {
    render(
      <SettingsSectionPanel title="기본 정보" description="센터 기본 정보" actions={<button type="button">편집</button>} testId="panel">
        <p>본문</p>
      </SettingsSectionPanel>
    );
    const panel = screen.getByTestId('panel');
    expect(panel).toHaveClass('mg-v2-settings-panel');
    expect(screen.getByRole('heading', { level: 2, name: '기본 정보' })).toBeInTheDocument();
    expect(screen.getByText('센터 기본 정보')).toHaveClass('mg-v2-settings-panel__description');
    expect(screen.getByRole('button', { name: '편집' })).toBeInTheDocument();
    expect(screen.getByText('본문').parentElement).toHaveClass('mg-v2-settings-panel__body--form');
  });

  it('body="plain"이면 흰 표면 없이 렌더하고 헤더가 없으면 생략한다', () => {
    const { container } = render(
      <SettingsSectionPanel body="plain" testId="panel">
        <p>목록</p>
      </SettingsSectionPanel>
    );
    expect(container.querySelector('.mg-v2-settings-panel__header')).toBeNull();
    expect(screen.getByText('목록').parentElement).toHaveClass('mg-v2-settings-panel__body--plain');
  });

  it('패널 CSS는 r12 토큰·neutral-100·1px neutral-300·그림자 없음, 내부 form은 흰 표면 r8', () => {
    const panel = ruleBody('.mg-v2-settings-panel');
    expect(panel).toMatch(/background:\s*var\(--mg-v2-color-neutral-100\)/);
    expect(panel).toMatch(/border:\s*var\(--mg-v2-border-width-thin\) solid var\(--mg-v2-color-neutral-300\)/);
    expect(panel).toMatch(/border-radius:\s*var\(--mg-v2-radius-panel\)/);
    expect(panel).toMatch(/box-shadow:\s*none/);
    const form = ruleBody('.mg-v2-settings-panel__body--form');
    expect(form).toMatch(/background:\s*var\(--mg-v2-color-surface-card\)/);
    expect(form).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(TOKENS).toMatch(/--mg-v2-radius-panel:\s*0\.75rem;/);
    expect(TOKENS).toMatch(/--mg-v2-color-neutral-100:/);
    expect(TOKENS).toMatch(/--mg-v2-color-neutral-300:/);
  });

  it('패널 제목은 h2 크기 토큰 · semibold(600) 토큰 — 상담사 지급 화면과 같은 굵기', () => {
    const title = ruleBody('.mg-v2-settings-panel__title');
    expect(title).toMatch(/font-size:\s*var\(--mg-v2-font-size-h2\)/);
    expect(title).toMatch(/font-weight:\s*var\(--mg-v2-font-weight-semibold\)/);
    expect(title).not.toMatch(/font-weight:\s*700/);
    expect(TOKENS).toMatch(/--mg-v2-font-weight-semibold:\s*600;/);
  });

  it('공통 CSS에는 hex·px 리터럴이 없다', () => {
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS.replace(/max-width:\s*767px/g, '')).not.toMatch(/\d+px/);
  });
});

describe('SettingsPageShell', () => {
  it('ErpPageShell 안에 quiet header(h1)·요약·본문을 렌더한다', () => {
    const { container } = render(
      <SettingsPageShell
        title="시스템 설정"
        titleId="sys-title"
        actions={<SettingsButton variant="ghost">새로고침</SettingsButton>}
        summary={<SettingsSummaryStrip items={[{ key: 'a', label: '센터명', value: '' }]} ariaLabel="요약" />}
      >
        <SettingsSectionPanel title="섹션">내용</SettingsSectionPanel>
      </SettingsPageShell>
    );
    const shell = container.querySelector('section.mg-v2-erp-shell');
    expect(shell).toHaveClass('mg-v2-settings-shell');
    expect(shell.querySelector('header .mg-v2-settings-header h1#sys-title')).toHaveTextContent('시스템 설정');
    expect(container.querySelector('.mg-v2-content-header')).toBeNull();
    const button = screen.getByRole('button', { name: '새로고침' });
    expect(button).toHaveClass('mg-v2-button', 'mg-v2-button-ghost', 'mg-v2-button-sm');
    expect(screen.getByText('—')).toHaveClass('mg-v2-settings-summary__value');
  });

  it('SettingsButton primary는 small 계약 클래스를 쓴다', () => {
    render(<SettingsButton variant="primary">저장</SettingsButton>);
    expect(screen.getByRole('button', { name: '저장' })).toHaveClass(
      'mg-v2-button',
      'mg-v2-button-primary',
      'mg-v2-button-sm',
      'mg-v2-settings-button'
    );
    const primary = ruleBody('.mg-v2-settings-shell .mg-v2-button.mg-v2-button-primary,\n.mg-v2-button.mg-v2-settings-button.mg-v2-button-primary');
    expect(primary).toMatch(/background:\s*var\(--mg-v2-color-primary-main\)/);
    const small = ruleBody('.mg-v2-settings-shell .mg-v2-button.mg-v2-button-sm,\n.mg-v2-button.mg-v2-settings-button.mg-v2-button-sm');
    expect(small).toMatch(/height:\s*var\(--mg-v2-component-height-sm\)/);
    expect(small).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
  });
});
