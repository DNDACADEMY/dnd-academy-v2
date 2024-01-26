import { render } from '@testing-library/react';

import SectionTitle from '.';

describe('SectionTitle', () => {
  const title = 'title';

  const renderSectionTitle = () => render((
    <SectionTitle title="title" subTitle="subtitle">
      <div>children</div>
    </SectionTitle>
  ));

  it('section title이 보여야만한다', () => {
    const { container } = renderSectionTitle();

    expect(container).toHaveTextContent(title);
  });
});
