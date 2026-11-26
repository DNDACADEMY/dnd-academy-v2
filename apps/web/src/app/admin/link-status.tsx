'use client';

import { useLinkStatus } from 'next/link';

import styles from './styles.module.scss';

export default function AdminLinkStatus() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span role="status" className={styles.linkStatus}>
      <span className={styles.visuallyHidden}>불러오는 중</span>
    </span>
  ) : null;
}
