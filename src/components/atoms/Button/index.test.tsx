import { Route } from 'next';

import { render, screen } from '@testing-library/react';

import Button from '.';

describe('Button', () => {
  const renderButton = (url?: Route) => render((
    <Button href={url}>
      버튼
    </Button>
  ));

  describe('"href" 속성 유무에 따라 버튼 또는 링크가 나타난다', () => {
    describe('버튼인 경우', () => {
      it('"href" 속성이 없어야만 한다', () => {
        renderButton();

        expect(screen.getByText('버튼')).not.toHaveAttribute('href', '/test');
      });
    });

    describe('링크인 경우', () => {
      const href = '/dnd/about';

      it('href 속성이 존재해야만 한다', () => {
        renderButton(href);

        expect(screen.getByText('버튼')).toHaveAttribute('href', href);
      });
    });
  });
});
