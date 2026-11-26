'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

import { signIn } from './actions';

import styles from './styles.module.scss';

export default function LoginForm({ disabled }: { disabled: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <form action={signIn} className={styles.loginForm}>
      <label>
        이메일
        <input name="email" type="email" placeholder="name@example.com" autoComplete="username" required />
      </label>
      <label htmlFor="admin-password">비밀번호</label>
      <div className={styles.password}>
        <input
          id="admin-password"
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          required
        />
        <button type="button" className={styles.quiet} onClick={() => setVisible(!visible)} aria-pressed={visible}>
          {visible ? '숨기기' : '보기'}
        </button>
      </div>
      <Submit disabled={disabled} />
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={styles.primary} disabled={disabled || pending}>
      {pending ? '로그인 중…' : '로그인'}
    </button>
  );
}
