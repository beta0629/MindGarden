/**
 * Button 컴포넌트 테스트 (MGButton 래퍼)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';
import Button from './Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  test('applies correct size class', () => {
    render(<Button size="large">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-button--large');
  });

  test('applies correct variant class', () => {
    render(<Button variant="success">Success Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-button--success');
  });

  test('handles click events', async() => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  test('prevents double click when preventDoubleClick is true', async() => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} preventDoubleClick>
        Click me
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  test('disables interaction when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('mg-button--disabled');

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('shows loading state', () => {
    render(
      <Button loading loadingText="Loading...">
        Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Loading...');
    expect(button).toBeDisabled();
  });

  test('renders icon when provided', () => {
    render(
      <Button icon="PLUS">Add Item</Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-button--with-icon');
    expect(button).toHaveClass('mg-button--icon-left');
  });

  test('positions icon correctly', () => {
    render(
      <Button icon="CHEVRON_RIGHT" iconPosition="right">
        Next
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-button--icon-right');
  });

  test('applies full width class when fullWidth is true', () => {
    render(<Button fullWidth>Full Width Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-button--full-width');
  });

  test('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  test('applies role-based theme', () => {
    /* theme role prop maps to data-role, not HTML role */
    /* eslint-disable-next-line jsx-a11y/aria-role */
    render(<Button role="CLIENT">Client Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-role', 'CLIENT');
  });

  test('has proper accessibility attributes', () => {
    render(
      <Button title="Tooltip text" aria-label="Custom label">
        Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Tooltip text');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });

  test('applies correct button type', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    render(<Button style={customStyle}>Styled Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle('background-color: red');
  });

  test('handles async click handlers', async() => {
    const asyncHandler = jest.fn().mockResolvedValue();
    render(<Button onClick={asyncHandler}>Async Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(asyncHandler).toHaveBeenCalledTimes(1);
    });
  });

  test('handles click handler errors gracefully', async() => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorHandler = jest.fn().mockRejectedValue(new Error('Test error'));

    render(<Button onClick={errorHandler}>Error Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Button click handler error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
