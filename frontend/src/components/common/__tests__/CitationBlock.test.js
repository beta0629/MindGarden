/**
 * CitationBlock — Apple T3 의료 출처 표기 회귀 테스트.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import React from 'react';
import { render } from '@testing-library/react';

import CitationBlock from '../CitationBlock';

describe('CitationBlock — Apple T3 의료 출처 회귀', () => {
  test('source 가 null/undefined/빈 객체면 아무것도 렌더하지 않는다', () => {
    const { container: c1 } = render(<CitationBlock source={null} />);
    const { container: c2 } = render(<CitationBlock source={undefined} />);
    const { container: c3 } = render(<CitationBlock source={{}} />);
    const { container: c4 } = render(
      <CitationBlock source={{ label: '', url: '', author: '', publishedYear: null }} />
    );

    expect(c1.querySelector('[data-testid="citation-block"]')).toBeNull();
    expect(c2.querySelector('[data-testid="citation-block"]')).toBeNull();
    expect(c3.querySelector('[data-testid="citation-block"]')).toBeNull();
    expect(c4.querySelector('[data-testid="citation-block"]')).toBeNull();
  });

  test('정상 4 필드 → 라벨/저자/연도/링크 모두 노출 + rel=noopener', () => {
    const { getByTestId, getByText } = render(
      <CitationBlock
        source={{
          label: 'WHO mhGAP Intervention Guide',
          url: 'https://www.who.int/mhgap',
          author: 'World Health Organization',
          publishedYear: 2016
        }}
      />
    );
    const block = getByTestId('citation-block');
    expect(block).toBeTruthy();
    expect(getByText('WHO mhGAP Intervention Guide')).toBeTruthy();
    expect(block.textContent).toContain('World Health Organization');
    expect(block.textContent).toContain('2016');

    const link = block.querySelector('a.mg-citation__link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('https://www.who.int/mhgap');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  test('javascript: 같은 비안전 URL 은 링크로 렌더하지 않는다 (XSS 가드)', () => {
    const { getByTestId } = render(
      <CitationBlock
        source={{
          label: '의심 출처',
          url: 'javascript:alert(1)',
          author: '악성',
          publishedYear: 2026
        }}
      />
    );
    const block = getByTestId('citation-block');
    expect(block.querySelector('a.mg-citation__link')).toBeNull();
  });

  test('http:// 도 그대로 통과하지만 mailto:/file: 등은 차단된다', () => {
    const { getByTestId, rerender } = render(
      <CitationBlock
        source={{ label: 'L', url: 'http://example.com/a', author: 'A', publishedYear: 2020 }}
      />
    );
    expect(getByTestId('citation-block').querySelector('a.mg-citation__link').getAttribute('href'))
      .toBe('http://example.com/a');

    rerender(
      <CitationBlock
        source={{ label: 'L', url: 'mailto:foo@bar.com', author: 'A', publishedYear: 2020 }}
      />
    );
    expect(getByTestId('citation-block').querySelector('a.mg-citation__link')).toBeNull();
  });
});
