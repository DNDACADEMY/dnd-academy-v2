import { render } from '@testing-library/react';

import PageTitle from '.';

describe('PageTitle', () => {
  const title = 'title';
  const subtitle = 'subTitle';

  const renderPageTitle = () => render((
    <PageTitle title={title} subTitle={subtitle} />
  ));

  it('title과 subTitle의 정보가 이 보여야함 한다', () => {
    const { container } = renderPageTitle();

    expect(container).toHaveTextContent(title);
    expect(container).toHaveTextContent(subtitle);
  });
});
