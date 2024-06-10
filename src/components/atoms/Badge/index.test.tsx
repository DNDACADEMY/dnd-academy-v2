import { render } from '@testing-library/react';

import Badge from '.';

describe('Badge', () => {
  const title = 'title';

  const renderBadge = () => render((
    <Badge label="title" variant="success" size="large" theme="light" />
  ));

  it('badge text가 보여야만한다', () => {
    const { container } = renderBadge();

    expect(container).toHaveTextContent(title);
  });
});
