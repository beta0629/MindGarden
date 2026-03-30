/**
 * Button 컴포넌트 통합 테스트
 * - 중복 클릭 방지 테스트
 * - 로딩 상태 테스트
 * - 다양한 variant 테스트
 * - 이벤트 핸들러 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../../components/Button';

describe('Button 컴포넌트 통합 테스트', () => {
  describe('중복 클릭 방지', () => {
    test('preventDoubleClick이 true일 때 중복 클릭 방지', async () => {
      const handleClick = jest.fn();
      
      render(
        <Button
          onClick={handleClick}
          preventDoubleClick={true}
          clickDelay={500}
        >
          클릭
        </Button>
      );

      const button = screen.getByRole('button', { name: /클릭/i });

      // 첫 번째 클릭
      await act(async () => {
        fireEvent.click(button);
      });

      expect(handleClick).toHaveBeenCalledTimes(1);

      // 즉시 두 번째 클릭 시도 (비활성화되어야 함)
      await act(async () => {
        fireEvent.click(button);
      });

      // 두 번째 클릭은 무시되어야 함
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(button).toBeDisabled();

      // clickDelay 후 다시 활성화
      await waitFor(
        () => {
          expect(button).not.toBeDisabled();
        },
        { timeout: 600 }
      );
    });

    test('preventDoubleClick이 false일 때 중복 클릭 허용', async () => {
      const handleClick = jest.fn();
      
      render(
        <Button
          onClick={handleClick}
          preventDoubleClick={false}
        >
          클릭
        </Button>
      );

      const button = screen.getByRole('button', { name: /클릭/i });

      // 연속 클릭
      await act(async () => {
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);
      });

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    test('비동기 onClick 핸들러와 중복 클릭 방지', async () => {
      const handleClick = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      render(
        <Button
          onClick={handleClick}
          preventDoubleClick={true}
          clickDelay={500}
        >
          비동기 클릭
        </Button>
      );

      const button = screen.getByRole('button', { name: /비동기 클릭/i });

      // 첫 번째 클릭
      await act(async () => {
        fireEvent.click(button);
      });

      // 비동기 처리 중 두 번째 클릭 시도
      await act(async () => {
        fireEvent.click(button);
      });

      // 두 번째 클릭은 무시되어야 함
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('로딩 상태', () => {
    test('loading이 true일 때 버튼 비활성화 및 로딩 텍스트 표시', () => {
      render(
        <Button
          loading={true}
          loadingText="처리 중..."
        >
          제출
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });

    test('loading과 preventDoubleClick 함께 사용', async () => {
      const handleClick = jest.fn();
      
      const { rerender } = render(
        <Button
          onClick={handleClick}
          loading={false}
          preventDoubleClick={true}
        >
          제출
        </Button>
      );

      const button = screen.getByRole('button', { name: /제출/i });

      // 로딩 시작
      rerender(
        <Button
          onClick={handleClick}
          loading={true}
          loadingText="처리 중..."
          preventDoubleClick={true}
        >
          제출
        </Button>
      );

      expect(button).toBeDisabled();
      expect(screen.getByText('처리 중...')).toBeInTheDocument();

      // 로딩 중 클릭 시도
      await act(async () => {
        fireEvent.click(button);
      });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('다양한 variant', () => {
    const variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'outline'] as const;

    variants.forEach(variant => {
      test(`${variant} variant가 올바른 클래스를 가져야 함`, () => {
        render(
          <Button variant={variant}>
            {variant} 버튼
          </Button>
        );

        const button = screen.getByRole('button', { name: new RegExp(variant, 'i') });
        expect(button).toHaveClass(`mg-button--${variant}`);
      });
    });
  });

  describe('다양한 size', () => {
    const sizes = ['small', 'medium', 'large'] as const;

    sizes.forEach(size => {
      test(`${size} size가 올바른 클래스를 가져야 함`, () => {
        render(
          <Button size={size}>
            {size} 버튼
          </Button>
        );

        const button = screen.getByRole('button', { name: new RegExp(size, 'i') });
        expect(button).toHaveClass(`mg-button--${size}`);
      });
    });
  });

  describe('disabled 상태', () => {
    test('disabled가 true일 때 클릭 무시', async () => {
      const handleClick = jest.fn();
      
      render(
        <Button
          onClick={handleClick}
          disabled={true}
        >
          비활성화
        </Button>
      );

      const button = screen.getByRole('button', { name: /비활성화/i });
      expect(button).toBeDisabled();

      await act(async () => {
        fireEvent.click(button);
      });

      expect(handleClick).not.toHaveBeenCalled();
    });

    test('disabled와 preventDoubleClick 함께 사용', async () => {
      const handleClick = jest.fn();
      
      render(
        <Button
          onClick={handleClick}
          disabled={true}
          preventDoubleClick={true}
        >
          비활성화
        </Button>
      );

      const button = screen.getByRole('button', { name: /비활성화/i });
      expect(button).toBeDisabled();

      await act(async () => {
        fireEvent.click(button);
      });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('fullWidth', () => {
    test('fullWidth가 true일 때 전체 너비 클래스 적용', () => {
      render(
        <Button fullWidth={true}>
          전체 너비
        </Button>
      );

      const button = screen.getByRole('button', { name: /전체 너비/i });
      expect(button).toHaveClass('mg-button--full-width');
    });
  });

  describe('이벤트 핸들러', () => {
    test('onClick 핸들러가 정상적으로 호출되어야 함', async () => {
      const handleClick = jest.fn();
      
      render(
        <Button onClick={handleClick}>
          클릭
        </Button>
      );

      const button = screen.getByRole('button', { name: /클릭/i });

      await act(async () => {
        fireEvent.click(button);
      });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('onClick 핸들러에서 에러 발생 시 처리', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const handleClick = jest.fn(() => {
        throw new Error('테스트 에러');
      });
      
      render(
        <Button
          onClick={handleClick}
          preventDoubleClick={true}
        >
          에러 테스트
        </Button>
      );

      const button = screen.getByRole('button', { name: /에러 테스트/i });

      await act(async () => {
        fireEvent.click(button);
      });

      expect(handleClick).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'Button click handler error:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('접근성', () => {
    test('aria-disabled 속성이 올바르게 설정되어야 함', () => {
      const { rerender } = render(
        <Button disabled={false}>
          활성화
        </Button>
      );

      let button = screen.getByRole('button', { name: /활성화/i });
      expect(button).toHaveAttribute('aria-disabled', 'false');

      rerender(
        <Button disabled={true}>
          비활성화
        </Button>
      );

      button = screen.getByRole('button', { name: /비활성화/i });
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test('title 속성이 올바르게 설정되어야 함', () => {
      render(
        <Button title="툴팁 텍스트">
          버튼
        </Button>
      );

      const button = screen.getByRole('button', { name: /버튼/i });
      expect(button).toHaveAttribute('title', '툴팁 텍스트');
    });
  });
});

