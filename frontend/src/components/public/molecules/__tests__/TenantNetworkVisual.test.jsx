/**
 * TenantNetworkVisual 단위 테스트 (Phase C-Refine v2)
 *
 * SPEC §3.1: 중앙 Core 심볼 + 5 노드 (Tenant A~E), viewBox 0 0 400 400.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

const TenantNetworkVisual = require('../TenantNetworkVisual').default;

const renderVisual = (props = {}) =>
  render(
    <MemoryRouter>
      <TenantNetworkVisual {...props} />
    </MemoryRouter>
  );

describe('TenantNetworkVisual', () => {
  it('renders an SVG with viewBox 0 0 400 400 per SPEC §8', () => {
    const { container } = renderVisual();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 400 400');
  });

  it('renders exactly 5 tenant node circles (Tenant A~E)', () => {
    const { container } = renderVisual();
    const labels = container.querySelectorAll('text');
    const labelTexts = Array.from(labels).map((node) => node.textContent);
    expect(labelTexts).toEqual(['Tenant A', 'Tenant B', 'Tenant C', 'Tenant D', 'Tenant E']);
  });

  it('renders 5 connecting lines from center to each node', () => {
    const { container } = renderVisual();
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(5);
  });

  it('exposes accessible label', () => {
    renderVisual();
    expect(screen.getAllByLabelText(/멀티 테넌트 네트워크|Multi-tenant network/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders central core symbol circles', () => {
    const { container } = renderVisual();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(8);
  });
});
