import { fireEvent, render, screen } from '@testing-library/react';

import AccordionItem from '.';

describe('AccordionItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const handleClick = jest.fn();

  const children = 'children';
  const title = 'title';

  const renderAccordionItem = ({ isActive }: { isActive: boolean; }) => render((
    <AccordionItem isActive={isActive} title={title} onClick={handleClick}>
      {children}
    </AccordionItem>
  ));

  describe('isActive가 true인 경우', () => {
    it('자식 컴포넌트가 보여야만 한다', () => {
      const { container } = renderAccordionItem({ isActive: true });

      expect(container).toHaveTextContent(children);
    });
  });

  describe('isActive가 false인 경우', () => {
    it('자식 컴포넌트가 보이지 않아야만 한다', () => {
      const { container } = renderAccordionItem({ isActive: false });

      expect(container).not.toHaveTextContent(children);
    });
  });

  describe('accordion 타이틀을 클릭하면', () => {
    it('클릭 이벤트가 발생해야만 한다', () => {
      renderAccordionItem({ isActive: false });

      fireEvent.click(screen.getByText(title));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
