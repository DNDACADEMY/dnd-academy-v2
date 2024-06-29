import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';

import faq from '@/lib/data/faq';

import FAQSection from '.';

window.scrollTo = jest.fn();

describe('FAQSection', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  const renderFAQSection = () => render((
    <FAQSection />
  ));

  describe('faq 첫번째 accordion item을 한 번 클릭한다.', () => {
    it('faq 첫번째 답변이 보여야만 한다', () => {
      const { container } = renderFAQSection();

      fireEvent.click(screen.getByText(`Q : ${faq[0].question}`));

      expect(container).toHaveTextContent(faq[0].answer.slice(0, 20));
    });
  });

  describe('faq 첫번째 accordion item을 두 번 클릭한다.', () => {
    it('faq 첫번째 답변이 보이지 않아야만 한다', async () => {
      const { container } = renderFAQSection();

      fireEvent.click(screen.getByText(`Q : ${faq[0].question}`));
      fireEvent.click(screen.getByText(`Q : ${faq[0].question}`));

      await waitFor(async () => {
        expect(container).not.toHaveTextContent(faq[0].answer.slice(0, 20));
      });
    });
  });
});
