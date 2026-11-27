import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ContentInput } from '@/lib/cms/content-contract';

import SubmissionPreview from './SubmissionPreview';

const organizer = { kind: 'organizer', targetId: null, projectName: null } as const;
const draft = {
  name: '검증용 운영진',
  description: '미리보기 소개',
  position: '개발',
  links: [],
} satisfies ContentInput;

describe('organizer submission preview', () => {
  it('shows the profile and introduction without empty sections', () => {
    render(<SubmissionPreview submission={organizer} draft={draft} media={new Map()} />);
    expect(screen.getByText(draft.name)).toBeVisible();
    expect(screen.getByRole('heading', { name: draft.description })).toBeVisible();
    expect(screen.queryByRole('heading', { name: /MBTI|이력|어떤 업무/ })).not.toBeInTheDocument();
  });

  it('retains filled sections in the preview', () => {
    render(
      <SubmissionPreview
        submission={organizer}
        draft={{
          ...draft,
          mbti: 'INTJ-A / INFP',
          details: [{ kind: 'role', body: '홈페이지 운영' }],
          links: [{ kind: 'blog', url: 'https://example.com/blog' }],
          skills: ['ClickHouse'],
        }}
        media={new Map()}
      />,
    );
    expect(screen.getByText('INTJ-A / INFP')).toBeVisible();
    expect(screen.getByText('♟️')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('🌿')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: '개인 블로그' })).toHaveAttribute('href', 'https://example.com/blog');
    expect(screen.getByText('ClickHouse').parentElement?.querySelector('use')).toHaveAttribute(
      'href',
      '/assets/icons/technology.svg#clickhouse',
    );
    expect(screen.getByText('홈페이지 운영')).toBeVisible();
  });
});
