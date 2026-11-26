import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { adminRequest } from './admin-request';
import SkillTagPicker from './skill-tag-picker';

vi.mock('./admin-request');

describe('SkillTagPicker', () => {
  beforeEach(() => {
    vi.mocked(adminRequest).mockReset();
    vi.mocked(adminRequest).mockResolvedValue({ skills: ['C++', 'React', 'React Query', 'Swift'] });
  });

  function edit(initial: string[]) {
    const onChange = vi.fn<() => void>();
    const { container } = render(
      <form>
        <SkillTagPicker initial={initial} onChange={onChange} />
      </form>,
    );
    const form = container.querySelector('form')!;
    const input = screen.getByRole('searchbox', { name: '기술 태그' });
    return { input, onChange, formValues: () => new FormData(form).getAll('skills') };
  }

  it('loads the catalog on demand, then adds and removes tags in order', async () => {
    const { input, onChange, formValues } = edit(['Swift']);
    expect(adminRequest).not.toHaveBeenCalled();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'react query' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(adminRequest).toHaveBeenCalledExactlyOnceWith('content/skills', {});
    const result = await screen.findByRole('button', { name: 'React Query 추가' });
    fireEvent.click(result);
    expect(formValues()).toEqual(['Swift', 'React Query']);

    fireEvent.change(input, { target: { value: 'c++' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Swift 태그 제거' }));
    expect(formValues()).toEqual(['React Query', 'C++']);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('reuses the existing spelling and adds a custom label only on request', async () => {
    const { input, formValues } = edit(['React']);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'react' } });
    expect(await screen.findByRole('button', { name: 'React 추가됨' })).toBeDisabled();
    expect(screen.queryByText('새 태그 추가')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '  화면 기획  ' } });
    const results = screen.getByRole('list', { name: '기술 검색 결과' });
    fireEvent.click(within(results).getByRole('button', { name: '화면 기획 새 태그 추가' }));
    expect(formValues()).toEqual(['React', '화면 기획']);
  });
});
