\set ON_ERROR_STOP on
begin;

do $$
declare
  editor uuid := gen_random_uuid();
  admissions uuid := gen_random_uuid();
  selected_cohort bigint;
  other_cohort bigint;
  matches jsonb;
begin
  insert into auth.users(id) values (editor),(admissions);
  insert into public.admin_accounts(user_id) values (editor),(admissions);
  insert into public.admin_permissions values (editor,'content'),(admissions,'admissions');
  insert into public.cohorts(ordinal) values (9987) returning id into selected_cohort;
  insert into public.cohorts(ordinal) values (9988) returning id into other_cohort;

  insert into public.projects(id) select n from generate_series(0,26) n;
  insert into public.project_revisions(parent_id,version,state,name,title,description,cohort_id)
  select n,1,case when n=26 then 'draft'::public.revision_state else 'published' end,
    case when n=0 then '한글 ReACT %_' when n=1 then '한글 React' else '게시 프로젝트' end,
    '제목','본문',case when n=25 then other_cohort else selected_cohort end
  from generate_series(0,26) n;
  insert into public.project_revisions(parent_id,version,state,name,title,description,cohort_id)
  values (0,2,'draft','비공개 이름','제목','본문',selected_cohort);

  insert into public.organizers(id) values (0);
  insert into public.organizer_revisions(parent_id,version,state,name,author,position,introduction,mbti,is_archived)
  values (0,1,'published','이전 운영진','','개발','','',true);
  insert into public.reviews(id) values (0),(1);
  insert into public.review_revisions(parent_id,version,state,name,position,body,cohort_id)
  values (0,1,'published','검증 후기','프론트엔드 개발자','본문',null),
         (1,1,'published','검증 후기','프론트엔드 개발자','본문',selected_cohort);

  matches := public.lookup_submission_content(editor,'project',normalize('한글', NFD) || ' react',9987);
  assert matches='[{"id":0,"name":"한글 ReACT %_","cohort":9987},{"id":1,"name":"한글 React","cohort":9987}]';
  assert public.lookup_submission_content(editor,'project','%_',9987)=jsonb_build_array(matches->0);
  assert public.lookup_submission_content(editor,'project','0',9987)=jsonb_build_array(matches->0);
  assert public.lookup_submission_content(editor,'project','00',9987)='[]';
  assert public.lookup_submission_content(editor,'project','비공개 이름')='[]';
  assert public.lookup_submission_content(editor,'project','26')='[]';
  assert public.lookup_submission_content(editor,'project','25',9987)='[]';
  assert jsonb_array_length(public.lookup_submission_content(editor,'project','25'))=1;
  matches := public.lookup_submission_content(editor,'project','',9987);
  assert jsonb_array_length(matches)=20;
  assert matches->0->>'id'='0' and matches->19->>'id'='19';
  assert public.lookup_submission_content(editor,'organizer','')='[{"id":0,"name":"이전 운영진"}]';
  assert public.lookup_submission_content(editor,'organizer','',9987)='[]';
  assert public.lookup_submission_content(editor,'review','검증')=
    '[{"id":0,"name":"검증 후기","cohort":null},{"id":1,"name":"검증 후기","cohort":9987}]';
  assert public.lookup_submission_content(editor,'review','검증',9987)=
    '[{"id":1,"name":"검증 후기","cohort":9987}]';

  assert not has_function_privilege('anon','public.lookup_submission_content(uuid,public.content_kind,text,integer)','execute');
  assert not has_function_privilege('authenticated','public.lookup_submission_content(uuid,public.content_kind,text,integer)','execute');
  begin
    perform public.lookup_submission_content(admissions,'project','');
    raise exception 'admissions-only admin could look up published content';
  exception when insufficient_privilege then null;
  end;
end
$$;

rollback;
