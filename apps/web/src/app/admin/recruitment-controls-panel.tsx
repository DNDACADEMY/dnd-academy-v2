'use client';

import { type FormEvent, useState } from 'react';

import type { AdmissionsState } from '@/lib/cms/admissions-contract';
import { recruitmentRequest, type RecruitmentControls } from '@/lib/cms/recruitment-contract';
import {
  CURRENT_FLAG,
  DESIGNER_APPLICATION_LINK,
  DEVELOPER_APPLICATION_LINK,
  NEXT_COHORT_NOTIFICATION_URL,
} from '@/lib/constants';

import { adminRequest } from './admin-request';
import { useUnsavedChanges } from './use-unsaved-changes';

import styles from './styles.module.scss';

function asKstInput(value: string) {
  return new Date(Date.parse(value) + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

function fromKstInput(value: string) {
  return value ? `${value.length === 16 ? `${value}:00` : value}+09:00` : '';
}

export function RecruitmentControlsPanel({
  initial,
  cohorts,
}: {
  initial: RecruitmentControls | null;
  cohorts: AdmissionsState['cohorts'];
}) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useUnsavedChanges(dirty);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const text = (name: string) => String(fields.get(name) ?? '').trim();
    const parsed = recruitmentRequest.safeParse({
      version: saved?.version ?? null,
      input: {
        cohortId: Number(text('cohort')),
        applicationMode: text('application-mode'),
        startsAt: fromKstInput(text('starts-at')),
        endsAt: fromKstInput(text('ends-at')),
        developerUrl: text('developer-url') || null,
        designerUrl: text('designer-url') || null,
        notificationUrl: text('notification-url'),
        passboardMode: text('passboard-mode'),
      },
    });
    setNotice('');
    if (!parsed.success) {
      setError(
        '마감 시각은 시작 시각 이후로 설정하고, 지원하기를 사용할 때는 HTTPS 지원 폼을 하나 이상 입력해 주세요.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      setSaved(await adminRequest<RecruitmentControls>('recruitment-controls', parsed.data));
      setDirty(false);
      setNotice('모집 버튼 설정을 저장했습니다.');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeading}>
        <h2>홈페이지 모집 버튼</h2>
        <p>저장하면 홈과 다른 페이지의 지원하기·알림 버튼에 적용됩니다. 합격자 조회 버튼은 홈에 표시됩니다.</p>
      </div>
      <form
        key={saved?.version ?? 'new'}
        onSubmit={save}
        onChange={() => {
          setDirty(true);
          setNotice('');
          setError('');
        }}
      >
        <fieldset className={styles.homeFields} disabled={busy}>
          <label>
            표시 기수
            <select
              name="cohort"
              defaultValue={saved?.cohortId ?? cohorts.find((cohort) => cohort.ordinal === CURRENT_FLAG)?.id ?? ''}
              required
            >
              <option value="">기수를 선택하세요</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.ordinal}기
                </option>
              ))}
            </select>
          </label>
          <section className={styles.mediaSlot} aria-label="지원하기 설정">
            <h3>지원하기</h3>
            <label>
              지원 버튼 노출
              <select name="application-mode" defaultValue={saved?.applicationMode ?? 'auto'}>
                <option value="auto">접수 일정에 따라 지원하기 / 알림 표시</option>
                <option value="open">지원하기 항상 표시</option>
                <option value="notify">알림 신청만 표시</option>
                <option value="hidden">지원하기와 알림 모두 숨김</option>
              </select>
            </label>
            <div className={styles.grid}>
              <label>
                접수 시작 (KST){' '}
                <input
                  type="datetime-local"
                  step={1}
                  name="starts-at"
                  required
                  defaultValue={asKstInput(saved?.startsAt ?? '2026-11-16T00:00:00+09:00')}
                />
              </label>
              <label>
                접수 마감 (KST){' '}
                <input
                  type="datetime-local"
                  step={1}
                  name="ends-at"
                  required
                  defaultValue={asKstInput(saved?.endsAt ?? '2026-12-07T00:00:00+09:00')}
                />
              </label>
            </div>
            <label>
              디자이너 지원 폼{' '}
              <input
                name="designer-url"
                type="url"
                maxLength={2048}
                placeholder="https://…"
                defaultValue={saved ? (saved.designerUrl ?? '') : DESIGNER_APPLICATION_LINK}
              />
            </label>
            <label>
              개발자 지원 폼{' '}
              <input
                name="developer-url"
                type="url"
                maxLength={2048}
                placeholder="https://…"
                defaultValue={saved ? (saved.developerUrl ?? '') : DEVELOPER_APPLICATION_LINK}
              />
            </label>
            <p className={styles.muted}>비워 둔 직군은 지원 창에 표시되지 않습니다.</p>
            <label>
              알림 신청 폼{' '}
              <input
                name="notification-url"
                type="url"
                maxLength={2048}
                required
                defaultValue={saved?.notificationUrl ?? NEXT_COHORT_NOTIFICATION_URL}
              />
            </label>
          </section>
          <section className={styles.mediaSlot} aria-label="합격자 조회 설정">
            <h3>합격자 조회</h3>
            <label>
              Passboard 버튼 노출
              <select name="passboard-mode" defaultValue={saved?.passboardMode ?? 'auto'}>
                <option value="auto">발표가 열리면 표시</option>
                <option value="visible">링크 항상 표시</option>
                <option value="hidden">숨김</option>
              </select>
            </label>
            <p className={styles.muted}>
              자동 노출은 표시 기수의 현재 발표가 열렸을 때 적용됩니다. 링크 노출과 실제 결과 공개는 각각 관리합니다.
            </p>
          </section>
          <div className={styles.buttons}>
            <button type="submit" className={styles.primary} disabled={!cohorts.length || (!dirty && !!saved)}>
              모집 버튼 설정 저장
            </button>
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className={styles.status}>
              {notice}
            </p>
          )}
        </fieldset>
      </form>
    </section>
  );
}
