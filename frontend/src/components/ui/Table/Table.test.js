/**
 * Table 컴포넌트 테스트 (children 기반 API)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Table from './Table';

describe('Table Component', () => {
  test('renders table with thead and tbody', () => {
    render(
      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>홍길동</td>
          </tr>
        </tbody>
      </Table>
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  test('applies base and optional striped, hover classes on table', () => {
    const { container } = render(
      <Table striped hoverable>
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const table = container.querySelector('table');
    expect(table).toHaveClass('mg-table');
    expect(table).toHaveClass('mg-table-striped');
    expect(table).toHaveClass('mg-table-hover');
  });

  test('hoverable false omits hover class', () => {
    const { container } = render(
      <Table hoverable={false}>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </Table>
    );

    const table = container.querySelector('table');
    expect(table).not.toHaveClass('mg-table-hover');
  });

  test('applies custom className on table', () => {
    const { container } = render(
      <Table className="custom-table">
        <tbody>
          <tr>
            <td>a</td>
          </tr>
        </tbody>
      </Table>
    );

    expect(container.querySelector('table')).toHaveClass('custom-table');
  });

  test('wraps table in mg-table-container', () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>z</td>
          </tr>
        </tbody>
      </Table>
    );

    expect(container.querySelector('.mg-table-container')).toBeInTheDocument();
  });

  test('row click can be handled via native tr onClick in children', () => {
    const handleRowClick = jest.fn();
    render(
      <Table>
        <tbody>
          <tr onClick={handleRowClick}>
            <td>클릭행</td>
          </tr>
        </tbody>
      </Table>
    );

    fireEvent.click(screen.getByText('클릭행').closest('tr'));
    expect(handleRowClick).toHaveBeenCalled();
  });
});
