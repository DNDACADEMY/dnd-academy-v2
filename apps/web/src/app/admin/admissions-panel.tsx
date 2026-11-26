'use client';

import { type FormEvent, useState } from 'react';

import { type AdmissionsState, positions, statuses } from '@/lib/cms/admissions-contract';

import { adminRequest } from './admin-request';

import styles from './styles.module.scss';

function identityFields() {
  return (
    <>
      <label>
        이름 <input name="name" required maxLength={160} autoComplete="off" />
      </label>
      <label>
        지원 이메일 <input name="email" type="email" required maxLength={254} autoComplete="off" />
      </label>
    </>
  );
}

function parseResultCsv(text: string) {
  const rows: string[][] = [];
  let line: string[] = [];
  let field = '';
  let quoted = false;
  let afterQuote = false;
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let index = 0; index <= source.length; index++) {
    const char = source[index] ?? '\n';
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
        afterQuote = true;
      } else {
        field += char;
      }
    } else if (char === ',' || char === '\n') {
      line.push(field);
      field = '';
      afterQuote = false;
      if (char === '\n') {
        if (line.some(Boolean)) rows.push(line);
        line = [];
      }
    } else if (char === '"' && !field && !afterQuote) {
      quoted = true;
    } else {
      if (afterQuote || char === '"') throw new Error('결과 CSV의 따옴표를 확인해 주세요.');
      field += char;
    }
  }
  if (quoted || rows.some((row) => row.length !== 3)) throw new Error('결과 CSV의 열을 확인해 주세요.');
  const [header, ...afterHeader] = rows;
  const records = header?.join(',') === 'name,email,status' ? afterHeader : rows;
  if (!records.length || records.length > 1000) throw new Error('결과 CSV는 1~1,000행까지 입력할 수 있습니다.');
  return records.map(([name, email, status]) => ({ name, email, status }));
}

export default function AdmissionsPanel({ initial }: { initial: AdmissionsState }) {
  const [state, setState] = useState(initial);
  const [cohortId, setCohortId] = useState(initial.cohorts[0]?.id ?? 0);
  const [eventId, setEventId] = useState(
    initial.events.find((event) => event.is_current)?.id ?? initial.events[0]?.id ?? 0,
  );
  const [match, setMatch] = useState<AdmissionsState['match']>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage('');
    try {
      const result = await adminRequest<AdmissionsState | { outcome: string; changed?: number }>('admissions', payload);
      if ('match' in result) {
        setMatch(result.match);
      } else {
        setMatch(undefined);
        const response = await fetch('/api/admin/admissions', { cache: 'no-store' });
        if (!response.ok) throw new Error('저장 후 목록을 갱신하지 못했습니다.');
        const updated: AdmissionsState = await response.json();
        setState(updated);
        setCohortId((current) => current || updated.cohorts[0]?.id || 0);
        setEventId((current) => current || updated.events[0]?.id || 0);
        setMessage(
          result.outcome === 'duplicate'
            ? '이미 등록되어 있습니다.'
            : result.changed === undefined
              ? '저장했습니다.'
              : `${result.changed}건을 반영했습니다.`,
        );
      }
      return true;
    } catch (error) {
      setMessage((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function submit(
    event: FormEvent<HTMLFormElement>,
    build: (values: FormData) => Record<string, unknown>,
    reset = false,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    void run(build(new FormData(form))).then((ok) => {
      if (ok && reset) form.reset();
    });
  }

  const selectedEvent = state.events.find(({ id }) => id === eventId);
  const cohortOptions = state.cohorts.map(({ id, ordinal }) => (
    <option key={id} value={id}>
      {ordinal}기
    </option>
  ));
  return (
    <>
      <h2>모집 관리</h2>
      {message && (
        <p role="status" className={styles.status}>
          {message}
        </p>
      )}
      <fieldset disabled={busy}>
        <legend>기수</legend>
        <form
          method="post"
          className={styles.form}
          onSubmit={(event) =>
            submit(event, (data) => ({ action: 'cohort', ordinal: Number(data.get('ordinal')) }), true)
          }
        >
          <label>
            기수 번호 <input name="ordinal" type="number" min="1" required />
          </label>
          <button>기수 등록</button>
        </form>
        <p>
          기수 엑셀 등록{' '}
          <button type="button" disabled>
            양식 준비 중
          </button>
        </p>
      </fieldset>
      <fieldset disabled={busy || !state.cohorts.length}>
        <legend>기수별 지원자</legend>
        <label>
          대상 기수{' '}
          <select value={cohortId} onChange={(event) => setCohortId(Number(event.target.value))}>
            {cohortOptions}
          </select>
        </label>
        <form
          method="post"
          className={styles.form}
          onSubmit={(event) =>
            submit(
              event,
              (data) => ({
                action: 'applicant',
                cohortId,
                name: data.get('name'),
                email: data.get('email'),
                position: data.get('position'),
              }),
              true,
            )
          }
        >
          {identityFields()}
          <label>
            지원 직군{' '}
            <select name="position">
              {positions.map((position) => (
                <option key={position}>{position}</option>
              ))}
            </select>
          </label>
          <button>지원자 등록</button>
        </form>
        <p>
          선택 기수 지원자 엑셀 등록{' '}
          <button type="button" disabled>
            양식 준비 중
          </button>
        </p>
      </fieldset>
      <fieldset disabled={busy || !state.cohorts.length}>
        <legend>발표 이벤트 설정</legend>
        <form
          method="post"
          className={styles.form}
          onSubmit={(event) =>
            submit(event, (data) => ({
              action: 'event',
              id: Number(data.get('id')),
              cohortId: Number(data.get('cohortId')),
              name: data.get('name'),
              startsAt: `${data.get('start')}:00+09:00`,
              endsAt: data.get('end') ? `${data.get('end')}:00+09:00` : null,
              current: data.get('current') === 'on',
            }))
          }
        >
          <label>
            이벤트 ID <input name="id" type="number" min="1" required />
          </label>
          <label>
            기수{' '}
            <select name="cohortId" value={cohortId} onChange={(event) => setCohortId(Number(event.target.value))}>
              {cohortOptions}
            </select>
          </label>
          <label>
            표시명 <input name="name" required maxLength={160} />
          </label>
          <label>
            발표 시작 (KST) <input name="start" type="datetime-local" defaultValue="2026-12-19T00:00" required />
          </label>
          <label>
            발표 종료 (KST, 선택) <input name="end" type="datetime-local" />
          </label>
          <label>
            <input name="current" type="checkbox" defaultChecked /> 현재 이벤트
          </label>
          <button>일정 저장</button>
        </form>
        <p>일정을 저장하면 공개 준비를 다시 확정해야 합니다.</p>
      </fieldset>
      <fieldset disabled={busy || !selectedEvent}>
        <legend>발표 준비와 결과 관리</legend>
        <label>
          이벤트{' '}
          <select
            value={eventId}
            onChange={(event) => {
              setEventId(Number(event.target.value));
              setMatch(undefined);
            }}
          >
            {state.events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.name}
              </option>
            ))}
          </select>
        </label>
        {selectedEvent && (
          <p>
            {new Date(selectedEvent.starts_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} KST ·{' '}
            {selectedEvent.ready ? '공개 준비 완료' : '닫힘'}
          </p>
        )}
        <div className={styles.buttons}>
          <button type="button" onClick={() => void run({ action: 'ready', eventId })}>
            공개 준비 확정
          </button>
          <button type="button" onClick={() => void run({ action: 'close', eventId })}>
            조회 닫기
          </button>
        </div>
        <form
          method="post"
          className={styles.form}
          onSubmit={(event) => {
            const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
            submit(event, (data) => {
              const identity = { name: data.get('name'), email: data.get('email') };
              return button?.value === 'save'
                ? { action: 'results', eventId, rows: [{ ...identity, status: data.get('status') }] }
                : { action: 'search', eventId, identity };
            });
          }}
        >
          {identityFields()}
          <button type="submit" value="search">
            개별 결과 조회
          </button>
          {match !== undefined && (
            <p role="status">
              {match ? `${match.position} · ${match.status ?? '결과 미등록'}` : '일치하는 지원자가 없습니다.'}
            </p>
          )}
          <label>
            새 결과{' '}
            <select name="status" key={match?.id}>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <button type="submit" value="save">
            개별 결과 저장
          </button>
        </form>
        <form
          method="post"
          className={styles.form}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const file = new FormData(form).get('csv');
            if (!(file instanceof File) || !file.size || file.size > 1024 * 1024) {
              setMessage('1 MiB 이하 결과 CSV를 선택해 주세요.');
              return;
            }
            try {
              const rows = parseResultCsv(await file.text());
              if (
                window.confirm(`선택한 이벤트에 결과 ${rows.length}건을 반영할까요?`) &&
                (await run({ action: 'results', eventId, rows }))
              )
                form.reset();
            } catch (error) {
              setMessage((error as Error).message);
            }
          }}
        >
          <label>
            결과 CSV (name,email,status) <input type="file" name="csv" accept=".csv,text/csv" required />
          </label>
          <button>일괄 결과 반영</button>
        </form>
      </fieldset>
    </>
  );
}
