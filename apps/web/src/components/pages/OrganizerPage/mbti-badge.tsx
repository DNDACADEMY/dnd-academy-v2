import styles from './index.module.scss';

const mbtiIcons = new Map([
  ['ISTJ', '📋'],
  ['ISFJ', '🏡'],
  ['INFJ', '🕯️'],
  ['INTJ', '♟️'],
  ['ISTP', '🛠️'],
  ['ISFP', '🎨'],
  ['INFP', '🌿'],
  ['INTP', '🔭'],
  ['ESTP', '⚡'],
  ['ESFP', '🎭'],
  ['ENFP', '🌈'],
  ['ENTP', '💡'],
  ['ESTJ', '🧭'],
  ['ESFJ', '🤝'],
  ['ENFJ', '☀️'],
  ['ENTJ', '🚀'],
]);

export default function MbtiBadge({ value }: { value: string }) {
  const types = new Set(
    value
      .trim()
      .toUpperCase()
      .split(/\s*[/,]\s*/)
      .map((part) => part.replace(/-[AT]$/, '')),
  );
  if (![...types].every((type) => mbtiIcons.has(type))) {
    return <div>{value}</div>;
  }

  return (
    <div className={styles.mbtiBadge}>
      {[...types].map((type) => (
        <span key={type} className={styles.mbtiIcon} aria-hidden="true">
          {mbtiIcons.get(type)}
        </span>
      ))}
      <span>{value}</span>
    </div>
  );
}
