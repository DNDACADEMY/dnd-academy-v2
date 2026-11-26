import type { ReactNode } from 'react';

import styles from '../styles.module.scss';

export function replaceRow<T>(rows: T[], index: number, value: T) {
  return rows.map((item, i) => (i === index ? value : item));
}

export function RowActions<T>({ rows, index, onChange }: { rows: T[]; index: number; onChange: (rows: T[]) => void }) {
  function move(offset: number) {
    const reordered = [...rows];
    [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
    onChange(reordered);
  }
  return (
    <div className={styles.buttons}>
      <button type="button" aria-label={`항목 ${index + 1} 위로`} disabled={index === 0} onClick={() => move(-1)}>
        ↑
      </button>
      <button
        type="button"
        aria-label={`항목 ${index + 1} 아래로`}
        disabled={index + 1 === rows.length}
        onClick={() => move(1)}
      >
        ↓
      </button>
      <button
        type="button"
        className={styles.danger}
        aria-label={`항목 ${index + 1} 삭제`}
        onClick={() => onChange(rows.filter((_, i) => i !== index))}
      >
        삭제
      </button>
    </div>
  );
}

export function HomeRow({ label, actions, children }: { label: string; actions: ReactNode; children?: ReactNode }) {
  return (
    <section className={styles.mediaSlot} aria-label={label}>
      <div className={styles.mediaSlotHeading}>
        <h4>{label}</h4>
        {actions}
      </div>
      {children}
    </section>
  );
}
