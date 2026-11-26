\set ON_ERROR_STOP on
begin;
do $test$
declare
  actor uuid := gen_random_uuid();
  logo uuid;
  copy uuid;
  scratch uuid;
  key text := 'published/attempt-' || gen_random_uuid() || '/' || gen_random_uuid();
  unused_key text := 'published/attempt-' || gen_random_uuid() || '/' || gen_random_uuid();
  saved bigint;
  live bigint;
  data jsonb;
begin
  insert into auth.users(id) values (actor);
  insert into public.admin_accounts(user_id) values (actor);
  insert into public.admin_permissions values (actor,'content');
  insert into public.cohorts(ordinal) values (9989);
  insert into public.media_assets(bucket,object_key,mime,bytes,sha256)
  values ('cms-drafts','test/'||gen_random_uuid(),'image/webp',1,repeat('a',64)) returning id into logo;
  insert into public.cms_media_publication_copies(object_key) values (key),(unused_key);
  insert into public.media_assets(bucket,object_key,mime,bytes,sha256,publication_pending)
  values ('cms-public',key,'image/webp',1,repeat('a',64),true) returning id into copy;
  insert into public.media_assets(bucket,object_key,mime,bytes,sha256,publication_pending)
  values ('cms-public',unused_key,'image/webp',1,repeat('b',64),true) returning id into scratch;

  data := jsonb_build_object(
    'stats', '{"cumulativeApplicants":0,"totalParticipants":0,"totalProjects":0,"dropouts":0,"dropoutCohort":9989}'::jsonb,
    'sponsorInfo','{"description":"fixture"}'::jsonb, 'automaticProjects',true, 'projectIds','[]'::jsonb,
    'faqs','[{"question":"draft question","answer":"draft answer","visible":true}]'::jsonb,
    'sponsors', jsonb_build_array(jsonb_build_object('name','sponsor','mediaId',logo,'visible',false)));
  perform public.seed_home_cms(data);
  select draft_id into saved from public.home_state;
  data := jsonb_set(data,'{faqs,0,visible}','false');
  saved := (public.write_home(actor,saved,'save',data)->>'revisionId')::bigint;
  assert jsonb_array_length(public.published_home()->'faqs') = 1;
  live := (public.write_home(actor,saved,'publish','{}')->>'publishedId')::bigint;
  assert public.published_home()->'faqs' = '[]'::jsonb;
  assert public.published_home()->'sponsors' = '[]'::jsonb;
  assert public.editable_home(actor)#>>'{input,sponsors,0,mediaId}' = logo::text;

  data := jsonb_set(data,'{sponsors,0,visible}','true');
  saved := (public.write_home(actor,live,'save',data)->>'revisionId')::bigint;
  begin
    perform public.write_home(actor,live,'publish','{}');
    raise exception 'stale publication was accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.write_home(actor,saved,'publish',jsonb_build_object(logo::text,scratch));
    raise exception 'unverified publication was accepted';
  exception when check_violation then null;
  end;
  assert public.prepare_media_copy_cleanup(unused_key);
  assert not exists(select 1 from public.media_assets where id=scratch);
  assert exists(select 1 from public.cms_media_publication_copies where object_key=unused_key);
  assert public.prepare_media_copy_cleanup(unused_key), 'cleanup retries must tolerate missing metadata';
  live := (public.write_home(actor,saved,'publish',jsonb_build_object(logo::text,copy))->>'publishedId')::bigint;
  assert public.published_home()#>>'{sponsors,0,mediaId}' = copy::text;
  assert not public.prepare_media_copy_cleanup(key), 'cleanup must retain a committed reference';
  assert exists(select 1 from public.media_assets where id=copy and not publication_pending);
  assert not exists(select 1 from public.cms_media_publication_copies where object_key=key);
  assert exists(select 1 from public.admin_audit where operation='home.publish' and split_part(target,'->',2)=live::text);
end $test$;
rollback;
