import { act, render } from '@testing-library/react';

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

  const renderCounterCard = () => render((
    <CounterCard count={count} title="title" />
  ));

  it('count가 나타나야만 한다', () => {
    const { container } = renderCounterCard();

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(container).toHaveTextContent('0');
  });
});
