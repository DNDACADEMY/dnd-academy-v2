import { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';

import SkillTag from '.';

describe('SkillTag', () => {
  const skill = 'skill';

  const renderSkillTag = (color: ComponentProps<typeof SkillTag>['color']) => render((
    <SkillTag color={color} skill={skill} />
  ));

  it('skill text가 보여야만 한다', () => {
    const { container } = renderSkillTag('grey');

    expect(container).toHaveTextContent(skill);
  });

  describe('color 속성에 따라 색상이 달라진다', () => {
    it('color 속성이 dark일 때, dark 클래스가 존재해야만 한다', () => {
      renderSkillTag('dark');

      const tag = screen.getByText(skill);

      expect(tag).toHaveClass('dark');
    });

    it('color 속성이 grey일 때, grey 클래스가 존재해야만 한다', () => {
      renderSkillTag('grey');

      const tag = screen.getByText(skill);

      expect(tag).toHaveClass('grey');
    });
  });
});
