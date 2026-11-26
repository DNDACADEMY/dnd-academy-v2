import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TechnologyTag from '.';

describe('TechnologyTag', () => {
  it('shares an icon across spellings and keeps the original label', () => {
    const { container } = render(<TechnologyTag skill="React.JS" color="dark" />);

    expect(screen.getByText('React.JS')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('use')).toHaveAttribute('href', '/assets/icons/technology.svg#react');
  });

  it('renders the RxSwift icon as decorative', () => {
    render(<TechnologyTag skill="RxSwift" color="grey" />);

    expect(screen.getByText('RxSwift')).toBeInTheDocument();
    expect(screen.getByAltText('')).toHaveAttribute('width', '12');
  });

  it('preserves punctuation when choosing between language icons', () => {
    const { container } = render(<TechnologyTag skill="C++" color="grey" />);

    expect(screen.getByText('C++')).toBeInTheDocument();
    expect(container.querySelector('use')).toHaveAttribute('href', '/assets/icons/technology.svg#cplusplus');
  });

  it.each(['Snapkit', 'UIKit'])('renders %s as text without borrowing another logo', (skill) => {
    const { container } = render(<TechnologyTag skill={skill} color="grey" />);

    expect(screen.getByText(skill)).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
