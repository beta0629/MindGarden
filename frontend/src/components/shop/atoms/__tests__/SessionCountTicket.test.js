/**
 * SessionCountTicket unit
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SessionCountTicket from '../SessionCountTicket';

describe('SessionCountTicket', () => {
  test('renders package session count label', () => {
    render(<SessionCountTicket sessionCount={10} testId="ticket-10" />);
    const el = screen.getByTestId('ticket-10');
    expect(el).toHaveAttribute('data-session-count', '10');
    expect(el).toHaveTextContent('10회');
    expect(el).toHaveTextContent('패키지');
  });

  test('renders single session label', () => {
    render(<SessionCountTicket sessionCount={1} />);
    expect(screen.getByTestId('shop-session-count-ticket')).toHaveTextContent('단회기');
  });
});
