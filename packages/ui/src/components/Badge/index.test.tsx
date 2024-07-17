import { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';

import Badge from '.';

describe('Badge', () => {
  const title = 'title';

  const renderBadge = ({
    variant = 'notice', label = title, size,
  }: Partial<ComponentProps<typeof Badge>>) => render((
    <Badge label={label} variant={variant} size={size} theme="light" />
  ));

  describe('variant 속성에 따라 색상이 달라진다', () => {
    it('variant 속성이 notice일 때, notice 클래스가 존재해야만 한다', () => {
      renderBadge({ variant: 'notice' });

      const badge = screen.getByText(title);

      expect(badge).toHaveClass('notice');
    });

    it('variant 속성이 error일 때, error 클래스가 존재해야만 한다', () => {
      renderBadge({ variant: 'error' });

      const badge = screen.getByText(title);

      expect(badge).toHaveClass('error');
    });

    it('variant 속성이 success일 때, success 클래스가 존재해야만 한다', () => {
      renderBadge({ variant: 'success' });

      const badge = screen.getByText(title);

      expect(badge).toHaveClass('success');
    });

    it('variant 속성이 info일 때, info 클래스가 존재해야만 한다', () => {
      renderBadge({ variant: 'info' });

      const badge = screen.getByText(title);

      expect(badge).toHaveClass('info');
    });
  });

  describe('size 속성에 따라 크기가 달라진다', () => {
    it('size 속성이 medium일 때, medium 클래스가 존재해야만 한다', () => {
      renderBadge({ size: 'medium' });

      const badge = screen.getByText(title);

      expect(badge).toHaveClass('medium');
    });

    it('size 속성이 large일 때, large 클래스가 존재해야만 한다', () => {
      renderBadge({ size: 'large' });

      const badge = screen.getByText(title);

      expect(badge).toHaveClass('large');
    });
  });
});
