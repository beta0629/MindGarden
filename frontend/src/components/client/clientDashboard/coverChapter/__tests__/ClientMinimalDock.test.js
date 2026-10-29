/**
 * ClientMinimalDock — 독 항목 4개 렌더 고정
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientMinimalDock from '../ClientMinimalDock';
import {
  CLIENT_COVER_DOCK_HOME,
  CLIENT_COVER_DOCK_ME,
  CLIENT_COVER_DOCK_SCHEDULE,
  CLIENT_COVER_DOCK_TEST_ID,
  CLIENT_COVER_DOCK_WELLNESS
} from '../../constants';

describe('ClientMinimalDock', () => {
  test('renders exactly 4 dock items (홈·예정·마음·나)', () => {
    render(
      <MemoryRouter>
        <ClientMinimalDock activeId="home" />
      </MemoryRouter>
    );

    const dock = screen.getByTestId(CLIENT_COVER_DOCK_TEST_ID);
    const items = dock.querySelectorAll('.client-cover__dock-item');
    expect(items).toHaveLength(4);

    const links = within(dock).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_HOME) }))
      .toBeInTheDocument();
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_SCHEDULE) }))
      .toBeInTheDocument();
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_WELLNESS) }))
      .toBeInTheDocument();
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_ME) }))
      .toBeInTheDocument();
  });
});
