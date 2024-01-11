import { render } from '@testing-library/react';

import CounterCard from '.';

describe('CounterCard', () => {
  const count = 10;

  const renderCounterCard = () => render((
    <CounterCard count={count} title="title" suffix="명" />
  ));

  it('count가 나타나야만 한다', () => {
    const { container } = renderCounterCard();

    expect(container).toHaveTextContent(`${count}`);
  });
});
