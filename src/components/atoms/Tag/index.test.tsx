import { fireEvent, render, screen } from '@testing-library/react';

import Tag from '.';

describe('Tag', () => {
  const handleClick = jest.fn();
  const title = 'title';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTag = ({ isActive }: { isActive: boolean; }) => render((
    <Tag onClick={handleClick} title={title} isActive={isActive} count={0} />
  ));

  describe('태그를 클릭하면', () => {
    it('클릭이벤트가 발생해야만 한다', () => {
      renderTag({ isActive: false });

      fireEvent.click(screen.getByText(title));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('isActive가 true인 경우', () => {
    it('스타일 속성에 active가 존재해야만 한다', () => {
      renderTag({ isActive: true });

      expect(screen.getByText(title)).toHaveClass('active');
    });
  });
});
