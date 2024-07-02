import { fireEvent, render, screen } from '@testing-library/react';

import AccordionItem from '.';

describe('AccordionItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const handleClick = jest.fn();

  const children = 'children';
  const title = 'title';

  const renderAccordionItem = ({
    activeIndex, currentIndex,
  }: { currentIndex: number; activeIndex: number }) => render((
    <AccordionItem
      activeIndex={activeIndex}
      currentIndex={currentIndex}
      title={title}
      onClick={handleClick}
    >
      {children}
    </AccordionItem>
  ));

  describe('activeIndex와 currentIndex가 같은 경우', () => {
    const params = { activeIndex: 0, currentIndex: 0 };

    it('자식 컴포넌트가 보여야만 한다', () => {
      const { container } = renderAccordionItem(params);

      expect(container).toHaveTextContent(children);
    });

    describe('accordion 타이틀을 클릭하면', () => {
      it('undefined와 함께 클릭 이벤트가 발생해야만 한다', () => {
        renderAccordionItem(params);

        fireEvent.click(screen.getByText(title));

        expect(handleClick).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('activeIndex와 currentIndex가 다른 경우', () => {
    const params = { activeIndex: 1, currentIndex: 0 };

    it('자식 컴포넌트가 보이지 않아야만 한다', () => {
      const { container } = renderAccordionItem(params);

      expect(container).not.toHaveTextContent(children);
    });

    describe('accordion 타이틀을 클릭하면', () => {
      it('current index와 함께 클릭 이벤트가 발생해야만 한다', () => {
        renderAccordionItem(params);

        fireEvent.click(screen.getByText(title));

        expect(handleClick).toHaveBeenCalledWith(params.currentIndex);
      });
    });
  });
});
