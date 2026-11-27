\set ON_ERROR_STOP on
begin;

do $$
declare
  editor uuid := gen_random_uuid();
  other_admin uuid := gen_random_uuid();
  cohort bigint;
  team uuid;
  member uuid;
  project_link uuid;
  review_link uuid;
  organizer_link uuid;
  project_id integer;
  review_id integer;
  result jsonb;
  job uuid;
  worker uuid := gen_random_uuid();
  recovery uuid := gen_random_uuid();
  fingerprint text := repeat('f',64);
  deadline timestamptz := clock_timestamp() + interval '3 days';
  project_hash text := repeat('a',64);
  review_hash text := repeat('b',64);
  organizer_hash text := repeat('c',64);
  project jsonb := '{"name":"검증 프로젝트","title":"한 줄 소개","description":"설명","links":[],"skills":["Next.js"],"images":[]}';
  review jsonb := '{"name":"검증 조원","description":"후기 본문","links":[]}';
begin
  insert into auth.users(id) values(editor),(other_admin);
  insert into public.admin_accounts(user_id) values(editor),(other_admin);
  insert into public.admin_permissions values(editor,'content'),(other_admin,'admissions');
  insert into public.cohorts(ordinal) values(9989) returning id into cohort;
  begin
    perform public.admin_submission_workspace(other_admin,9989);
    raise exception 'admissions-only account accessed submissions';
  exception when insufficient_privilege then null;
  end;
  assert not has_function_privilege('anon','public.save_submission(uuid,text,integer,jsonb,boolean)','execute');
  assert not has_table_privilege('anon','public.content_submission_links','select');
  assert public.admin_submission_action(editor,'teams',jsonb_build_object('cohortId',cohort,'count',8))->>'changed'='8';
  assert public.admin_submission_action(editor,'teams',jsonb_build_object('cohortId',cohort,'count',12))->>'changed'='4';
  select id into strict team from public.submission_teams where cohort_id=cohort and number=12;
  perform public.admin_submission_action(editor,'member',jsonb_build_object(
    'teamId',team,'name','검증 조원','position','프론트엔드 개발자'));
  select id into strict member from public.submission_team_members where team_id=team;

  project_link := (public.admin_submission_action(editor,'issue',jsonb_build_object(
    'kind','project','teamId',team,'label','검증 프로젝트','tokenHash',project_hash,'expiresAt',deadline))->>'id')::uuid;
  review_link := (public.admin_submission_action(editor,'issue',jsonb_build_object(
    'kind','review','teamId',team,'memberId',member,'tokenHash',review_hash,'expiresAt',deadline))->>'id')::uuid;
  organizer_link := (public.admin_submission_action(editor,'issue',jsonb_build_object(
    'kind','organizer','label','검증 운영진','position','개발','archived',false,
    'tokenHash',organizer_hash,'expiresAt',deadline))->>'id')::uuid;
  assert public.admin_submission_workspace(editor,9989)->'teams'->11->>'number'='12';
  assert public.open_submission_session(project_link,project_hash,repeat('e',64))->'input'->>'name'='';
  assert public.submission_session_credential(project_link,repeat('e',64))=project_hash;
  begin
    perform public.submission_session_credential(review_link,repeat('e',64));
    raise exception 'editing session opened a different link';
  exception when no_data_found then null;
  end;
  update public.content_submission_sessions set expires_at=clock_timestamp() where link_id=project_link;
  begin
    perform public.submission_session_credential(project_link,repeat('e',64));
    raise exception 'expired editing session remained valid';
  exception when no_data_found then null;
  end;
  begin
    perform public.read_submission(review_link,project_hash);
    raise exception 'project token opened a member review';
  exception when no_data_found then null;
  end;
  update public.content_submission_links set expires_at=clock_timestamp() where id=project_link;
  begin
    perform public.read_submission(project_link,project_hash);
    raise exception 'expired link opened';
  exception when insufficient_privilege then null;
  end;
  assert public.admin_submission_action(editor,'extend',jsonb_build_object(
    'scope','link','id',project_link,'expiresAt',deadline))->>'changed'='1';
  assert public.save_submission(project_link,project_hash,0,project,false)->>'version'='1';
  begin
    perform public.save_submission(project_link,project_hash,0,project,true);
    raise exception 'stale draft could submit';
  exception when serialization_failure then null;
  end;
  assert public.save_submission(review_link,review_hash,0,review,true)->>'state'='submitted';
  assert public.save_submission(project_link,project_hash,1,project,true)->>'state'='submitted';
  begin
    perform public.read_submission(project_link,project_hash);
    raise exception 'submitted link could still edit';
  exception when insufficient_privilege then null;
  end;

  assert jsonb_array_length(public.admin_submission_review(editor,array[project_link,review_link]))=2;
  job := public.queue_submission_publication(editor,array[project_link,review_link],fingerprint);
  assert public.queue_submission_publication(editor,array[review_link,project_link],fingerprint)=job;
  assert public.claim_submission_publication(job,worker)->>'actor'=editor::text;
  assert not (public.claim_submission_publication(job,recovery) ? 'actor');
  update public.submission_publication_jobs set lease_until=clock_timestamp() where id=job;
  assert public.claim_submission_publication(job,recovery)->>'actor'=editor::text;
  begin
    perform public.advance_submission_publication(job,worker,failure=>true);
    raise exception 'expired worker advanced publication';
  exception when serialization_failure then null;
  end;
  perform public.release_submission_publication(job,worker);
  assert public.read_submission_publication(editor,job)->>'state'='processing';
  perform public.release_submission_publication(job,recovery);
  assert public.read_submission_publication(editor,job)->>'state'='queued';
  assert public.claim_submission_publication(job,recovery)->>'actor'=editor::text;
  assert (select attempts from public.submission_publication_jobs where id=job)=3;
  result := public.advance_submission_publication(job,recovery,items=>jsonb_build_array(
    jsonb_build_object('linkId',project_link,'kind','project','input',project),
    jsonb_build_object('linkId',review_link,'kind','review','input',review || '{"position":"프론트엔드 개발자"}')
  ));
  assert public.claim_submission_publication(job,worker)->>'state'='published';
  assert public.read_submission_publication(editor,job)->>'state'='published';
  assert jsonb_array_length(public.read_submission_publication(editor,job)->'published')=2;
  project_id := (result->0->>'id')::integer;
  review_id := (result->1->>'id')::integer;
  assert (select p->>'name' from public.published_content('project',project_id) p)='검증 프로젝트';
  assert (select (r->>'projectId')::integer from public.published_content('review',review_id) r)=project_id;
  assert (select t.project_id from public.submission_teams t where id=team)=project_id;
  begin
    perform public.publish_submission_batch(editor,jsonb_build_array(
      jsonb_build_object('linkId',project_link,'kind','project','input',project)
    ),'{}');
    raise exception 'duplicate publish succeeded';
  exception when serialization_failure then null;
  end;

  perform public.admin_submission_action(editor,'revoke',jsonb_build_object('linkId',organizer_link));
  begin
    perform public.read_submission(organizer_link,organizer_hash);
    raise exception 'revoked link opened';
  exception when insufficient_privilege then null;
  end;
end
$$;

rollback;
