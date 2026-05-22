import { act, render, screen } from '@testing-library/react';

import CounterCard from '.';

describe('CounterCard', () => {
  const count = 10;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderCounterCard = ({ highlight = false }: { highlight?: boolean } = {}) =>
    render(<CounterCard count={count} title="title" highlight={highlight} />);

  it('count가 나타나야만 한다', () => {
    const { container } = renderCounterCard();

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(container).toHaveTextContent('0');
  });

  describe('highlight', () => {
    it('highlight 속성이 있으면 highlight 클래스가 존재해야만 한다', () => {
      renderCounterCard({ highlight: true });

      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(screen.getByText('title')).toHaveClass('highlight');
    });
  });
});
