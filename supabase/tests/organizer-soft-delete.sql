\set ON_ERROR_STOP on
begin;
do $test$
declare
  actor uuid := gen_random_uuid();
  admissions_actor uuid := gen_random_uuid();
  input jsonb := '{"name":"Soft-delete fixture","description":"Retained profile","author":"","position":"개발","mbti":"","isArchived":false,"links":[],"skills":[],"details":[]}';
  token text;
  member integer;
  live bigint;
  draft bigint;
  selected_link_id uuid;
  issue jsonb;
  row_data jsonb;
  pending boolean;
  job uuid;
  worker uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (actor), (admissions_actor);
  insert into public.admin_accounts(user_id) values (actor), (admissions_actor);
  insert into public.admin_permissions values (actor,'content'), (admissions_actor,'admissions');

  for pending in select unnest(array[false,true]) loop
    token := encode(convert_to(gen_random_uuid()::text,'UTF8'),'hex');
    token := left(token,64);
    row_data := public.write_content(actor,'organizer',null,null,null,'save',input);
    member := (row_data->>'id')::integer;
    live := (row_data->>'revisionId')::bigint;
    perform public.write_content(actor,'organizer',member,live,1,'publish','{}');
    issue := jsonb_build_object('kind','organizer','targetId',member,'tokenHash',token,
      'expiresAt',clock_timestamp()+interval '1 day','label','fixture');
    selected_link_id := (public.admin_submission_action(actor,'issue',issue)->>'id')::uuid;
    assert public.open_submission_session(selected_link_id,token,repeat('a',62)||case when pending then '01' else '00' end)->>'id'=selected_link_id::text;
    if pending then
      perform public.save_submission(selected_link_id,token,0,'{"name":"Pending","description":"Pending","links":[],"skills":[]}',true);
      job := public.queue_submission_publication(actor,array[selected_link_id],repeat('b',64));
    end if;
    row_data := public.write_content(actor,'organizer',member,live,1,'save',input || '{"description":"Retained draft"}');
    draft := (row_data->>'revisionId')::bigint;

    begin
      perform public.soft_delete_organizer(admissions_actor,member,draft,1);
      raise exception 'non-content admin deleted profile';
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.soft_delete_organizer(actor,member,live,1);
      raise exception 'stale revision deleted profile';
    exception when serialization_failure then null;
    end;

    assert (public.soft_delete_organizer(actor,member,draft,1)->>'id')::integer=member;
    assert exists (select from public.organizers where id=member and deleted_at is not null);
    assert exists (select from public.organizer_revisions where id=draft and state='draft' and introduction='Retained draft');
    assert exists (select from public.organizer_revisions where id=live and state='archived' and introduction='Retained profile');
    assert exists (select from public.admin_audit where operation='organizer.delete' and target='organizer/'||member);
    assert not exists (select from public.published_content('organizer',member));
    assert not (public.published_organizer_directory()->'active' @> jsonb_build_array(jsonb_build_object('id',member)));
    assert public.lookup_submission_content(actor,'organizer',member::text) = '[]'::jsonb;
    assert public.content_workspace(actor,'organizer',member)->'initial' = 'null'::jsonb;
    assert not (public.content_workspace(actor,'organizer',member)->'rows' @> jsonb_build_array(jsonb_build_object('id',member)));
    assert public.submission_link_data(selected_link_id)->>'state' = 'revoked';

    begin
      perform public.read_submission(selected_link_id,token);
      raise exception 'old link opened a deleted profile';
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.admin_submission_action(actor,'issue',issue);
      raise exception 'new link issued for a deleted profile';
    exception when no_data_found then null;
    end;
    begin
      perform public.write_content(actor,'organizer',member,draft,1,'save',input);
      raise exception 'stale editor replaced a deleted profile draft';
    exception when serialization_failure then null;
    end;
    begin
      perform public.write_content(actor,'organizer',member,draft,1,'publish','{}');
      raise exception 'stale editor republished a deleted profile';
    exception when serialization_failure then null;
    end;
    if pending then
      perform public.claim_submission_publication(job,worker);
      begin
        perform public.advance_submission_publication(job,worker,items=>jsonb_build_array(jsonb_build_object(
          'linkId',selected_link_id,'kind','organizer','input',input,'expectedRevision',draft,'expectedEdit',1,'expectedLive',live)));
        raise exception 'pending worker republished a deleted profile';
      exception when serialization_failure then null;
      end;
      assert not exists (select from public.content_submission_decisions where content_submission_decisions.link_id=selected_link_id);
    end if;
  end loop;

  assert not has_function_privilege('anon','public.soft_delete_organizer(uuid,integer,bigint,integer)','execute');
  assert not has_function_privilege('authenticated','public.soft_delete_organizer(uuid,integer,bigint,integer)','execute');
end $test$;
rollback;
