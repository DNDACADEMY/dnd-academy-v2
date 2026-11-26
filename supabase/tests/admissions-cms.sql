\set ON_ERROR_STOP on
begin;

do $$
declare
  admissions_user uuid := gen_random_uuid();
  content_user uuid := gen_random_uuid();
  unknown_user uuid := gen_random_uuid();
  cohort_id bigint;
  event public.admission_events;
  actor_event bigint := 998801;
  other_event bigint := 998802;
  article jsonb;
  workspace jsonb;
  check_result jsonb;
  result_status public.application_status;
  name_hash text := repeat('a',64);
  email_hash text := repeat('b',64);
  body jsonb;
begin
  insert into auth.users(id) values (admissions_user),(content_user),(unknown_user);
  insert into public.admin_accounts(user_id) values (admissions_user),(content_user);
  insert into public.admin_permissions values (admissions_user,'admissions'),(content_user,'content');
  assert (select count(*) from public.cms_permissions(unknown_user)) = 0, 'unregistered account was allowed';

  begin
    perform public.admissions_read(content_user,null,null,null);
    raise exception 'content permission allowed admission access';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.content_workspace(admissions_user,'project',null);
    raise exception 'admissions permission allowed content access';
  exception when insufficient_privilege then null;
  end;
  assert not has_function_privilege('authenticated','public.admissions_write(uuid,text,jsonb)','execute');
  assert not has_function_privilege('anon','public.check_admission(bigint,text,text,text)','execute');
  assert not has_table_privilege('authenticated','public.applications','select');

  cohort_id := (public.admissions_write(admissions_user,'cohort','{"ordinal":9988}')->>'id')::bigint;
  assert public.admissions_write(admissions_user,'cohort','{"ordinal":9988}')->>'outcome' = 'duplicate';
  perform public.admissions_write(admissions_user,'event',jsonb_build_object('id',actor_event,'cohortId',cohort_id,
    'name','가상 발표','startsAt','2026-12-19T00:00:00+09:00','endsAt','2026-12-19T00:10:00+09:00','current',true));
  perform public.admissions_write(admissions_user,'ready',jsonb_build_object('eventId',actor_event));
  select * into event from public.admission_events where id=actor_event;
  assert not public.event_open(event,'2026-12-18T23:59:59.999999+09');
  assert public.event_open(event,'2026-12-19T00:00:00+09');
  assert public.event_open(event,'2026-12-19T00:00:00.000001+09');
  assert not public.event_open(event,'2026-12-19T00:10:00+09');
  event.ends_at := null;
  assert public.event_open(event,'2027-01-01T00:00:00+09');
  event.ready := false;
  assert not public.event_open(event,'2027-01-01T00:00:00+09');
  assert (public.current_admission()->>'resultAnnouncementDateTime') = '2026-12-19T00:00:00+09:00';

  body := jsonb_build_object('cohortId',cohort_id,'position','FRONTEND','nameCiphertext','fixture','emailCiphertext','fixture',
    'nameHash',name_hash,'emailHash',email_hash);
  perform public.admissions_write(admissions_user,'applicant',body);
  perform public.admissions_write(admissions_user,'event',jsonb_build_object('id',other_event,'cohortId',cohort_id,
    'name','가상 발표','startsAt',statement_timestamp() - interval '1 minute','current',false));
  assert public.check_admission(other_event,name_hash,email_hash,'test-visitor')->>'code' = 'AP002';
  assert public.check_admission(other_event,name_hash,repeat('c',64),'test-visitor')->>'code' = 'AP002';
  perform public.admissions_write(admissions_user,'ready',jsonb_build_object('eventId',other_event));
  assert public.check_admission(other_event,name_hash,email_hash,'test-visitor')->>'code' = 'AP001';
  for result_status in select unnest(enum_range(null::public.application_status)) loop
    perform public.admissions_write(admissions_user,'results',jsonb_build_object('eventId',other_event,
      'rows',jsonb_build_array(jsonb_build_object('nameHash',name_hash,'emailHash',email_hash,'status',result_status))));
    check_result := public.check_admission(other_event,name_hash,email_hash,'test-visitor');
    assert check_result->>'status' = result_status::text;
  end loop;
  assert public.admissions_write(admissions_user,'applicant',body)->>'outcome' = 'duplicate';
  assert public.admissions_write(admissions_user,'applicant',body || '{"position":"DESIGNER"}')->>'outcome' = 'conflict';
  assert public.check_admission(other_event,name_hash,email_hash,'test-visitor')->>'status' = 'WAITLISTED';
  assert public.check_admission(other_event,name_hash,repeat('c',64),'test-visitor')->>'code' = 'AP001';
  perform public.admissions_write(admissions_user,'close',jsonb_build_object('eventId',other_event));
  assert public.check_admission(other_event,name_hash,email_hash,'test-visitor')->>'code' = 'AP002';

  body := '{"name":"가상 CMS","title":"첫 게시","description":"내용","cohort":9988,"images":[],"links":[],"skills":["TS","TS"]}';
  article := public.write_content(content_user,'project',null,null,null,'save',body);
  assert (select count(*) from public.published_content('project',(article->>'id')::int)) = 0;
  assert (select item->>'state' from public.editable_content(content_user,'project',(article->>'id')::int) item) = 'draft';
  workspace := public.content_workspace(content_user,'project',(article->>'id')::int);
  assert workspace->'initial' = (select item from public.editable_content(content_user,'project',(article->>'id')::int) item);
  assert exists (
    select from jsonb_array_elements(workspace->'rows') summary
    where summary->>'id'=article->>'id' and summary->>'state'='draft' and not (summary ? 'description')
  ), 'workspace lists summaries without body fields';
  assert public.content_workspace(content_user,'project',null)->'initial' = 'null'::jsonb;
  perform public.write_content(content_user,'project',(article->>'id')::int,(article->>'revisionId')::bigint,
    (article->>'editNumber')::int,'publish','{}');
  assert (select item->>'name' from public.published_content('project',(article->>'id')::int) item) = '가상 CMS';
  assert exists (
    select from jsonb_array_elements(public.content_workspace(content_user,'project',null)->'rows') summary
    where summary->>'id'=article->>'id' and summary->>'liveRevisionId'=article->>'revisionId'
  );
  assert not has_function_privilege('authenticated','public.content_workspace(uuid,public.content_kind,integer)','execute');
  assert (select jsonb_array_length(item->'skills') from public.published_content('project',(article->>'id')::int) item) = 1;
  begin
    perform public.write_content(content_user,'project',(article->>'id')::int,null,null,'save',body);
    raise exception 'stale edit was accepted';
  exception when serialization_failure then null;
  end;
  perform public.write_content(content_user,'project',(article->>'id')::int,(article->>'revisionId')::bigint,
    (article->>'editNumber')::int,'unpublish','{}');
  assert (select count(*) from public.published_content('project',(article->>'id')::int)) = 0;

  delete from public.admin_permissions where user_id=admissions_user;
  assert (select count(*) from public.cms_permissions(admissions_user)) = 0;
  begin
    perform public.admissions_read(admissions_user,null,null,null);
    raise exception 'same Auth subject retained revoked rights';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
