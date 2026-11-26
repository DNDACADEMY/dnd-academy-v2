import type { HomeInput } from '@/lib/cms/home-contract';

import { HomeRow, RowActions, replaceRow } from './editor-row';

import styles from '../styles.module.scss';

export function FaqEditor({
  rows,
  onChange,
}: {
  rows: HomeInput['faqs'];
  onChange: (rows: HomeInput['faqs']) => void;
}) {
  return (
    <div className={styles.homeFields}>
      <div className={styles.mediaSlotHeading}>
        <h3>FAQ {rows.length}개</h3>
        <button
          type="button"
          disabled={rows.length === 100}
          onClick={() => onChange([...rows, { question: '', answer: '', visible: true }])}
        >
          질문 추가
        </button>
      </div>
      <p className={styles.muted}>공개한 질문이 없으면 홈페이지에서 FAQ 섹션이 숨겨집니다.</p>
      {rows.map((row, index) => {
        const update = (value: Partial<typeof row>) => onChange(replaceRow(rows, index, { ...row, ...value }));
        return (
          <HomeRow
            key={index}
            label={row.question || '새 질문'}
            actions={<RowActions rows={rows} index={index} onChange={onChange} />}
          >
            <label>
              질문{' '}
              <input
                value={row.question}
                maxLength={300}
                onChange={(event) => update({ question: event.target.value })}
              />
            </label>
            <label>
              답변{' '}
              <textarea
                value={row.answer}
                maxLength={8000}
                onChange={(event) => update({ answer: event.target.value })}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={row.visible}
                onChange={(event) => update({ visible: event.target.checked })}
              />
              홈에 공개
            </label>
          </HomeRow>
        );
      })}
    </div>
  );
}
