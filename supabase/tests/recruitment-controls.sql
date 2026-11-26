\set ON_ERROR_STOP on
begin;
do $test$
declare
 actor uuid := gen_random_uuid();
 content_actor uuid := gen_random_uuid();
 target bigint;
 config jsonb;
 saved jsonb;
 expected_version integer;
begin
 insert into auth.users(id) values(actor), (content_actor);
 insert into public.admin_accounts(user_id) values(actor), (content_actor);
 insert into public.admin_permissions values(actor,'admissions'), (content_actor,'content');
 insert into public.cohorts(ordinal) values (9987) returning id into target;
 select version into expected_version from public.recruitment_controls where singleton;
 config := jsonb_build_object('cohortId',target,'applicationMode','open','startsAt','2026-11-16 00:00:00+09',
   'endsAt','2026-12-07 00:00:00+09','developerUrl','https://example.com/development',
   'notificationUrl','https://example.com/notify','passboardMode','visible');
 begin
   perform public.write_recruitment_controls(content_actor,expected_version,config);
   raise exception 'content-only account changed recruitment settings';
 exception when insufficient_privilege then null;
 end;
 saved := public.write_recruitment_controls(actor,expected_version,config);
 assert saved->>'designerUrl' is null and saved->>'developerUrl' like 'https://%';
 assert saved->>'passboardMode'='visible';
 assert saved->'announcement'='null'::jsonb;
 begin
   perform public.write_recruitment_controls(actor,expected_version,config);
   raise exception 'stale update was accepted';
 exception when serialization_failure then null;
 end;
 begin
   perform public.write_recruitment_controls(actor,(saved->>'version')::integer,config - 'developerUrl');
   raise exception 'open without application forms was accepted';
 exception when check_violation then null;
 end;
 assert not has_function_privilege('anon','public.write_recruitment_controls(uuid,integer,jsonb)','execute');
end $test$;
rollback;
