/**
 * AdminMessageListBlock — safeDisplay 미리보기·본문 렌더 스모크
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { buildMessagePreview, renderMessageBody } from '../AdminMessageListBlock';

describe('AdminMessageListBlock safeDisplay helpers', () => {
  test('buildMessagePreview strips HTML and truncates at 80 chars', () => {
    const html = `<p>${'가'.repeat(90)}</p>`;
    const preview = buildMessagePreview(html);

    expect(preview).not.toMatch(/<[^>]+>/);
    expect(preview.length).toBeLessThanOrEqual(81);
    expect(preview.endsWith('…')).toBe(true);
  });

  test('buildMessagePreview coerces object content via toDisplayString', () => {
    const preview = buildMessagePreview({ nested: 'value' });
    expect(preview).toContain('nested');
    expect(preview).not.toMatch(/\[object Object\]/);
  });

  test('renderMessageBody uses SafeText for plain text', () => {
    render(<div data-testid="body">{renderMessageBody('안녕하세요')}</div>);
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
  });

  test('renderMessageBody sanitizes HTML and blocks script injection', () => {
    const { container } = render(
      <div data-testid="body">
        {renderMessageBody('<p>본문</p><script>alert(1)</script>')}
      </div>
    );
    expect(container.textContent).toContain('본문');
    expect(container.querySelector('script')).toBeNull();
  });

  test('renderMessageBody handles object content without React #130', () => {
    render(<div data-testid="body">{renderMessageBody({ foo: 'bar' })}</div>);
    expect(screen.getByText('{"foo":"bar"}')).toBeInTheDocument();
  });
});
