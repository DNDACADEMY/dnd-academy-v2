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

  it('keeps the version label while using the Java logo', () => {
    const { container } = render(<TechnologyTag skill="Java17" color="grey" />);

    expect(screen.getByText('Java17')).toBeInTheDocument();
    expect(container.querySelector('use')).toHaveAttribute('href', '/assets/icons/technology.svg#java');
  });

  it('uses the service icon for AWS EC2', () => {
    const { container } = render(<TechnologyTag skill="AWS EC2" color="grey" />);

    expect(container.querySelector('use')).toHaveAttribute('href', '/assets/icons/technology.svg#awsec2');
  });

  it('renders the RxSwift icon as decorative', () => {
    render(<TechnologyTag skill="RxSwift" color="grey" />);

    expect(screen.getByText('RxSwift')).toBeInTheDocument();
    expect(screen.getByAltText('')).toHaveAttribute('width', '12');
  });

  it.each([
    ['UX기획', 'uxplanning'],
    ['GA', 'googleanalytics'],
    ['GA4', 'googleanalytics'],
    ['Hadoop', 'apachehadoop'],
    ['Apache Hadoop', 'apachehadoop'],
    ['서비스 기획 및 운영', 'servicemanagement'],
    ['UX Research', 'uxresearch'],
  ])('adds the matching icon to %s without changing the label', (skill, slug) => {
    const { container } = render(<TechnologyTag skill={skill} color="grey" />);

    expect(screen.getByText(skill)).toBeInTheDocument();
    expect(container.querySelector('use')).toHaveAttribute('href', `/assets/icons/technology.svg#${slug}`);
  });

  it('renders an unmapped technology as text', () => {
    const { container } = render(<TechnologyTag skill="Snapkit" color="grey" />);

    expect(screen.getByText('Snapkit')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
