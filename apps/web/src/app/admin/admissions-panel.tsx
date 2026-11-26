'use client';

import { type FormEvent, useState } from 'react';

import { type AdmissionsState, positions, statuses } from '@/lib/cms/admissions-contract';
import type { RecruitmentControls } from '@/lib/cms/recruitment-contract';

import { adminRequest } from './admin-request';
import { RecruitmentControlsPanel } from './recruitment-controls-panel';

import styles from './styles.module.scss';

const tabs = [
  ['results', '결과 관리'],
  ['schedule', '발표 일정'],
  ['homepage', '홈페이지 버튼'],
  ['applicants', '지원자 등록'],
  ['cohorts', '기수 관리'],
] as const;

const positionLabels: Record<string, string> = {
  FRONTEND: '프런트엔드',
  BACKEND: '백엔드',
  ANDROID: '안드로이드',
  IOS: 'iOS',
  DESIGNER: '디자인',
};
const statusLabels = { NONE: '미정', PASSED: '합격', FAILED: '불합격', WAITLISTED: '예비 합격' };

function kstInput(iso: string | null | undefined) {
  return iso ? new Date(Date.parse(iso) + 9 * 60 * 60 * 1000).toISOString().slice(0, 19) : '';
}

function kstDate(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

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

export default function AdmissionsPanel({
  initial,
  recruitment,
}: {
  initial: AdmissionsState;
  recruitment: RecruitmentControls | null;
}) {
  const [state, setState] = useState(initial);
  const [cohortId, setCohortId] = useState(initial.cohorts[0]?.id ?? 0);
  const [eventId, setEventId] = useState(
    initial.events.find((event) => event.is_current)?.id ?? initial.events[0]?.id ?? 0,
  );
  const [match, setMatch] = useState<AdmissionsState['match']>();
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<(typeof tabs)[number][0]>('results');
  const [editingNewEvent, setEditingNewEvent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage('');
    setFailed(false);
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
        if (payload.action === 'event' && typeof payload.id === 'number') {
          setEventId(payload.id);
          setEditingNewEvent(false);
        } else {
          setEventId((current) => current || updated.events[0]?.id || 0);
        }
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
      setFailed(true);
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
  const dates = selectedEvent
    ? `${kstDate(selectedEvent.starts_at)}부터 · ${selectedEvent.ends_at ? kstDate(selectedEvent.ends_at) + ' 종료' : '수동 종료'}`
    : '';
  const eventPicker = (
    <label className={styles.eventPicker}>
      발표 이벤트
      <select
        value={eventId}
        disabled={!state.events.length}
        onChange={(event) => {
          setEventId(Number(event.target.value));
          setEditingNewEvent(false);
          setMatch(undefined);
          setMessage('');
        }}
      >
        {!state.events.length && <option value={0}>등록된 발표 일정 없음</option>}
        {state.events.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · #{item.id}
            {item.is_current ? ' · 현재 이벤트' : ''}
          </option>
        ))}
      </select>
    </label>
  );
  const schedule = editingNewEvent ? undefined : selectedEvent;

  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>모집 관리</h1>
          <p>지원 결과, 발표 일정, 홈페이지 모집 버튼을 관리하세요.</p>
        </div>
      </div>
      <div className={styles.tabs} aria-label="모집 업무">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={active === value}
            onClick={() => {
              setActive(value);
              setMatch(undefined);
              setMessage('');
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {message && (
        <p className={failed ? styles.error : styles.status} role={failed ? 'alert' : 'status'}>
          {message}
        </p>
      )}

      <div hidden={active !== 'homepage'}>
        <RecruitmentControlsPanel initial={recruitment} cohorts={state.cohorts} />
      </div>
      {(active === 'results' || active === 'schedule') && (
        <section className={`${styles.card} ${styles.eventCard}`}>
          {eventPicker}
          {selectedEvent && (
            <div className={styles.eventStatus}>
              <span className={styles.pill} data-tone={selectedEvent.ready ? 'green' : 'neutral'}>
                {selectedEvent.ready ? '공개 준비 완료' : '공개 준비 전'}
              </span>
              <span>{dates} (KST)</span>
            </div>
          )}
        </section>
      )}

      {active === 'results' &&
        (selectedEvent ? (
          <div className={styles.admissionsGrid}>
            <section className={styles.card}>
              <div className={styles.cardHeading}>
                <h2>개별 결과</h2>
                <p>이름과 이메일로 지원자를 찾고 결과를 수정하세요.</p>
              </div>
              <form
                method="post"
                className={styles.form}
                onSubmit={(event) => {
                  const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                  submit(event, (data) => {
                    const identity = { name: data.get('name'), email: data.get('email') };
                    return button?.value === 'save'
                      ? { action: 'results', eventId, rows: [{ ...identity, status: data.get('status') }] }
                      : { action: 'search', eventId, identity };
                  });
                }}
              >
                <fieldset className={styles.fields} disabled={busy}>
                  <div className={styles.grid} onChange={() => setMatch(undefined)}>
                    {identityFields()}
                  </div>
                  <div className={styles.buttons}>
                    <button type="submit" value="search" className={styles.primary}>
                      개별 결과 조회
                    </button>
                  </div>
                  {match === null && (
                    <p className={styles.empty} role="status">
                      일치하는 지원자가 없습니다.
                    </p>
                  )}
                  {match && (
                    <div className={styles.resultBox}>
                      <div>
                        <span className={styles.muted}>{positionLabels[match.position] ?? match.position}</span>
                        <strong>{match.status ? statusLabels[match.status] : '결과 미등록'}</strong>
                      </div>
                      <label>
                        새 결과{' '}
                        <select name="status" key={`${match.id}:${match.status}`} defaultValue={match.status ?? 'NONE'}>
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" value="save" className={styles.primary}>
                        개별 결과 저장
                      </button>
                    </div>
                  )}
                </fieldset>
              </form>
            </section>
            <section className={styles.card}>
              <div className={styles.cardHeading}>
                <h2>결과 CSV 일괄 반영</h2>
                <p>선택한 발표 이벤트에 적용됩니다. 파일은 최대 1 MiB, 1,000행까지 올릴 수 있습니다.</p>
              </div>
              <form
                method="post"
                className={styles.form}
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const file = new FormData(form).get('csv');
                  try {
                    if (!(file instanceof File) || !file.size || file.size > 1024 * 1024)
                      throw new Error('1 MiB 이하 결과 CSV를 선택해 주세요.');
                    const rows = parseResultCsv(await file.text());
                    if (
                      window.confirm(`${selectedEvent.name}에 결과 ${rows.length}건을 반영할까요?`) &&
                      (await run({ action: 'results', eventId, rows }))
                    )
                      form.reset();
                  } catch (error) {
                    setFailed(true);
                    setMessage((error as Error).message);
                  }
                }}
              >
                <fieldset disabled={busy} className={styles.fields}>
                  <label>
                    결과 CSV <input type="file" name="csv" accept=".csv,text/csv" required />
                  </label>
                  <p className={styles.muted}>
                    <code>name,email,status</code>
                  </p>
                  <div className={styles.buttons}>
                    <button type="submit">일괄 결과 반영</button>
                  </div>
                </fieldset>
              </form>
            </section>
          </div>
        ) : (
          <div className={styles.empty}>
            발표 일정을 먼저 등록하세요.{' '}
            <button type="button" onClick={() => setActive('schedule')}>
              발표 일정으로 이동
            </button>
          </div>
        ))}

      {active === 'schedule' && (
        <>
          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <div>
                <h2>{schedule ? '발표 일정 편집' : '새 발표 일정'}</h2>
                <p>모든 시각은 한국 표준시(KST)입니다.</p>
              </div>
              {selectedEvent && (
                <button type="button" onClick={() => setEditingNewEvent(!editingNewEvent)}>
                  {editingNewEvent ? '기존 일정으로' : '＋ 새 일정'}
                </button>
              )}
            </div>
            <form
              method="post"
              className={styles.form}
              key={schedule ? JSON.stringify(schedule) : 'new'}
              onSubmit={(event) =>
                submit(event, (data) => {
                  const date = (key: string) => {
                    const value = String(data.get(key) ?? '');
                    return value ? `${value}${value.length === 16 ? ':00' : ''}+09:00` : null;
                  };
                  return {
                    action: 'event',
                    id: schedule?.id ?? Number(data.get('id')),
                    cohortId: Number(data.get('cohortId')),
                    name: data.get('name'),
                    startsAt: date('start'),
                    endsAt: date('end'),
                    current: data.get('current') === 'on',
                  };
                })
              }
            >
              <fieldset disabled={busy || !state.cohorts.length} className={styles.fields}>
                <div className={styles.grid}>
                  <label>
                    이벤트 ID{' '}
                    <input name="id" type="number" min="1" required defaultValue={schedule?.id} readOnly={!!schedule} />
                  </label>
                  <label>
                    기수{' '}
                    <select name="cohortId" defaultValue={schedule?.cohort_id ?? cohortId}>
                      {cohortOptions}
                    </select>
                  </label>
                </div>
                <label>
                  표시명 <input name="name" required maxLength={160} defaultValue={schedule?.name} />
                </label>
                <div className={styles.grid}>
                  <label>
                    발표 시작 (KST){' '}
                    <input
                      name="start"
                      type="datetime-local"
                      step="1"
                      defaultValue={kstInput(schedule?.starts_at)}
                      required
                    />
                  </label>
                  <label>
                    발표 종료 (KST, 선택){' '}
                    <input name="end" type="datetime-local" step="1" defaultValue={kstInput(schedule?.ends_at)} />
                  </label>
                </div>
                <label>
                  <input name="current" type="checkbox" defaultChecked={schedule?.is_current ?? false} /> Passboard의
                  현재 이벤트로 표시
                </label>
                <p className={styles.muted}>일정을 저장하면 공개 준비 상태를 다시 확정해야 합니다.</p>
                <div className={styles.buttons}>
                  <button className={styles.primary}>일정 저장</button>
                </div>
              </fieldset>
            </form>
          </section>
          {schedule && (
            <section className={`${styles.card} ${styles.noticeCard}`}>
              <div>
                <h2>조회 공개 설정</h2>
                <p>공개 준비가 끝났고 발표 시작 시각이 지난 경우에 결과 조회가 열립니다.</p>
              </div>
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={busy || selectedEvent?.ready}
                  onClick={() => {
                    if (window.confirm(`${schedule.name}의 공개 준비를 확정할까요?`))
                      void run({ action: 'ready', eventId });
                  }}
                >
                  공개 준비 확정
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={busy || !selectedEvent?.ready}
                  onClick={() => {
                    if (window.confirm(`${schedule.name}의 결과 조회를 닫을까요?`))
                      void run({ action: 'close', eventId });
                  }}
                >
                  조회 닫기
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {active === 'applicants' && (
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <h2>지원자 개별 등록</h2>
            <p>기수를 선택한 뒤 지원 정보를 입력하세요. 동일 정보로 다시 등록해도 결과가 유지됩니다.</p>
          </div>
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
            <fieldset disabled={busy || !state.cohorts.length} className={styles.fields}>
              <label>
                대상 기수{' '}
                <select value={cohortId} onChange={(event) => setCohortId(Number(event.target.value))}>
                  {cohortOptions}
                </select>
              </label>
              <div className={styles.grid}>{identityFields()}</div>
              <label>
                지원 직군{' '}
                <select name="position">
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {positionLabels[position]}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.buttons}>
                <button className={styles.primary}>지원자 등록</button>
              </div>
            </fieldset>
          </form>
          <div className={styles.subtleRow}>
            <span>선택 기수 지원자 엑셀 등록</span>
            <span className={styles.pill} data-tone="neutral">
              양식 준비 중
            </span>
          </div>
        </section>
      )}

      {active === 'cohorts' && (
        <div className={styles.admissionsGrid}>
          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <h2>
                등록된 기수 <span>{state.cohorts.length}개</span>
              </h2>
            </div>
            {state.cohorts.length ? (
              <ul className={styles.cohortList}>
                {[...state.cohorts]
                  .sort((a, b) => b.ordinal - a.ordinal)
                  .map((cohort) => (
                    <li key={cohort.id}>
                      <strong>{cohort.ordinal}기</strong>
                      <button
                        type="button"
                        className={styles.quiet}
                        onClick={() => {
                          setCohortId(cohort.id);
                          setActive('applicants');
                        }}
                      >
                        지원자 등록 →
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className={styles.empty}>등록된 기수가 없습니다.</p>
            )}
          </section>
          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <h2>기수 추가</h2>
              <p>지원자 등록에 사용할 기수를 추가합니다.</p>
            </div>
            <form
              method="post"
              className={styles.form}
              onSubmit={(event) =>
                submit(event, (data) => ({ action: 'cohort', ordinal: Number(data.get('ordinal')) }), true)
              }
            >
              <fieldset className={styles.fields} disabled={busy}>
                <label>
                  기수 번호 <input name="ordinal" type="number" min="1" required />
                </label>
                <div className={styles.buttons}>
                  <button className={styles.primary}>기수 등록</button>
                </div>
              </fieldset>
            </form>
            <div className={styles.subtleRow}>
              <span>기수 엑셀 등록</span>
              <span className={styles.pill} data-tone="neutral">
                양식 준비 중
              </span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
