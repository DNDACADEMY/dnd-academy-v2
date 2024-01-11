import { render } from '@testing-library/react';

import EventStatusBadge from '.';

describe('EventStatusBadge', () => {
  const title = 'title';

  const renderEventStatusBadge = () => render((
    <EventStatusBadge text="title" type="success" />
  ));

  it('badge text가 보여야만한다', () => {
    const { container } = renderEventStatusBadge();

    expect(container).toHaveTextContent(title);
  });
});
