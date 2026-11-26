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

  it('renders an unmapped technology as text', () => {
    const { container } = render(<TechnologyTag skill="Snapkit" color="grey" />);

    expect(screen.getByText('Snapkit')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
